// ─── InspectorEffectsSection — Epic Hertz Studio v2 ───────────────────────────
import React, { useState } from 'react';
import type { CaptionStyle } from '../../types';
import ColorPopover from '../ColorPopover';

export interface InspectorEffectsSectionProps {
  style: CaptionStyle;
  effectiveStyle: CaptionStyle;
  onStyleChange: (style: CaptionStyle) => void;
  onApplyStyleChange: (updater: (prev: CaptionStyle) => CaptionStyle) => void;
  subTab: 'fill' | 'effects' | 'background';
  effectiveStrokeColor: string;
}

export const InspectorEffectsSection: React.FC<InspectorEffectsSectionProps> = ({
  style: _style,
  effectiveStyle,
  onStyleChange: _onStyleChange,
  onApplyStyleChange,
  subTab,
  effectiveStrokeColor,
}) => {
  const [activeColorTarget, setActiveColorTarget] = useState<
    'stroke' | 'glow' | 'extrude' | 'plate' | null
  >(null);

  if (subTab === 'fill') {
    return (
      <div className="space-y-3">
        {/* Stroke (Outline) Width */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs">
          <span className="text-mist font-medium">Outline Width</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              aria-label="Outline width"
              min={0}
              max={0.25}
              step={0.01}
              value={effectiveStyle.stroke.width}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onApplyStyleChange((s) => ({
                  ...s,
                  stroke: { ...s.stroke, width: val },
                }));
              }}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-bone text-[11px] w-12 text-right">
              {(effectiveStyle.stroke.width * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stroke Color */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs relative">
          <span className="text-mist font-medium">Outline Color</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveColorTarget(activeColorTarget === 'stroke' ? null : 'stroke')}
              className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 text-xs text-bone cursor-pointer"
            >
              <div
                style={{ backgroundColor: effectiveStrokeColor }}
                className="w-4 h-4 rounded-md border border-white/20"
              />
              <span className="font-mono text-[11px]">{effectiveStrokeColor}</span>
            </button>
            {activeColorTarget === 'stroke' && (
              <ColorPopover
                value={effectiveStrokeColor}
                onChange={(col) => {
                  const c = typeof col === 'string' ? col : col.stops[0][1];
                  onApplyStyleChange((s) => ({
                    ...s,
                    stroke: { ...s.stroke, color: c },
                  }));
                }}
                onClose={() => setActiveColorTarget(null)}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (subTab === 'effects') {
    return (
      <div className="space-y-3">
        {/* Glow Strength */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs">
          <span className="text-mist font-medium">Glow Strength</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              aria-label="Glow strength"
              min={0}
              max={2}
              step={0.1}
              value={effectiveStyle.glow.strength}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onApplyStyleChange((s) => ({
                  ...s,
                  glow: { ...s.glow, strength: val },
                }));
              }}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-bone text-[11px] w-12 text-right">
              {effectiveStyle.glow.strength.toFixed(1)}
            </span>
          </div>
        </div>

        {/* 3D Extrude Depth */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs">
          <span className="text-mist font-medium">3D Depth</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              aria-label="3D extrusion depth"
              min={0}
              max={0.25}
              step={0.01}
              value={effectiveStyle.extrude.depth}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onApplyStyleChange((s) => ({
                  ...s,
                  extrude: { ...s.extrude, depth: val },
                }));
              }}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-bone text-[11px] w-12 text-right">
              {(effectiveStyle.extrude.depth * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // subTab === 'background'
  return (
    <div className="space-y-3">
      {/* Plate Mode */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">BG Mode</span>
        <div className="flex items-center gap-1 bg-[#181817] p-0.5 rounded-lg border border-white/5">
          {(['none', 'block', 'line'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onApplyStyleChange((s) => ({
                  ...s,
                  plate: { ...s.plate, mode: m },
                }));
              }}
              className={`flex-1 py-1 rounded capitalize text-[10px] font-bold cursor-pointer ${
                effectiveStyle.plate.mode === m
                  ? 'bg-amber-400 text-black'
                  : 'text-smoke hover:text-bone'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InspectorEffectsSection;
