// ─── Fast captioned-video export (WebCodecs) ────────────────────────────────
// Decodes the source video frame by frame, draws the captions on each frame with the SAME
// engine the preview uses, hardware-encodes the result and carries the audio across.
// It is not tied to playback, so it runs faster than real time, is frame accurate, keeps the
// source frame rate and lets us pick quality and resolution.
//
// If anything about the browser can't do this (no WebCodecs, no encodable codec, audio that
// cannot be carried over) it throws, and the caller falls back to the canvas path.
// We never hand back a file that silently lost its sound.

import type { Segment, CaptionStyle } from '../types';
import { renderCaptions } from '../engine/render';
import { ensureFonts } from '../engine/fonts';

export type ExportQuality = 'standard' | 'high' | 'max';

export interface ExportOptions {
  quality: ExportQuality;
  /** Cap the SHORT side of the output (e.g. 1080). 0 / undefined keeps the source size. */
  maxShortSide?: number;
  /** Optional file stream for direct-to-disk streaming in Chromium to eliminate RAM bloat. */
  fileStream?: WritableStream;
}

export interface ExportProgress {
  /** 0–100 */
  pct: number;
  /** Seconds remaining, once enough has been processed to estimate. */
  etaSec?: number;
}

export class ExportUnsupportedError extends Error {}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

export function webCodecsSupported(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
}

/**
 * Pre-flight memory estimator based on video duration, dimensions, and target quality.
 * Flags scenarios above ~950MB that risk crashing browser tabs on mobile or low-RAM environments.
 */
export function estimateExportMemory(
  durationSec: number,
  srcWidth: number,
  srcHeight: number,
  quality: ExportQuality,
  maxShortSide?: number,
): { estimatedBytes: number; isHighMemory: boolean } {
  const cap = maxShortSide ?? 0;
  const scale = cap > 0 ? Math.min(1, cap / Math.min(srcWidth, srcHeight)) : 1;
  const outW = srcWidth * scale;
  const outH = srcHeight * scale;
  const pixels = outW * outH;

  // Empirical target bitrates for H.264
  const pixelFactor = pixels / (1920 * 1080);
  const baseBitrate =
    quality === 'max' ? 16_000_000 : quality === 'standard' ? 3_500_000 : 8_000_000;
  const bitrate = baseBitrate * Math.max(0.2, pixelFactor);

  const estimatedBytes = Math.round((bitrate * durationSec) / 8);
  const isHighMemory = estimatedBytes > 950_000_000 || (pixels > 1920 * 1080 && durationSec > 180);

  return { estimatedBytes, isHighMemory };
}

/**
 * Hardware-accelerated frame-by-frame export via WebCodecs and mediabunny.
 * When `options.fileStream` is provided (e.g. from File System Access API), streams directly to disk.
 * Otherwise returns a standalone video Blob.
 */
