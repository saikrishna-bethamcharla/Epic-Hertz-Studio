// ─── ProgressOverlay ─────────────────────────────────────────────────────────
// Full-screen overlay shown during long async operations.

import { motion } from 'framer-motion';
import type { AppStage } from './types';

interface ProgressOverlayProps {
  stage: AppStage;
  statusText: string;
  progress?: number; // 0–100, used during 'burning'
}

const STAGE_ICON: Partial<Record<AppStage, string>> = {
  extracting: '🔊',
  uploading: '☁️',
  transcribing: '✨',
  burning: '🎬',
};

export default function ProgressOverlay({ stage, statusText, progress }: ProgressOverlayProps) {
  const icon = STAGE_ICON[stage] ?? '⏳';
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
        className="text-6xl mb-6 select-none"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
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
      {showBar && (
        <p className="mt-2 text-smoke text-sm tabular-nums">{progress}%</p>
      )}
    </motion.div>
  );
}
