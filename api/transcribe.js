// ─── Epic Hertz Studio: Serverless Transcription Proxy (hardened) ───────────
// Receives extracted audio, calls Gemini, returns timestamped caption segments.
//
// Env vars
//   GEMINI_API_KEY            required (do NOT use a VITE_ prefixed var — Vite bundles those into client JS)
//   ALLOWED_ORIGINS           optional, comma-separated. Default: production + localhost
//   MAX_AUDIO_BYTES           optional, default 4400000 (Vercel functions cap request bodies ~4.5 MB)
//   RATE_LIMIT_PER_MIN        optional, default 8   (per IP, server-key requests only)
//   RATE_LIMIT_PER_DAY        optional, default 60  (per IP, server-key requests only)
//                             The web client splits long audio into ~2-minute chunks,
//                             so one request ≈ 2 minutes of video (60/day ≈ 2 hours).
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//                             optional but strongly recommended: shared rate-limit store.
//                             Without it, limits are per-instance and easy to sidestep.
//   GEMINI_MODELS             optional, comma-separated model fallback order

import { GoogleGenAI } from '@google/genai';
import { parseSegmentsFromResponse } from './_lib/parse.js';

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

// ─── Settings ───────────────────────────────────────────────────────────────

const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES) || 4_400_000;
const LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN) || 8;
const LIMIT_PER_DAY = Number(process.env.RATE_LIMIT_PER_DAY) || 60;
const GLOBAL_DAILY_LIMIT = Number(process.env.GLOBAL_DAILY_LIMIT) || 0;
const DEADLINE_MS = 52_000; // leave headroom under maxDuration (60s)

if (process.env.NODE_ENV === 'production' && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
  console.warn('[transcribe] UPSTASH_REDIS_REST_* is not configured; using memory fallback (limits apply per serverless instance).');
}

const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'https://epic-hertz-studio.vercel.app,https://saikrishna-bethamcharla.github.io,http://localhost:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Current production Gemini models supporting audio input & structured output.
const DEFAULT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];
const CANDIDATE_MODELS = process.env.GEMINI_MODELS
  ? process.env.GEMINI_MODELS.split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_MODELS;

const LANGUAGE_LABELS = {
  auto: 'any spoken language',
  te: 'Telugu',
  hi: 'Hindi',
  en: 'English',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  mr: 'Marathi',
  bn: 'Bengali',
  es: 'Spanish',
  fr: 'French',
};

// Formats Gemini accepts for audio
const MIME_MAP = {
  'audio/wav': 'audio/wav',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/mpeg': 'audio/mp3',
  'audio/mp3': 'audio/mp3',
  'audio/ogg': 'audio/ogg',
  'audio/aac': 'audio/aac',
  'audio/flac': 'audio/flac',
  'audio/aiff': 'audio/aiff',
};

// ─── Small utilities ────────────────────────────────────────────────────────

class HttpError extends Error {
  constructor(status, message, retryAfterSec) {
    super(message);
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clientIp(req) {
  const real = req.headers['x-real-ip'];
  if (real) return String(real).trim();
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || 'unknown';
}

// ─── Rate limiting (Upstash REST if configured, else per-instance memory) ───

const memoryHits = new Map();

function memoryHit(key, windowSec) {
  const now = Date.now();
  if (memoryHits.size > 5000) {
    for (const [k, v] of memoryHits) if (v.reset <= now) memoryHits.delete(k);
  }
  const entry = memoryHits.get(key);
  if (!entry || entry.reset <= now) {
    memoryHits.set(key, { count: 1, reset: now + windowSec * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

async function redisHit(key, windowSec) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await withTimeout(
    fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSec), 'NX'],
      ]),
    }),
    2000,
  );
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const data = await res.json();
  return Number(data?.[0]?.result);
}

async function hit(key, windowSec) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const n = await redisHit(key, windowSec);
      if (Number.isFinite(n)) return n;
    } catch (err) {
      console.warn('rate-limit store unavailable, using memory:', err?.message);
    }
  }
  return memoryHit(key, windowSec);
}

async function checkRateLimit(ip) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const minute = Math.floor(now.getTime() / 60000);

  // 1. Per-IP checks run first so blocked or spam requests do not consume global daily capacity
  const perMin = await hit(`epic:rl:m:${ip}:${minute}`, 60);
  if (perMin > LIMIT_PER_MIN) {
    const wait = 61 - now.getUTCSeconds(); // seconds until the next minute bucket
    throw new HttpError(429, 'Too many requests. Please wait a moment and try again.', wait);
  }
  const perDay = await hit(`epic:rl:d:${ip}:${day}`, 86400);
  if (perDay > LIMIT_PER_DAY) {
    throw new HttpError(
      429,
      'Daily free limit reached for your IP (60 requests/day). Please add your own free Gemini API key in upload settings to continue without limits.',
    );
  }

  // 2. Check and increment global daily capacity only after per-IP validation succeeds
  if (GLOBAL_DAILY_LIMIT > 0) {
    const globalDayHits = await hit(`epic:rl:global:${day}`, 86400);
    if (globalDayHits > GLOBAL_DAILY_LIMIT) {
      throw new HttpError(
        429,
        'Studio daily capacity reached across all shared users. Please add your own free Gemini API key in upload settings to continue without limits.',
      );
    }
  }
}

