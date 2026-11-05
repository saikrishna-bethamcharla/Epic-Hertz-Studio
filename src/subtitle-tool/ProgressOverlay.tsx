// ─── ProgressOverlay ─────────────────────────────────────────────────────────
// Full-screen overlay shown during long async operations.

import { motion } from 'framer-motion';
import { Volume2, CloudUpload, Cpu, Film, Loader2 } from 'lucide-react';
import type { AppStage } from './types';

interface ProgressOverlayProps {
  stage: AppStage;
  statusText: string;
  progress?: number; // 0–100, used during 'burning'
  onCancel?: () => void;
}

function getStageIcon(stage: AppStage) {
  switch (stage) {
    case 'extracting':
      return <Volume2 className="w-12 h-12 text-amber-400" />;
    case 'uploading':
      return <CloudUpload className="w-12 h-12 text-cyan-400" />;
    case 'transcribing':
      return <Cpu className="w-12 h-12 text-emerald-400 animate-pulse" />;
    case 'burning':
      return <Film className="w-12 h-12 text-crimson-2" />;
    default:
      return <Loader2 className="w-12 h-12 text-amber-300 animate-spin" />;
  }
}

export default function ProgressOverlay({
  stage,
  statusText,
  progress,
  onCancel,
}: ProgressOverlayProps) {
  const showBar = stage === 'burning' && typeof progress === 'number';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/90 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      aria-label={statusText}
    >
      {/* Pulsing icon */}
      <motion.div
        className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {getStageIcon(stage)}
      </motion.div>

      {/* Status text */}
      <p className="text-bone text-xl font-sans font-medium mb-2">{statusText}</p>

      {/* Spinner (shown when no percentage available) */}
      {!showBar && (
        <motion.div
          className="mt-6 w-8 h-8 rounded-full border-2 border-white/10 border-t-crimson"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Progress bar (burn step) */}
      {showBar && (
        <div className="mt-6 w-64 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-crimson to-crimson-2"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
      {showBar && <p className="mt-2 text-smoke text-sm tabular-nums">{progress}%</p>}

      {/* Cancel button during video export */}
      {stage === 'burning' && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-6 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-smoke hover:text-bone text-xs font-medium transition-colors cursor-pointer"
        >
          Cancel Export
        </button>
      )}
    </motion.div>
  );
}
