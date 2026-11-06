// ─── Contextual Inspector Panel — Epic Hertz Studio v2 ────────────────────────
import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import {
  Type,
  Zap,
  Clock,
  Layout,
  RotateCcw,
  Play,
  Bookmark,
  ChevronUp,
  Wand2,
} from 'lucide-react';

import type {
  Segment,
  CaptionStyle,
  SegmentStyleOverride,
  WordTimestamp,
  LowerThirdSpec,
} from '../types';
import LowerThirdInspector from './inspector/LowerThirdInspector';
import { Plus } from 'lucide-react';
import { fontById, getEffectiveCaptionStyle } from '../engine/spec';
import SavePresetModal from './SavePresetModal';
import { formatTimecode } from '../utils/formatTime';
import { checkReadability, getCPS, getWPM } from '../utils/readability';
import { fixTimings } from '../utils/alignWords';
import InspectorTypographySection from './inspector/InspectorTypographySection';
import InspectorEffectsSection from './inspector/InspectorEffectsSection';

interface InspectorPanelProps {
  scope: 'all' | 'caption' | 'words';
  onScopeChange: (scope: 'all' | 'caption' | 'words') => void;
  style: CaptionStyle;
  onStyleChange: (style: CaptionStyle) => void;
  activeSegment: Segment | null;
  onUpdateActiveSegment: (override: Partial<Segment>) => void;
  onSegmentOverrideChange?: (segId: string, override: Partial<SegmentStyleOverride> | null) => void;
  selectedWordIndices: number[];
  onSelectWordIndex: (index: number) => void;
  totalSegmentsCount: number;
  onPlayPreview?: () => void;
  onGoToBrand?: () => void;
  onAutoAlignTimings?: () => void;
  lowerThirds?: LowerThirdSpec[];
  activeLowerThirdId?: string | null;
  onSelectLowerThird?: (id: string | null) => void;
  onUpdateLowerThird?: (updated: LowerThirdSpec) => void;
  onDeleteLowerThird?: (id: string) => void;
  onAddLowerThird?: () => void;
  photoCache?: Map<string, HTMLImageElement>;
  onPhotoUploaded?: (photoBlobId: string, img: HTMLImageElement) => void;
  onPhotoRemoved?: (photoBlobId: string) => void;
  onClearAllOverrides?: () => void;
}

export type InspectorTab = 'text' | 'animation' | 'timing' | 'layout';
export type TextSubTab = 'basic' | 'fill' | 'effects' | 'background';

