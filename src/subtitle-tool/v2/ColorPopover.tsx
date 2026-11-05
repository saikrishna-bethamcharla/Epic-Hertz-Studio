// ─── Color Popover — Epic Hertz Studio v2 ─────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { Pipette } from 'lucide-react';
import type { Paint, GradientPaint } from '../engine/spec';
import { getBrandColors } from './userPresets';

interface ColorPopoverProps {
  value: Paint;
  onChange: (color: Paint) => void;
  onClose: () => void;
  title?: string;
}

const RECENT_COLORS_KEY = 'ehs.recent_colors.v2';

function getRecentColors(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COLORS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ['#FFFFFF', '#FFE14D', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#000000'];
}

function addRecentColor(hex: string) {
  const current = getRecentColors().filter((c) => c.toLowerCase() !== hex.toLowerCase());
  const next = [hex, ...current].slice(0, 12);
  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(next));
  } catch {}
}

const PRESET_GRADIENTS: GradientPaint[] = [
  {
    angle: 90,
    stops: [
      [0, '#FFE14D'],
      [1, '#FF7A00'],
    ],
  },
  {
    angle: 90,
    stops: [
      [0, '#00F2FE'],
      [1, '#4FACFE'],
    ],
  },
  {
    angle: 90,
    stops: [
      [0, '#FA709A'],
      [1, '#FEE140'],
    ],
  },
  {
    angle: 90,
    stops: [
      [0, '#FF0844'],
      [1, '#FFB199'],
    ],
  },
  {
    angle: 90,
    stops: [
      [0, '#F5576C'],
      [1, '#F093FB'],
    ],
  },
  {
    angle: 90,
    stops: [
      [0, '#43E97B'],
      [1, '#38F9D7'],
    ],
  },
];

export default function ColorPopover({ value, onChange, onClose }: ColorPopoverProps) {
  const isGrad = typeof value === 'object' && 'stops' in value;
  const [tab, setTab] = useState<'solid' | 'gradient'>(isGrad ? 'gradient' : 'solid');
  const brandColors = getBrandColors();
  const [recentColors, setRecentColors] = useState<string[]>(() => getRecentColors());

  const solidHex = typeof value === 'string' ? value : value.stops[0]?.[1] || '#FFFFFF';
  const [hexInput, setHexInput] = useState(solidHex);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(solidHex);
  }, [solidHex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [onClose]);

  const handlePickEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const res = await eyeDropper.open();
        if (res?.sRGBHex) {
          handleSolidChange(res.sRGBHex);
        }
      } catch (e) {
        // user cancelled
      }
    }
  };

  const handleSolidChange = (newHex: string) => {
    setHexInput(newHex);
    onChange(newHex);
    addRecentColor(newHex);
    setRecentColors(getRecentColors());
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl bg-[#1c1c1b] border border-white/15 shadow-2xl p-3 text-xs text-bone animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header Tabs: Solid / Gradient */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
        <div className="flex items-center gap-1 bg-[#141413] p-0.5 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => {
              setTab('solid');
              if (isGrad) handleSolidChange(solidHex);
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
              tab === 'solid' ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'
            }`}
          >
            Solid
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('gradient');
              if (!isGrad) {
                onChange({
                  angle: 90,
                  stops: [
                    [0, solidHex],
                    [1, '#FF7A00'],
                  ],
                });
              }
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
              tab === 'gradient' ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'
            }`}
          >
            Gradient
          </button>
        </div>

        {'EyeDropper' in window && (
          <button
            type="button"
            onClick={handlePickEyeDropper}
            className="p-1.5 rounded-lg text-smoke hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Pick color from screen"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {tab === 'solid' ? (
        <div className="space-y-3">
          {/* Native HTML5 Color Picker Tile */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20 shrink-0">
              <input
                type="color"
                value={solidHex.length === 7 ? solidHex : '#FFFFFF'}
                onChange={(e) => handleSolidChange(e.target.value)}
                className="absolute -inset-2 w-16 h-16 cursor-pointer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-smoke block font-mono">HEX CODE</label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    onChange(e.target.value);
                  }
                }}
                className="w-full bg-[#141413] border border-white/15 focus:border-amber-400 rounded-md px-2 py-1 text-xs font-mono text-bone focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Quick Palette Swatches */}
          <div className="grid grid-cols-8 gap-1 pt-1">
            {[
              '#FFFFFF',
              '#FFE14D',
              '#FFB703',
              '#FB8500',
              '#EF4444',
              '#EC4899',
              '#8B5CF6',
              '#3B82F6',
              '#06B6D4',
              '#10B981',
              '#84CC16',
              '#000000',
            ].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => handleSolidChange(hex)}
                style={{ backgroundColor: hex }}
                className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                  solidHex.toLowerCase() === hex.toLowerCase()
                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                    : 'border-white/15'
                }`}
                title={hex}
              />
            ))}
          </div>

          {/* Brand Colors Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[10px] text-smoke uppercase font-semibold mb-1.5">
              <span>Brand Palette</span>
              <span className="text-[9px] lowercase text-smoke/70">from Brand tab</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {brandColors.map((hex, idx) => (
                <button
                  key={`${hex}-${idx}`}
                  type="button"
                  onClick={() => handleSolidChange(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
                    solidHex.toLowerCase() === hex.toLowerCase()
                      ? 'border-amber-400 ring-1 ring-amber-400'
                      : 'border-white/15'
                  }`}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {/* Recent Colors Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-[10px] text-smoke uppercase font-semibold mb-1.5">
              Recently Used
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {recentColors.map((hex, idx) => (
                <button
                  key={`${hex}-${idx}`}
                  type="button"
                  onClick={() => handleSolidChange(hex)}
                  style={{ backgroundColor: hex }}
                  className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
                  title={hex}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Gradient Tab */
        <div className="space-y-3">
          <div className="text-[11px] text-smoke">Preset Gradients:</div>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESET_GRADIENTS.map((grad, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(grad)}
                style={{
                  background: `linear-gradient(${grad.angle}deg, ${grad.stops[0][1]}, ${grad.stops[1][1]})`,
                }}
                className="h-8 rounded-lg border border-white/20 hover:scale-102 hover:border-amber-400 transition-all shadow-xs"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
