// ─── InspectorEffectsSection — Epic Hertz Studio v2 ───────────────────────────
import React, { useState } from 'react';
import type { CaptionStyle } from '../../types';
import ColorPopover from '../ColorPopover';

export interface InspectorEffectsSectionProps {
  style: CaptionStyle;
  onStyleChange: (style: CaptionStyle) => void;
  subTab: 'fill' | 'effects' | 'background';
  effectiveStrokeColor: string;
}

export const InspectorEffectsSection: React.FC<InspectorEffectsSectionProps> = ({
  style,
  onStyleChange,
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
              min={0}
              max={0.25}
              step={0.01}
              value={style.stroke.width}
              onChange={(e) => {
                onStyleChange({
                  ...style,
                  stroke: { ...style.stroke, width: parseFloat(e.target.value) },
                });
              }}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-bone text-[11px] w-12 text-right">
              {(style.stroke.width * 100).toFixed(0)}%
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
                  onStyleChange({ ...style, stroke: { ...style.stroke, color: c } });
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
              min={0}
              max={2}
              step={0.1}
              value={style.glow.strength}
              onChange={(e) => {
                onStyleChange({
                  ...style,
                  glow: { ...style.glow, strength: parseFloat(e.target.value) },
                });
              }}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-bone text-[11px] w-12 text-right">
              {style.glow.strength.toFixed(1)}
            </span>
          </div>
        </div>

        {/* 3D Extrude Depth */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs">
          <span className="text-mist font-medium">3D Depth</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={0.25}
              step={0.01}
              value={style.extrude.depth}
              onChange={(e) => {
                onStyleChange({
                  ...style,
                  extrude: { ...style.extrude, depth: parseFloat(e.target.value) },
                });
              }}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-bone text-[11px] w-12 text-right">
              {(style.extrude.depth * 100).toFixed(0)}%
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
                onStyleChange({ ...style, plate: { ...style.plate, mode: m } });
              }}
              className={`flex-1 py-1 rounded capitalize text-[10px] font-bold cursor-pointer ${
                style.plate.mode === m ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'
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
