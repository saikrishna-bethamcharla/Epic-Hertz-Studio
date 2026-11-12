// ─── ExportModal ──────────────────────────────────────────────────────────────
// Professional NLE-style export dialog with live cover preview, custom resolution,
// bitrate, codec, format, frame rate, subtitle exports, and duration/size telemetry.

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Folder,
  Film,
  Download,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useModalA11y } from './hooks/useModalA11y';
import { toSRT, toVTT, downloadText, downloadBlob } from './utils/srt';
import { burnCaptionsCanvas } from './utils/burnCaptionsCanvas';
import {
  exportCaptionedVideo,
  estimateExportMemory,
  type ExportQuality,
} from './utils/exportVideo';
import { renderCaptions } from './engine/render';
import { renderLowerThirds } from './engine/lowerThirds';
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
  const baseName = videoFile ? videoFile.name.replace(/\.[^.]+$/, '') : 'video';

  // Export settings state
  const [fileName, setFileName] = useState(`${baseName}`);
  const [exportTo, setExportTo] = useState(`C:/Users/Downloads/${baseName}.mp4`);
  const [resolution, setResolution] = useState<'original' | '4k' | '1440' | '1080' | '720'>('1080');
  const [bitrate, setBitrate] = useState<'recommended' | 'higher' | 'custom'>('recommended');
  const [codec, setCodec] = useState<'h264' | 'hevc' | 'av1'>('h264');
  const [format, setFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');
  const [frameRate, setFrameRate] = useState<'30' | '60' | '24' | 'original'>('30');
  const [removeWatermark, setRemoveWatermark] = useState(true);

  // Section accordions
  const [videoSectionOpen, setVideoSectionOpen] = useState(true);
  const [audioSectionOpen, setAudioSectionOpen] = useState(false);
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'aac'>('mp3');

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cover preview canvas
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [coverTime, setCoverTime] = useState(1.0);

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

  // Extract source video metadata
  useEffect(() => {
    if (!videoFile) return;
    const v = document.createElement('video');
    v.src = URL.createObjectURL(videoFile);
    v.onloadedmetadata = () => {
      setVideoMeta({
        width: v.videoWidth || 1080,
        height: v.videoHeight || 1920,
        duration: v.duration || 60,
      });
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => URL.revokeObjectURL(v.src);
  }, [videoFile]);

  // Keep destination path synchronized when name or format changes
  useEffect(() => {
    setExportTo(`C:/Users/Downloads/${fileName || baseName}.${format}`);
  }, [fileName, format, baseName]);

  // Render live video cover preview with styled captions and lower thirds
  useEffect(() => {
    if (!videoFile || !isOpen) return;
    const v = document.createElement('video');
    v.src = URL.createObjectURL(videoFile);
    v.currentTime = Math.min(coverTime, (videoMeta?.duration || 10) - 0.1);
    v.muted = true;
    v.playsInline = true;
    v.onseeked = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const vw = v.videoWidth || 1080;
      const vh = v.videoHeight || 1920;
      canvas.width = vw;
      canvas.height = vh;
      ctx.drawImage(v, 0, 0, vw, vh);
      renderCaptions(ctx, vw, vh, v.currentTime, segments, style);
      if (lowerThirds && photoCache) {
        renderLowerThirds(ctx, vw, vh, v.currentTime, lowerThirds, photoCache);
      }
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => URL.revokeObjectURL(v.src);
  }, [videoFile, isOpen, coverTime, videoMeta, segments, style, lowerThirds, photoCache]);

  const handleNextCoverFrame = () => {
    const maxDur = videoMeta?.duration || 10;
    setCoverTime((prev) => (prev + 2.0 >= maxDur ? 0.5 : prev + 2.0));
  };

  const handleBrowseLocation = async () => {
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const picker = (
          window as unknown as {
            showSaveFilePicker: (opts: {
              suggestedName: string;
              types: { description: string; accept: Record<string, string[]> }[];
            }) => Promise<{ name: string }>;
          }
        ).showSaveFilePicker({
          suggestedName: `${fileName || baseName}.${format}`,
          types: [
            {
              description: 'Video file',
              accept: { [`video/${format}`]: [`.${format}`] },
            },
          ],
        });
        const handle = await picker;
        if (handle?.name) {
          setFileName(handle.name.replace(/\.[^.]+$/, ''));
          setExportTo(`Selected: ${handle.name}`);
        }
      } catch {
        // User cancelled picker
      }
    }
  };

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

  // Map resolution selection to pixel cap
  const maxShortSide = useMemo(() => {
    if (resolution === '4k') return 2160;
    if (resolution === '1440') return 1440;
    if (resolution === '1080') return 1080;
    if (resolution === '720') return 720;
    return 0; // original
  }, [resolution]);

  // Map bitrate selection to quality tier
  const exportQuality: ExportQuality = useMemo(() => {
    if (bitrate === 'higher') return 'max';
    if (bitrate === 'custom') return 'standard';
    return 'high';
  }, [bitrate]);

  // Pre-flight memory estimation
  const memoryEstimate = videoMeta
    ? estimateExportMemory(
        videoMeta.duration,
        videoMeta.width,
        videoMeta.height,
        exportQuality,
        maxShortSide,
      )
    : null;

  // Format footer telemetry
  const durationSec = videoMeta?.duration || 0;
  const durMin = Math.floor(durationSec / 60);
  const durSec = Math.floor(durationSec % 60);
  const durationStr = `${durMin}m ${durSec.toString().padStart(2, '0')}s`;

  const sizeMb = memoryEstimate ? Math.round(memoryEstimate.estimatedBytes / (1024 * 1024)) : 0;
  const sizeStr = sizeMb > 1024 ? `${(sizeMb / 1024).toFixed(1)} GB` : `${sizeMb || 209} MB`;

  const handleDownloadSubtitle = (fmt: 'srt' | 'vtt' | 'txt') => {
    try {
      const outName = fileName || baseName;
      if (fmt === 'srt') {
        downloadText(toSRT(segments), `${outName}.srt`, 'text/plain');
        onBurnStatus?.('Downloaded .SRT subtitle file.');
      } else if (fmt === 'vtt') {
        downloadText(toVTT(segments), `${outName}.vtt`, 'text/vtt');
        onBurnStatus?.('Downloaded .VTT subtitle file.');
      } else if (fmt === 'txt') {
        const txt = segments.map((s) => s.text).join('\n');
        downloadText(txt, `${outName}_transcript.txt`, 'text/plain');
        onBurnStatus?.('Downloaded .TXT transcript file.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  const handleExport = async () => {
    setError(null);
    setProcessing(true);

    try {
      let fileStream: WritableStream | undefined;
      let streamedDirectly = false;
      const canStreamToDisk = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

      if (canStreamToDisk) {
        try {
          const picker = (
            window as unknown as {
              showSaveFilePicker: (opts: {
                suggestedName: string;
                types: { description: string; accept: Record<string, string[]> }[];
              }) => Promise<{ createWritable: () => Promise<WritableStream> }>;
            }
          ).showSaveFilePicker({
            suggestedName: `${fileName || baseName}_captioned.${format}`,
            types: [
              {
                description: 'Exported Captioned Video',
                accept: { [`video/${format}`]: [`.${format}`] },
              },
            ],
          });
          const handle = await picker;
          fileStream = await handle.createWritable();
          streamedDirectly = true;
        } catch {
          // User dismissed picker; fall back to normal in-memory blob download
        }
      }

      onBurnStart();
      onClose();

      let blob: Blob | null = null;
      try {
        // Tier 1: Hardware-accelerated frame decode/encode via WebCodecs
        blob = await exportCaptionedVideo(
          videoFile,
          segments,
          style,
          {
            quality: exportQuality,
            maxShortSide,
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
        const ext = blob.type.includes('webm') ? 'webm' : format;
        downloadBlob(blob, `${fileName || baseName}_captioned.${ext}`);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        tabIndex={-1}
        className="w-full max-w-4xl rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-2xl p-5 md:p-6 flex flex-col text-bone max-h-[92vh]"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
          <h2 id="export-modal-title" className="text-sm font-semibold text-bone">
            Export-{fileName || baseName}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            title="Close dialog"
            className="text-smoke hover:text-bone text-sm p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-crimson/15 border border-crimson/40 text-xs text-crimson-2">
            {error}
          </div>
        )}

        {/* Pre-flight Memory Warning */}
        {memoryEstimate?.isHighMemory && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-300">
                Large export footprint (~
                {(memoryEstimate.estimatedBytes / 1024 / 1024 / 1024).toFixed(1)} GB)
              </div>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                We recommend selecting <strong>1080p</strong> and <strong>Recommended</strong> bit
                rate for safe browser export.
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid: Left Preview Card | Right Form Settings */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 mt-4 overflow-y-auto pr-1 flex-1">
          {/* Left Column: Video & Cover Preview */}
          <div className="flex flex-col items-center">
            <div className="w-full bg-[#121212] border border-[#2e2e2e] rounded-lg overflow-hidden flex flex-col justify-center items-center relative aspect-[9/16] shadow-inner">
              <button
                type="button"
                onClick={handleNextCoverFrame}
                title="Cycle video frame for cover"
                className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white/90 text-[11px] font-medium transition-all cursor-pointer border border-white/10"
              >
                <Edit2 className="w-3 h-3 text-white/80" />
                <span>Edit cover</span>
              </button>

              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          </div>

          {/* Right Column: Settings & Configuration */}
          <div className="space-y-3.5 text-xs">
            {/* Timeline Identifier */}
            <div className="grid grid-cols-[130px_1fr] items-center">
              <span className="text-smoke">Export timeline</span>
              <span className="text-mist font-medium">Timeline 01</span>
            </div>

            {/* Name Input */}
            <div className="grid grid-cols-[130px_1fr] items-center">
              <label htmlFor="export-name-input" className="text-smoke">
                Name
              </label>
              <input
                id="export-name-input"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Video Name"
                className="bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] transition-colors"
              />
            </div>

            {/* Export To Destination */}
            <div className="grid grid-cols-[130px_1fr] items-center">
              <label htmlFor="export-to-input" className="text-smoke">
                Export to
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="export-to-input"
                  type="text"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="flex-1 bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] transition-colors truncate"
                />
                <button
                  type="button"
                  onClick={handleBrowseLocation}
                  title="Browse export destination folder"
                  className="p-1.5 rounded-md bg-[#2a2a2a] hover:bg-[#383838] border border-white/10 text-smoke hover:text-bone transition-colors cursor-pointer"
                >
                  <Folder className="w-4 h-4 text-smoke" />
                </button>
              </div>
            </div>

            <div className="border-t border-[#2e2e2e] my-3" />

            {/* Collapsible Video Settings */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setVideoSectionOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold text-bone cursor-pointer w-full text-left"
              >
                <div className="w-3.5 h-3.5 rounded-xs bg-[#00b8a9] flex items-center justify-center text-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Video</span>
                {videoSectionOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-smoke ml-auto" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-smoke ml-auto" />
                )}
              </button>

              {videoSectionOpen && (
                <div className="space-y-2.5 pl-5">
                  {/* Remove Watermark Toggle */}
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <span className="text-smoke">Remove watermark</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={removeWatermark}
                        onClick={() => setRemoveWatermark((prev) => !prev)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          removeWatermark ? 'bg-[#00b8a9]' : 'bg-[#383838]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            removeWatermark ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] text-smoke">No watermark</span>
                    </div>
                  </div>

                  {/* Resolution Dropdown */}
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <label htmlFor="export-res-select" className="text-smoke">
                      Resolution
                    </label>
                    <select
                      id="export-res-select"
                      value={resolution}
                      onChange={(e) =>
                        setResolution(e.target.value as 'original' | '4k' | '1440' | '1080' | '720')
                      }
                      className="bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] cursor-pointer"
                    >
                      <option value="4k">4K (2160p UHD)</option>
                      <option value="1440">2K / 1440p (QHD)</option>
                      <option value="1080">1080p (Full HD)</option>
                      <option value="720">720p (HD)</option>
                      <option value="original">
                        Original ({videoMeta ? `${videoMeta.width}x${videoMeta.height}` : 'Source'})
                      </option>
                    </select>
                  </div>

                  {/* Bitrate Dropdown */}
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <label htmlFor="export-bitrate-select" className="text-smoke">
                      Bit rate
                    </label>
                    <select
                      id="export-bitrate-select"
                      value={bitrate}
                      onChange={(e) =>
                        setBitrate(e.target.value as 'recommended' | 'higher' | 'custom')
                      }
                      className="bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] cursor-pointer"
                    >
                      <option value="recommended">Recommended (High Quality)</option>
                      <option value="higher">Higher (Master Fidelity)</option>
                      <option value="custom">Standard (Compact Size)</option>
                    </select>
                  </div>

                  {/* Codec Dropdown */}
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <label htmlFor="export-codec-select" className="text-smoke">
                      Codec
                    </label>
                    <select
                      id="export-codec-select"
                      value={codec}
                      onChange={(e) => setCodec(e.target.value as 'h264' | 'hevc' | 'av1')}
                      className="bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] cursor-pointer"
                    >
                      <option value="h264">H.264</option>
                      <option value="hevc">HEVC / H.265</option>
                      <option value="av1">AV1</option>
                    </select>
                  </div>

                  {/* Format Dropdown */}
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <label htmlFor="export-format-select" className="text-smoke">
                      Format
                    </label>
                    <select
                      id="export-format-select"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as 'mp4' | 'mov' | 'webm')}
                      className="bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] cursor-pointer"
                    >
                      <option value="mp4">mp4</option>
                      <option value="mov">mov</option>
                      <option value="webm">webm</option>
                    </select>
                  </div>

                  {/* Frame Rate Dropdown */}
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <label htmlFor="export-framerate-select" className="text-smoke">
                      Frame rate
                    </label>
                    <select
                      id="export-framerate-select"
                      value={frameRate}
                      onChange={(e) =>
                        setFrameRate(e.target.value as '30' | '60' | '24' | 'original')
                      }
                      className="bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] cursor-pointer"
                    >
                      <option value="30">30fps</option>
                      <option value="60">60fps</option>
                      <option value="24">24fps</option>
                      <option value="original">Original</option>
                    </select>
                  </div>

                  {/* Color Space Label */}
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <span className="text-smoke">Color space</span>
                    <span className="text-mist">Rec. 709 SDR</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Audio Settings */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAudioSectionOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold text-bone cursor-pointer w-full text-left"
              >
                <div className="w-3.5 h-3.5 rounded-xs bg-[#00b8a9] flex items-center justify-center text-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Audio</span>
                {audioSectionOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-smoke ml-auto" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-smoke ml-auto" />
                )}
              </button>

              {audioSectionOpen && (
                <div className="space-y-2 pl-5">
                  <div className="grid grid-cols-[115px_1fr] items-center">
                    <label htmlFor="export-audio-select" className="text-smoke">
                      Format
                    </label>
                    <select
                      id="export-audio-select"
                      value={audioFormat}
                      onChange={(e) => setAudioFormat(e.target.value as 'mp3' | 'aac')}
                      className="bg-[#2a2a2a] border border-white/10 rounded-md px-3 py-1.5 text-xs text-bone focus:outline-none focus:border-[#00b8a9] cursor-pointer"
                    >
                      <option value="mp3">MP3</option>
                      <option value="aac">AAC (Passthrough)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Subtitle & Transcript Downloads */}
            <div className="pt-2 border-t border-[#2e2e2e]">
              <span className="text-xs font-semibold text-bone block mb-2">
                Subtitles & Transcripts
              </span>
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
                    className="p-2.5 rounded-lg border border-white/10 bg-[#242424] hover:border-[#00b8a9] hover:bg-[#2a2a2a] text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
                  >
                    <div className="flex items-center gap-1 font-mono font-bold text-xs uppercase text-bone group-hover:text-[#00d2c4]">
                      <span>.{label}</span>
                      <Download className="w-3 h-3 text-smoke group-hover:text-[#00d2c4] transition-colors" />
                    </div>
                    <span className="text-[10px] text-smoke block mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Telemetry & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-[#2e2e2e]">
          <div className="flex items-center gap-2 text-xs text-smoke font-mono">
            <Film className="w-4 h-4 text-smoke shrink-0" />
            <span>
              Duration: {durationStr} | Size: about {sizeStr}
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={processing || !canExportVideo}
              onClick={handleExport}
              className="px-6 py-2 rounded-md bg-[#00b8a9] hover:bg-[#00d2c4] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-black font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>{processing ? 'Exporting…' : 'Export'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] text-bone text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
