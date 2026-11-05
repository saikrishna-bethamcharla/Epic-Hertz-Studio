// ─── Contextual Inspector Panel — Epic Hertz Studio v2 ────────────────────────
import { useState, useMemo } from 'react';
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

import type { Segment, CaptionStyle, SegmentStyleOverride, WordTimestamp } from '../types';
import { fontById } from '../engine/spec';
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
}

export type InspectorTab = 'text' | 'animation' | 'timing' | 'layout';
export type TextSubTab = 'basic' | 'fill' | 'effects' | 'background';

export default function InspectorPanel({
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
}: InspectorPanelProps) {
  const [tab, setTab] = useState<InspectorTab>('text');
  const [textSubTab, setTextSubTab] = useState<TextSubTab>('basic');
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);

  // Active Effective Values
  const effectiveFont = activeSegment?.styleOverride?.fontFamily || style.font.family;
  const fontDef = useMemo(() => fontById(effectiveFont), [effectiveFont]);
  const availableWeights = useMemo(() => {
    const weights = fontDef.files.map((f) => f.weight);
    return Array.from(new Set(weights)).sort((a, b) => a - b);
  }, [fontDef]);

  const effectiveWeight = activeSegment?.styleOverride?.fontWeight || style.font.weight;
  const effectiveSize =
    activeSegment?.styleOverride?.fontSize !== undefined
      ? activeSegment.styleOverride.fontSize * 100
      : activeSegment?.styleOverride?.scale !== undefined
        ? style.font.size * activeSegment.styleOverride.scale * 100
        : style.font.size * 100;

  const effectiveFill = activeSegment?.styleOverride?.fillColor || style.fill;
  const effectiveStrokeColor = activeSegment?.styleOverride?.strokeColor || style.stroke.color;

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

  return (
    <aside className="h-full flex flex-col bg-[#141413] border-l border-white/10 select-none overflow-hidden">
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
                  scope === sc ? 'bg-amber-400 text-black shadow-xs' : 'text-smoke hover:text-bone'
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
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
              Customized
            </span>
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
                onStyleChange={onStyleChange}
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
                onStyleChange={onStyleChange}
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
                      onStyleChange({ ...style, motion: { ...style.motion, in: ea } });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold capitalize transition-colors ${
                      style.motion.in === ea
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
                      onStyleChange({ ...style, highlight: { ...style.highlight, mode: hl } });
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold capitalize transition-colors ${
                      style.highlight.mode === hl
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
                checked={style.highlight.keep}
                onChange={(e) => {
                  onStyleChange({
                    ...style,
                    highlight: { ...style.highlight, keep: e.target.checked },
                  });
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
              <p className="text-[10px] text-smoke leading-relaxed">
                Fine-tunes word highlight timing relative to voice acoustic onsets.
              </p>
            </div>

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
                        ⚠️ {diag.warnings.join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 bg-[#181817] rounded-xl border border-white/5 text-center text-xs text-smoke">
                Select a caption on the left to inspect and adjust individual word timing precision.
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
                      if (scope === 'all') {
                        onStyleChange({
                          ...style,
                          layout: { ...style.layout, x: anchor.x, y: anchor.y },
                        });
                      } else if (scope === 'caption' && activeSegment && onSegmentOverrideChange) {
                        onSegmentOverrideChange(activeSegment.id, {
                          positionX: anchor.x,
                          positionY: anchor.y,
                        });
                      }
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
                  value={style.layout.wordsPerPage}
                  onChange={(e) => {
                    onStyleChange({
                      ...style,
                      layout: { ...style.layout, wordsPerPage: parseInt(e.target.value, 10) },
                    });
                  }}
                  className="flex-1 accent-amber-400 cursor-pointer"
                />
                <span className="font-mono text-bone text-[11px] w-8 text-right">
                  {style.layout.wordsPerPage}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-smoke/70 italic">
              💡 Tip: You can also drag the caption block directly on the video player!
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
                  // Reset all segments
                  setIsResetMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[11px]"
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
    </aside>
  );
}
