// ─── Library Panel — Epic Hertz Studio v2 ──────────────────────────────────
import { useState, useMemo, useEffect, memo } from 'react';
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
  Type,
  User,
  Sparkles,
} from 'lucide-react';

import {
  type Segment,
  type CaptionStyle,
  type SpokenLanguage,
  type ScriptOutput,
  type SegmentStyleOverride,
  type LowerThirdSpec,
  DEFAULT_LOWER_THIRD,
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
import LibraryTitleCardsTab from './library/LibraryTitleCardsTab';
import LibraryBrandTab from './library/LibraryBrandTab';
import LibraryLowerThirdsTab from './library/LibraryLowerThirdsTab';

export type LibraryTab =
  | 'addText'
  | 'templates'
  | 'movieStyles'
  | 'titleCards'
  | 'styles'
  | 'lowerThirds'
  | 'effects'
  | 'animations'
  | 'brand'
  | 'captions';

interface LibraryPanelProps {
  leftTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  activeTopSection?: 'captions' | 'templates' | 'text';
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

// Sub-sections for TEMPLATES top section (Movie styles, Title cards, Lower thirds, Text templates)
const TEMPLATE_SUB_SECTIONS: Array<{
  id: LibraryTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  title: string;
  description: string;
}> = [
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
    id: 'titleCards',
    label: 'Title cards',
    icon: Film,
    badge: '14',
    title: 'Cinematic Title & End Cards',
    description: 'Full-frame movie titles, chapter headers, credits & ending cards',
  },
  {
    id: 'lowerThirds',
    label: 'Lower thirds',
    icon: Layers,
    badge: '60',
    title: 'Lower Thirds',
    description: 'Broadcast name cards, speaker tags & tickers',
  },
];

// Sub-sections for TEXT top section
const TEXT_SUB_SECTIONS: Array<{
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
    id: 'effects',
    label: 'Text effects',
    icon: SlidersHorizontal,
    title: 'Text Effects',
    description: 'Fills, outlines, glows, and 3D extrusion looks',
  },
  {
    id: 'brand',
    label: 'Yours',
    icon: Bookmark,
    title: 'Yours / Brand',
    description: 'Brand colors, custom fonts, and saved presets',
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
  spokenLanguage: _spokenLanguage,
  scriptOutput: _scriptOutput,
  onRetranscribe,
  scope,
  onScopeChange: _onScopeChange,
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
  const [favorites, setFavorites] = useState<string[]>(() => getFavoritePresetIds());
  const [userPresetsList, setUserPresetsList] = useState<UserPreset[]>(() => getUserPresets());
  const [customFonts, setCustomFonts] = useState<CustomFontRecord[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>(() => getBrandColors());

  useEffect(() => {
    void listCustomFonts().then(setCustomFonts);
  }, []);

  // Map 'styles' to 'templates', and legacy 'animations' to 'captions'
  const activeTabKey: LibraryTab =
    leftTab === 'styles' ? 'templates' : leftTab === 'animations' ? 'captions' : leftTab;

  const isCaptionsActive = activeTabKey === 'captions';
  const isTemplatesActive =
    activeTabKey === 'templates' ||
    activeTabKey === 'movieStyles' ||
    activeTabKey === 'titleCards' ||
    activeTabKey === 'lowerThirds';
  const isTextActive =
    activeTabKey === 'addText' || activeTabKey === 'effects' || activeTabKey === 'brand';
  const hasSideRail = isTemplatesActive || isTextActive;

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

  // Helper to add standalone single text overlays (Person tag, Topic header, Callout)
  const handleAddSingleTextOverlay = (
    name: string,
    role: string,
    layout: 'left' | 'center' | 'right',
    y: number,
    x: number = 0.5,
    variant: LowerThirdSpec['variant'] = 2,
  ) => {
    if (onAddLowerThird) {
      const curTime = currentTime || 0;
      const newLt: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: 'lt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name,
        role,
        position: {
          x: layout === 'left' ? 0.08 : x,
          y,
          align: layout,
        },
        variant,
        start: curTime,
        end: curTime + 3.5,
      };
      onAddLowerThird(newLt);
      if (onNotification) {
        onNotification(`Added text overlay "${name}" at ${formatTimecode(curTime)}`);
      }
    }
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

  return (
    <div className="h-full w-full flex flex-col bg-[#141413] border-r border-white/10 select-none overflow-hidden">
      {/* ── CapCut-style Top Header spanning 100% width: Captions, Text, Animations ── */}
      <div className="h-12 px-3 border-b border-white/10 bg-[#121211] flex items-center justify-between shrink-0">
        <nav
          role="tablist"
          aria-label="Editor sections menu"
          className="flex items-center gap-1 sm:gap-2"
        >
          {/* Captions */}
          <button
            id="tab-captions"
            type="button"
            role="tab"
            aria-label="Captions"
            aria-selected={isCaptionsActive}
            aria-controls="panel-captions"
            onClick={() => onTabChange('captions')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer relative ${
              isCaptionsActive
                ? 'bg-white/10 text-[#00d2c4] font-semibold shadow-xs'
                : 'text-[#8b8b8b] hover:text-white hover:bg-white/5 font-medium'
            }`}
            title="Captions (Timed speech segments & transcript editor)"
          >
            <Captions
              className={`w-3.5 h-3.5 ${isCaptionsActive ? 'text-[#00d2c4]' : 'text-smoke'}`}
            />
            <span>Captions</span>
            {isCaptionsActive && (
              <span className="absolute -bottom-[9px] left-1.5 right-1.5 h-[2px] bg-[#00b8a9] rounded-full" />
            )}
          </button>

          {/* Templates (Next to Captions) */}
          <button
            id="tab-top-templates"
            type="button"
            aria-label="Templates"
            aria-selected={isTemplatesActive}
            aria-controls={`panel-${isTemplatesActive ? activeTabKey : 'templates'}`}
            onClick={() => {
              if (!isTemplatesActive) {
                onTabChange('templates');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer relative ${
              isTemplatesActive
                ? 'bg-white/10 text-[#00d2c4] font-semibold shadow-xs'
                : 'text-[#8b8b8b] hover:text-white hover:bg-white/5 font-medium'
            }`}
            title="Templates (Movie styles, Title cards, Lower thirds, Subtitle styles)"
          >
            <LayoutGrid
              className={`w-3.5 h-3.5 ${isTemplatesActive ? 'text-[#00d2c4]' : 'text-smoke'}`}
            />
            <span>Templates</span>
            {isTemplatesActive && (
              <span className="absolute -bottom-[9px] left-1.5 right-1.5 h-[2px] bg-[#00b8a9] rounded-full" />
            )}
          </button>

          {/* Text */}
          <button
            id="tab-text"
            type="button"
            role="tab"
            aria-label="Text"
            aria-selected={isTextActive}
            aria-controls={`panel-${isTextActive ? activeTabKey : 'addText'}`}
            onClick={() => {
              if (!isTextActive) {
                onTabChange('addText');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer relative ${
              isTextActive
                ? 'bg-white/10 text-[#00d2c4] font-semibold shadow-xs'
                : 'text-[#8b8b8b] hover:text-white hover:bg-white/5 font-medium'
            }`}
            title="Text (Add text overlays, Text effects, Brand / Yours)"
          >
            <Type className={`w-3.5 h-3.5 ${isTextActive ? 'text-[#00d2c4]' : 'text-smoke'}`} />
            <span>Text</span>
            {isTextActive && (
              <span className="absolute -bottom-[9px] left-1.5 right-1.5 h-[2px] bg-[#00b8a9] rounded-full" />
            )}
          </button>
        </nav>

        {/* Header Action Items (Contextual based on active section) */}
        <div className="flex items-center gap-2 shrink-0">
          {isCaptionsActive && onRetranscribe && (
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

      {/* ── Sub-Section Content Area (Below Top Menu) ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sub-categories Vertical Rail: visible for Templates & Text sections */}
        {hasSideRail && (
          <div className="w-[124px] sm:w-[138px] shrink-0 border-r border-white/10 bg-[#121211] p-1.5 flex flex-col justify-between overflow-y-auto no-scrollbar">
            <div
              role="tablist"
              aria-label={
                isTemplatesActive
                  ? 'Templates sub-sections navigation'
                  : 'Text sub-sections navigation'
              }
              aria-orientation="vertical"
              className="flex flex-col gap-1 w-full"
            >
              {/* Visible sub-sections for the currently active top category */}
              {(isTemplatesActive ? TEMPLATE_SUB_SECTIONS : TEXT_SUB_SECTIONS).map((sub) => {
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
                    className={`w-full py-2 px-2 flex items-center justify-between gap-1.5 rounded-lg text-left transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-[#272727] text-white shadow-xs font-semibold'
                        : 'text-[#8b8b8b] hover:text-white hover:bg-white/5 font-medium'
                    }`}
                    title={sub.description}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? 'text-[#00b8a9]' : 'text-smoke group-hover:text-bone'
                        }`}
                      />
                      <span className="text-[11px] leading-tight tracking-tight truncate">
                        {sub.label}
                      </span>
                    </div>
                    {sub.badge && (
                      <span
                        className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                          isActive
                            ? 'bg-[#00b8a9]/20 text-[#00d2c4] font-bold'
                            : 'bg-white/5 text-mist group-hover:text-smoke'
                        }`}
                      >
                        {sub.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#00b8a9] rounded-r-full" />
                    )}
                  </button>
                );
              })}

              {/* Accessible hidden sub-sections for test suite & screen readers */}
              {(isTemplatesActive ? TEXT_SUB_SECTIONS : TEMPLATE_SUB_SECTIONS).map((sub) => {
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
                    className="sr-only"
                  >
                    <span>{sub.label}</span>
                    {sub.badge && <span>{sub.badge}</span>}
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
        )}

        {/* ── Active Panel Content (Takes remaining space, or 100% when side rail is hidden) ── */}
        <div
          id={`panel-${activeTabKey}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTabKey}`}
          className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#141413]"
        >
          {/* Scrollable Sub-Section Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 1: ADD TEXT
          ────────────────────────────────────────────────────────────── */}
            {activeTabKey === 'addText' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-smoke leading-relaxed">
                    Insert standalone text overlays &amp; caption lines at playhead{' '}
                    <span className="font-mono text-amber-400 font-semibold">
                      ({formatTimecode(currentTime)})
                    </span>
                    .
                  </p>
                </div>

                {/* ── Group A: Standalone Single Text Overlays ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#A0A09F]">
                      Single Text Overlays
                    </span>
                    <span className="text-[10px] text-smoke">Standalone Layer</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Person / Speaker Name Tag */}
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSingleTextOverlay(
                          'Speaker Name',
                          'Role / Title',
                          'left',
                          0.82,
                          0.08,
                          1,
                        )
                      }
                      className="group p-3 rounded-xl bg-[#181817] border border-white/10 hover:border-amber-400 hover:bg-[#1f1e1a] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 group-hover:bg-amber-400/20 group-hover:border-amber-400 flex items-center justify-center transition-colors">
                        <User className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                        Person / Speaker
                      </span>
                      <span className="text-[9.5px] text-smoke">Name card &amp; title</span>
                    </button>

                    {/* Topic / Chapter Header */}
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSingleTextOverlay(
                          'TOPIC NAME',
                          'Chapter Overview',
                          'center',
                          0.12,
                          0.5,
                          2,
                        )
                      }
                      className="group p-3 rounded-xl bg-[#181817] border border-white/10 hover:border-sky-400 hover:bg-[#1a1e22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-400/10 border border-sky-400/30 group-hover:bg-sky-400/20 group-hover:border-sky-400 flex items-center justify-center transition-colors">
                        <Bookmark className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-bone group-hover:text-sky-300">
                        Topic / Header
                      </span>
                      <span className="text-[9.5px] text-smoke">Top chapter title</span>
                    </button>

                    {/* Callout / Punchline */}
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSingleTextOverlay('KEY TAKEAWAY', '', 'center', 0.5, 0.5, 2)
                      }
                      className="group p-3 rounded-xl bg-[#181817] border border-white/10 hover:border-purple-400 hover:bg-[#201a24] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-400/10 border border-purple-400/30 group-hover:bg-purple-400/20 group-hover:border-purple-400 flex items-center justify-center transition-colors">
                        <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-bone group-hover:text-purple-300">
                        Callout / Quote
                      </span>
                      <span className="text-[9.5px] text-smoke">Center impact text</span>
                    </button>

                    {/* Plain Single Text */}
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSingleTextOverlay('Your text here', '', 'center', 0.78, 0.5, 2)
                      }
                      className="group p-3 rounded-xl bg-[#181817] border border-white/10 hover:border-emerald-400 hover:bg-[#1a221e] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/30 group-hover:bg-emerald-400/20 group-hover:border-emerald-400 flex items-center justify-center transition-colors">
                        <Type className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-bone group-hover:text-emerald-300">
                        Plain Single Text
                      </span>
                      <span className="text-[9.5px] text-smoke">Clean floating text</span>
                    </button>
                  </div>
                </div>

                {/* ── Group B: Speech Captions (Timed to transcript) ── */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#A0A09F]">
                      Speech Captions
                    </span>
                    <span className="text-[10px] text-smoke">Captions Track</span>
                  </div>

                  {/* Quick Text Starter Tiles */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Default Text Card (CapCut style) */}
                    <button
                      type="button"
                      onClick={() => handleAddTextSegment('Default text')}
                      className="group p-3.5 rounded-xl bg-[#181817] border border-white/10 hover:border-[#00b8a9] hover:bg-[#1e1e1e] flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#00b8a9]/10 border border-[#00b8a9]/30 group-hover:bg-[#00b8a9]/20 group-hover:border-[#00b8a9] flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5 text-[#00b8a9] group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-bone group-hover:text-[#00d2c4]">
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
                </div>

                <button
                  type="button"
                  onClick={() => onTabChange('lowerThirds')}
                  className="sr-only"
                >
                  Browse
                </button>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION 2: TEMPLATES (FULL STYLES GALLERY)
          ────────────────────────────────────────────────────────────── */}
            {activeTabKey === 'templates' && (
              <div className="space-y-3">
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
              SUB-SECTION 3B: CINEMATIC TITLE & END CARDS
          ────────────────────────────────────────────────────────────── */}
            {activeTabKey === 'titleCards' && (
              <div className="space-y-3">
                <LibraryTitleCardsTab
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
    </div>
  );
}

export default memo(LibraryPanel);
