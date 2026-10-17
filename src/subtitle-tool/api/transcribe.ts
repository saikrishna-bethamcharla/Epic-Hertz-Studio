// ─── Gemini transcription API client ────────────────────────────────────────
// Supports both:
// 1. Studio Cloud Serverless Proxy (/api/transcribe) — Zero configuration for all visitors
// 2. Personal Custom API Key (BYOK) — Client-side or proxy forwarding for power users

import { GoogleGenAI } from '@google/genai';
import { buildSegments } from '../utils/srt';
import type { Segment, SpokenLanguage, ScriptOutput, WordTimestamp } from '../types';

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

let memoryKey = '';

export function getStoredApiKey(): string {
  // 1. In-memory cache
  if (memoryKey && memoryKey.length > 5) {
    return memoryKey;
  }

  // 2. Check localStorage
  try {
    const local = localStorage.getItem('epic_gemini_api_key')?.trim();
    if (local && local.length > 5) {
      memoryKey = local;
      return local;
    }
  } catch {
    // ignore
  }

  // 3. Check sessionStorage
  try {
    const session = sessionStorage.getItem('epic_gemini_api_key')?.trim();
    if (session && session.length > 5) {
      memoryKey = session;
      return session;
    }
  } catch {
    // ignore
  }

  // 4. Fallback to env key only if not revoked or placeholder
  if (
    ENV_API_KEY &&
    ENV_API_KEY !== 'your_gemini_api_key_here' &&
    !ENV_API_KEY.startsWith('AIzaSyDJJ7')
  ) {
    return ENV_API_KEY.trim();
  }

  return '';
}

export function hasCustomApiKey(): boolean {
  return Boolean(getStoredApiKey());
}

export function setStoredApiKey(key: string): void {
  const trimmed = key.trim();
  memoryKey = trimmed;
  try {
    localStorage.setItem('epic_gemini_api_key', trimmed);
  } catch {
    // ignore
  }
  try {
    sessionStorage.setItem('epic_gemini_api_key', trimmed);
  } catch {
    // ignore
  }
}

function getProxyEndpoint(): string {
  if (typeof window === 'undefined') return '/api/transcribe';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('vercel.app')) {
    return '/api/transcribe';
  }
  // External or GitHub Pages domain fallback to Vercel serverless proxy
  return 'https://epic-hertz-studio.vercel.app/api/transcribe';
}

function parseTime(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace('s', '')) || 0;
  }
  return 0;
}

const LANGUAGE_LABELS: Record<SpokenLanguage, string> = {
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

export interface TranscribeOptions {
  spokenLanguage?: SpokenLanguage;
  scriptOutput?: ScriptOutput;
  languageCode?: string; // BCP-47 fallback
  onStatus?: (msg: string) => void;
}

/**
 * Main transcription entrypoint.
 * Automatically chooses between user's custom Gemini key and Studio Cloud AI.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscribeOptions = {},
): Promise<Segment[]> {
  const customKey = getStoredApiKey();

  // If user configured their own custom key, execute client-side with failover to proxy
  if (customKey) {
    try {
      return await transcribeClientSide(audioBlob, options, customKey);
    } catch (clientErr) {
      console.warn('Client-side SDK run failed, attempting proxy with custom key:', clientErr);
      return await transcribeViaProxy(audioBlob, options, customKey);
    }
  }

  // Zero-setup default: Use Studio Cloud AI Serverless Proxy
  return await transcribeViaProxy(audioBlob, options);
}

/**
 * Calls the Vercel serverless proxy route /api/transcribe with streaming audio.
 */
async function transcribeViaProxy(
  audioBlob: Blob,
  options: TranscribeOptions,
  customKey?: string,
): Promise<Segment[]> {
  const { spokenLanguage = 'auto', scriptOutput = 'romanized', onStatus } = options;

  onStatus?.('Connecting to Studio Cloud AI…');

  const endpoint = getProxyEndpoint();
  const url = `${endpoint}?spokenLanguage=${encodeURIComponent(spokenLanguage)}&scriptOutput=${encodeURIComponent(scriptOutput)}`;

  const headers: Record<string, string> = {
    'Content-Type': audioBlob.type || 'audio/wav',
    'x-spoken-language': spokenLanguage,
    'x-script-output': scriptOutput,
  };

  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  onStatus?.('Uploading audio to AI model…');

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: audioBlob,
    });
  } catch (netErr) {
    throw new Error(
      `Network error connecting to transcription service: ${netErr instanceof Error ? netErr.message : String(netErr)}. You can also provide a personal Gemini API Key in Settings (⚙).`,
    );
  }

  onStatus?.('Generating synced subtitles…');

  let data: { segments?: Segment[]; error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Cloud server returned unexpected response format (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(
      data?.error || `Transcription failed with HTTP ${res.status}. You can configure a personal key in Settings (⚙).`,
    );
  }

  if (!data?.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
    throw new Error('No speech detected in audio. Please try a video with clear spoken dialogue.');
  }

  onStatus?.('Finalizing caption timeline…');
  return data.segments;
}

