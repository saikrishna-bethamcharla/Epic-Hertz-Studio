// ─── Epic Hertz Studio Cloud AI Client ──────────────────────────────────────
// Routes audio directly through the serverless backend proxy (/api/transcribe).
// Completely zero-configuration and zero API key UI for visitors.

import type { Segment, SpokenLanguage, ScriptOutput } from '../types';

function getProxyEndpoint(): string {
  if (typeof window === 'undefined') return '/api/transcribe';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('vercel.app')) {
    return '/api/transcribe';
  }
  // External or GitHub Pages domain fallback to Vercel serverless proxy
  return 'https://epic-hertz-studio.vercel.app/api/transcribe';
}

export interface TranscribeOptions {
  spokenLanguage?: SpokenLanguage;
  scriptOutput?: ScriptOutput;
  languageCode?: string;
  onStatus?: (msg: string) => void;
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

  const headers: Record<string, string> = {
    'Content-Type': audioBlob.type || 'audio/wav',
    'x-spoken-language': spokenLanguage,
    'x-script-output': scriptOutput,
  };

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
      `Network connection error: ${netErr instanceof Error ? netErr.message : String(netErr)}. Please check your internet connection and try again.`,
    );
  }

  onStatus?.('Generating synced subtitles…');

  let data: { segments?: Segment[]; error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned unexpected response format (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(
      data?.error || `Transcription service is currently busy (HTTP ${res.status}). Please try again in a moment.`,
    );
  }

  if (!data?.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
    throw new Error('No speech detected in audio. Please try a video with clear spoken dialogue.');
  }

  onStatus?.('Finalizing caption timeline…');
  return data.segments;
}
