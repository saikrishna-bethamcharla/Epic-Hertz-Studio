// ─── ExportBar ────────────────────────────────────────────────────────────────
// Bottom action bar: export SRT, export VTT, burn captions into video.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toSRT, toVTT, downloadText, downloadBlob } from './utils/srt';
import { burnCaptions, embedSubtitlesMP4 } from './utils/burnCaptions';
import type { Segment, SubtitleStyle } from './types';

interface ExportBarProps {
  segments: Segment[];
  videoFile: File;
  style?: SubtitleStyle;
  onBurnStart: () => void;
  onBurnProgress: (pct: number) => void;
  onBurnDone: () => void;
  onBurnError: (msg: string) => void;
  onReset: () => void;
}

export default function ExportBar({
  segments,
  videoFile,
  style,
  onBurnStart,
  onBurnProgress,
  onBurnDone,
  onBurnError,
  onReset,
}: ExportBarProps) {
  const [processing, setProcessing] = useState(false);
  const [actionText, setActionText] = useState('');
  const [burnError, setBurnError] = useState<string | null>(null);

  const baseName = videoFile.name.replace(/\.[^.]+$/, '');

  const handleSRT = () => {
    downloadText(toSRT(segments), `${baseName}.srt`, 'text/plain');
  };

  const handleVTT = () => {
    downloadText(toVTT(segments), `${baseName}.vtt`, 'text/vtt');
  };

  // 1. Lossless MP4 (100% original video/audio quality, 0 fps drop, fast stream-copy)
  const handleLosslessEmbed = async () => {
    setProcessing(true);
    setActionText('Embedding MP4 track…');
    setBurnError(null);
    onBurnStart();
    try {
      const srtContent = toSRT(segments);
      const blob = await embedSubtitlesMP4(videoFile, srtContent);
      downloadBlob(blob, `${baseName}_subtitled.mp4`);
      onBurnDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Embedding failed.';
      setBurnError(msg);
      onBurnError(msg);
    } finally {
      setProcessing(false);
    }
  };

  // 2. Burn directly onto video frames using native FFmpeg
  const handleBurn = async () => {
    setProcessing(true);
    setActionText('Burning into frames…');
    setBurnError(null);
    onBurnStart();
    try {
      const srtContent = toSRT(segments);
      const blob = await burnCaptions(videoFile, srtContent, style, (pct) => {
        onBurnProgress(pct);
      });
      downloadBlob(blob, `${baseName}_burned.mp4`);
      onBurnDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Burn failed.';
      setBurnError(msg);
      onBurnError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border-t border-white/10 bg-ink-2 px-4 py-4">
      {/* Error */}
      <AnimatePresence>
        {burnError && (
          <motion.p
            className="text-crimson-2 text-xs mb-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            ⚠ {burnError}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3">
        {/* Export buttons */}
        <ExportBtn onClick={handleSRT} icon="⬇" label="Export SRT" />
        <ExportBtn onClick={handleVTT} icon="⬇" label="Export VTT" />

        {/* 1. Lossless MP4 Button (Recommended) */}
        <button
          onClick={handleLosslessEmbed}
          disabled={processing || segments.length === 0}
          title="Keeps 100% original video/audio quality, 60fps, zero lag. Subtitles embedded into MP4 container."
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
            bg-crimson hover:bg-crimson-2 disabled:opacity-40 disabled:pointer-events-none
            text-white transition-colors shadow-lg shadow-crimson/20
          "
        >
          <span>⚡</span>
          {processing && actionText.includes('Embedding') ? 'Embedding…' : 'Lossless Subtitled MP4 (Instant)'}
        </button>

        {/* 2. Hardsub Burn button */}
        <button
          onClick={handleBurn}
          disabled={processing || segments.length === 0}
          title="Hardcodes/burns captions directly into video pixels"
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
            border border-white/20 hover:border-white/40 hover:bg-white/5
            disabled:opacity-40 disabled:pointer-events-none text-bone transition-colors
          "
        >
          <span>🎬</span>
          {processing && actionText.includes('Burning') ? 'Burning…' : 'Hardcode / Burn'}
        </button>

        {/* Spacer + reset */}
        <div className="ml-auto">
          <button
            onClick={onReset}
            className="text-smoke hover:text-bone text-xs transition-colors"
          >
            ← Start over
          </button>
        </div>
      </div>

      <p className="mt-3 text-smoke text-[11px]">
        <strong>Lossless Subtitled MP4:</strong> 0% quality loss, original frame rate (60fps), instant generation. <br />
        <strong>Hardcode / Burn:</strong> Re-encodes frames to permanently bake captions into pixels.
      </p>
    </div>
  );
}

function ExportBtn({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
        border border-white/15 text-bone hover:border-white/30 hover:bg-white/5
        transition-colors
      "
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
