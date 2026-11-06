// ─── SegmentStyleDrawer — Epic Hertz Studio ──────────────────────────────────
// Drawer component for per-caption style overrides (position, scale, color, speaker, emoji).

import { motion, AnimatePresence } from 'framer-motion';
import { Palette, RotateCcw, Smile } from 'lucide-react';
import type { Segment, SegmentStyleOverride } from '../types';

export const POPULAR_EMOJIS = [
  { label: 'Reactions', emojis: ['🔥', '😂', '🤯', '❤️', '👏', '🚀'] },
  { label: 'Emphasis', emojis: ['⚡', '✨', '⭐', '💥', '🎯', '💯'] },
  { label: 'Expressions', emojis: ['👀', '🤫', '😎', '💡', '⚠️', '🚨'] },
];

export const PRESET_ACCENT_COLORS = [
  { label: 'Yellow', value: '#FACC15' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Lime', value: '#84CC16' },
  { label: 'Orange', value: '#FB923C' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'White', value: '#FFFFFF' },
];

export interface SegmentStyleDrawerProps {
  segment: Segment;
  isOpen: boolean;
  isEmojiOpen: boolean;
  onCloseEmoji: () => void;
  onInsertEmoji: (emoji: string) => void;
  onUpdateOverride: (segId: string, override: Partial<SegmentStyleOverride> | null) => void;
  onUpdateSpeaker: (segId: string, speaker: string | undefined) => void;
}

export function SegmentStyleDrawer({
  segment,
  isOpen,
  isEmojiOpen,
  onCloseEmoji,
  onInsertEmoji,
  onUpdateOverride,
  onUpdateSpeaker,
}: SegmentStyleDrawerProps) {
  return (
    <>
      {/* ── Popover: Opt-In Creator Emoji Picker ──────────────────────── */}
      <AnimatePresence>
        {isEmojiOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="mt-2 p-2.5 bg-[#1f1e1b] border border-amber-400/30 rounded-xl shadow-xl z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Smile className="w-3 h-3" />
                <span>Insert Reaction Emoji</span>
              </span>
              <button
                type="button"
                onClick={onCloseEmoji}
                className="text-smoke hover:text-bone text-xs p-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {POPULAR_EMOJIS.map((group) => (
                <div key={group.label}>
                  <div className="text-[9px] font-semibold text-smoke/70 mb-1">{group.label}</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {group.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onInsertEmoji(emoji)}
                        className="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-black/40 hover:bg-amber-400/20 hover:scale-120 active:scale-95 transition-all cursor-pointer"
                        title={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drawer: Per-Caption Style Overrides ────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 p-2.5 bg-[#181715] border border-white/10 rounded-xl text-xs space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-white/10 pb-1">
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span>Caption Style Override</span>
              </span>
              {segment.styleOverride && (
                <button
                  type="button"
                  onClick={() => onUpdateOverride(segment.id, null)}
                  className="flex items-center gap-1 text-[9px] text-smoke hover:text-amber-300 lowercase cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>reset</span>
                </button>
              )}
            </div>

            {/* Position Override */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-smoke">Position (2D Anchor):</span>
                {(segment.styleOverride?.positionX !== undefined ||
                  segment.styleOverride?.positionY !== undefined) && (
                  <span className="text-[10px] text-amber-300 font-mono">
                    ({Math.round((segment.styleOverride.positionX ?? 0.5) * 100)}%,{' '}
                    {Math.round((segment.styleOverride.positionY ?? 0.82) * 100)}%)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: 'Def', x: undefined, y: undefined },
                  { label: 'Top', x: 0.5, y: 0.18 },
                  { label: 'Mid', x: 0.5, y: 0.5 },
                  { label: 'Bot', x: 0.5, y: 0.82 },
                  { label: 'Top-L', x: 0.22, y: 0.18 },
                  { label: 'Top-R', x: 0.78, y: 0.18 },
                  { label: 'Bot-L', x: 0.22, y: 0.82 },
                  { label: 'Bot-R', x: 0.78, y: 0.82 },
                ].map((opt) => {
                  const isSelected =
                    opt.x === undefined && opt.y === undefined
                      ? segment.styleOverride?.positionX === undefined &&
                        segment.styleOverride?.positionY === undefined
                      : Math.abs((segment.styleOverride?.positionX ?? 0.5) - (opt.x ?? 0.5)) <
                          0.05 &&
                        Math.abs((segment.styleOverride?.positionY ?? 0.82) - (opt.y ?? 0.82)) <
                          0.05;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        onUpdateOverride(segment.id, {
                          positionX: opt.x,
                          positionY: opt.y,
                        })
                      }
                      className={`px-1.5 py-1 rounded text-[10px] font-medium transition-colors text-center cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-white/10 text-smoke hover:text-bone'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-smoke/70 italic">
                Tip: You can also drag this caption directly on the video player.
              </p>
            </div>

            {/* Scale Override */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-smoke">Scale:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: '0.85x', val: 0.85 },
                  { label: '1.0x', val: undefined },
                  { label: '1.15x', val: 1.15 },
                  { label: '1.3x', val: 1.3 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onUpdateOverride(segment.id, { scale: opt.val })}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      segment.styleOverride?.scale === opt.val
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-white/10 text-smoke hover:text-bone'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Accent Color */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-smoke">Custom Color:</span>
                {segment.styleOverride?.highlightColor && (
                  <span
                    className="w-3 h-3 rounded-full border border-white/40"
                    style={{ backgroundColor: segment.styleOverride.highlightColor }}
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onUpdateOverride(segment.id, { highlightColor: undefined })}
                  className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                    !segment.styleOverride?.highlightColor
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-white/10 text-smoke hover:text-bone'
                  }`}
                >
                  Default
                </button>
                {PRESET_ACCENT_COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => onUpdateOverride(segment.id, { highlightColor: col.value })}
                    className="w-5 h-5 rounded-md border transition-transform hover:scale-115 cursor-pointer"
                    style={{
                      backgroundColor: col.value,
                      borderColor:
                        segment.styleOverride?.highlightColor === col.value
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.2)',
                    }}
                    title={col.label}
                  />
                ))}
              </div>
            </div>

            {/* Speaker Tag Assign */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
              <span className="text-smoke">Speaker:</span>
              <div className="flex items-center gap-1">
                {['S1', 'S2', 'S3', 'S4'].map((spk) => (
                  <button
                    key={spk}
                    type="button"
                    onClick={() =>
                      onUpdateSpeaker(segment.id, segment.speaker === spk ? undefined : spk)
                    }
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                      segment.speaker === spk
                        ? 'bg-amber-400 text-black'
                        : 'bg-white/10 text-smoke hover:text-bone'
                    }`}
                  >
                    {spk}
                  </button>
                ))}
                {segment.speaker && (
                  <button
                    type="button"
                    onClick={() => onUpdateSpeaker(segment.id, undefined)}
                    className="px-1 text-[10px] text-smoke hover:text-crimson-2 cursor-pointer"
                    title="Clear speaker"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
