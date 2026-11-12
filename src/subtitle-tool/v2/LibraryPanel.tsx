// ─── Library Panel — Epic Hertz Studio v2 ──────────────────────────────────
import { useState, useMemo, useEffect, useRef, memo } from 'react';
import {
  Captions,
  SlidersHorizontal,
  Film,
  Layers,
  ChevronLeft,
  AlertTriangle,
  Ban,
  Trash2,
  PlusCircle,
  Plus,
  LayoutGrid,
  Bookmark,
  Quote,
  Clapperboard,
  Upload,
  Download,
  X,
} from 'lucide-react';

import type {
  Segment,
  CaptionStyle,
  SpokenLanguage,
  ScriptOutput,
  SegmentStyleOverride,
  LowerThirdSpec,
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
import LibraryMovieStylesTab from './library/LibraryMovieStylesTab';
import LibraryBrandTab from './library/LibraryBrandTab';
import LibraryLowerThirdsTab from './library/LibraryLowerThirdsTab';
import { ENTRANCE_PRESETS, EXIT_PRESETS, HIGHLIGHT_PRESETS } from '../engine/animation/presets';
import {
  parseMotionPresetPack,
  serializeMotionPresetPack,
  buildPackFromBuiltins,
} from '../engine/animation/presetPack';
import {
  getInstalledMotionPacks,
  installMotionPack,
  removeMotionPack,
  type InstalledMotionPack,
} from './motionPacks';

export type LibraryTab =
  | 'addText'
  | 'templates'
  | 'movieStyles'
  | 'styles'
  | 'lowerThirds'
  | 'effects'
  | 'animations'
  | 'brand'
  | 'captions';

interface LibraryPanelProps {
  leftTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  segments: Segment[];
  activeId: string | null;
  selectedId?: string | null;
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
  onScopeChange?: (scope: 'all' | 'caption' | 'words') => void;
  onClearAllOverrides?: () => void;
  onNotification?: (msg: string) => void;
  onToggleCollapse?: () => void;
  currentTime?: number;
  selectedLowerThirdId?: string | null;
  selectedLowerThirdSpec?: LowerThirdSpec | null;
  onAddLowerThird?: (spec: LowerThirdSpec) => void;
  onUpdateLowerThird?: (spec: LowerThirdSpec) => void;
  onAddMultipleLowerThirds?: (specs: LowerThirdSpec[]) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Look-only presets (Text Effects sub-section)
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

// Sub-sections in the Text Section navigation
const SUB_SECTIONS: Array<{
  id: LibraryTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  title: string;
  description: string;
}> = [
  {
    id: 'addText',
    label: 'Add text',
    icon: PlusCircle,
    title: 'Add Text',
    description: 'Insert text layers & headlines at playhead',
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: LayoutGrid,
    badge: '66',
    title: 'Text Templates',
    description: 'Viral subtitles & social preset templates',
  },
  {
    id: 'movieStyles',
    label: 'Movie styles',
    icon: Clapperboard,
    badge: '20',
    title: 'Movie Style Text Templates',
    description: 'Cinematic typography, blockbuster trailers, film noir & sci-fi text presets',
  },
  {
    id: 'lowerThirds',
    label: 'Lower thirds',
    icon: Layers,
    badge: '60',
    title: 'Lower Thirds',
    description: 'Broadcast name cards, speaker tags & tickers',
  },
  {
    id: 'effects',
    label: 'Text effects',
    icon: SlidersHorizontal,
    title: 'Text Effects',
    description: 'Fills, outlines, glows, and 3D extrusion looks',
  },
  {
    id: 'animations',
    label: 'Animations',
    icon: Film,
    title: 'Animations',
    description: 'Entrance, exit, and karaoke word highlights',
  },
  {
    id: 'brand',
    label: 'Yours',
    icon: Bookmark,
    title: 'Yours / Brand',
    description: 'Brand colors, custom fonts, and saved presets',
  },
  {
    id: 'captions',
    label: 'Captions',
    icon: Captions,
    title: 'Captions',
    description: 'Timed speech segments & transcription editor',
  },
];

function LibraryPanel({
  leftTab,
  onTabChange,
  segments,
  activeId,
  selectedId,
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
  onScopeChange,
  onClearAllOverrides,
  onNotification,
  onToggleCollapse,
  currentTime = 0,
  selectedLowerThirdId,
  selectedLowerThirdSpec,
  onAddLowerThird,
  onUpdateLowerThird,
  onAddMultipleLowerThirds,
}: LibraryPanelProps) {
  const [animSubTab, setAnimSubTab] = useState<'entrance' | 'exit' | 'highlight'>('entrance');
  const [motionPacks, setMotionPacks] = useState<InstalledMotionPack[]>(() =>
    getInstalledMotionPacks(),
  );
  const motionPackInputRef = useRef<HTMLInputElement>(null);
  const [favorites, setFavorites] = useState<string[]>(() => getFavoritePresetIds());
  const [userPresetsList, setUserPresetsList] = useState<UserPreset[]>(() => getUserPresets());
  const [customFonts, setCustomFonts] = useState<CustomFontRecord[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>(() => getBrandColors());

  type UiMotionPreset = {
    key: string;
    name: string;
    hint: string;
    packName?: string;
    motion: Partial<CaptionStyle['motion']>;
  };
  type UiHighlightPreset = {
    key: string;
    name: string;
    hint: string;
    packName?: string;
    highlight: Partial<CaptionStyle['highlight']>;
  };

  const entrancePresets = useMemo<UiMotionPreset[]>(
    () => [
      ...ENTRANCE_PRESETS.map((p) => ({
        key: p.id,
        name: p.name,
        hint: p.hint,
        motion: p.motion,
      })),
      ...motionPacks.flatMap((pack) =>
        pack.presets
          .filter((p) => p.group === 'entrance')
          .map((p) => ({
            key: `${pack.id}:${p.id}`,
            name: p.name,
            hint: p.hint,
            packName: pack.name,
            motion: (p.motion ?? {}) as Partial<CaptionStyle['motion']>,
          })),
      ),
    ],
    [motionPacks],
  );

  const exitPresets = useMemo<UiMotionPreset[]>(
    () => [
      ...EXIT_PRESETS.map((p) => ({
        key: p.id,
        name: p.name,
        hint: p.hint,
        motion: p.motion,
      })),
      ...motionPacks.flatMap((pack) =>
        pack.presets
          .filter((p) => p.group === 'exit')
          .map((p) => ({
            key: `${pack.id}:${p.id}`,
            name: p.name,
            hint: p.hint,
            packName: pack.name,
            motion: (p.motion ?? {}) as Partial<CaptionStyle['motion']>,
          })),
      ),
    ],
    [motionPacks],
  );

  const highlightPresets = useMemo<UiHighlightPreset[]>(
    () => [
      ...HIGHLIGHT_PRESETS.map((p) => ({
        key: p.id,
        name: p.name,
        hint: p.hint,
        highlight: p.highlight,
      })),
      ...motionPacks.flatMap((pack) =>
        pack.presets
          .filter((p) => p.group === 'highlight')
          .map((p) => ({
            key: `${pack.id}:${p.id}`,
            name: p.name,
            hint: p.hint,
            packName: pack.name,
            highlight: (p.highlight ?? {}) as Partial<CaptionStyle['highlight']>,
          })),
      ),
    ],
    [motionPacks],
  );

  const handleImportMotionPack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result ?? '');
      const result = parseMotionPresetPack(text);
      if (!result.ok) {
        if (onNotification) onNotification(`Motion pack import failed: ${result.errors[0]}`);
        return;
      }
      const updated = installMotionPack(result.pack);
      setMotionPacks(updated);
      if (onNotification)
        onNotification(
          `Installed "${result.pack.name}" — ${result.pack.presets.length} presets added`,
        );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportMotionPack = () => {
    const json = serializeMotionPresetPack({
      name: 'Epic Hertz Motion Library',
      author: 'Epic Hertz Studio',
      presets: buildPackFromBuiltins(ENTRANCE_PRESETS, EXIT_PRESETS, HIGHLIGHT_PRESETS),
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epic-hertz-motion-pack-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotification) onNotification('Motion pack exported as JSON');
  };

  const handleRemoveMotionPack = (id: string, name: string) => {
    setMotionPacks(removeMotionPack(id));
    if (onNotification) onNotification(`Removed motion pack "${name}"`);
  };

  useEffect(() => {
    void listCustomFonts().then(setCustomFonts);
  }, []);

  // Map 'styles' to 'templates' for backwards compatibility
  const activeTabKey: LibraryTab = leftTab === 'styles' ? 'templates' : leftTab;

  // Active sub-section metadata
  const currentSubSection = useMemo(() => {
    return (
      SUB_SECTIONS.find((s) => s.id === activeTabKey) ||
      SUB_SECTIONS.find((s) => s.id === 'templates') ||
      SUB_SECTIONS[0]
    );
  }, [activeTabKey]);

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

  const targetCaptionId = selectedId ?? activeId;
  const targetCaptionIndex = segments.findIndex((s) => s.id === targetCaptionId);

  // Helper to add a new text segment at current playhead
  const handleAddTextSegment = (
    text = 'Default text',
    override?: Partial<SegmentStyleOverride>,
  ) => {
    const curTime = currentTime || 0;
    const duration = 2.0;
    const start = Math.max(0, parseFloat(curTime.toFixed(2)));
    const end = parseFloat((start + duration).toFixed(2));
    const newId = `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const words = text
      .trim()
      .split(/\s+/)
      .map((word, i, arr) => {
        const wDur = duration / Math.max(1, arr.length);
        return {
          word,
          start: parseFloat((start + i * wDur).toFixed(2)),
          end: parseFloat((start + (i + 1) * wDur).toFixed(2)),
        };
      });

    const newSegment: Segment = {
      id: newId,
      index: segments.length + 1,
      start,
      end,
      text,
      words,
    };

    if (override) {
      newSegment.styleOverride = override;
    }

    // Insert in time-sorted order and re-index 1..N
    const next = [...segments, newSegment]
      .sort((a, b) => a.start - b.start)
      .map((s, idx) => ({ ...s, index: idx + 1 }));

    onSegmentsChange(next);
    onSelectSegment(newId);
    onSeek(start);
    if (onNotification) onNotification(`Added "${text}" at ${formatTimecode(start)}`);
  };

  // Apply style to scope helper
  const applyPresetToScope = (targetStyle: CaptionStyle, presetName: string) => {
    addRecentPresetId(targetStyle.id);

    if (scope === 'caption') {
      if (!targetCaptionId) {
        if (onNotification)
          onNotification('Select a caption first to apply this style to a single caption.');
        return;
      }
      if (onSegmentOverrideChange) {
        onSegmentOverrideChange(targetCaptionId, {
          customStyle: targetStyle,
          fillColor: typeof targetStyle.fill === 'string' ? targetStyle.fill : undefined,
          strokeColor: targetStyle.stroke.color,
          highlightColor: targetStyle.highlight.color,
        });
        if (onNotification)
          onNotification(`Applied "${presetName}" to Caption #${targetCaptionIndex + 1}`);
      }
    } else {
      // scope === 'all'
      onStyleChange(targetStyle);
      const hasOverrides = segments.some((s) => s.styleOverride);
      if (hasOverrides && onClearAllOverrides) {
        onClearAllOverrides();
        if (onNotification)
          onNotification(`Applied "${presetName}" to all captions (custom overrides reset)`);
      } else {
        if (onNotification) onNotification(`Applied "${presetName}" to all captions`);
      }
    }
  };

  // Apply look only
  const applyLookToScope = (look: Partial<CaptionStyle>, name: string) => {
    const isNone = name === 'None';
    if (scope === 'caption') {
      if (!targetCaptionId) {
        if (onNotification)
          onNotification('Select a caption first to apply text effects to a single caption.');
        return;
      }
      if (onSegmentOverrideChange) {
        if (isNone) {
          onSegmentOverrideChange(targetCaptionId, null);
        } else {
          onSegmentOverrideChange(targetCaptionId, {
            customStyle: look,
            fillColor: typeof look.fill === 'string' ? look.fill : undefined,
            strokeColor: look.stroke?.color,
          });
        }
        if (onNotification)
          onNotification(
            isNone
              ? `Reset text effects on Caption #${targetCaptionIndex + 1}`
              : `Applied "${name}" look to Caption #${targetCaptionIndex + 1}`,
          );
      }
    } else {
      // scope === 'all'
      onStyleChange({ ...style, ...look });
      if (onNotification)
        onNotification(
          isNone ? 'Reset text effects on all captions' : `Applied "${name}" look to all captions`,
        );
    }
  };

  const renderScopeBanner = () => (
    <div className="flex items-center justify-between p-2 rounded-lg bg-[#181817] border border-white/5 text-xs mb-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] uppercase font-bold text-mist tracking-wider">Target:</span>
        <span className="font-semibold text-bone truncate">
          {scope === 'all'
            ? `All (${segments.length} captions)`
            : targetCaptionIndex >= 0
              ? `Caption #${targetCaptionIndex + 1}`
              : 'None selected'}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onScopeChange?.('all')}
          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
            scope === 'all'
              ? 'bg-amber-400 text-black shadow-xs'
              : 'text-smoke hover:text-bone bg-white/5'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => {
            if (targetCaptionId) onScopeChange?.('caption');
            else if (onNotification)
              onNotification('Select a caption in the list or timeline first');
          }}
          disabled={!targetCaptionId}
          title="Apply styles to this caption only"
          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
            scope === 'caption'
              ? 'bg-amber-400 text-black shadow-xs'
              : targetCaptionId
                ? 'text-smoke hover:text-bone bg-white/5'
                : 'text-smoke/40 bg-white/5 cursor-not-allowed'
          }`}
        >
          Caption
        </button>
      </div>
    </div>
  );

  const showScopeHeader =
    activeTabKey === 'templates' ||
    activeTabKey === 'movieStyles' ||
    activeTabKey === 'effects' ||
    activeTabKey === 'animations';

  return (
    <div className="h-full flex bg-[#141413] border-r border-white/10 select-none overflow-hidden">
      {/* ── Sub-Sections Vertical Navigation Rail (Left Rail) ── */}
      <div className="w-[102px] shrink-0 border-r border-white/10 bg-[#121211] p-1.5 flex flex-col justify-between overflow-y-auto no-scrollbar">
        <div
          role="tablist"
          aria-label="Text sub-sections navigation"
          aria-orientation="vertical"
          className="flex flex-col gap-1 w-full"
        >
          {SUB_SECTIONS.map((sub) => {
            const Icon = sub.icon;
            const isActive = activeTabKey === sub.id;
            return (
              <button
                key={sub.id}
                id={`tab-${sub.id}`}
                type="button"
                role="tab"
                aria-label={sub.id === 'templates' ? 'Templates / Styles' : sub.label}
                aria-selected={isActive}
                aria-controls={`panel-${sub.id}`}
                onClick={() => onTabChange(sub.id)}
                className={`w-full py-2.5 px-1.5 flex flex-col items-center justify-center gap-1 rounded-lg text-center transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-xs font-semibold'
                    : 'text-smoke hover:text-bone hover:bg-white/5 border border-transparent font-medium'
                }`}
                title={sub.description}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-amber-400' : 'text-smoke group-hover:text-bone'
                  }`}
                />
                <span className="text-[10px] leading-tight tracking-tight break-words text-center">
                  {sub.label}
                </span>
                {sub.badge && (
                  <span
                    className={`text-[8px] px-1 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-amber-400/25 text-amber-300 font-bold'
                        : 'bg-white/5 text-mist group-hover:text-smoke'
                    }`}
                  >
                    {sub.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-[2.5px] bg-amber-400 rounded-r-full" />
                )}
              </button>
            );
          })}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full mt-2 py-1.5 flex items-center justify-center gap-1 text-smoke hover:text-bone hover:bg-white/5 rounded-lg border border-transparent transition-colors text-[10px] font-medium cursor-pointer shrink-0"
            title="Collapse text panel ([)"
            aria-label="Collapse library panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Collapse</span>
          </button>
        )}
      </div>

      {/* ── Sub-Section Content Area (Right Panel) ── */}
      <div
        id={`panel-${activeTabKey}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTabKey}`}
        className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#141413]"
      >
        {/* Top Header of Active Sub-Section */}
        <div className="h-11 px-3 border-b border-white/10 bg-[#121211]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-xs font-bold text-bone truncate">{currentSubSection.title}</h3>
            {currentSubSection.badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-mist font-mono">
                {currentSubSection.badge} presets
              </span>
            )}
            {activeTabKey === 'captions' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/20 font-mono font-bold uppercase">
                {spokenLanguage} · {scriptOutput}
              </span>
            )}
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-1.5 shrink-0">
            {showScopeHeader && (
              <div className="flex items-center gap-1 bg-[#181817] p-0.5 rounded-md border border-white/5 text-xs">
                <button
                  type="button"
                  onClick={() => onScopeChange?.('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    scope === 'all'
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'text-smoke hover:text-bone hover:bg-white/5'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (targetCaptionId) onScopeChange?.('caption');
                    else if (onNotification)
                      onNotification('Select a caption in the list or timeline first');
                  }}
                  disabled={!targetCaptionId}
                  title="Apply to active caption only"
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    scope === 'caption'
                      ? 'bg-amber-400 text-black shadow-xs'
                      : targetCaptionId
                        ? 'text-smoke hover:text-bone hover:bg-white/5'
                        : 'text-smoke/40 cursor-not-allowed'
                  }`}
                >
                  Caption
                </button>
              </div>
            )}
            {activeTabKey === 'captions' && onRetranscribe && (
              <button
                type="button"
                onClick={onRetranscribe}
                className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-mist hover:text-bone text-[10px] font-medium transition-colors cursor-pointer"
              >
                Re-transcribe
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Sub-Section Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 1: ADD TEXT
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'addText' && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-smoke leading-relaxed">
                  Insert text overlays and titles at playhead{' '}
                  <span className="font-mono text-amber-400 font-semibold">
                    ({formatTimecode(currentTime)})
                  </span>
                  .
                </p>
              </div>

              {/* Quick Text Starter Tiles */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Default Text Card (CapCut style) */}
                <button
                  type="button"
                  onClick={() => handleAddTextSegment('Default text')}
                  className="group p-3.5 rounded-xl bg-[#181817] border border-white/10 hover:border-amber-400/80 hover:bg-[#1f1f1d] flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 group-hover:bg-amber-400/20 group-hover:border-amber-400 flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                    Default text
                  </span>
                  <span className="text-[10px] text-smoke">Add at playhead</span>
                </button>

                {/* Bold Headline Card */}
                <button
                  type="button"
                  onClick={() =>
                    handleAddTextSegment('HEADLINE TITLE', {
                      fontSize: 0.12,
                      fontWeight: 900,
                      textCase: 'upper',
                      fillColor: '#FFFFFF',
                      strokeColor: '#000000',
                    })
                  }
                  className="group p-3.5 rounded-xl bg-[#181817] border border-white/10 hover:border-amber-400/80 hover:bg-[#1f1f1d] flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 group-hover:border-amber-400 flex items-center justify-center font-black text-sm text-bone group-hover:text-amber-300">
                    H1
                  </div>
                  <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                    Headline
                  </span>
                  <span className="text-[10px] text-smoke">Bold title</span>
                </button>

                {/* Subheading Card */}
                <button
                  type="button"
                  onClick={() =>
                    handleAddTextSegment('Subtitle context', {
                      fontSize: 0.07,
                      fontWeight: 600,
                      textCase: 'none',
                      fillColor: '#E4E4E7',
                      strokeColor: '#000000',
                    })
                  }
                  className="group p-3.5 rounded-xl bg-[#181817] border border-white/10 hover:border-amber-400/80 hover:bg-[#1f1f1d] flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 group-hover:border-amber-400 flex items-center justify-center font-medium text-xs text-bone group-hover:text-amber-300">
                    H2
                  </div>
                  <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                    Subheading
                  </span>
                  <span className="text-[10px] text-smoke">Supporting line</span>
                </button>

                {/* Callout Quote Card */}
                <button
                  type="button"
                  onClick={() =>
                    handleAddTextSegment('Highlight Quote', {
                      fontSize: 0.08,
                      fontWeight: 700,
                      fillColor: '#FFFFFF',
                      customStyle: {
                        plate: {
                          mode: 'line',
                          color: 'rgba(20,20,25,0.85)',
                          padX: 0.35,
                          padY: 0.15,
                          radius: 0.25,
                        },
                      },
                    })
                  }
                  className="group p-3.5 rounded-xl bg-[#181817] border border-white/10 hover:border-amber-400/80 hover:bg-[#1f1f1d] flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 group-hover:border-amber-400 flex items-center justify-center text-smoke group-hover:text-amber-300">
                    <Quote className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                    Callout Plate
                  </span>
                  <span className="text-[10px] text-smoke">Framed box</span>
                </button>
              </div>

              {/* Lower Third Quick Jump */}
              <div className="p-3 rounded-xl bg-[#181817] border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-bone">Titles & Lower Thirds Library</div>
                    <div className="text-[10px] text-smoke truncate">
                      72 cinema titles, end cards & name tags
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange('lowerThirds')}
                  className="px-2.5 py-1 rounded-md bg-amber-400 text-black text-[10px] font-bold hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
                >
                  Browse
                </button>
              </div>

              {/* Quick instructions */}
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-smoke space-y-1">
                <div className="text-bone font-semibold text-[11px]">Workflow tips:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-mist">
                  <li>Click any card above to drop a text segment at the playhead.</li>
                  <li>Drag corners in the video preview to reposition or scale.</li>
                  <li>Customize colors, fonts, and animations in the Inspector.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 2: TEMPLATES (FULL STYLES GALLERY)
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'templates' && (
            <div className="space-y-3">
              {renderScopeBanner()}
              <LibraryStylesTab
                style={style}
                sampleSegment={sampleSegment}
                userPresetsList={userPresetsList}
                favorites={favorites}
                onFavoritesChange={setFavorites}
                onApplyPreset={applyPresetToScope}
                onUserPresetsChange={setUserPresetsList}
                onNotification={onNotification}
              />
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 3: MOVIE STYLE TEXT TEMPLATES
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'movieStyles' && (
            <div className="space-y-3">
              {renderScopeBanner()}
              <LibraryMovieStylesTab
                style={style}
                sampleSegment={sampleSegment}
                favorites={favorites}
                onFavoritesChange={setFavorites}
                onApplyPreset={applyPresetToScope}
                onNotification={onNotification}
              />
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 4: LOWER THIRDS PACK LIBRARY
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'lowerThirds' && (
            <LibraryLowerThirdsTab
              currentTime={currentTime}
              selectedLowerThirdId={selectedLowerThirdId}
              selectedLowerThirdSpec={selectedLowerThirdSpec}
              onAddLowerThird={(spec) => onAddLowerThird?.(spec)}
              onUpdateLowerThird={(spec) => onUpdateLowerThird?.(spec)}
              onAddMultipleLowerThirds={(specs) => onAddMultipleLowerThirds?.(specs)}
              excludePackId="title-end"
            />
          )}

          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 4: TEXT EFFECTS (LOOK-ONLY PRESETS)
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'effects' && (
            <div className="space-y-3">
              {renderScopeBanner()}
              <p className="text-[11px] text-smoke">
                Applies styling treatments (fill, stroke, shadow, glow, 3D) without altering your
                font or animation timings.
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {/* None / Reset tile */}
                <button
                  type="button"
                  onClick={() => applyLookToScope(NONE_LOOK, 'None')}
                  className="group p-2 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 flex items-center justify-center transition-all hover:scale-102 min-h-[46px] cursor-pointer"
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
                    className="p-2 rounded-lg bg-[#181817] border border-white/10 hover:border-amber-400 text-left transition-all hover:scale-102 flex flex-col gap-0.5 min-h-[46px] cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-bone truncate">{eff.name}</span>
                    <span className="text-[9px] text-smoke">Effect</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 5: ANIMATIONS (MOTION-ONLY PRESETS)
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'animations' && (
            <div className="space-y-3">
              {renderScopeBanner()}
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
                <span className="text-[10px] font-medium text-smoke uppercase tracking-wider">
                  Motion Presets
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={motionPackInputRef}
                    accept=".json"
                    onChange={handleImportMotionPack}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => motionPackInputRef.current?.click()}
                    title="Install a motion preset pack (.json)"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#181817] border border-white/10 hover:border-amber-400 text-bone text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Import pack
                  </button>
                  <button
                    type="button"
                    onClick={handleExportMotionPack}
                    title="Download every preset as a shareable pack"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#181817] border border-white/10 hover:border-amber-400 text-bone text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              </div>

              {motionPacks.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {motionPacks.map((pack) => (
                    <span
                      key={pack.id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/25 text-[9px] text-amber-200"
                    >
                      {pack.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveMotionPack(pack.id, pack.name)}
                        aria-label={`Remove ${pack.name}`}
                        className="hover:text-white cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 bg-[#121211] p-0.5 rounded-lg border border-white/10">
                {(['entrance', 'exit', 'highlight'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setAnimSubTab(sub)}
                    className={`flex-1 py-1 rounded text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                      animSubTab === sub ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {animSubTab === 'entrance' && (
                <div className="grid grid-cols-2 gap-2">
                  {entrancePresets.map((item) => {
                    const active = style.motion.entranceType
                      ? style.motion.entranceType === item.motion.entranceType
                      : style.motion.in === item.motion.in;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        title={item.packName ? `From ${item.packName}` : undefined}
                        onClick={() => {
                          onStyleChange({
                            ...style,
                            motion: { ...style.motion, ...item.motion },
                          });
                          if (onNotification) onNotification(`Entrance: ${item.name}`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                            : 'bg-[#181817] border-white/10 hover:border-white/20 text-bone'
                        }`}
                      >
                        <span className="text-xs">{item.name}</span>
                        <span className="block text-[9px] leading-tight text-smoke mt-0.5">
                          {item.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {animSubTab === 'exit' && (
                <div className="grid grid-cols-2 gap-2">
                  {exitPresets.map((item) => {
                    const active = style.motion.exitType
                      ? style.motion.exitType === item.motion.exitType
                      : style.motion.out === item.motion.out;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        title={item.packName ? `From ${item.packName}` : undefined}
                        onClick={() => {
                          onStyleChange({
                            ...style,
                            motion: { ...style.motion, ...item.motion },
                          });
                          if (onNotification) onNotification(`Exit: ${item.name}`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                            : 'bg-[#181817] border-white/10 hover:border-white/20 text-bone'
                        }`}
                      >
                        <span className="text-xs">{item.name}</span>
                        <span className="block text-[9px] leading-tight text-smoke mt-0.5">
                          {item.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {animSubTab === 'highlight' && (
                <div className="grid grid-cols-2 gap-2">
                  {highlightPresets.map((item) => {
                    const active =
                      style.highlight.mode === item.highlight.mode &&
                      (item.highlight.emphasisType
                        ? style.highlight.emphasisType === item.highlight.emphasisType
                        : true);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        title={item.packName ? `From ${item.packName}` : undefined}
                        onClick={() => {
                          onStyleChange({
                            ...style,
                            highlight: { ...style.highlight, ...item.highlight },
                          });
                          if (onNotification) onNotification(`Highlight: ${item.name}`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                            : 'bg-[#181817] border-white/10 hover:border-white/20 text-bone'
                        }`}
                      >
                        <span className="text-xs">{item.name}</span>
                        <span className="block text-[9px] leading-tight text-smoke mt-0.5">
                          {item.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 6: YOURS / BRAND KIT
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'brand' && (
            <LibraryBrandTab
              brandColors={brandColors}
              setBrandColors={setBrandColors}
              customFonts={customFonts}
              setCustomFonts={setCustomFonts}
              setUserPresetsList={setUserPresetsList}
              onNotification={onNotification}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 7: CAPTIONS LIST
          ────────────────────────────────────────────────────────────── */}
          {activeTabKey === 'captions' && (
            <div className="space-y-3">
              {/* Quick Jump to Movie Style Text Templates */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400/15 via-amber-400/5 to-transparent border border-amber-400/30 flex items-center justify-between gap-2 shadow-xs">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-bone flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Movie Style Text Templates</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                      20 styles
                    </span>
                  </div>
                  <div className="text-[10px] text-smoke truncate">
                    Apply Blockbuster, Noir, Sci-Fi or Gold typography to captions
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTabChange('movieStyles')}
                  className="px-2.5 py-1 rounded bg-amber-400 text-black text-[10px] font-bold hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
                >
                  Browse Movie Styles
                </button>
              </div>

              {/* Captions List */}
              <div className="space-y-1.5">
                {segments.map((seg) => {
                  const isSelected = seg.id === (selectedId ?? activeId);
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
                        isSelected
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-smoke">
                            {(seg.end - seg.start).toFixed(2)}s
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = segments
                                .filter((s) => s.id !== seg.id)
                                .map((s, i) => ({ ...s, index: i + 1 }));
                              onSegmentsChange(updated);
                            }}
                            aria-label={`Delete caption ${seg.index}`}
                            title="Delete segment"
                            className="p-1 rounded hover:bg-white/10 text-smoke hover:text-crimson-2 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        aria-label={`Caption segment ${seg.index + 1}`}
                        value={seg.text}
                        onChange={(e) => {
                          const updated = segments.map((s) =>
                            s.id === seg.id ? { ...s, text: e.target.value } : s,
                          );
                          onSegmentsChange(updated);
                        }}
                        onFocus={() => {
                          onSelectSegment(seg.id);
                          onSeek(seg.start);
                        }}
                        rows={2}
                        className="w-full bg-transparent text-bone text-xs leading-relaxed resize-none focus:outline-none rounded hover:bg-white/5 focus:bg-white/5 p-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSegment(seg.id);
                          onSeek(seg.start);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(LibraryPanel);
