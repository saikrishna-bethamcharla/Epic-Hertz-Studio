// ─── ExportModal ──────────────────────────────────────────────────────────────
// Pro export dialog: Fast WebCodecs burn-in with real-time canvas fallback, SRT, VTT, TXT.
// Supports direct-to-disk streaming in Chromium via File System Access API.

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Download } from 'lucide-react';
import { useModalA11y } from './hooks/useModalA11y';
import { toSRT, toVTT, downloadText, downloadBlob } from './utils/srt';
import { burnCaptionsCanvas } from './utils/burnCaptionsCanvas';
import {
  exportCaptionedVideo,
  estimateExportMemory,
  type ExportQuality,
} from './utils/exportVideo';
import type { Segment, CaptionStyle, LowerThirdSpec } from './types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File;
  segments: Segment[];
  style: CaptionStyle;
  lowerThirds?: LowerThirdSpec[];
  photoCache?: Map<string, HTMLImageElement>;
  onBurnStart: () => void;
  onBurnProgress: (pct: number) => void;
  onBurnStatus?: (msg: string) => void;
  onBurnDone: () => void;
  onBurnError: (msg: string) => void;
  signal?: AbortSignal;
}

export default function ExportModal({
  isOpen,
  onClose,
  videoFile,
  segments,
  style,

  lowerThirds,
  photoCache,
  onBurnStart,
  onBurnProgress,
  onBurnStatus,
  onBurnDone,
  onBurnError,
  signal,
}: ExportModalProps) {
  const [quality, setQuality] = useState<ExportQuality>('high');
  const [resolution, setResolution] = useState<'original' | '1080'>('original');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadSubtitle = (fmt: 'srt' | 'vtt' | 'txt') => {
    try {
      if (fmt === 'srt') {
        downloadText(toSRT(segments), `${baseName}.srt`, 'text/plain');
        onBurnStatus?.('Downloaded .SRT subtitle file.');
      } else if (fmt === 'vtt') {
        downloadText(toVTT(segments), `${baseName}.vtt`, 'text/vtt');
        onBurnStatus?.('Downloaded .VTT subtitle file.');
      } else if (fmt === 'txt') {
        const txt = segments.map((s) => s.text).join('\n');
        downloadText(txt, `${baseName}_transcript.txt`, 'text/plain');
        onBurnStatus?.('Downloaded .TXT transcript file.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  // Video metadata for memory preflight
  const [videoMeta, setVideoMeta] = useState<{
    width: number;
    height: number;
    duration: number;
  } | null>(null);

  const modalRef = useModalA11y<HTMLDivElement>({
    isOpen,
    onClose: () => {
      if (!processing) onClose();
    },
    closeOnEscape: !processing,
  });

  useEffect(() => {
    if (!videoFile) return;
    const v = document.createElement('video');
    v.src = URL.createObjectURL(videoFile);
    v.onloadedmetadata = () => {
      setVideoMeta({
        width: v.videoWidth || 1920,
        height: v.videoHeight || 1080,
        duration: v.duration || 60,
      });
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => URL.revokeObjectURL(v.src);
  }, [videoFile]);

  // Browser engine capability detection
  const canExportVideo = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
    const canvas = document.createElement('canvas');
    const hasCaptureStream =
      typeof (canvas as unknown as { captureStream?: () => MediaStream }).captureStream ===
      'function';
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    return hasWebCodecs || (hasCaptureStream && hasMediaRecorder);
  }, []);

  const baseName = videoFile.name.replace(/\.[^.]+$/, '');

  // Pre-flight memory estimation
  const memoryEstimate = videoMeta
    ? estimateExportMemory(
        videoMeta.duration,
        videoMeta.width,
        videoMeta.height,
        quality,
        resolution === '1080' ? 1080 : 0,
      )
    : null;

  // Auto-enforce recommendations if memory is high to prevent browser OOM.
  // Guarded on equality so the effect settles instead of re-applying forever.
  const recommendedResolution =
    memoryEstimate?.recommendedResolution === '1080' ? '1080' : 'original';
  useEffect(() => {
    if (!isOpen || !memoryEstimate?.isHighMemory) return;
    if (quality === memoryEstimate.recommendedQuality && resolution === recommendedResolution) {
      return;
    }
    setQuality(memoryEstimate.recommendedQuality);
    setResolution(recommendedResolution);
    onBurnStatus?.(
      `High memory footprint detected. Auto-selected ${memoryEstimate.recommendedQuality} quality at ${recommendedResolution === '1080' ? '1080p' : 'original'} resolution to prevent browser memory limits.`,
    );
  }, [isOpen, memoryEstimate, quality, resolution, recommendedResolution, onBurnStatus]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setError(null);
    setProcessing(true);

    try {
      // Check if Chromium direct-to-disk streaming is available
      let fileStream: WritableStream | undefined;
      let streamedDirectly = false;
      const canStreamToDisk = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

      if (canStreamToDisk) {
        try {
          const picker = (
            window as unknown as {
              showSaveFilePicker: (opts: {
                suggestedName: string;
                types: Array<{ description: string; accept: Record<string, string[]> }>;
              }) => Promise<{ createWritable: () => Promise<WritableStream> }>;
            }
          ).showSaveFilePicker;

          const handle = await picker({
            suggestedName: `${baseName}_captioned.mp4`,
            types: [
              {
                description: 'MP4 Video',
                accept: { 'video/mp4': ['.mp4'] },
              },
            ],
          });
          fileStream = await handle.createWritable();
          streamedDirectly = true;
        } catch (pickerErr) {
          // If user cancels the file picker, stop cleanly without error
          if (pickerErr instanceof DOMException && pickerErr.name === 'AbortError') {
            setProcessing(false);
            return;
          }
          // Otherwise, fall back to in-memory BufferTarget
          fileStream = undefined;
          streamedDirectly = false;
        }
      }

      // Close modal and show progress overlay
      onClose();
      onBurnStart();

      let blob: Blob | null = null;
      try {
        // Tier 1: Hardware-accelerated WebCodecs frame-by-frame export
        blob = await exportCaptionedVideo(
          videoFile,
          segments,
          style,
          {
            quality,
            maxShortSide: resolution === '1080' ? 1080 : 0,
            fileStream,
            lowerThirds,
            photoCache,
          },
          ({ pct, etaSec }) => {
            onBurnProgress(pct);
            const eta =
              etaSec === undefined
                ? ''
                : ` · about ${
                    etaSec < 90
                      ? `${Math.max(1, Math.round(etaSec))} s`
                      : `${Math.round(etaSec / 60)} min`
                  } left`;
            onBurnStatus?.(`Exporting your captioned video… ${Math.round(pct)}%${eta}`);
          },
          signal,
        );
      } catch (fastErr: unknown) {
        if (signal?.aborted || (fastErr instanceof DOMException && fastErr.name === 'AbortError')) {
          throw fastErr;
        }
        console.warn('Fast WebCodecs export unavailable, using real-time canvas export:', fastErr);
        onBurnStatus?.(
          'Fast hardware encoder unavailable in this browser. Exporting in real time…',
        );

        // Tier 2: Real-time Canvas + Web Audio MediaRecorder fallback
        blob = await burnCaptionsCanvas(
          videoFile,
          segments,
          style,
          (pct) => {
            onBurnProgress(pct);
          },
          signal,
          lowerThirds,
          photoCache,
        );
      }

      if (!streamedDirectly && blob) {
        const ext = blob.type.includes('webm') ? 'webm' : 'mp4';
        downloadBlob(blob, `${baseName}_captioned.${ext}`);
      }

      onBurnDone();
    } catch (err: unknown) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        onBurnStatus?.('Export cancelled.');
        return;
      }
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
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl bg-[#171716] border border-white/10 shadow-2xl p-6 flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 id="export-modal-title" className="text-lg font-bold text-bone">
              Export Captioned Video
            </h2>
            <p className="text-xs text-smoke mt-0.5">
              Hardware-accelerated MP4 export with 60fps animation fidelity
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            title="Close dialog"
            className="text-smoke hover:text-bone text-base p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-crimson/15 border border-crimson/40 text-xs text-crimson-2">
            {error}
          </div>
        )}

        {/* Pre-flight Memory Warning */}
        {memoryEstimate?.isHighMemory && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-300">
                High memory footprint detected (~
                {(memoryEstimate.estimatedBytes / 1024 / 1024 / 1024).toFixed(1)} GB)
              </div>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                To prevent browser memory limits on long videos, we recommend selecting{' '}
                <strong>Up to 1080p</strong> and <strong>Standard</strong> quality.
              </p>
            </div>
          </div>
        )}

        {/* Export Settings */}
        <div className="space-y-4 mt-5">
          {/* Quality & Resolution */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[#1c1c1a] p-3">
            {(
              [
                [
                  'Quality',
                  quality,
                  [
                    ['standard', 'Standard'],
                    ['high', 'High'],
                    ['max', 'Maximum'],
                  ],
                  (v: string) => setQuality(v as ExportQuality),
                ],
                [
                  'Resolution',
                  resolution,
                  [
                    ['original', 'Original'],
                    ['1080', 'Up to 1080p'],
                  ],
                  (v: string) => setResolution(v as 'original' | '1080'),
                ],
              ] as const
            ).map(([label, value, options, onPick]) => (
              <div key={label}>
                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-smoke mb-1.5">
                  {label}
                </div>
                <div
                  className="flex rounded-lg overflow-hidden border border-white/10"
                  role="group"
                  aria-label={label}
                >
                  {options.map(([v, text]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onPick(v)}
                      aria-pressed={value === v}
                      className={`flex-1 px-1.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                        value === v
                          ? 'bg-amber-400 text-black'
                          : 'text-mist hover:text-bone hover:bg-white/5'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Subtitle / Transcript files */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-bone">Subtitle & Transcript Files</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['srt', 'SRT', 'Timestamps'],
                  ['vtt', 'VTT', 'Timestamps'],
                  ['txt', 'TXT', 'Plain Script'],
                ] as const
              ).map(([fmt, label, desc]) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleDownloadSubtitle(fmt)}
                  className="p-3 rounded-xl border border-white/10 bg-[#1c1c1a] hover:border-amber-400/60 hover:bg-[#252420] text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
                >
                  <div className="flex items-center gap-1 font-mono font-bold text-xs uppercase text-bone group-hover:text-amber-300">
                    <span>.{label}</span>
                    <Download className="w-3 h-3 text-smoke group-hover:text-amber-300 transition-colors" />
                  </div>
                  <span className="text-[10px] text-smoke block mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {!canExportVideo && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Video Export Unsupported in Safari / WebKit</span>
              </p>
              <p className="text-amber-300/80 leading-relaxed">
                Your browser lacks client-side video encoding support (WebCodecs and
                Canvas.captureStream). You can still download SRT, VTT, or TXT subtitles above, or
                open Epic Hertz Studio in Chrome or Firefox for full MP4 video export.
              </p>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-end gap-3 mt-7">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-smoke hover:text-bone transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing || !canExportVideo}
            onClick={handleExport}
            className="px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 disabled:cursor-not-allowed active:scale-95 text-black font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>{processing ? 'Exporting…' : 'Export Video'}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
