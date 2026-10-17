// ─── Epic Hertz Studio: Serverless Transcription Proxy ──────────────────────
// Vercel Serverless Function that receives extracted audio and calls Gemini
// using process.env.GEMINI_API_KEY.
// Allows any visitor to transcribe video subtitles instantly without needing their own key.

import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

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

async function getRequestBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object' && req.body.audio) {
    return Buffer.from(req.body.audio, 'base64');
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseTime(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace('s', '')) || 0;
  }
  return 0;
}

function parseSegmentsFromResponse(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    const data = JSON.parse(cleaned);
    const list = Array.isArray(data) ? data : data.segments || data.subtitles || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item, i) => {
        let words = undefined;
        if (Array.isArray(item.words)) {
          words = item.words
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
  const parsedFromSRT = [];
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

  // Word chunk fallback
  const words = rawText.trim().split(/\s+/);
  const segments = [];
  const chunkSize = 4;
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const startTime = (i / chunkSize) * 2.0;
    const endTime = startTime + 1.8;
    segments.push({
      id: `seg-${Math.floor(i / chunkSize) + 1}`,
      index: Math.floor(i / chunkSize) + 1,
      start: startTime,
      end: endTime,
      text: chunkWords.join(' '),
    });
  }
  return segments;
}

export default async function handler(req, res) {
  // Setup CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-spoken-language, x-script-output, x-gemini-api-key');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return;
  }

  const apiKey =
    req.headers['x-gemini-api-key'] ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    res.status(500).json({
      error: 'Transcription service is temporarily unavailable. Please try again shortly.',
    });
    return;
  }

  let tmpPath = null;
  let client = null;
  let uploadedFile = null;

  try {
    const audioBuffer = await getRequestBody(req);
    if (!audioBuffer || audioBuffer.length < 500) {
      res.status(400).json({ error: 'Invalid audio data received. Minimum 500 bytes required.' });
      return;
    }

    // Query params or headers for options
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const spokenLanguage =
      url.searchParams.get('spokenLanguage') ||
      req.headers['x-spoken-language'] ||
      'auto';
    const scriptOutput =
      url.searchParams.get('scriptOutput') ||
      req.headers['x-script-output'] ||
      'romanized';

    // Write audio buffer to temp file for upload
    tmpPath = path.join(
      os.tmpdir(),
      `epichertz-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`,
    );
    await fs.promises.writeFile(tmpPath, audioBuffer);

    client = new GoogleGenAI({ apiKey });

    // Upload to Files API
    uploadedFile = await client.files.upload({
      file: tmpPath,
      config: { mimeType: 'audio/wav' },
    });

    // Wait for processing
    let fileState = uploadedFile;
    let pollCount = 0;
    while (fileState.state === 'PROCESSING' && pollCount < 30) {
      await new Promise((r) => setTimeout(r, 1200));
      fileState = await client.files.get({ name: uploadedFile.name });
      pollCount++;
    }

    if (fileState.state === 'FAILED') {
      throw new Error('Gemini audio processing failed on Files API.');
    }

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

CRITICAL TIMING ACCURACY INSTRUCTION:
- Set "start_time" at the EXACT FIRST MILLISECOND (the initial audible breath or phonetic onset) when the speaker begins vocalizing each phrase.
- DO NOT delay timestamps to the middle or end of words. The highlight must trigger the instant the word is heard.
- Break speech into short, energetic viral segments (2 to 4 words or 1.0 to 2.2 seconds each maximum).
- For EVERY segment, you MUST provide the "words" array with precise start and end times for each individual word.

Return ONLY a JSON array with this exact structure:
[
  {
    "start_time": 0.0,
    "end_time": 1.4,
    "text": "${isRomanized ? 'Prathi frame lo oka katha.' : 'ప్రతి ఫ్రేమ్ లో ఒక కథ'}",
    "words": [
      { "word": "${isRomanized ? 'Prathi' : 'ప్రతి'}", "start": 0.0, "end": 0.35 },
      { "word": "${isRomanized ? 'frame' : 'ఫ్రేమ్'}", "start": 0.35, "end": 0.75 },
      { "word": "${isRomanized ? 'lo' : 'లో'}", "start": 0.75, "end": 0.95 },
      { "word": "${isRomanized ? 'oka' : 'ఒక'}", "start": 0.95, "end": 1.15 },
      { "word": "${isRomanized ? 'katha.' : 'కథ'}", "start": 1.15, "end": 1.4 }
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
    let lastError = null;

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
                uri: fileState.uri,
                mime_type: 'audio/wav',
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          });

          rawText = interaction.output_text || '';
          if (rawText) break;
        } catch (err) {
          lastError = err;
          const msg = String(err);
          const is503 =
            msg.includes('503') ||
            msg.toLowerCase().includes('high demand') ||
            msg.toLowerCase().includes('temporarily unavailable');
          if (is503) {
            await new Promise((r) => setTimeout(r, 1500 * attempts));
          } else {
            break;
          }
        }
      }
      if (rawText) break;
    }

    if (!rawText && lastError) {
      throw lastError;
    }

    const segments = parseSegmentsFromResponse(rawText);
    if (!segments || segments.length === 0) {
      res.status(422).json({
        error: 'No speech detected in audio. Please try a video with clear spoken dialogue.',
      });
      return;
    }

    res.status(200).json({ segments });
  } catch (error) {
    console.error('Transcription error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  } finally {
    // Clean up local temp file
    if (tmpPath) {
      await fs.promises.unlink(tmpPath).catch(() => {});
    }
    // Clean up uploaded file from Gemini storage
    if (client && uploadedFile?.name) {
      await client.files.delete({ name: uploadedFile.name }).catch(() => {});
    }
  }
}
