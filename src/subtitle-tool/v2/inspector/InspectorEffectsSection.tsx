// ─── InspectorEffectsSection — Epic Hertz Studio v2 ───────────────────────────
import React, { useState } from 'react';
import type { CaptionStyle } from '../../types';
import ColorPopover from '../ColorPopover';
import { AstryxSegmentedGroup, AstryxSlider } from '../../astryx';

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
        {/* Stroke (Outline) Width (Astryx Precision Slider) */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs">
          <span className="text-mist font-medium">Outline Width</span>
          <AstryxSlider
            value={Math.round(effectiveStyle.stroke.width * 100)}
            onChange={(val) => {
              onApplyStyleChange((s) => ({
                ...s,
                stroke: { ...s.stroke, width: val / 100 },
              }));
            }}
            min={0}
            max={25}
            step={1}
            precision={0}
            unit="%"
            ariaLabel="Outline width"
          />
        </div>

        {/* Stroke Color */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs relative">
          <span className="text-mist font-medium">Outline Color</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveColorTarget(activeColorTarget === 'stroke' ? null : 'stroke')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 text-xs text-bone cursor-pointer transition-colors"
            >
              <div
                style={{ backgroundColor: effectiveStrokeColor }}
                className="w-4 h-4 rounded-md border border-white/20 shadow-xs"
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
        {/* Glow Strength (Astryx Precision Slider) */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs">
          <span className="text-mist font-medium">Glow Strength</span>
          <AstryxSlider
            value={effectiveStyle.glow.strength}
            onChange={(val) => {
              onApplyStyleChange((s) => ({
                ...s,
                glow: { ...s.glow, strength: val },
              }));
            }}
            min={0}
            max={2}
            step={0.1}
            precision={1}
            ariaLabel="Glow strength"
          />
        </div>

        {/* 3D Extrude Depth (Astryx Precision Slider) */}
        <div className="grid grid-cols-[96px_1fr] items-center text-xs">
          <span className="text-mist font-medium">3D Depth</span>
          <AstryxSlider
            value={Math.round(effectiveStyle.extrude.depth * 100)}
            onChange={(val) => {
              onApplyStyleChange((s) => ({
                ...s,
                extrude: { ...s.extrude, depth: val / 100 },
              }));
            }}
            min={0}
            max={25}
            step={1}
            precision={0}
            unit="%"
            ariaLabel="3D extrusion depth"
          />
        </div>
      </div>
    );
  }

  // subTab === 'background'
  return (
    <div className="space-y-3">
      {/* Plate Mode (Astryx Segmented Control) */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">BG Mode</span>
        <AstryxSegmentedGroup
          ariaLabel="Background Mode"
          size="sm"
          value={effectiveStyle.plate.mode}
          onChange={(m) => {
            onApplyStyleChange((s) => ({
              ...s,
              plate: { ...s.plate, mode: m },
            }));
          }}
          options={[
            { id: 'none', label: 'None' },
            { id: 'block', label: 'Block' },
            { id: 'line', label: 'Line' },
          ]}
        />
      </div>
    </div>
  );
};

export default InspectorEffectsSection;
