// ─── Caption burning via ffmpeg.wasm ────────────────────────────────────────
// Hardcodes subtitles into the video using the 'subtitles' filter.
// Runs entirely in-browser — no server needed.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { getAssetUrl } from './assetUrl';
import type { SubtitleStyle } from '../types';

let ffmpegBurnInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegBurnInstance?.loaded) return ffmpegBurnInstance;

  const ffmpeg = new FFmpeg();
  try {
    const localCore = getAssetUrl('ffmpeg/ffmpeg-core.js');
    const localWasm = getAssetUrl('ffmpeg/ffmpeg-core.wasm');

    await ffmpeg.load({
      coreURL: await toBlobURL(localCore, 'text/javascript'),
      wasmURL: await toBlobURL(localWasm, 'application/wasm'),
    });
  } catch (err) {
    console.warn('Local ffmpeg load failed, attempting CDN fallback...', err);
    const cdnBase = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  ffmpegBurnInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Burns SRT subtitles into a video file and returns the output as a Blob.
 * @param videoFile  The original video File
 * @param srtContent The .srt string to burn in
 * @param onProgress  Callback with 0–100 progress
 */
export async function burnCaptions(
  videoFile: File,
  srtContent: string,
  style?: SubtitleStyle,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(Math.min(progress, 1) * 100));
  });

  const inputName = 'input_video.mp4';
  const srtName = 'subs.srt';
  const fontName = 'gautami.ttf';
  const outputName = 'captioned.mp4';

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  // Load font file
  const fontUrl = getAssetUrl(`fonts/${fontName}`);
  const fontRes = await fetch(fontUrl);
  const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

  // Alignment: 2 = bottom-center, 5 = center-center, 8 = top-center
  const align = style?.position === 'top' ? '8' : style?.position === 'middle' ? '5' : '2';
  const marginV = style?.position === 'top' ? '25' : style?.position === 'middle' ? '0' : '30';

  // Map hex color #RRGGBB → ASS color &H00BBGGRR
  const toAssColor = (hexStr?: string, defaultColor = '&H00FFFFFF'): string => {
    if (!hexStr) return defaultColor;
    const hex = hexStr.replace('#', '').trim();
    if (hex.length === 6) {
      const r = hex.substring(0, 2);
      const g = hex.substring(2, 4);
      const b = hex.substring(4, 6);
      return `&H00${b}${g}${r}`;
    }
    return defaultColor;
  };

  const primaryAss = toAssColor(style?.textColor, '&H00FFFFFF');
  const outlineAss = toAssColor(style?.outlineColor, '&H00000000');
  const outlineSize = Math.max(2, style?.outlineWidth ?? 3);
  const fontSize = style?.fontSize ? Math.round(style.fontSize * 1.1) : 26;

  // Process uppercase SRT if requested
  const processedSrt = style?.uppercase
    ? srtContent
        .split('\n')
        .map((line) => (/^\d+$/.test(line.trim()) || line.includes('-->') ? line : line.toUpperCase()))
        .join('\n')
    : srtContent;

  const styleStr = [
    'FontName=Gautami',
    `FontSize=${fontSize}`,
    `PrimaryColour=${primaryAss}`,
    `OutlineColour=${outlineAss}`,
    'BackColour=&H80000000',
    'BorderStyle=1',
    `Outline=${outlineSize}`,
    'Shadow=2',
    'Bold=1',
    `Alignment=${align}`,
    `MarginV=${marginV}`,
  ].join(',');

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
  await ffmpeg.writeFile(srtName, processedSrt);
  await ffmpeg.writeFile(fontName, fontBytes);

  await ffmpeg.exec([
    '-i', inputName,
    '-vf', `subtitles=${srtName}:fontsdir=.:force_style='${styleStr}'`,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '22',
    '-c:a', 'copy',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);

  // Clean up wasm filesystem
  await Promise.allSettled([
    ffmpeg.deleteFile(inputName),
    ffmpeg.deleteFile(srtName),
    ffmpeg.deleteFile(fontName),
    ffmpeg.deleteFile(outputName),
  ]);

  return new Blob([data], { type: 'video/mp4' });
}

/**
 * Embeds subtitles losslessly into the MP4 container as a timed text track.
 * Video & audio frames are copied bit-for-bit (0% quality loss, 0% frame drops, 100% original fps).
 * Any video player (VLC, QuickTime, Windows Media, TV, phone) can display it with native subtitle toggle.
 */
export async function embedSubtitlesMP4(
  videoFile: File,
  srtContent: string,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  const inputName = 'input_video.mp4';
  const srtName = 'subs.srt';
  const outputName = 'captioned_lossless.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
  await ffmpeg.writeFile(srtName, srtContent);

  // Stream-copy video & audio without re-encoding!
  // -c:v copy: preserves 100% original video frame rate & quality
  // -c:a copy: preserves original audio
  // -c:s mov_text: embeds the subtitle track natively inside MP4
  // -disposition:s:0 default+forced: instructs media players to show subtitles AUTOMATICALLY without manual toggling!
  await ffmpeg.exec([
    '-i', inputName,
    '-i', srtName,
    '-c:v', 'copy',
    '-c:a', 'copy',
    '-c:s', 'mov_text',
    '-metadata:s:s:0', 'language=tel',
    '-disposition:s:0', 'default+forced',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);

  await Promise.allSettled([
    ffmpeg.deleteFile(inputName),
    ffmpeg.deleteFile(srtName),
    ffmpeg.deleteFile(outputName),
  ]);

  return new Blob([data], { type: 'video/mp4' });
}
