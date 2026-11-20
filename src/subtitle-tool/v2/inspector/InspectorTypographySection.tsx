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
import { AstryxSegmentedGroup, AstryxSlider, AstryxTooltip } from '../../astryx';

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
            aria-label="Active caption text"
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
          <AstryxTooltip content="Bold" shortcut="Ctrl+B">
            <button
              type="button"
              aria-label="Bold"
              onClick={() => {
                const newWeight = effectiveWeight >= 800 ? 600 : 900;
                onApplyStyleChange((s) => ({
                  ...s,
                  font: { ...s.font, weight: newWeight },
                }));
              }}
              className={`p-1.5 rounded cursor-pointer transition-all ${
                effectiveWeight >= 800
                  ? 'bg-amber-400 text-black shadow-xs font-bold'
                  : 'text-smoke hover:text-bone hover:bg-white/5'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
          </AstryxTooltip>

          <AstryxTooltip content="Underline" shortcut="Ctrl+U">
            <button
              type="button"
              aria-label="Underline"
              onClick={() => {
                const nextUnderline = !effectiveStyle.font.underline;
                onApplyStyleChange((s) => ({
                  ...s,
                  font: { ...s.font, underline: nextUnderline },
                }));
              }}
              className={`p-1.5 rounded cursor-pointer transition-all ${
                effectiveStyle.font.underline
                  ? 'bg-amber-400 text-black shadow-xs font-bold'
                  : 'text-smoke hover:text-bone hover:bg-white/5'
              }`}
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>
          </AstryxTooltip>

          <AstryxTooltip content="Italic" shortcut="Ctrl+I">
            <button
              type="button"
              aria-label="Italic"
              onClick={() => {
                const nextItalic = !effectiveStyle.font.italic;
                onApplyStyleChange((s) => ({
                  ...s,
                  font: { ...s.font, italic: nextItalic },
                }));
              }}
              className={`p-1.5 rounded cursor-pointer transition-all ${
                effectiveStyle.font.italic
                  ? 'bg-amber-400 text-black shadow-xs font-bold'
                  : 'text-smoke hover:text-bone hover:bg-white/5'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </AstryxTooltip>
        </div>
      </div>

      {/* Font Size Slider + Stepper (Astryx Precision Slider) */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Size</span>
        <AstryxSlider
          value={effectiveSize}
          onChange={(val) => {
            onApplyStyleChange((s) => ({
              ...s,
              font: { ...s.font, size: val / 100 },
            }));
          }}
          min={3}
          max={20}
          step={0.1}
          precision={1}
          unit="%"
          ariaLabel="Font size"
        />
      </div>

      {/* Text Case Toggles (Astryx Segmented Control) */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Case</span>
        <AstryxSegmentedGroup
          ariaLabel="Text Case"
          size="sm"
          value={effectiveStyle.font.textCase || 'none'}
          onChange={(cs) => {
            onApplyStyleChange((s) => ({
              ...s,
              font: { ...s.font, textCase: cs },
            }));
          }}
          options={[
            { id: 'none', label: 'Aa', title: 'Normal Case' },
            { id: 'upper', label: 'AA', title: 'ALL CAPS' },
            { id: 'lower', label: 'aa', title: 'lowercase' },
            { id: 'title', label: 'Tt', title: 'Title Case' },
          ]}
        />
      </div>

      {/* Primary Fill Color */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs relative">
        <span className="text-mist font-medium">Fill Color</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColorPickerOpen((p) => !p)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 text-xs text-bone cursor-pointer transition-colors"
          >
            <div
              style={{
                background:
                  typeof effectiveFill === 'string'
                    ? effectiveFill
                    : `linear-gradient(${effectiveFill.angle}deg, ${effectiveFill.stops[0][1]}, ${effectiveFill.stops[1][1]})`,
              }}
              className="w-4 h-4 rounded-md border border-white/20 shadow-xs"
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

      {/* Tracking (Letter Spacing - Astryx Precision Slider) */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Tracking</span>
        <AstryxSlider
          value={+(effectiveStyle.font.tracking * 100).toFixed(1)}
          onChange={(val) => {
            onApplyStyleChange((s) => ({
              ...s,
              font: { ...s.font, tracking: val / 100 },
            }));
          }}
          min={-5}
          max={15}
          step={0.5}
          precision={1}
          unit="em"
          ariaLabel="Tracking"
        />
      </div>

      {/* Alignment (Astryx Segmented Control) */}
      <div className="grid grid-cols-[96px_1fr] items-center text-xs">
        <span className="text-mist font-medium">Align</span>
        <AstryxSegmentedGroup
          ariaLabel="Text Alignment"
          size="sm"
          value={effectiveStyle.layout.align || 'center'}
          onChange={(al) => {
            onApplyStyleChange((s) => ({
              ...s,
              layout: { ...s.layout, align: al },
            }));
          }}
          options={[
            { id: 'left', label: '', icon: AlignLeft, title: 'Align Left' },
            { id: 'center', label: '', icon: AlignCenter, title: 'Align Center' },
            { id: 'right', label: '', icon: AlignRight, title: 'Align Right' },
          ]}
        />
      </div>
    </div>
  );
};

export default InspectorTypographySection;
