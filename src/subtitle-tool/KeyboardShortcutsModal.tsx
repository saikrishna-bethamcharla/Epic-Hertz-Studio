// ─── Keyboard Shortcuts Cheat Sheet Modal ──────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Playback & Navigation',
    items: [
      { keys: ['Space'], description: 'Play or pause video' },
      { keys: ['J', 'L'], description: 'Shuttle backward / forward 1s' },
      { keys: ['K'], description: 'Pause playback' },
      { keys: ['←', '→'], description: 'Step 1 frame backward / forward' },
      { keys: ['Shift', '← / →'], description: 'Jump 1.0s backward / forward' },
      { keys: ['↑', '↓'], description: 'Jump to previous / next caption' },
    ],
  },
  {
    title: 'Caption Editing',
    items: [
      { keys: ['S'], description: 'Split active caption at playhead' },
      { keys: ['Delete'], description: 'Delete selected caption' },
      { keys: ['Enter'], description: 'Split caption at cursor (inside text)' },
      { keys: ['Backspace'], description: 'Merge with previous (at start of text)' },
    ],
  },
  {
    title: 'History & Workspace',
    items: [
      { keys: ['Ctrl / ⌘', 'Z'], description: 'Undo last edit' },
      { keys: ['Ctrl / ⌘', 'Shift', 'Z'], description: 'Redo last edit' },
      { keys: ['?'], description: 'Open this keyboard shortcuts guide' },
      { keys: ['Esc'], description: 'Close dialogs or clear selection' },
    ],
  },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard Shortcuts"
            className="w-full max-w-lg rounded-2xl bg-[#171716] border border-white/10 shadow-2xl p-6 flex flex-col max-h-[85vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-bone">Keyboard Shortcuts</h2>
                  <p className="text-xs text-smoke">Pro editing speed and navigation keys</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shortcuts dialog"
                className="p-1 rounded-lg text-smoke hover:text-bone hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5" data-lenis-prevent>
              {SHORTCUT_CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 mb-2.5">
                    {cat.title}
                  </h3>
                  <div className="space-y-1.5 bg-[#141413] rounded-xl p-2.5 border border-white/5">
                    {cat.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors text-xs"
                      >
                        <span className="text-mist">{item.description}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {item.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-bone font-mono text-[11px] font-semibold shadow-sm"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-smoke shrink-0">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-bone font-mono text-[10px]">?</kbd> anytime to view</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-bone font-medium text-xs transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
