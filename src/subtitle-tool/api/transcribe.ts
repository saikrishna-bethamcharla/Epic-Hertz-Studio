// ─── Gemini transcription API client ────────────────────────────────────────
// Uploads an audio Blob to the Gemini Files API, then calls
// gemini-3.5-transcribe with word-level timestamps.
// Requires VITE_GEMINI_API_KEY to be set in your .env.local file.

import { GoogleGenAI } from '@google/genai';
import { buildSegments } from '../utils/srt';
import type { Segment } from '../types';

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export function getStoredApiKey(): string {
  if (ENV_API_KEY && ENV_API_KEY !== 'your_gemini_api_key_here') {
    return ENV_API_KEY;
  }
  try {
    return localStorage.getItem('epic_gemini_api_key') || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem('epic_gemini_api_key', key.trim());
  } catch {
    // ignore
  }
}

function getClient(): GoogleGenAI {
  const key = getStoredApiKey();
  if (!key) {
    throw new Error(
      'Missing Gemini API Key. Please add it via the settings gear or provide VITE_GEMINI_API_KEY.',
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

function parseTime(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace('s', '')) || 0;
  }
  return 0;
}

// ─── Main transcribe function ────────────────────────────────────────────────

export interface TranscribeOptions {
  languageCode?: string; // BCP-47 e.g. "en-US". Leave undefined for auto-detect.
  onStatus?: (msg: string) => void;
}

export async function transcribeAudio(
  audioBlob: Blob,
  { onStatus }: TranscribeOptions = {},
): Promise<Segment[]> {
  const client = getClient();

  // ── Step 1: Upload audio to Files API ───────────────────────────────────
  onStatus?.('Uploading audio…');

  const uploadedFile = await client.files.upload({
    file: audioBlob,
    config: { mimeType: (audioBlob.type || 'audio/mp3') as 'audio/mp3' },
  });

  // Poll until ACTIVE
  let fileState = uploadedFile;
  while (fileState.state === 'PROCESSING') {
    await sleep(1500);
    fileState = await client.files.get({ name: uploadedFile.name! });
  }
  if (fileState.state === 'FAILED') {
    throw new Error('Gemini Files API: file processing failed.');
  }

  onStatus?.('Transcribing…');

  const prompt = `Analyze this audio carefully and generate accurate timestamped dialogue subtitles.
Break the speech down into natural, short spoken dialogue segments (2 to 5 words or 1.5 to 3 seconds each).
Do NOT return one single long block for the entire speech. Every short phrase or pause must be its own segment with its exact start_time and end_time.

Return ONLY a JSON array with this exact structure:
[
  { "start_time": 0.0, "end_time": 1.8, "text": "గోదావరి దేశీ గీ" },
  { "start_time": 1.9, "end_time": 3.4, "text": "ఇంటి రుచికి మన గీ" }
]
Output valid JSON only. Do not include markdown or explanations.`;

  // Multi-model resilience: if gemini-3.8-flash has a temporary 503 capacity spike,
  // automatically failover to gemini-3.5-flash-lite or gemini-3.5-transcribe
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
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
              mime_type: (fileState.mimeType || 'audio/mp3') as 'audio/mp3',
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
        const is503 = msg.includes('503') || msg.toLowerCase().includes('high demand') || msg.toLowerCase().includes('temporarily unavailable');
        if (is503) {
          onStatus?.(`Traffic spike on ${model}, retrying...`);
          await sleep(1500 * attempts);
        } else {
          // If not 503, try next candidate model
          break;
        }
      }
    }
    if (rawText) break;
  }

  if (!rawText && lastError) {
    throw lastError;
  }

  // ── Step 3: Parse segments ──────────────────────────────────────────────
  onStatus?.('Building captions…');
  const segments = parseSegmentsFromResponse(rawText);

  if (segments.length === 0) {
    throw new Error(
      'No speech detected in audio. Please try a video with clear spoken audio.',
    );
  }

  return segments;
}

/**
 * Robustly parses structured subtitle segments from Gemini's response.
 */
function parseSegmentsFromResponse(rawText: string): Segment[] {
  let cleaned = rawText.trim();
  // Strip markdown code fences if model wrapped response
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    const data = JSON.parse(cleaned);
    const list = Array.isArray(data) ? data : data.segments || data.subtitles || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: Record<string, unknown>, i: number) => ({
        id: `seg-${i + 1}-${Date.now()}`,
        index: i + 1,
        start: parseTime(item.start_time ?? item.start ?? item.startTime ?? 0),
        end: parseTime(item.end_time ?? item.end ?? item.endTime ?? 0),
        text: String(item.text ?? item.dialogue ?? item.caption ?? '').trim(),
      })).filter((s) => s.text.length > 0);
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