/**
 * Client-side direct transcription via @google/genai SDK for users who supply their own key.
 */
async function transcribeClientSide(
  audioBlob: Blob,
  { spokenLanguage = 'auto', scriptOutput = 'romanized', onStatus }: TranscribeOptions,
  apiKey: string,
): Promise<Segment[]> {
  const client = new GoogleGenAI({ apiKey });

  // Step 1: Upload audio to Files API
  onStatus?.('Uploading audio to personal Gemini account…');

  const uploadedFile = await client.files.upload({
    file: audioBlob,
    config: { mimeType: (audioBlob.type || 'audio/wav') as 'audio/mp3' },
  });

  // Poll until ACTIVE
  let fileState = uploadedFile;
  while (fileState.state === 'PROCESSING') {
    await sleep(1200);
    fileState = await client.files.get({ name: uploadedFile.name! });
  }
  if (fileState.state === 'FAILED') {
    throw new Error('Gemini Files API: file processing failed.');
  }

  onStatus?.('Transcribing speech…');

  const langName = LANGUAGE_LABELS[spokenLanguage] || 'spoken language';
  const isRomanized = scriptOutput === 'romanized';

  const scriptDirective = isRomanized
    ? `CRITICAL SCRIPT INSTRUCTION:
- Transcribe the spoken audio using ROMANIZED SCRIPT / ENGLISH ALPHABET ONLY.
- For Indian languages (e.g. Telugu, Hindi, Tamil), produce natural colloquial Romanized script (e.g. Tanglish: "Prathi frame lo oka katha.", Hinglish: "Aapka swagat hai", etc.).
- Do NOT output native Telugu/Devanagari/Tamil characters. Use standard conversational English transliteration readable by social media audiences.`
    : `CRITICAL SCRIPT INSTRUCTION:
- Transcribe the spoken audio strictly in its authentic NATIVE SCRIPT (e.g., Telugu script 'తెలుగు లిపి', Hindi Devanagari 'हिन्दी', Tamil 'தமிழ்', etc.).
- Preserve correct native spelling, conjuncts, and punctuation.`;

  const prompt = `Analyze this audio carefully and generate accurate timestamped dialogue subtitles.
Language: Spoken in ${langName}.
${scriptDirective}

Break the speech down into natural, short spoken dialogue segments (2 to 5 words or 1.5 to 3.0 seconds maximum each).
Do NOT return one single long block for the entire speech. Every short phrase or pause must be its own segment with its exact start_time and end_time.
Also include an optional "words" array with start and end times for each individual word inside the segment for word-level karaoke sync.

Return ONLY a JSON array with this exact structure:
[
  {
    "start_time": 0.0,
    "end_time": 1.8,
    "text": "${isRomanized ? 'Prathi frame lo oka katha.' : 'ప్రతి ఫ్రేమ్ లో ఒక కథ'}",
    "words": [
      { "word": "${isRomanized ? 'Prathi' : 'ప్రతి'}", "start": 0.0, "end": 0.6 },
      { "word": "${isRomanized ? 'frame' : 'ఫ్రేమ్'}", "start": 0.6, "end": 1.1 },
      { "word": "${isRomanized ? 'katha.' : 'కథ'}", "start": 1.1, "end": 1.8 }
    ]
  }
]
Output valid JSON only. Do not include markdown code block formatting or explanations.`;

  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ];

  let rawText = '';
  let lastError: unknown = null;

  for (const model of candidateModels) {
    let attempts = 0;
    while (attempts < 2) {
      try {
        attempts++;
        const interaction = await client.interactions.create({
          model,
          input: [
            {
              type: 'audio',
              uri: fileState.uri!,
              mime_type: (fileState.mimeType || 'audio/wav') as 'audio/mp3',
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        } as Parameters<typeof client.interactions.create>[0]);

        rawText = (interaction as { output_text?: string }).output_text ?? '';
        if (rawText) break;
      } catch (err: unknown) {
        lastError = err;
        const msg = String(err);
        const is503 =
          msg.includes('503') ||
          msg.toLowerCase().includes('high demand') ||
          msg.toLowerCase().includes('temporarily unavailable');
        if (is503) {
          onStatus?.(`Traffic spike on ${model}, retrying...`);
          await sleep(1500 * attempts);
        } else {
          break;
        }
      }
    }
    if (rawText) break;
  }

  // Cleanup uploaded file from Gemini account
  if (uploadedFile?.name) {
    client.files.delete({ name: uploadedFile.name }).catch(() => {});
  }

  if (!rawText && lastError) {
    throw lastError;
  }

  onStatus?.('Building captions…');
  const segments = parseSegmentsFromResponse(rawText);

  if (segments.length === 0) {
    throw new Error('No speech detected in audio. Please try a video with clear spoken audio.');
  }

  return segments;
}

/**
 * Robustly parses structured subtitle segments from Gemini's response.
 */
function parseSegmentsFromResponse(rawText: string): Segment[] {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    const data = JSON.parse(cleaned);
    const list = Array.isArray(data) ? data : data.segments || data.subtitles || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: Record<string, unknown>, i: number) => {
        let words: WordTimestamp[] | undefined = undefined;
        if (Array.isArray(item.words)) {
          words = (item.words as Record<string, unknown>[])
            .map((w) => ({
              word: String(w.word ?? ''),
              start: parseTime(w.start ?? w.start_time ?? 0),
              end: parseTime(w.end ?? w.end_time ?? 0),
            }))
            .filter((w) => w.word.length > 0);
        }

        return {
          id: `seg-${i + 1}-${Date.now()}`,
          index: i + 1,
          start: parseTime(item.start_time ?? item.start ?? item.startTime ?? 0),
          end: parseTime(item.end_time ?? item.end ?? item.endTime ?? 0),
          text: String(item.text ?? item.dialogue ?? item.caption ?? '').trim(),
          words: words && words.length > 0 ? words : undefined,
        };
      }).filter((s) => s.text.length > 0);
    }
  } catch (err) {
    console.warn('JSON parse fallback for subtitles:', err);
  }

  // Fallback: Check if output is standard SRT format
  const srtBlocks = cleaned.split(/\n\s*\n/);
  const parsedFromSRT: Segment[] = [];
  let srtIdx = 1;
  for (const block of srtBlocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    const timeLine = lines.find((l) => l.includes('-->'));
    if (timeLine) {
      const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
      const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ');
      if (textLines) {
        parsedFromSRT.push({
          id: `seg-${srtIdx}`,
          index: srtIdx++,
          start: parseTime(startStr),
          end: parseTime(endStr),
          text: textLines,
        });
      }
    }
  }

  if (parsedFromSRT.length > 0) return parsedFromSRT;

  // Ultimate fallback: split text into small chunks
  const words = rawText.trim().split(/\s+/);
  return buildSegments(
    words.map((word, i) => ({
      word,
      start: i * 0.6,
      end: i * 0.6 + 0.5,
    })),
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
