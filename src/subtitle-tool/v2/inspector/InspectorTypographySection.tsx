// ─── InspectorTypographySection — Epic Hertz Studio v2 ────────────────────────
import React, { useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  ChevronDown,
} from 'lucide-react';
import type { Segment, CaptionStyle, SegmentStyleOverride } from '../../types';
import FontPopover from '../FontPopover';
import ColorPopover from '../ColorPopover';

export interface InspectorTypographySectionProps {
  scope: 'all' | 'caption' | 'words';
  style: CaptionStyle;
  effectiveStyle: CaptionStyle;
  onStyleChange: (style: CaptionStyle) => void;
  onApplyStyleChange: (updater: (prev: CaptionStyle) => CaptionStyle) => void;
  activeSegment: Segment | null;
  onUpdateActiveSegment: (override: Partial<Segment>) => void;
  onSegmentOverrideChange?: (segId: string, override: Partial<SegmentStyleOverride> | null) => void;
  effectiveFont: string;
  fontDef: { label: string };
  availableWeights: number[];
  effectiveWeight: number;
  effectiveSize: number;
  effectiveFill: string | CaptionStyle['fill'];
  onGoToBrand?: () => void;
}

export const InspectorTypographySection: React.FC<InspectorTypographySectionProps> = ({
  scope,
  style: _style,
  effectiveStyle,
  onStyleChange: _onStyleChange,
  onApplyStyleChange,
  activeSegment,
  onUpdateActiveSegment,
  onSegmentOverrideChange: _onSegmentOverrideChange,
  effectiveFont,
  fontDef,
  availableWeights,
  effectiveWeight,
  effectiveSize,
  effectiveFill,
  onGoToBrand,
}) => {
  const [isFontPopoverOpen, setIsFontPopoverOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Caption Text (if scope = caption) */}
      {scope === 'caption' && activeSegment && (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Caption Text
          </label>
          <textarea
            value={activeSegment.text}
            onChange={(e) => onUpdateActiveSegment({ text: e.target.value })}
            rows={2}
            className="w-full bg-[#181817] border border-white/15 focus:border-amber-400 rounded-lg p-2 text-xs text-bone resize-none focus:outline-none"
          />
        </div>
      )}

      {/* Font Family Row */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs relative">
        <span className="text-mist font-medium">Font</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFontPopoverOpen((p) => !p)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 text-bone text-xs font-semibold text-left transition-colors cursor-pointer"
          >
            <span className="truncate">{fontDef.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-smoke ml-1 shrink-0" />
          </button>
          {isFontPopoverOpen && (
            <FontPopover
              currentFamilyId={effectiveFont}
              onSelectFamily={(fId) => {
                onApplyStyleChange((s) => ({
                  ...s,
                  font: { ...s.font, family: fId },
                }));
              }}
              onClose={() => setIsFontPopoverOpen(false)}
              onGoToBrand={onGoToBrand}
            />
          )}
        </div>
      </div>

      {/* Font Weight */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Weight</span>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {availableWeights.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                onApplyStyleChange((s) => ({
                  ...s,
                  font: { ...s.font, weight: w },
                }));
              }}
              className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                effectiveWeight === w
                  ? 'bg-amber-400 text-black'
                  : 'bg-[#181817] text-smoke hover:text-bone border border-white/5'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Style Toggles: B / U / I */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Style</span>
        <div className="flex items-center gap-1 bg-[#181817] p-0.5 rounded-lg border border-white/5 w-fit">
          <button
            type="button"
            onClick={() => {
              const newWeight = effectiveWeight >= 800 ? 600 : 900;
              onApplyStyleChange((s) => ({
                ...s,
                font: { ...s.font, weight: newWeight },
              }));
            }}
            className={`p-1.5 rounded cursor-pointer ${effectiveWeight >= 800 ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'}`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const nextUnderline = !effectiveStyle.font.underline;
              onApplyStyleChange((s) => ({
                ...s,
                font: { ...s.font, underline: nextUnderline },
              }));
            }}
            className={`p-1.5 rounded cursor-pointer ${effectiveStyle.font.underline ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'}`}
            title="Underline"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const nextItalic = !effectiveStyle.font.italic;
              onApplyStyleChange((s) => ({
                ...s,
                font: { ...s.font, italic: nextItalic },
              }));
            }}
            className={`p-1.5 rounded cursor-pointer ${effectiveStyle.font.italic ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'}`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Font Size Slider + Stepper */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Size</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={3}
            max={20}
            step={0.1}
            value={effectiveSize}
            onChange={(e) => {
              const val = parseFloat(e.target.value) / 100;
              onApplyStyleChange((s) => ({
                ...s,
                font: { ...s.font, size: val },
              }));
            }}
            className="flex-1 accent-amber-400 cursor-pointer"
          />
          <span className="font-mono text-bone text-[11px] w-12 text-right">
            {effectiveSize.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Text Case Toggles */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Case</span>
        <div className="flex items-center gap-1 bg-[#181817] p-0.5 rounded-lg border border-white/5 w-fit">
          {(['none', 'upper', 'lower', 'title'] as const).map((cs) => (
            <button
              key={cs}
              type="button"
              onClick={() => {
                onApplyStyleChange((s) => ({
                  ...s,
                  font: { ...s.font, textCase: cs },
                }));
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                effectiveStyle.font.textCase === cs
                  ? 'bg-amber-400 text-black'
                  : 'text-smoke hover:text-bone'
              }`}
            >
              {cs === 'none' ? 'Aa' : cs === 'upper' ? 'AA' : cs === 'lower' ? 'aa' : 'Tt'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Fill Color */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs relative">
        <span className="text-mist font-medium">Fill Color</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColorPickerOpen((p) => !p)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 text-xs text-bone cursor-pointer"
          >
            <div
              style={{
                background:
                  typeof effectiveFill === 'string'
                    ? effectiveFill
                    : `linear-gradient(${effectiveFill.angle}deg, ${effectiveFill.stops[0][1]}, ${effectiveFill.stops[1][1]})`,
              }}
              className="w-4 h-4 rounded-md border border-white/20"
            />
            <span className="font-mono text-[11px]">
              {typeof effectiveFill === 'string' ? effectiveFill : 'Gradient'}
            </span>
          </button>
          {isColorPickerOpen && (
            <ColorPopover
              value={effectiveFill}
              onChange={(col) => {
                onApplyStyleChange((s) => ({
                  ...s,
                  fill: col,
                }));
              }}
              onClose={() => setIsColorPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Tracking (Letter Spacing) */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Tracking</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={-0.05}
            max={0.15}
            step={0.005}
            value={effectiveStyle.font.tracking}
            onChange={(e) => {
              const tr = parseFloat(e.target.value);
              onApplyStyleChange((s) => ({
                ...s,
                font: { ...s.font, tracking: tr },
              }));
            }}
            className="flex-1 accent-amber-400 cursor-pointer"
          />
          <span className="font-mono text-bone text-[11px] w-12 text-right">
            {(effectiveStyle.font.tracking * 100).toFixed(1)}em
          </span>
        </div>
      </div>

      {/* Alignment */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Align</span>
        <div className="flex items-center gap-1 bg-[#181817] p-0.5 rounded-lg border border-white/5 w-fit">
          {(['left', 'center', 'right'] as const).map((al) => (
            <button
              key={al}
              type="button"
              onClick={() => {
                onApplyStyleChange((s) => ({
                  ...s,
                  layout: { ...s.layout, align: al },
                }));
              }}
              className={`p-1.5 rounded cursor-pointer ${
                effectiveStyle.layout.align === al
                  ? 'bg-amber-400 text-black'
                  : 'text-smoke hover:text-bone'
              }`}
            >
              {al === 'left' ? (
                <AlignLeft className="w-3.5 h-3.5" />
              ) : al === 'center' ? (
                <AlignCenter className="w-3.5 h-3.5" />
              ) : (
                <AlignRight className="w-3.5 h-3.5" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InspectorTypographySection;