function InspectorPanel({
  scope,
  onScopeChange,
  style,
  onStyleChange,
  activeSegment,
  onUpdateActiveSegment,
  onSegmentOverrideChange,
  selectedWordIndices,
  onSelectWordIndex,
  totalSegmentsCount,
  onPlayPreview,
  onGoToBrand,
  onAutoAlignTimings,
  lowerThirds = [],
  activeLowerThirdId,
  onSelectLowerThird,
  onUpdateLowerThird,
  onDeleteLowerThird,
  onAddLowerThird,
  photoCache,
  onPhotoUploaded,
  onPhotoRemoved,
  onClearAllOverrides,
}: InspectorPanelProps) {
  const [tab, setTab] = useState<InspectorTab>('text');
  const [textSubTab, setTextSubTab] = useState<TextSubTab>('basic');
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);

  // Active Effective Values
  const effectiveStyle = useMemo(() => {
    if (scope === 'all' || !activeSegment) return style;
    return getEffectiveCaptionStyle(style, activeSegment.styleOverride);
  }, [scope, activeSegment, style]);

  const effectiveFont = effectiveStyle.font.family;
  const fontDef = useMemo(() => fontById(effectiveFont), [effectiveFont]);
  const availableWeights = useMemo(() => {
    const weights = fontDef.files.map((f) => f.weight);
    return Array.from(new Set(weights)).sort((a, b) => a - b);
  }, [fontDef]);

  const effectiveWeight = effectiveStyle.font.weight;
  const effectiveSize = effectiveStyle.font.size * 100;
  const effectiveFill = effectiveStyle.fill;
  const effectiveStrokeColor = effectiveStyle.stroke.color;

  const applyStyleChange = useCallback(
    (updater: (prev: CaptionStyle) => CaptionStyle) => {
      if (scope === 'all') {
        onStyleChange(updater(style));
      } else if (scope === 'caption') {
        if (!activeSegment || !onSegmentOverrideChange) return;
        const currentEffective = getEffectiveCaptionStyle(style, activeSegment.styleOverride);
        const nextEffective = updater(currentEffective);
        onSegmentOverrideChange(activeSegment.id, {
          customStyle: nextEffective,
          fontFamily: nextEffective.font.family,
          fontWeight: nextEffective.font.weight,
          fontSize: nextEffective.font.size,
          underline: nextEffective.font.underline,
          italic: nextEffective.font.italic,
          textCase: nextEffective.font.textCase,
          fillColor:
            typeof nextEffective.fill === 'string'
              ? nextEffective.fill
              : nextEffective.fill.stops[0][1],
          strokeColor: nextEffective.stroke.color,
          highlightColor: nextEffective.highlight.color,
          positionX: nextEffective.layout.x,
          positionY: nextEffective.layout.y,
        });
      } else if (scope === 'words') {
        if (activeSegment && onSegmentOverrideChange) {
          const currentEffective = getEffectiveCaptionStyle(style, activeSegment.styleOverride);
          const nextEffective = updater(currentEffective);
          onSegmentOverrideChange(activeSegment.id, {
            customStyle: nextEffective,
          });
        }
      }
    },
    [scope, activeSegment, onStyleChange, onSegmentOverrideChange, style],
  );

  // Active Word if selected
  const activeWord: WordTimestamp | null =
    activeSegment && activeSegment.words && selectedWordIndices.length > 0
      ? activeSegment.words[selectedWordIndices[0]] || null
      : null;

  // Readability diagnostic
  const diag = useMemo(() => {
    if (!activeSegment) return null;
    const issues = checkReadability(activeSegment);
    const cps = getCPS(activeSegment);
    const wpm = getWPM(activeSegment);
    return {
      cps,
      wpm,
      warnings: issues.map((i) => i.message),
    };
  }, [activeSegment]);

  const [panelSection, setPanelSection] = useState<'captions' | 'lowerThirds'>('captions');
  const activeLt = lowerThirds.find((lt) => lt.id === activeLowerThirdId);

  useEffect(() => {
    if (activeLowerThirdId) {
      setPanelSection('lowerThirds');
    }
  }, [activeLowerThirdId]);

  return (
    <aside className="h-full flex flex-col bg-[#141413] border-l border-white/10 select-none overflow-hidden">
      {/* ── Top-level Tab Switcher: Captions vs Lower Thirds ── */}
      <div className="flex items-center border-b border-white/10 bg-[#10100f] px-3 pt-2 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setPanelSection('captions');
            onSelectLowerThird?.(null);
          }}
          className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-colors ${
            panelSection === 'captions'
              ? 'border-amber-400 text-amber-200'
              : 'border-transparent text-smoke hover:text-bone'
          }`}
        >
          Captions
        </button>
        <button
          type="button"
          onClick={() => setPanelSection('lowerThirds')}
          className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            panelSection === 'lowerThirds'
              ? 'border-amber-400 text-amber-200'
              : 'border-transparent text-smoke hover:text-bone'
          }`}
        >
          <span>Lower Thirds</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono">
            {lowerThirds.length}
          </span>
        </button>
      </div>

      {panelSection === 'lowerThirds' ? (
        activeLt && onUpdateLowerThird && onDeleteLowerThird ? (
          <LowerThirdInspector
            spec={activeLt}
            onChange={onUpdateLowerThird}
            onDelete={onDeleteLowerThird}
            photoImage={photoCache?.get(activeLt.photoBlobId || '')}
            onPhotoUploaded={onPhotoUploaded}
            onPhotoRemoved={onPhotoRemoved}
          />
        ) : (
          <div className="flex-1 flex flex-col p-4 text-xs space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="font-semibold text-bone">Lower Thirds</div>
                <div className="text-[11px] text-smoke">
                  {lowerThirds.length} overlay{lowerThirds.length === 1 ? '' : 's'} on timeline
                </div>
              </div>
              {onAddLowerThird && (
                <button
                  type="button"
                  onClick={onAddLowerThird}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {lowerThirds.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#181816] rounded-2xl border border-white/5 my-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-bone">No Lower Thirds Yet</div>
                  <div className="text-[11px] text-smoke mt-0.5 max-w-[200px]">
                    Add animated speaker names, titles, and social handles to your reel.
                  </div>
                </div>
                {onAddLowerThird && (
                  <button
                    type="button"
                    onClick={onAddLowerThird}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create Lower Third</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-smoke uppercase tracking-wider block">
                  Select to Edit
                </span>
                {lowerThirds.map((lt) => (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => onSelectLowerThird?.(lt.id)}
                    className="w-full p-3 rounded-xl bg-[#1a1a18] hover:bg-[#22221f] border border-white/10 hover:border-amber-400/40 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 font-mono text-[9px] font-bold">
                          V{lt.variant}
                        </span>
                        <span className="font-semibold text-bone truncate">
                          {lt.name || 'Unnamed'}
                        </span>
                      </div>
                      <div className="text-[11px] text-smoke truncate mt-0.5">
                        {lt.role || 'No title'}
                      </div>
                    </div>
                    <span className="text-[10px] text-smoke font-mono shrink-0">
                      {formatTimecode(lt.start)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <>
          {/* ── 4.1 Contextual Header & Scope Switch ── */}
          <div className="p-3 border-b border-white/10 bg-[#121211] shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-smoke">
              <span className="uppercase tracking-wider">Editing Scope</span>
              <div className="flex items-center gap-1 bg-[#181817] p-0.5 rounded-lg border border-white/5">
                {(['all', 'caption', 'words'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => onScopeChange(sc)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors ${
                      scope === sc
                        ? 'bg-amber-400 text-black shadow-xs'
                        : 'text-smoke hover:text-bone'
                    }`}
                  >
                    {sc === 'all' ? 'All' : sc === 'caption' ? 'Caption' : 'Words'}
                  </button>
                ))}
              </div>
            </div>

            {/* Target indicator */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#181817] border border-white/5 text-xs">
              <span className="font-semibold text-bone truncate">
                {scope === 'all'
                  ? `All ${totalSegmentsCount} captions`
                  : scope === 'caption'
                    ? activeSegment
                      ? `Caption #${activeSegment.index} (${formatTimecode(activeSegment.start)})`
                      : 'Select a caption'
                    : activeWord
                      ? `Word: "${activeWord.word}"`
                      : 'Select a word chip'}
              </span>
              {scope === 'caption' && activeSegment?.styleOverride && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
                    Customized
                  </span>
                  <button
                    type="button"
                    onClick={() => onSegmentOverrideChange?.(activeSegment.id, null)}
                    className="text-[10px] text-smoke hover:text-amber-300 underline cursor-pointer"
                    title="Reset this caption back to global style"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* ── 4.2 Main Tabs: Text · Animation · Timing · Layout ── */}
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-[#181817] border border-white/5 text-[11px] font-bold">
              {[
                { id: 'text', label: 'Text', icon: Type },
                { id: 'animation', label: 'Anim', icon: Zap },
                { id: 'timing', label: 'Timing', icon: Clock },
                { id: 'layout', label: 'Layout', icon: Layout },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id as InspectorTab)}
                    className={`py-1.5 flex items-center justify-center gap-1 rounded-md transition-colors ${
                      isActive
                        ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                        : 'text-smoke hover:text-bone'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Inspector Scroll Body ── */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* ─────────────────────────────────────────────────────────────
            TAB 1: TEXT
        ────────────────────────────────────────────────────────────── */}
            {tab === 'text' && (
              <div className="space-y-3">
                {/* Sub-tabs: Basic · Fill & outline · Effects · Background */}
                <div className="flex items-center gap-1 bg-[#121211] p-0.5 rounded-lg border border-white/5 text-[11px]">
                  {(['basic', 'fill', 'effects', 'background'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTextSubTab(st)}
                      className={`flex-1 py-1 rounded capitalize font-medium transition-colors ${
                        textSubTab === st
                          ? 'bg-white/10 text-amber-300 font-bold'
                          : 'text-smoke hover:text-bone'
                      }`}
                    >
                      {st === 'basic'
                        ? 'Basic'
                        : st === 'fill'
                          ? 'Fill'
                          : st === 'effects'
                            ? 'Effects'
                            : 'BG'}
                    </button>
                  ))}
                </div>

                {textSubTab === 'basic' ? (
                  <InspectorTypographySection
                    scope={scope}
                    style={style}
                    effectiveStyle={effectiveStyle}
                    onStyleChange={onStyleChange}
                    onApplyStyleChange={applyStyleChange}
                    activeSegment={activeSegment}
                    onUpdateActiveSegment={onUpdateActiveSegment}
                    onSegmentOverrideChange={onSegmentOverrideChange}
                    effectiveFont={effectiveFont}
                    fontDef={fontDef}
                    availableWeights={availableWeights}
                    effectiveWeight={effectiveWeight}
                    effectiveSize={effectiveSize}
                    effectiveFill={effectiveFill}
                    onGoToBrand={onGoToBrand}
                  />
                ) : (
                  <InspectorEffectsSection
                    style={style}
                    effectiveStyle={effectiveStyle}
                    onStyleChange={onStyleChange}
                    onApplyStyleChange={applyStyleChange}
                    subTab={textSubTab}
                    effectiveStrokeColor={effectiveStrokeColor}
                  />
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
            TAB 2: ANIMATION
        ────────────────────────────────────────────────────────────── */}
            {tab === 'animation' && (
              <div className="space-y-4">
                {/* Entrance Motion Section */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Entrance Animation
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        'pop',
                        'slide-up',
                        'slide-down',
                        'zoom',
                        'blur',
                        'typewriter',
                        'glitch',
                        'fade',
                        'none',
                      ] as const
                    ).map((ea) => (
                      <button
                        key={ea}
                        type="button"
                        onClick={() => {
                          applyStyleChange((s) => ({
                            ...s,
                            motion: { ...s.motion, in: ea },
                          }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold capitalize transition-colors ${
                          effectiveStyle.motion.in === ea
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-[#181817] text-smoke hover:text-bone border border-white/5'
                        }`}
                      >
                        {ea}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highlight Style Mode */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Spoken Highlight Mode
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['box', 'color', 'underline', 'sweep', 'none'] as const).map((hl) => (
                      <button
                        key={hl}
                        type="button"
                        onClick={() => {
                          applyStyleChange((s) => ({
                            ...s,
                            highlight: { ...s.highlight, mode: hl },
                          }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold capitalize transition-colors ${
                          effectiveStyle.highlight.mode === hl
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-[#181817] text-smoke hover:text-bone border border-white/5'
                        }`}
                      >
                        {hl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Karaoke Keep Highlight Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={effectiveStyle.highlight.keep}
                    onChange={(e) => {
                      const ch = e.target.checked;
                      applyStyleChange((s) => ({
                        ...s,
                        highlight: { ...s.highlight, keep: ch },
                      }));
                    }}
                    className="rounded border-white/20 text-amber-400 focus:ring-0 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-mist">Keep spoken words highlighted (Karaoke)</span>
                </label>

                {/* Loop Preview Button */}
                {onPlayPreview && (
                  <button
                    type="button"
                    onClick={onPlayPreview}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 font-semibold text-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Loop Play Selected Caption</span>
                  </button>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
            TAB 3: TIMING
        ────────────────────────────────────────────────────────────── */}
            {tab === 'timing' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Audio Sync & Caption Timing
                </span>

                {/* Global Voice Sync Offset Slider */}
                <div className="p-3 bg-[#181817] rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist font-medium">Voice Sync Offset</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {(style.syncOffset ?? 0) > 0
                        ? `+${(style.syncOffset ?? 0).toFixed(2)}s`
                        : `${(style.syncOffset ?? 0).toFixed(2)}s`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={style.syncOffset ?? 0}
                    onChange={(e) =>
                      onStyleChange({ ...style, syncOffset: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-smoke font-mono">
                    <span>-0.50s (Lead / Early)</span>
                    <span>0.00s</span>
                    <span>+0.50s (Lag)</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { label: 'Tight (-0.15s)', val: -0.15 },
                      { label: 'Snappy (-0.08s)', val: -0.08 },
                      { label: 'Zero (0.00s)', val: 0.0 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onStyleChange({ ...style, syncOffset: preset.val })}
                        className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          Math.abs((style.syncOffset ?? 0) - preset.val) < 0.02
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-smoke leading-relaxed">
                    Fine-tunes word highlight timing relative to voice acoustic onsets.
                  </p>
                </div>

                {onAutoAlignTimings && (
                  <button
                    type="button"
                    onClick={onAutoAlignTimings}
                    className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Align Words to Voice Onsets</span>
                  </button>
                )}

                {activeSegment ? (
                  <>
                    {/* Timecode Steppers */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-[#181817] rounded-lg border border-white/5 space-y-1">
                        <span className="text-smoke text-[10px]">Start Time</span>
                        <span className="font-mono text-bone font-bold block">
                          {formatTimecode(activeSegment.start)}
                        </span>
                      </div>
                      <div className="p-2 bg-[#181817] rounded-lg border border-white/5 space-y-1">
                        <span className="text-smoke text-[10px]">End Time</span>
                        <span className="font-mono text-bone font-bold block">
                          {formatTimecode(activeSegment.end)}
                        </span>
                      </div>
                    </div>

                    {/* Word Timing Chips */}
                    {activeSegment.words && activeSegment.words.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-smoke block">Word Chips:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const fixed = fixTimings(activeSegment);
                              onUpdateActiveSegment({
                                words: fixed.words,
                                start: fixed.start,
                                end: fixed.end,
                              });
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                            title="Auto-align words proportionally by character length"
                          >
                            <Wand2 className="w-2.5 h-2.5" />
                            <span>Fix timings</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap p-2 bg-[#181817] rounded-xl border border-white/5">
                          {activeSegment.words.map((w, idx) => {
                            const isSelected = selectedWordIndices.includes(idx);
                            return (
                              <button
                                key={`${w.word}-${idx}`}
                                type="button"
                                onClick={() => onSelectWordIndex(idx)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-amber-400 text-black font-extrabold shadow-xs scale-105'
                                    : 'bg-white/5 text-bone hover:bg-white/10'
                                }`}
                              >
                                {w.word}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Diagnostics Card */}
                    {diag && (
                      <div className="p-3 bg-[#181817] rounded-xl border border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-smoke">Reading Speed</span>
                          <span
                            className={`font-mono font-bold ${diag.cps > 20 ? 'text-amber-400' : 'text-emerald-400'}`}
                          >
                            {diag.cps.toFixed(1)} CPS · {diag.wpm.toFixed(0)} WPM
                          </span>
                        </div>
                        {diag.warnings.length > 0 && (
                          <div className="text-[11px] text-amber-300 font-medium">
                            Warning: {diag.warnings.join(' · ')}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-[#181817] rounded-xl border border-white/5 text-center text-xs text-smoke">
                    Select a caption on the left to inspect and adjust individual word timing
                    precision.
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
            TAB 4: LAYOUT
        ────────────────────────────────────────────────────────────── */}
            {tab === 'layout' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Screen Position & Layout
                </span>

                {/* Quick 2D Anchors */}
                <div className="space-y-1.5">
                  <span className="text-xs text-smoke">Position Anchors:</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: 'Top', x: 0.5, y: 0.18 },
                      { label: 'Mid', x: 0.5, y: 0.5 },
                      { label: 'Lower 1/3', x: 0.5, y: 0.74 },
                      { label: 'Bot', x: 0.5, y: 0.85 },
                      { label: 'Top-L', x: 0.22, y: 0.18 },
                      { label: 'Top-R', x: 0.78, y: 0.18 },
                      { label: 'Bot-L', x: 0.22, y: 0.85 },
                      { label: 'Bot-R', x: 0.78, y: 0.85 },
                    ].map((anchor) => (
                      <button
                        key={anchor.label}
                        type="button"
                        onClick={() => {
                          applyStyleChange((s) => ({
                            ...s,
                            layout: { ...s.layout, x: anchor.x, y: anchor.y },
                          }));
                        }}
                        className="p-1.5 rounded-lg bg-[#181817] hover:bg-white/10 text-smoke hover:text-bone text-[10px] font-semibold border border-white/5"
                      >
                        {anchor.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Words Per Page */}
                <div className="grid grid-cols-[96px_1fr] items-center text-xs">
                  <span className="text-mist font-medium">Words/Page</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={1}
                      value={effectiveStyle.layout.wordsPerPage}
                      onChange={(e) => {
                        const wpp = parseInt(e.target.value, 10);
                        applyStyleChange((s) => ({
                          ...s,
                          layout: { ...s.layout, wordsPerPage: wpp },
                        }));
                      }}
                      className="flex-1 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-mono text-bone text-[11px] w-8 text-right">
                      {effectiveStyle.layout.wordsPerPage}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-smoke/70 italic">
                  Tip: You can also drag the caption block directly on the video player!
                </p>
              </div>
            )}
          </div>

          {/* ── 4.13 Sticky Footer: Reset & Save as Preset ── */}
          <div className="p-3 border-t border-white/10 bg-[#121211] flex items-center justify-between shrink-0 gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsResetMenuOpen((p) => !p)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-smoke hover:text-bone text-xs transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
                <ChevronUp className="w-3 h-3 ml-0.5" />
              </button>
              {isResetMenuOpen && (
                <div className="absolute bottom-full left-0 mb-1.5 w-44 rounded-xl bg-[#1c1c1b] border border-white/15 shadow-xl p-1 text-xs text-bone z-50">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSegment && onSegmentOverrideChange)
                        onSegmentOverrideChange(activeSegment.id, null);
                      setIsResetMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[11px]"
                  >
                    Reset this caption
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllOverrides?.();
                      setIsResetMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[11px] text-rose-300 hover:text-rose-200"
                  >
                    Reset all overrides
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSavePresetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-sm transition-all"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save as preset</span>
            </button>
          </div>

          {/* Save Preset Dialog */}
          <SavePresetModal
            isOpen={isSavePresetOpen}
            onClose={() => setIsSavePresetOpen(false)}
            style={style}
          />
        </>
      )}
    </aside>
  );
}

export default memo(InspectorPanel);
