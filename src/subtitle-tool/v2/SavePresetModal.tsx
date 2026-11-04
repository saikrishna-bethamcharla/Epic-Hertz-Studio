// ─── Save as Preset Modal — Epic Hertz Studio v2 ──────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, X } from 'lucide-react';
import type { CaptionStyle } from '../engine/spec';
import { saveUserPreset } from './userPresets';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  style: CaptionStyle;
  onSaved?: () => void;
}

export default function SavePresetModal({
  isOpen,
  onClose,
  style,
  onSaved,
}: SavePresetModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Yours' | 'Viral' | 'Kinetic' | 'Clean'>('Yours');
  const [includeLayout, setIncludeLayout] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const presetName = name.trim() || 'My Custom Style';
    const presetStyle: CaptionStyle = {
      ...style,
      id: `user-${Date.now()}`,
      name: presetName,
      layout: includeLayout ? style.layout : { ...style.layout, x: 0.5, y: 0.74 },
    };

    saveUserPreset({
      id: presetStyle.id,
      name: presetName,
      category,
      style: presetStyle,
      createdAt: Date.now(),
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-sm rounded-2xl bg-[#171716] border border-white/10 shadow-2xl p-5 flex flex-col gap-4 text-bone text-xs"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Bookmark className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-bone">Save as Preset</h3>
                <p className="text-[11px] text-smoke">Store this look in your preset library</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-smoke hover:text-bone hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-smoke uppercase mb-1">
                Preset Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amber Glow Reels"
                autoFocus
                className="w-full bg-[#121211] border border-white/15 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-bone focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-smoke uppercase mb-1">
                Category
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['Yours', 'Viral', 'Kinetic', 'Clean'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                      category === cat
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-white/5 text-smoke hover:text-bone'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeLayout}
                onChange={(e) => setIncludeLayout(e.target.checked)}
                className="rounded border-white/20 text-amber-400 focus:ring-0 bg-transparent cursor-pointer"
              />
              <span className="text-[11px] text-mist">
                Include custom position ({Math.round(style.layout.x * 100)}%, {Math.round(style.layout.y * 100)}%)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-smoke hover:text-bone hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-sm"
            >
              Save Preset
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
