// ─── Audio extraction via ffmpeg.wasm ───────────────────────────────────────
// Pulls the audio track out of a video file so we can send it to Gemini.
// Uses @ffmpeg/ffmpeg which runs entirely in-browser via WebAssembly.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  // Load ffmpeg-core locally from /ffmpeg/ (ESM) to prevent cross-origin/CORS blocking
  const baseURL = window.location.origin + '/ffmpeg';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Extracts the audio track from a video File as an MP3 Blob.
 * Strips video so the payload sent to Gemini is as small as possible.
 */
export async function extractAudio(
  videoFile: File,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const inputName = 'input_video';
  const outputName = 'audio_out.mp3';

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
  await ffmpeg.exec([
    '-i', inputName,
    '-vn',                // strip video
    '-acodec', 'libmp3lame',
    '-q:a', '4',          // VBR quality ~128kbps — good enough for STT
    '-ar', '16000',       // 16 kHz — optimal for speech recognition
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  // Clean up temp files
  await ffmpeg.deleteFile(inputName).catch(() => {});
  await ffmpeg.deleteFile(outputName).catch(() => {});

  return new Blob([data], { type: 'audio/mp3' });
}

/**
 * Preloads ffmpeg.wasm in the background so the first user action feels instant.
 */
export function prefetchFFmpeg(): void {
  getFFmpeg().catch(() => {});
}
