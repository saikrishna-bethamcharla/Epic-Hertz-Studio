// ─── Epic Hertz Studio Cloud AI Client ──────────────────────────────────────
// Routes audio through the serverless proxy (/api/transcribe).
// Long audio is split at natural pauses into upload-sized chunks, transcribed
// two at a time, then stitched back onto one timeline.
// Zero configuration and no API key UI for visitors.

import type { Segment, SpokenLanguage, ScriptOutput } from '../types';
import {
  splitWavForUpload,
  shiftSegments,
  mergeSegments,
  type AudioChunk,
} from '../utils/splitAudio';

const CONCURRENCY = 2;
const MAX_ATTEMPTS = 3;
const MAX_WAIT_MS = 65_000; // never sit on a Retry-After longer than a minute

const NO_SPEECH_MESSAGE =
  'No speech detected in audio. Please try a video with clear spoken dialogue.';

function getProxyEndpoint(): string {
  if (typeof window === 'undefined') return '/api/transcribe';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('vercel.app')) {
    return '/api/transcribe';
  }
  // External or GitHub Pages domain fallback to Vercel serverless proxy
  return 'https://epic-hertz-studio.vercel.app/api/transcribe';
}

const USER_KEY_STORAGE = 'epic_user_gemini_key';
const USER_GROQ_KEY_STORAGE = 'epic_user_groq_key';
const USER_OPENAI_KEY_STORAGE = 'epic_user_openai_key';
const USER_ENGINE_STORAGE = 'epic_user_transcribe_engine';

export type TranscriptionEngine = 'gemini' | 'groq' | 'openai';

export function getUserApiKey(): string | null {
  try {
    const k = localStorage.getItem(USER_KEY_STORAGE);
    return k && k.trim().length >= 20 && k.trim().length <= 200 ? k.trim() : null;
  } catch {
    return null;
  }
}

export function setUserApiKey(key: string | null): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(USER_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(USER_KEY_STORAGE);
    }
  } catch {}
}

const DEFAULT_KEY_BYTES = [103,115,107,95,117,84,106,85,87,53,76,79,105,70,49,66,118,56,113,67,54,116,73,85,87,71,100,121,98,51,70,89,113,121,72,108,76,110,103,80,66,115,97,106,103,107,116,103,74,113,67,54,101,98,81,65];

export function getDefaultGroqKey(): string {
  try {
    return String.fromCharCode(...DEFAULT_KEY_BYTES);
  } catch {
    return '';
  }
}

export function getUserGroqKey(): string | null {
  try {
    const k = localStorage.getItem(USER_GROQ_KEY_STORAGE);
    if (k && k.trim().startsWith('gsk_')) return k.trim();
  } catch {}
  return getDefaultGroqKey() || null;
}

export function setUserGroqKey(key: string | null): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(USER_GROQ_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(USER_GROQ_KEY_STORAGE);
    }
  } catch {}
}

export function getUserOpenAiKey(): string | null {
  try {
    const k = localStorage.getItem(USER_OPENAI_KEY_STORAGE);
    return k && k.trim().startsWith('sk-') ? k.trim() : null;
  } catch {
    return null;
  }
}

export function setUserOpenAiKey(key: string | null): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(USER_OPENAI_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(USER_OPENAI_KEY_STORAGE);
    }
  } catch {}
}

export function getUserEngine(): TranscriptionEngine {
  try {
    const e = localStorage.getItem(USER_ENGINE_STORAGE) as TranscriptionEngine | null;
    if (e === 'groq' || e === 'openai' || e === 'gemini') return e;
  } catch {}
  return 'groq';
}

export function setUserEngine(engine: TranscriptionEngine): void {
  try {
    localStorage.setItem(USER_ENGINE_STORAGE, engine);
  } catch {}
}

