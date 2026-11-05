// ─── Library Panel — Epic Hertz Studio v2 ──────────────────────────────────
import { useState, useMemo, useEffect } from 'react';
import {
  Captions,
  Type,
  Sparkles,
  Zap,
  Smile,
  Palette,
  ChevronLeft,
  AlertTriangle,
  Ban,
} from 'lucide-react';

import type {
  Segment,
  CaptionStyle,
  SpokenLanguage,
  ScriptOutput,
  SegmentStyleOverride,
} from '../types';
import {
  getUserPresets,
  getFavoritePresetIds,
  addRecentPresetId,
  getBrandColors,
  type UserPreset,
} from './userPresets';
import { listCustomFonts, type CustomFontRecord } from '../utils/projectStorage';
import { formatTimecode } from '../utils/formatTime';
import { checkReadability } from '../utils/readability';
import LibraryStylesTab from './library/LibraryStylesTab';
import LibraryBrandTab from './library/LibraryBrandTab';

export type LibraryTab = 'captions' | 'styles' | 'effects' | 'animations' | 'emoji' | 'brand';

interface LibraryPanelProps {
  leftTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  segments: Segment[];
  activeId: string | null;
  onSelectSegment: (id: string) => void;
  onSegmentsChange: (segments: Segment[]) => void;
  onSeek: (time: number) => void;
  style: CaptionStyle;
  onStyleChange: (style: CaptionStyle) => void;
  onSegmentOverrideChange?: (segId: string, override: Partial<SegmentStyleOverride> | null) => void;
  spokenLanguage: SpokenLanguage;
  scriptOutput: ScriptOutput;
  onRetranscribe?: () => void;
  scope: 'all' | 'caption' | 'words';
  onNotification?: (msg: string) => void;
  onToggleCollapse?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Look-only presets (Text Effects tab)
// ─────────────────────────────────────────────────────────────────────────────
const NONE_LOOK: Partial<CaptionStyle> = {
  fill: '#FFFFFF',
  stroke: { width: 0.03, color: '#000000' },
  shadow: { x: 0, y: 0.02, blur: 0.04, color: 'rgba(0,0,0,0.5)' },
  glow: { color: '', blur: 0, strength: 0 },
  extrude: { depth: 0, color: '#000000', angle: 90 },
  plate: { mode: 'none', color: '', padX: 0, padY: 0, radius: 0 },
};

const LOOK_PRESETS: Array<{ id: string; name: string; look: Partial<CaptionStyle> }> = [
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    look: {
      fill: '#FFFFFF',
      stroke: { width: 0.04, color: '#00F2FE' },
      glow: { color: '#00F2FE', blur: 0.28, strength: 1.5 },
      shadow: { x: 0, y: 0.04, blur: 0.12, color: 'rgba(0,0,0,0.8)' },
      extrude: { depth: 0, color: '#000', angle: 90 },
      plate: { mode: 'none', color: '', padX: 0, padY: 0, radius: 0 },
    },
  },
  {
    id: 'hard-shadow',
    name: 'Hard Shadow',
    look: {
      fill: '#FFE14D',
      stroke: { width: 0.08, color: '#000000' },
      shadow: { x: 0.05, y: 0.08, blur: 0, color: '#000000' },
      glow: { color: '', blur: 0, strength: 0 },
      extrude: { depth: 0, color: '#000', angle: 90 },
      plate: { mode: 'none', color: '', padX: 0, padY: 0, radius: 0 },
    },
  },
  {
    id: '3d-block',
    name: '3D Extrude',
    look: {
      fill: '#FFFFFF',
      stroke: { width: 0.05, color: '#000000' },
      shadow: { x: 0, y: 0.06, blur: 0.08, color: 'rgba(0,0,0,0.7)' },
      glow: { color: '', blur: 0, strength: 0 },
      extrude: { depth: 0.12, color: '#E11D48', angle: 90 },
      plate: { mode: 'none', color: '', padX: 0, padY: 0, radius: 0 },
    },
  },
  {
    id: 'gold-foil',
    name: 'Gold Foil',
    look: {
      fill: {
        angle: 45,
        stops: [
          [0, '#FFE885'],
          [0.5, '#F59E0B'],
          [1, '#B45309'],
        ],
      },
      stroke: { width: 0.06, color: '#1A1408' },
      shadow: { x: 0, y: 0.04, blur: 0.1, color: 'rgba(0,0,0,0.6)' },
      glow: { color: '#F59E0B', blur: 0.15, strength: 0.8 },
      extrude: { depth: 0, color: '#000', angle: 90 },
      plate: { mode: 'none', color: '', padX: 0, padY: 0, radius: 0 },
    },
  },
  {
    id: 'outline-pop',
    name: 'Outline Pop',
    look: {
      fill: '#FFFFFF',
      stroke: { width: 0.12, color: '#000000' },
      shadow: { x: 0, y: 0.05, blur: 0.15, color: 'rgba(0,0,0,0.8)' },
      glow: { color: '', blur: 0, strength: 0 },
      extrude: { depth: 0, color: '#000', angle: 90 },
      plate: { mode: 'none', color: '', padX: 0, padY: 0, radius: 0 },
    },
  },
  {
    id: 'glass-plate',
    name: 'Glass Plate',
    look: {
      fill: '#FFFFFF',
      stroke: { width: 0, color: '#000000' },
      shadow: { x: 0, y: 0.04, blur: 0.1, color: 'rgba(0,0,0,0.5)' },
      glow: { color: '', blur: 0, strength: 0 },
      extrude: { depth: 0, color: '#000', angle: 90 },
      plate: { mode: 'line', color: 'rgba(20,20,25,0.75)', padX: 0.35, padY: 0.14, radius: 0.25 },
    },
  },
  {
    id: 'plain',
    name: 'Pristine Clean',
    look: {
      fill: '#FFFFFF',
      stroke: { width: 0.02, color: 'rgba(0,0,0,0.4)' },
      shadow: { x: 0, y: 0.02, blur: 0.06, color: 'rgba(0,0,0,0.4)' },
      glow: { color: '', blur: 0, strength: 0 },
      extrude: { depth: 0, color: '#000', angle: 90 },
      plate: { mode: 'none', color: '', padX: 0, padY: 0, radius: 0 },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Emoji Library categorized
// ─────────────────────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  { name: 'Hype', items: ['🔥', '⚡', '🚀', '💥', '🏆', '💯', '✨', '👑', '🎯', '🎬'] },
  { name: 'Mindset', items: ['💡', '🧠', '💰', '📈', '🔑', '💎', '⏳', '📌', '🤝', '⭐'] },
  { name: 'Reactions', items: ['😂', '😮', '🤯', '😱', '🤫', '👀', '😎', '🫡', '🙏', '🙌'] },
  { name: 'Signals', items: ['👇', '👉', '⚠️', '❌', '✅', '🚨', '🛑', '🔊', '🔔', '📣'] },
];

export default function LibraryPanel({
  leftTab,
  onTabChange,
  segments,
  activeId,
  onSelectSegment,
  onSegmentsChange,
  onSeek,
  style,
  onStyleChange,
  onSegmentOverrideChange,
  spokenLanguage,
  scriptOutput,
  onRetranscribe,
  scope,
  onNotification,
  onToggleCollapse,
}: LibraryPanelProps) {
  const [animSubTab, setAnimSubTab] = useState<'entrance' | 'exit' | 'highlight'>('entrance');
  const [favorites, setFavorites] = useState<string[]>(() => getFavoritePresetIds());
  const [userPresetsList, setUserPresetsList] = useState<UserPreset[]>(() => getUserPresets());
  const [customFonts, setCustomFonts] = useState<CustomFontRecord[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>(() => getBrandColors());

  useEffect(() => {
    void listCustomFonts().then(setCustomFonts);
  }, []);

  // Sample segment for thumbnail rendering (rule: user's first caption or fallback)
  const sampleSegment: Segment = useMemo(() => {
    if (segments.length > 0 && segments[0].text) return segments[0];
    return {
      id: 'preview-sample',
      index: 1,
      start: 0,
      end: 2.2,
      text: 'Create viral subtitles fast',
      words: [
        { word: 'Create', start: 0.0, end: 0.6 },
        { word: 'viral', start: 0.6, end: 1.1 },
        { word: 'subtitles', start: 1.1, end: 1.7 },
        { word: 'fast', start: 1.7, end: 2.2 },
      ],
    };
  }, [segments]);

  // Apply style to scope helper
  const applyPresetToScope = (targetStyle: CaptionStyle, presetName: string) => {
    addRecentPresetId(targetStyle.id);

    if (scope === 'all' || !activeId) {
      onStyleChange(targetStyle);
      if (onNotification) onNotification(`Applied "${presetName}" to all captions`);
    } else if (scope === 'caption' && onSegmentOverrideChange) {
      onSegmentOverrideChange(activeId, {
        customStyle: targetStyle,
        fillColor: typeof targetStyle.fill === 'string' ? targetStyle.fill : undefined,
        strokeColor: targetStyle.stroke.color,
        highlightColor: targetStyle.highlight.color,
      });
      if (onNotification)
        onNotification(
          `Applied "${presetName}" to Caption #${segments.findIndex((s) => s.id === activeId) + 1}`,
        );
    }
  };

  // Apply look only
  const applyLookToScope = (look: Partial<CaptionStyle>, name: string) => {
    const isNone = name === 'None';
    if (scope === 'all' || !activeId) {
      onStyleChange({ ...style, ...look });
      if (onNotification)
        onNotification(
          isNone ? 'Reset text effects on all captions' : `Applied "${name}" look to all captions`,
        );
    } else if (scope === 'caption' && onSegmentOverrideChange) {
      if (isNone) {
        onSegmentOverrideChange(activeId, {
          fillColor: undefined,
          strokeColor: undefined,
          customStyle: undefined,
        });
      } else {
        onSegmentOverrideChange(activeId, {
          fillColor: typeof look.fill === 'string' ? look.fill : undefined,
          strokeColor: look.stroke?.color,
        });
      }
      if (onNotification)
        onNotification(
          isNone
            ? 'Removed text effect from selected caption'
            : `Applied "${name}" look to selected caption`,
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#141413] border-r border-white/10 select-none overflow-hidden">
      {/* ── 3.1 Tab Rail (Compact tabs with small icon above label, amber underline) ── */}
      <div className="flex items-center border-b border-white/10 bg-[#121211] overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'captions', label: 'Captions', icon: Captions },
          { id: 'styles', label: 'Styles', icon: Type },
          { id: 'effects', label: 'Effects', icon: Sparkles },
          { id: 'animations', label: 'Anim', icon: Zap },
          { id: 'emoji', label: 'Emoji', icon: Smile },
          { id: 'brand', label: 'Brand', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = leftTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id as LibraryTab)}
              className={`min-w-[54px] flex-1 py-2 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors relative ${
                isActive
                  ? 'text-amber-300 bg-white/5'
                  : 'text-smoke hover:text-bone hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="px-2 py-2 text-smoke hover:text-bone hover:bg-white/5 transition-colors shrink-0"
            title="Collapse library panel ([)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Tab Content Container ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ─────────────────────────────────────────────────────────────
            TAB 1: CAPTIONS
        ────────────────────────────────────────────────────────────── */}
        {leftTab === 'captions' && (
          <div className="space-y-3">
            {/* Header: Language & Re-transcribe */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-mono text-[10px] font-bold uppercase">
                  {spokenLanguage} · {scriptOutput}
                </span>
                <span className="text-smoke text-[11px]">{segments.length} captions</span>
              </div>
              {onRetranscribe && (
                <button
                  type="button"
                  onClick={onRetranscribe}
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-mist hover:text-bone text-[10px] transition-colors"
                >
                  Re-transcribe
                </button>
              )}
            </div>

            {/* Captions List */}
            <div className="space-y-1.5">
              {segments.map((seg) => {
                const isActive = seg.id === activeId;
                const issues = checkReadability(seg);
                const hasWarning = issues.length > 0;
                const hasOverride = !!seg.styleOverride;

                return (
                  <div
                    key={seg.id}
                    onClick={() => {
                      onSelectSegment(seg.id);
                      onSeek(seg.start);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-1.5 ${
                      isActive
                        ? 'bg-amber-400/10 border-amber-400/60 shadow-xs'
                        : 'bg-[#181817] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-smoke text-[10px]">#{seg.index}</span>
                        <span className="font-mono text-amber-400/90 text-[10px]">
                          {formatTimecode(seg.start)}
                        </span>
                        {hasOverride && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                            title="Has custom style override"
                          />
                        )}
                        {hasWarning && (
                          <span title={issues.map((i) => i.message).join(', ')}>
                            <AlertTriangle className="w-3 h-3 text-amber-400/80" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-smoke">
                        {(seg.end - seg.start).toFixed(2)}s
                      </span>
                    </div>

                    <textarea
                      value={seg.text}
                      onChange={(e) => {
                        const updated = segments.map((s) =>
                          s.id === seg.id ? { ...s, text: e.target.value } : s,
                        );
                        onSegmentsChange(updated);
                      }}
                      rows={2}
                      className="w-full bg-transparent text-bone text-xs leading-relaxed resize-none focus:outline-none rounded hover:bg-white/5 focus:bg-white/5 p-1 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: FULL STYLES GALLERY
        ────────────────────────────────────────────────────────────── */}
        {leftTab === 'styles' && (
          <LibraryStylesTab
            style={style}
            sampleSegment={sampleSegment}
            userPresetsList={userPresetsList}
            favorites={favorites}
            onFavoritesChange={setFavorites}
            onApplyPreset={applyPresetToScope}
          />
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: TEXT EFFECTS (LOOK-ONLY PRESETS)
        ────────────────────────────────────────────────────────────── */}
        {leftTab === 'effects' && (
          <div className="space-y-3">
            <p className="text-[11px] text-smoke">
              Applies styling treatment (fill, outline, shadow, glow, 3D) without changing your
              chosen font or animation.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {/* None / Reset tile: symbol only, no text label */}
              <button
                type="button"
                onClick={() => applyLookToScope(NONE_LOOK, 'None')}
                className="group p-2 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 flex items-center justify-center transition-all hover:scale-102 min-h-[46px]"
                title="None (reset text effect)"
                aria-label="None (reset text effect)"
              >
                <Ban className="w-5 h-5 text-smoke/70 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
              </button>

              {LOOK_PRESETS.map((eff) => (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => applyLookToScope(eff.look, eff.name)}
                  className="p-2 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 text-left transition-all hover:scale-102 flex flex-col gap-0.5 min-h-[46px]"
                >
                  <span className="text-[11px] font-bold text-bone truncate">{eff.name}</span>
                  <span className="text-[9px] text-smoke">Effect</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: ANIMATIONS (MOTION-ONLY PRESETS)
        ────────────────────────────────────────────────────────────── */}
        {leftTab === 'animations' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 bg-[#121211] p-0.5 rounded-lg border border-white/10">
              {(['entrance', 'exit', 'highlight'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setAnimSubTab(sub)}
                  className={`flex-1 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                    animSubTab === sub ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {animSubTab === 'entrance' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pop', name: 'Pop Bounce' },
                  { id: 'slide-up', name: 'Slide Up' },
                  { id: 'slide-down', name: 'Slide Down' },
                  { id: 'zoom', name: 'Zoom Slam' },
                  { id: 'blur', name: 'Blur In' },
                  { id: 'mask-up', name: 'Mask Reveal' },
                  { id: 'drop', name: 'Drop' },
                  { id: 'typewriter', name: 'Typewriter' },
                  { id: 'glitch', name: 'Glitch' },
                  { id: 'fade', name: 'Fade' },
                  { id: 'none', name: 'None' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onStyleChange({
                        ...style,
                        motion: { ...style.motion, in: item.id as any },
                      });
                      if (onNotification) onNotification(`Entrance set to: ${item.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style.motion.in === item.id
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                        : 'bg-[#181817] border-white/10 hover:border-white/20 text-bone'
                    }`}
                  >
                    <span className="text-xs">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {animSubTab === 'exit' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', name: 'None' },
                  { id: 'fade', name: 'Fade Out' },
                  { id: 'slide-down', name: 'Slide Down' },
                  { id: 'shrink', name: 'Shrink' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onStyleChange({
                        ...style,
                        motion: { ...style.motion, out: item.id as any },
                      });
                      if (onNotification) onNotification(`Exit set to: ${item.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style.motion.out === item.id
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                        : 'bg-[#181817] border-white/10 hover:border-white/20 text-bone'
                    }`}
                  >
                    <span className="text-xs">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {animSubTab === 'highlight' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'box', name: 'Highlight Box' },
                  { id: 'color', name: 'Active Color' },
                  { id: 'underline', name: 'Underline Sweep' },
                  { id: 'sweep', name: 'Karaoke Sweep' },
                  { id: 'none', name: 'None' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onStyleChange({
                        ...style,
                        highlight: { ...style.highlight, mode: item.id as any },
                      });
                      if (onNotification) onNotification(`Highlight set to: ${item.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style.highlight.mode === item.id
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                        : 'bg-[#181817] border-white/10 hover:border-white/20 text-bone'
                    }`}
                  >
                    <span className="text-xs">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: EMOJI PALETTE
        ────────────────────────────────────────────────────────────── */}
        {leftTab === 'emoji' && (
          <div className="space-y-3">
            <p className="text-[11px] text-smoke">
              Click any creator emoji to append to the active caption text.
            </p>
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {cat.name}
                </span>
                <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#181817] rounded-xl border border-white/5">
                  {cat.items.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        if (!activeId) return;
                        const next = segments.map((s) =>
                          s.id === activeId ? { ...s, text: `${s.text} ${emoji}`.trim() } : s,
                        );
                        onSegmentsChange(next);
                        if (onNotification) onNotification(`Added ${emoji} to caption`);
                      }}
                      className="h-10 rounded-lg hover:bg-white/10 text-xl flex items-center justify-center transition-transform hover:scale-115 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 6: BRAND KIT
        ────────────────────────────────────────────────────────────── */}
        {leftTab === 'brand' && (
          <LibraryBrandTab
            brandColors={brandColors}
            setBrandColors={setBrandColors}
            customFonts={customFonts}
            setCustomFonts={setCustomFonts}
            setUserPresetsList={setUserPresetsList}
            onNotification={onNotification}
          />
        )}
      </div>
    </div>
  );
}
