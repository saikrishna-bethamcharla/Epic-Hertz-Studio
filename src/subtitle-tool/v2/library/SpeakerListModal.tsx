// ─── Speaker List Modal — Epic Hertz Studio v2 ──────────────────────────────
// Allows creators to paste a speaker roster (Name and optional Role/Handle per line)
// to automatically generate sequenced lower thirds at timestamps.

import { useState } from 'react';
import { Users, X, Plus } from 'lucide-react';
import type { LowerThirdSpec } from '../../engine/spec';
import { DEFAULT_LOWER_THIRD } from '../../engine/spec';
import { nanoid } from 'nanoid';

interface SpeakerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLowerThirds: (items: LowerThirdSpec[]) => void;
  currentTime: number;
  templateId?: string;
}

export default function SpeakerListModal({
  isOpen,
  onClose,
  onAddLowerThirds,
  currentTime,
  templateId = 'corp-bar-slide',
}: SpeakerListModalProps) {
  const [inputText, setInputText] = useState(
    'Dr. Sarabhai | Chief Scientist | @sarabhai\nProf. Ramanujan | Senior Fellow | @math.cam\nAnanya Rao | Research Lead',
  );
  const [durationPerItem, setDurationPerItem] = useState(4.0);
  const [gapBetween, setGapBetween] = useState(2.0);

  if (!isOpen) return null;

  const handleApply = () => {
    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const generated: LowerThirdSpec[] = [];
    let startT = currentTime;

    for (const line of lines) {
      const parts = line.split(/[|,\t\-\u2013\u2014]/).map((p) => p.trim());
      const name = parts[0] || 'Speaker';
      const role = parts[1] || '';
      const handle = parts[2] || '';

      generated.push({
        ...DEFAULT_LOWER_THIRD,
        id: nanoid(),
        templateId,
        name,
        role,
        handle,
        start: startT,
        end: startT + durationPerItem,
      });

      startT += durationPerItem + gapBetween;
    }

    if (generated.length > 0) {
      onAddLowerThirds(generated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121211]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-bone">Paste Speaker Roster</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-smoke hover:text-bone rounded hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-[11px] text-smoke leading-relaxed">
            Paste one speaker per line in format:{' '}
            <code className="text-amber-300 font-mono">Name | Role | @handle</code>
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            aria-label="Speaker list input"
            className="w-full bg-[#121211] border border-white/10 rounded-lg p-2.5 text-xs text-bone font-mono focus:outline-none focus:border-amber-400 resize-none"
          />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1 text-[11px] text-smoke">
              Duration per speaker (s)
              <input
                type="number"
                min={2}
                max={20}
                step={0.5}
                value={durationPerItem}
                onChange={(e) => setDurationPerItem(parseFloat(e.target.value) || 4)}
                className="bg-[#121211] border border-white/10 rounded p-1.5 text-xs text-bone focus:outline-none focus:border-amber-400"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-smoke">
              Interval between (s)
              <input
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={gapBetween}
                onChange={(e) => setGapBetween(parseFloat(e.target.value) || 2)}
                className="bg-[#121211] border border-white/10 rounded p-1.5 text-xs text-bone focus:outline-none focus:border-amber-400"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 bg-[#121211]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-smoke hover:text-bone rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Lower Thirds
          </button>
        </div>
      </div>
    </div>
  );
}