export async function exportCaptionedVideo(
  file: File,
  segments: Segment[],
  style: CaptionStyle,
  options: ExportOptions,
  onProgress?: (p: ExportProgress) => void,
  signal?: AbortSignal,
): Promise<Blob | null> {
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
  if (!webCodecsSupported())
    throw new ExportUnsupportedError('WebCodecs is not available in this browser.');

  await ensureFonts(style, segments.map((s) => s.text).join(' '));
  const mb = await import('mediabunny');

  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  try {
    const vTrack = await input.getPrimaryVideoTrack();
    if (!vTrack) throw new ExportUnsupportedError('No video track found.');

    // Output size (optionally capped on the short side; always even for H.264)
    const srcW = await vTrack.getDisplayWidth();
    const srcH = await vTrack.getDisplayHeight();
    const cap = options.maxShortSide ?? 0;
    const scale = cap > 0 ? Math.min(1, cap / Math.min(srcW, srcH)) : 1;
    const outW = even(srcW * scale);
    const outH = even(srcH * scale);

    // H.264 MP4 is what every social platform accepts. Where the browser can't encode it
    // (some Linux builds), fall back to VP9 in WebM rather than mislabel a file.
    const useAvc = await mb.canEncodeVideo('avc', { width: outW, height: outH });
    const canVp9 = !useAvc && (await mb.canEncodeVideo('vp9', { width: outW, height: outH }));
    if (!useAvc && !canVp9) throw new ExportUnsupportedError('No video encoder available.');

    // AAC is the safest audio codec inside an MP4. Use it when the browser can encode it; sources
    // that are already AAC are copied across untouched.
    const aacOk = useAvc && (await mb.canEncodeAudio('aac'));

    const isStreaming = Boolean(options.fileStream);
    const target = isStreaming ? new mb.StreamTarget(options.fileStream!) : new mb.BufferTarget();

    const output = new mb.Output({
      format: useAvc
        ? new mb.Mp4OutputFormat({ fastStart: isStreaming ? false : 'in-memory' })
        : new mb.WebMOutputFormat(),
      target,
    });

    const quality =
      options.quality === 'max'
        ? mb.QUALITY_VERY_HIGH
        : options.quality === 'standard'
          ? mb.QUALITY_MEDIUM
          : mb.QUALITY_HIGH;

    // One reusable canvas: source frame first, captions on top
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new ExportUnsupportedError('Canvas is not available.');

    const conversion = await mb.Conversion.init({
      input,
      output,
      showWarnings: false,
      audio: aacOk ? { codec: 'aac' } : undefined,
      video: {
        codec: useAvc ? 'avc' : 'vp9',
        quality,
        width: outW,
        height: outH,
        fit: 'contain',
        process: (sample) => {
          if (canvas.width !== sample.displayWidth || canvas.height !== sample.displayHeight) {
            canvas.width = sample.displayWidth;
            canvas.height = sample.displayHeight;
          }
          sample.draw(ctx, 0, 0);
          renderCaptions(ctx, canvas.width, canvas.height, sample.timestamp, segments, style);
          return canvas;
        },
        processedWidth: outW,
        processedHeight: outH,
      },
    });

    if (!conversion.isValid)
      throw new ExportUnsupportedError('This video cannot be exported in this browser.');

    // The library drops tracks it cannot encode without failing. Losing the sound is not acceptable.
    const audioTracks = await input.getAudioTracks();
    const droppedAudio = conversion.discardedTracks.some(
      (d) => d.track.isAudioTrack() && d.reason !== 'discarded_by_user',
    );
    if (audioTracks.length > 0 && droppedAudio) {
      throw new ExportUnsupportedError('The audio could not be carried over in this browser.');
    }

    const started = performance.now();
    conversion.onProgress = (p) => {
      const elapsed = (performance.now() - started) / 1000;
      const etaSec = p > 0.04 ? Math.max(0, elapsed / p - elapsed) : undefined;
      onProgress?.({ pct: Math.min(99, p * 100), etaSec });
    };

    if (signal) {
      if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');
      signal.addEventListener(
        'abort',
        () => {
          void conversion.cancel();
          if (isStreaming && options.fileStream) {
            options.fileStream.abort().catch(() => {});
          }
        },
        { once: true },
      );
    }

    try {
      await conversion.execute();
    } catch (execErr: unknown) {
      if (signal?.aborted || (execErr instanceof DOMException && execErr.name === 'AbortError')) {
        throw new DOMException('Export cancelled', 'AbortError');
      }
      const msg = execErr instanceof Error ? execErr.message : String(execErr);
      if (/quota|memory|allocation|out of memory|ArrayBuffer/i.test(msg)) {
        throw new Error(
          'Out of memory during video encoding. Try selecting 1080p resolution or Standard quality.',
        );
      }
      if (/encode|encoder|codec/i.test(msg)) {
        throw new Error(
          `Video hardware encoding error: ${msg}. Try exporting with Standard quality or 1080p.`,
        );
      }
      throw execErr;
    }

    if (isStreaming && options.fileStream) {
      await options.fileStream.close().catch(() => {});
      onProgress?.({ pct: 100 });
      return null;
    }

    const buffer = (output.target as InstanceType<typeof mb.BufferTarget>).buffer;
    if (!buffer) throw new Error('The encoder produced no data.');
    onProgress?.({ pct: 100 });
    return new Blob([buffer], { type: useAvc ? 'video/mp4' : 'video/webm' });
  } finally {
    input.dispose?.();
  }
}