// ─── Request handling ───────────────────────────────────────────────────────

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-spoken-language, x-script-output, x-gemini-api-key',
  );
  res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cache-Control', 'no-store');
}

async function readBody(req) {
  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > MAX_AUDIO_BYTES * 1.4) {
    throw new HttpError(413, 'Audio is too large. Try a shorter clip.');
  }
  if (Buffer.isBuffer(req.body)) return req.body;

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_AUDIO_BYTES * 1.4) {
      throw new HttpError(413, 'Audio is too large. Try a shorter clip.');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function getAudio(req) {
  const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const raw = await readBody(req);

  // Legacy JSON shape: { audio: <base64>, mimeType?: string }
  if (contentType === 'application/json') {
    let parsed;
    try {
      parsed = JSON.parse(raw.toString('utf8'));
    } catch {
      throw new HttpError(400, 'Invalid request body.');
    }
    if (!parsed?.audio || typeof parsed.audio !== 'string') {
      throw new HttpError(400, 'Invalid audio data received.');
    }
    const buf = Buffer.from(parsed.audio, 'base64');
    const mime = MIME_MAP[String(parsed.mimeType || 'audio/wav').toLowerCase()];
    if (!mime) throw new HttpError(415, 'Unsupported audio format.');
    return { buffer: buf, mimeType: mime };
  }

  // Raw binary (default). Missing / generic content-type is treated as WAV.
  const generic = !contentType || contentType === 'application/octet-stream';
  const mimeType = generic ? 'audio/wav' : MIME_MAP[contentType];
  if (!mimeType) throw new HttpError(415, 'Unsupported audio format. Use WAV, MP3, OGG, AAC or FLAC.');
  return { buffer: raw, mimeType };
}

// ─── Prompt ─────────────────────────────────────────────────────────────────

function buildPrompt(langName, isRomanized, isAutoDetect = false) {
  const languageDirective = isAutoDetect
    ? `Language: Auto-detect the spoken language (e.g. English, Telugu, Hindi, Tamil). Transcribe speech faithfully in whatever language is spoken.`
    : `Language: Spoken in ${langName}.`;

  const scriptDirective = isRomanized
    ? `CRITICAL SCRIPT INSTRUCTION:
- If the spoken audio is English: Output standard English words with proper spelling and capitalization.
- If the spoken audio is an Indian language (e.g. Telugu, Hindi, Tamil): Transcribe into natural colloquial Romanized script (e.g. Tanglish: "Prathi frame lo oka katha.", Hinglish: "Aapka swagat hai") using the Latin/English alphabet only.
- Do NOT output native Telugu/Devanagari/Tamil characters when Romanized is requested.`
    : `CRITICAL SCRIPT INSTRUCTION:
- Transcribe the spoken audio strictly in its authentic NATIVE SCRIPT (e.g., Telugu script 'తెలుగు లిపి', Hindi Devanagari 'हिन्दी', Tamil 'தமிழ்').
- Preserve correct native spelling, conjuncts, and punctuation.`;

  const ex = (roman, native) => (isRomanized ? roman : native);

  return `Analyze this audio carefully and generate accurate timestamped dialogue subtitles.
${languageDirective}
${scriptDirective}

TIMING RULES:
- "start" is when the speaker begins vocalizing that phrase/word; "end" is when vocalization ceases.
- All times are in SECONDS from the start of this audio clip, as decimal numbers (e.g. 1.35). Never use MM:SS.
- The timestamps must strictly match the acoustic speech in the audio. Do not drift or invent time offsets.
- Break speech into short, energetic segments (2 to 4 words, about 1.0 to 2.2 seconds each).
- For EVERY segment provide a "words" array with start and end times for each word.
- Timestamps must be non-decreasing and must not overlap.
- If there is no speech, return [].

Return ONLY a JSON array with this exact structure:
[
  {
    "start_time": 0.0,
    "end_time": 1.4,
    "text": "${ex('Prathi frame lo oka katha.', 'ప్రతి ఫ్రేమ్ లో ఒక కథ')}",
    "words": [
      { "word": "${ex('Prathi', 'ప్రతి')}", "start": 0.0, "end": 0.35 },
      { "word": "${ex('frame', 'ఫ్రేమ్')}", "start": 0.35, "end": 0.75 },
      { "word": "${ex('lo', 'లో')}", "start": 0.75, "end": 0.95 },
      { "word": "${ex('oka', 'ఒక')}", "start": 0.95, "end": 1.15 },
      { "word": "${ex('katha.', 'కథ')}", "start": 1.15, "end": 1.4 }
    ]
  }
]
Output valid JSON only.`;
}

// ─── Gemini call with model fallback and a hard deadline ────────────────────

const is404 = (msg) => /404|NOT_FOUND|not found|unsupported|deprecated|unknown model/i.test(msg);
const isOverloaded = (msg) => /503|UNAVAILABLE|overloaded|high demand|temporarily/i.test(msg);

async function transcribeWithFallback(client, { base64, mimeType, prompt }, deadlineAt) {
  let lastError = null;
  let timedOut = false;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const remaining = deadlineAt - Date.now();
      if (remaining < 4000) {
        timedOut = true;
        return { text: '', lastError, timedOut, model: null };
      }
      try {
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0,
            },
          }),
          remaining,
        );
        const text = response?.text || '';
        if (text) {
          console.info(`[transcribe] Succeeded using model: ${model}`);
          return { text, lastError, timedOut, model };
        }
        break; // empty answer: try the next model
      } catch (err) {
        lastError = err;
        const errStr = String(err?.message || err || '');
        if (err?.code === 'TIMEOUT') {
          timedOut = true;
          return { text: '', lastError, timedOut, model: null };
        }
        if (is404(errStr)) {
          console.warn(`[transcribe] Model ${model} is not available (404), skipping immediately.`);
          break; // skip to next model immediately without retry
        }
        if (isOverloaded(errStr) && attempt === 1) {
          await sleep(1200);
          continue; // one retry on the same model
        }
        break; // quota, bad model name, etc. → next model
      }
    }
  }
  return { text: '', lastError, timedOut, model: null };
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const startedAt = Date.now();
  applyCors(req, res);

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Origin not allowed.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return;
  }

  // Bring-your-own-key users pay for themselves, so they skip the shared limit.
  const rawUserKey = req.headers['x-gemini-api-key'];
  const userKey =
    typeof rawUserKey === 'string' && rawUserKey.length > 20 && rawUserKey.length < 200
      ? rawUserKey.trim()
      : null;
  const apiKey = userKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    res.status(503).json({ error: 'Transcription service is temporarily unavailable. Please try again shortly.' });
    return;
  }

  try {
    if (!userKey) await checkRateLimit(clientIp(req));

    const { buffer, mimeType } = await getAudio(req);
    if (!buffer || buffer.length < 500) {
      throw new HttpError(400, 'Invalid audio data received. Minimum 500 bytes required.');
    }
    if (buffer.length > MAX_AUDIO_BYTES) {
      throw new HttpError(413, 'Audio is too large. Try a shorter clip.');
    }

    const spokenLanguage = String(
      new URL(req.url, 'http://localhost').searchParams.get('spokenLanguage') ||
        req.headers['x-spoken-language'] ||
        'auto',
    );
    const scriptOutput = String(
      new URL(req.url, 'http://localhost').searchParams.get('scriptOutput') ||
        req.headers['x-script-output'] ||
        'romanized',
    );

    const isAutoDetect = spokenLanguage === 'auto';
    const langName = Object.hasOwn(LANGUAGE_LABELS, spokenLanguage)
      ? LANGUAGE_LABELS[spokenLanguage]
      : LANGUAGE_LABELS.auto;
    const isRomanized = scriptOutput !== 'native';

    const client = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(langName, isRomanized, isAutoDetect);

    const { text, lastError, timedOut, model: successfulModel } = await transcribeWithFallback(
      client,
      { base64: buffer.toString('base64'), mimeType, prompt },
      startedAt + DEADLINE_MS,
    );

    if (!text) {
      if (lastError) console.error('Transcription failed:', lastError?.message || lastError);
      if (timedOut) throw new HttpError(504, 'Transcription took too long. Try a shorter clip.');
      const errStr = String(lastError?.message || lastError || '');
      if (/RESOURCE_EXHAUSTED|quota|rate limit|429/i.test(errStr)) {
        throw new HttpError(
          429,
          'Gemini free tier quota exceeded on shared server key. Please add your own free Gemini key in upload settings, or try again shortly.',
        );
      }
      throw new HttpError(
        503,
        'Transcription service is busy. Please try again shortly or use your own Gemini API key.',
      );
    }

    const segments = parseSegmentsFromResponse(text);
    if (segments.length === 0) {
      console.warn('No parseable segments. Response length:', text.length);
      throw new HttpError(422, 'No speech detected in audio. Please try a video with clear spoken dialogue.');
    }

    res.status(200).json({ segments, model: successfulModel });
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.retryAfterSec) res.setHeader('Retry-After', String(error.retryAfterSec));
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Something went wrong while transcribing. Please try again.' });
  }
}
