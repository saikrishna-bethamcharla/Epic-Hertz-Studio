// ─── ExportModal ──────────────────────────────────────────────────────────────
// Pro export dialog: Lossless MP4 (stream copy), Hardcoded pixel burn MP4, SRT, VTT, TXT.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toSRT, toVTT, downloadText, downloadBlob } from './utils/srt';
import { burnCaptions, embedSubtitlesMP4 } from './utils/burnCaptions';
import { burnCaptionsCanvas } from './utils/burnCaptionsCanvas';
import type { Segment, SubtitleStyle } from './types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File;
  segments: Segment[];
  style: SubtitleStyle;
  onBurnStart: () => void;
  onBurnProgress: (pct: number) => void;
  onBurnDone: () => void;
  onBurnError: (msg: string) => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  videoFile,
  segments,
  style,
  onBurnStart,
  onBurnProgress,
  onBurnDone,
  onBurnError,
}: ExportModalProps) {
  const [exportType, setExportType] = useState<'lossless' | 'hardsub' | 'srt' | 'vtt' | 'txt'>('lossless');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseName = videoFile.name.replace(/\.[^.]+$/, '');

  const handleExport = async () => {
    setError(null);
    setProcessing(true);

    try {
      if (exportType === 'srt') {
        downloadText(toSRT(segments), `${baseName}.srt`, 'text/plain');
        onClose();
        return;
      }
      if (exportType === 'vtt') {
        downloadText(toVTT(segments), `${baseName}.vtt`, 'text/vtt');
        onClose();
        return;
      }
      if (exportType === 'txt') {
        const txt = segments.map((s) => s.text).join('\n');
        downloadText(txt, `${baseName}_transcript.txt`, 'text/plain');
        onClose();
        return;
      }

      // MP4 exports
      onClose();
      onBurnStart();

      if (exportType === 'lossless') {
        const srtContent = toSRT(segments);
        const blob = await embedSubtitlesMP4(videoFile, srtContent);
        downloadBlob(blob, `${baseName}_subtitled.mp4`);
        onBurnDone();
      } else if (exportType === 'hardsub') {
        const srtContent = toSRT(segments);
        let blob: Blob;
        try {
          blob = await burnCaptions(videoFile, srtContent, style, (pct) => {
            onBurnProgress(pct);
          });
        } catch (ffmpegErr) {
          console.warn('FFmpeg WASM burn encountered an issue, seamlessly switching to hardware Canvas burn:', ffmpegErr);
          blob = await burnCaptionsCanvas(videoFile, segments, style, (pct) => {
            onBurnProgress(pct);
          });
        }
        downloadBlob(blob, `${baseName}_burned.mp4`);
        onBurnDone();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      onBurnError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        className="w-full max-w-lg rounded-2xl bg-[#171716] border border-white/10 shadow-2xl p-6 flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-bone">Export Video & Captions</h2>
            <p className="text-xs text-smoke mt-0.5">Choose your delivery format for clients or social channels</p>
          </div>
          <button
            onClick={onClose}
            className="text-smoke hover:text-bone text-base p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-crimson/15 border border-crimson/40 text-xs text-crimson-2">
            {error}
          </div>
        )}

        {/* Export Formats Selection */}
        <div className="space-y-3 mt-5">
          {/* 1. Lossless Softsub MP4 */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              exportType === 'lossless'
                ? 'bg-[#252420] border-amber-400/80 shadow-sm'
                : 'bg-[#1c1c1a] border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="exportType"
              checked={exportType === 'lossless'}
              onChange={() => setExportType('lossless')}
              className="mt-1 accent-amber-400"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-bone">Lossless Subtitled MP4</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-[11px] text-smoke mt-1 leading-relaxed">
                Stream-copied MP4 with embedded forced subtitle track. 100% original video resolution & 60fps quality with zero re-encoding loss.
              </p>
            </div>
          </label>

          {/* 2. Hardcoded Burn MP4 */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              exportType === 'hardsub'
                ? 'bg-[#252420] border-amber-400/80 shadow-sm'
                : 'bg-[#1c1c1a] border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="exportType"
              checked={exportType === 'hardsub'}
              onChange={() => setExportType('hardsub')}
              className="mt-1 accent-amber-400"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-bone">Hardcoded Burn MP4</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                  REELS / TIKTOK
                </span>
              </div>
              <p className="text-[11px] text-smoke mt-1 leading-relaxed">
                Burns styled captions directly into the video pixels. Permanent on Instagram Reels, TikTok, YouTube Shorts, and WhatsApp statuses.
              </p>
            </div>
          </label>

          {/* 3. Subtitle / Transcript files */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {(['srt', 'vtt', 'txt'] as const).map((fmt) => (
              <label
                key={fmt}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  exportType === fmt
                    ? 'bg-[#252420] border-amber-400 text-amber-200'
                    : 'bg-[#1c1c1a] border-white/10 text-mist hover:border-white/20 hover:text-bone'
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  checked={exportType === fmt}
                  onChange={() => setExportType(fmt)}
                  className="sr-only"
                />
                <span className="block font-mono font-bold text-xs uppercase">.{fmt}</span>
                <span className="text-[10px] text-smoke block mt-0.5">
                  {fmt === 'txt' ? 'Plain Script' : 'Timestamps'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-end gap-3 mt-7">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-smoke hover:text-bone transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleExport}
            className="px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-semibold text-xs transition-all shadow-md flex items-center gap-2"
          >
            <span>Export Now</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