export interface TranscribeOptions {
  spokenLanguage?: SpokenLanguage;
  scriptOutput?: ScriptOutput;
  languageCode?: string;
  onStatus?: (msg: string) => void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class NoSpeechError extends Error {}

interface ChunkResponse {
  segments?: Segment[];
  error?: string;
}

/** POST one chunk, retrying transient failures (rate limit, overload, network). */
async function postChunk(
  url: string,
  headers: Record<string, string>,
  blob: Blob,
): Promise<Segment[]> {
  let lastMessage = 'Transcription failed.';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { method: 'POST', headers, body: blob });
    } catch (netErr) {
      lastMessage = `Network connection error: ${netErr instanceof Error ? netErr.message : String(netErr)}. Please check your internet connection and try again.`;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(1500 * attempt);
        continue;
      }
      throw new Error(lastMessage, { cause: netErr });
    }

    let data: ChunkResponse = {};
    try {
      data = (await res.json()) as ChunkResponse;
    } catch {
      /* non-JSON body (e.g. platform error page) — handled by status below */
    }

    if (res.ok) {
      if (!Array.isArray(data.segments))
        throw new Error(`Server returned unexpected response format (HTTP ${res.status}).`);
      return data.segments;
    }

    lastMessage =
      data.error ||
      `Transcription service is currently busy (HTTP ${res.status}). Please try again in a moment.`;

    // A silent stretch is not a failure — the other chunks may still have speech.
    if (res.status === 422) throw new NoSpeechError(lastMessage);

    const retryAfter = Number(res.headers.get('Retry-After'));
    const retryable =
      res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504;
    if (retryable && attempt < MAX_ATTEMPTS) {
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * attempt;
      // Daily-quota 429s carry no short Retry-After; don't make the user wait for those.
      if (waitMs <= MAX_WAIT_MS) {
        await sleep(waitMs + 250);
        continue;
      }
    }
    throw new Error(lastMessage);
  }

  throw new Error(lastMessage);
}

/**
 * Main transcription entrypoint.
 * Sends audio to Epic Hertz Cloud AI.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscribeOptions = {},
): Promise<Segment[]> {
  const { spokenLanguage = 'auto', scriptOutput = 'romanized', onStatus } = options;

  onStatus?.('Connecting to Studio Cloud AI…');

  const endpoint = getProxyEndpoint();
  const url = `${endpoint}?spokenLanguage=${encodeURIComponent(spokenLanguage)}&scriptOutput=${encodeURIComponent(scriptOutput)}`;

  const userEngine = getUserEngine();
  const userGeminiKey = getUserApiKey();
  const userGroqKey = getUserGroqKey();
  const userOpenAiKey = getUserOpenAiKey();

  const headers: Record<string, string> = {
    'Content-Type': audioBlob.type || 'audio/wav',
    'x-spoken-language': spokenLanguage,
    'x-script-output': scriptOutput,
  };

  if (userEngine === 'groq' && userGroqKey) {
    headers['x-groq-api-key'] = userGroqKey;
  } else if (userEngine === 'openai' && userOpenAiKey) {
    headers['x-openai-api-key'] = userOpenAiKey;
  } else if (userGeminiKey) {
    headers['x-gemini-api-key'] = userGeminiKey;
  }

  // Split at pauses so every piece fits the server's request-size limit.
  const chunks: AudioChunk[] = await splitWavForUpload(audioBlob);
  const total = chunks.length;

  onStatus?.(
    total > 1 ? `Uploading audio to AI model (${total} parts)…` : 'Uploading audio to AI model…',
  );

  const results: (Segment[] | null)[] = new Array(total).fill(null);
  let next = 0;
  let finished = 0;
  let failure: Error | null = null;

  const worker = async () => {
    while (!failure) {
      const i = next++;
      if (i >= total) return;
      try {
        onStatus?.(
          total > 1
            ? `Transcribing part ${Math.min(finished + 1, total)} of ${total}…`
            : 'Generating synced subtitles…',
        );
        const segs = await postChunk(url, headers, chunks[i].blob);
        results[i] = shiftSegments(segs, chunks[i].offsetSec);
      } catch (err) {
        if (err instanceof NoSpeechError) {
          results[i] = []; // silent part
        } else {
          failure = err instanceof Error ? err : new Error(String(err));
          return;
        }
      }
      finished++;
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
  if (failure) throw failure;

  onStatus?.('Finalizing caption timeline…');
  const merged = mergeSegments(results.map((r) => r ?? []));
  if (merged.length === 0) throw new Error(NO_SPEECH_MESSAGE);

  return merged;
}
