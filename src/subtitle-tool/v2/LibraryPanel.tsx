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
  Share2,
  Zap,
  Crosshair,
} from 'lucide-react';

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

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
  | 'callouts'
  | 'youtubeGraphics'
  | 'socialGraphics'
  | 'mogrtAnimations'
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
    badge: '4',
    title: 'Add Text Overlays',
    description: 'Insert single text layers & headlines at playhead',
  },
  {
    id: 'callouts',
    label: 'Call-outs',
    icon: Crosshair,
    badge: '8',
    title: 'Bold Call-Out Graphics',
    description:
      '8 directional & tech pointer callouts (Box, Reticle HUD, Brackets, Minimal Target)',
  },
  {
    id: 'youtubeGraphics',
    label: 'YouTube Pack',
    icon: YouTubeIcon,
    badge: '8',
    title: 'YouTube Creator Elements',
    description:
      '8 authentic YouTube button models (Pill, Minimal, Like & Bell Bar, Channel Card, Gold, Neon, End Screen)',
  },
  {
    id: 'socialGraphics',
    label: 'Social handles',
    icon: Share2,
    badge: '18',
    title: 'Social Media Lower Thirds 2.0',
    description: '18 platform handle cards with animated sliding mask wipe',
  },
  {
    id: 'mogrtAnimations',
    label: 'MOGRT titles',
    icon: Sparkles,
    badge: '5',
    title: 'MOGRT Motion Titles',
    description:
      'Authentic After Effects motion titles (Spin & Twist, Mirror Splash, RGB Glitch, Cyber Strobe, Kinetic Wipe)',
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
    activeTabKey === 'addText' ||
    activeTabKey === 'callouts' ||
    activeTabKey === 'youtubeGraphics' ||
    activeTabKey === 'socialGraphics' ||
    activeTabKey === 'mogrtAnimations' ||
    activeTabKey === 'effects' ||
    activeTabKey === 'brand';
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

  // Helper to add locked MOGRT text & YouTube graphics animations
  const handleAddMogrtText = (
    templateId: string,
    defaultName: string,
    defaultRole: string,
    extra?: string,
  ) => {
    if (onAddLowerThird) {
      const curTime = currentTime || 0;
      let newLt: LowerThirdSpec;

      if (templateId === 'mogrt-spin-twist') {
        newLt = {
          ...DEFAULT_LOWER_THIRD,
          id: 'mogrt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          templateId,
          name: defaultName,
          role: defaultRole,
          position: { x: 0.5, y: 0.5, align: 'center' },
          font: { family: 'asap', weight: 800, size: 0.045 },
          scale: 1,
          colors: {
            primary: '#FFFFFF',
            secondary: '#FFFFFF',
            textPrimary: '#FFFFFF',
            textSecondary: '#FFFFFF',
          },
          variant: 6,
          start: curTime,
          end: curTime + 5.5,
          introDuration: 1.4,
          outroDuration: 1.0,
        };
      } else if (templateId === 'mogrt-mirror-splash') {
        newLt = {
          ...DEFAULT_LOWER_THIRD,
          id: 'mogrt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          templateId,
          name: defaultName,
          role: defaultRole,
          position: { x: 0.5, y: 0.5, align: 'center' },
          font: { family: 'sniglet', weight: 800, size: 0.045 },
          scale: 1,
          colors: {
            primary: '#A7F7FF',
            secondary: '#FFFA6F',
            textPrimary: '#A7F7FF',
            textSecondary: '#FFFA6F',
          },
          variant: 2,
          start: curTime,
          end: curTime + 4.5,
          introDuration: 0.8,
          outroDuration: 0.7,
        };
      } else if (templateId.startsWith('mogrt-youtube')) {
        let duration = 4.2;
        let yPos = 0.82;
        if (templateId === 'mogrt-youtube-minimal') duration = 3.6;
        else if (templateId === 'mogrt-youtube-channel-card') {
          duration = 4.8;
          yPos = 0.8;
        } else if (templateId === 'mogrt-youtube-end-screen') {
          duration = 5.0;
          yPos = 0.65;
        }

        newLt = {
          ...DEFAULT_LOWER_THIRD,
          id: 'mogrt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          templateId,
          name: defaultName,
          role: defaultRole,
          position: { x: 0.5, y: yPos, align: 'center' },
          font: { family: 'inter', weight: 800, size: 0.038 },
          scale: 1,
          colors: {
            primary: '#FF0000',
            secondary: '#FFFFFF',
            textPrimary: '#FFFFFF',
            textSecondary: '#AAAAAA',
          },
          variant: 2,
          start: curTime,
          end: curTime + duration,
          introDuration: 0.6,
          outroDuration: 0.6,
        };
      } else if (templateId.startsWith('mogrt-social')) {
        newLt = {
          ...DEFAULT_LOWER_THIRD,
          id: 'mogrt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          templateId,
          name: defaultName,
          role: defaultRole,
          extra: extra || 'instagram',
          position: { x: 0.5, y: 0.85, align: 'center' },
          font: { family: 'inter', weight: 700, size: 0.035 },
          scale: 1,
          colors: {
            primary: '#E1306C',
            secondary: '#FFFFFF',
            textPrimary: '#FFFFFF',
            textSecondary: '#E2E8F0',
          },
          variant: 2,
          start: curTime,
          end: curTime + 3.8,
          introDuration: 0.6,
          outroDuration: 0.5,
        };
      } else if (templateId.startsWith('mogrt-callout') || templateId === 'mogrt-bold-callout') {
        newLt = {
          ...DEFAULT_LOWER_THIRD,
          id: 'mogrt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          templateId,
          name: defaultName,
          role: defaultRole,
          position: { x: 0.55, y: 0.45, align: 'center' },
          font: { family: 'montserrat', weight: 800, size: 0.036 },
          scale: 1,
          colors: {
            primary: '#F59E0B',
            secondary: '#FFFFFF',
            textPrimary: '#FFFFFF',
            textSecondary: '#94A3B8',
          },
          variant: 2,
          start: curTime,
          end: curTime + 4.2,
          introDuration: 0.8,
          outroDuration: 0.6,
        };
      } else {
        // mogrt-rgb-glitch, mogrt-rgb-cyber-02, mogrt-trendy-minimal-03
        newLt = {
          ...DEFAULT_LOWER_THIRD,
          id: 'mogrt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          templateId,
          name: defaultName,
          role: defaultRole,
          position: { x: 0.5, y: 0.5, align: 'center' },
          font: { family: 'montserrat', weight: 900, size: 0.052 },
          scale: 1,
          colors: {
            primary: '#FF0055',
            secondary: '#00F0FF',
            textPrimary: '#FFFFFF',
            textSecondary: '#FFFFFF',
          },
          variant: 2,
          start: curTime,
          end: curTime + 3.6,
          introDuration: 0.5,
          outroDuration: 0.5,
        };
      }

      (newLt as any).isLockedMogrt = true;
      onAddLowerThird(newLt);
      if (onNotification) {
        onNotification(`Added text graphic at ${formatTimecode(curTime)}`);
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
                ? 'bg-white/10 text-amber-300 font-semibold shadow-xs'
                : 'text-[#8b8b8b] hover:text-white hover:bg-white/5 font-medium'
            }`}
            title="Captions (Timed speech segments & transcript editor)"
          >
            <Captions
              className={`w-3.5 h-3.5 ${isCaptionsActive ? 'text-amber-300' : 'text-smoke'}`}
            />
            <span>Captions</span>
            {isCaptionsActive && (
              <span className="absolute -bottom-[9px] left-1.5 right-1.5 h-[2px] bg-amber-400 rounded-full" />
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
                ? 'bg-white/10 text-amber-300 font-semibold shadow-xs'
                : 'text-[#8b8b8b] hover:text-white hover:bg-white/5 font-medium'
            }`}
            title="Templates (Movie styles, Title cards, Lower thirds, Subtitle styles)"
          >
            <LayoutGrid
              className={`w-3.5 h-3.5 ${isTemplatesActive ? 'text-amber-300' : 'text-smoke'}`}
            />
            <span>Templates</span>
            {isTemplatesActive && (
              <span className="absolute -bottom-[9px] left-1.5 right-1.5 h-[2px] bg-amber-400 rounded-full" />
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
                ? 'bg-white/10 text-amber-300 font-semibold shadow-xs'
                : 'text-[#8b8b8b] hover:text-white hover:bg-white/5 font-medium'
            }`}
            title="Text (Add text overlays, Text effects, Brand / Yours)"
          >
            <Type className={`w-3.5 h-3.5 ${isTextActive ? 'text-amber-300' : 'text-smoke'}`} />
            <span>Text</span>
            {isTextActive && (
              <span className="absolute -bottom-[9px] left-1.5 right-1.5 h-[2px] bg-amber-400 rounded-full" />
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
                          isActive ? 'text-amber-400' : 'text-smoke group-hover:text-bone'
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
                            ? 'bg-amber-400/20 text-amber-300 font-bold'
                            : 'bg-white/5 text-mist group-hover:text-smoke'
                        }`}
                      >
                        {sub.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-amber-400 rounded-r-full" />
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

                {/* Category Quick Nav Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onTabChange('youtubeGraphics')}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-red-950/40 to-[#181817] border border-red-500/30 hover:border-red-500 text-left transition-all hover:scale-102 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                        <YouTubeIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-bone group-hover:text-red-300">
                          YouTube &amp; Social
                        </div>
                        <div className="text-[9px] text-smoke">Subscribe &amp; Handles</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-red-400 font-bold">5 &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTabChange('mogrtAnimations')}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-amber-950/40 to-[#181817] border border-amber-400/30 hover:border-amber-400 text-left transition-all hover:scale-102 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-bone group-hover:text-amber-300">
                          MOGRT Titles
                        </div>
                        <div className="text-[9px] text-smoke">AE Motion Models</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-amber-400 font-bold">4 &rarr;</span>
                  </button>
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
                      className="group p-3 rounded-xl bg-[#181817] border border-purple-400 hover:bg-[#201a24] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
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
                      className="group p-3.5 rounded-xl bg-[#181817] border border-white/10 hover:border-amber-400 hover:bg-[#1e1e1d] flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/30 group-hover:bg-amber-400/20 group-hover:border-amber-400 flex items-center justify-center transition-colors">
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
              SUB-SECTION: BOLD CALL-OUT GRAPHICS (8 STYLES)
          ────────────────────────────────────────────────────────────── */}
            {activeTabKey === 'callouts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-bone">
                        Bold Call-Out Graphics
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-amber-400/15 border-amber-400/30 text-amber-300">
                        8 STYLES
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-white/10 border-white/20 text-smoke">
                        DEFAULT MODEL
                      </span>
                    </div>
                    <p className="text-[11px] text-smoke mt-0.5">
                      Precision target anchors, animated leader lines &amp; info cards (from Bold
                      Call-Outs MOGRTs).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. Right Box Callout */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-right-box',
                        'PRODUCT FEATURE',
                        'Key detail highlighted here',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-amber-400/30 hover:border-amber-400 hover:bg-[#201d16] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/40 group-hover:bg-amber-400/25 group-hover:border-amber-400 flex items-center justify-center transition-colors">
                      <Crosshair className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                      Right Box Callout
                    </span>
                    <span className="text-[9.5px] text-smoke">Bottom-Left Anchor · Amber Bar</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">
                      Style 01
                    </span>
                  </button>

                  {/* 2. Left Box Callout */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-left-box',
                        'SPECIFICATION',
                        'Technical parameter note',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-cyan-400/30 hover:border-cyan-400 hover:bg-[#152023] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-cyan-400/15 border border-cyan-400/40 group-hover:bg-cyan-400/25 group-hover:border-cyan-400 flex items-center justify-center transition-colors">
                      <Crosshair className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-cyan-300">
                      Left Box Callout
                    </span>
                    <span className="text-[9.5px] text-smoke">Bottom-Right Anchor · Cyan Bar</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300">
                      Style 02
                    </span>
                  </button>

                  {/* 3. Top Pointer Callout */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-top-pointer',
                        'HEADER CALLOUT',
                        'Direct vertical leader up',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-lime-400/30 hover:border-lime-400 hover:bg-[#182216] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-lime-400/15 border border-lime-400/40 group-hover:bg-lime-400/25 group-hover:border-lime-400 flex items-center justify-center transition-colors">
                      <Crosshair className="w-4 h-4 text-lime-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-lime-300">
                      Top Pointer Callout
                    </span>
                    <span className="text-[9.5px] text-smoke">Vertical Down · Lime Accent</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-300">
                      Style 03
                    </span>
                  </button>

                  {/* 4. Bottom Pointer Callout */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-bottom-pointer',
                        'BOTTOM ANCHOR',
                        'Direct vertical leader down',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-orange-400/30 hover:border-orange-400 hover:bg-[#221a16] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-orange-400/15 border border-orange-400/40 group-hover:bg-orange-400/25 group-hover:border-orange-400 flex items-center justify-center transition-colors">
                      <Crosshair className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-orange-300">
                      Bottom Pointer Callout
                    </span>
                    <span className="text-[9.5px] text-smoke">Vertical Up · Orange Accent</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-300">
                      Style 04
                    </span>
                  </button>

                  {/* 5. HUD Tech Reticle */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-reticle-hud',
                        'TARGET IDENTIFIED',
                        'Telemetry lock • 37.77° N',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-red-500/30 hover:border-red-500 hover:bg-[#221516] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/40 group-hover:bg-red-500/25 group-hover:border-red-500 flex items-center justify-center transition-colors">
                      <Crosshair className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-red-300">
                      HUD Tech Reticle
                    </span>
                    <span className="text-[9.5px] text-smoke">Rotating Crosshair · Telemetry</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">
                      Style 05 · Cyber
                    </span>
                  </button>

                  {/* 6. Corner Brackets */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-bracket-card',
                        'METRIC VALUE',
                        'Precision corner bracket frame',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-sky-400/30 hover:border-sky-400 hover:bg-[#161d22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-400/15 border border-sky-400/40 group-hover:bg-sky-400/25 group-hover:border-sky-400 flex items-center justify-center transition-colors">
                      <span className="text-sm font-mono font-bold text-sky-400 tracking-tighter">
                        [ ]
                      </span>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-sky-300">
                      Corner Brackets
                    </span>
                    <span className="text-[9.5px] text-smoke">Framing Corners · Target Dot</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-sky-400/10 text-sky-300">
                      Style 06
                    </span>
                  </button>

                  {/* 7. Minimal Target Ring */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-minimal-target',
                        'MINIMAL POINTER',
                        'Clean architectural callout',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-white/20 hover:border-white hover:bg-[#202020] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/25 group-hover:bg-white/20 group-hover:border-white flex items-center justify-center transition-colors">
                      <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-white">
                      Minimal Target Ring
                    </span>
                    <span className="text-[9.5px] text-smoke">
                      Concentric Rings · Floating Text
                    </span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-bone">
                      Style 07
                    </span>
                  </button>

                  {/* 8. Solid Badge Capsule */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-callout-solid-badge',
                        'POPULAR CHOICE',
                        'Highlight badge',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-amber-500/30 hover:border-amber-500 hover:bg-[#221c15] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/40 group-hover:bg-amber-500/25 group-hover:border-amber-500 flex items-center justify-center transition-colors">
                      <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                      Solid Badge Capsule
                    </span>
                    <span className="text-[9.5px] text-smoke">Vibrant Pill · Pointer Needle</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">
                      Style 08
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION: YOUTUBE PACK GRAPHICS (8 MODELS)
          ────────────────────────────────────────────────────────────── */}
            {activeTabKey === 'youtubeGraphics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-bone">
                        YouTube Creator Elements
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-red-500/15 border-red-500/30 text-red-300">
                        8 MODELS
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-white/10 border-white/20 text-smoke">
                        DEFAULT MODEL
                      </span>
                    </div>
                    <p className="text-[11px] text-smoke mt-0.5">
                      Recreated from YouTube Pack (82 button styles) with authentic transitions
                      &amp; bell chimes.
                    </p>
                  </div>
                </div>

                {/* Hero Feature: Model 01 - YouTube Subscribe Creator Pill */}
                <div className="p-3.5 rounded-xl bg-[#181817] border border-red-500/30 hover:border-red-500/60 transition-all flex flex-col gap-3">
                  <div className="p-3 rounded-lg bg-[#0e0e0d] border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center shrink-0 shadow-md">
                        <YouTubeIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white tracking-tight truncate">
                          CHANNEL NAME
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">1.2M SUBSCRIBERS</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-[10px] tracking-wide">
                        SUBSCRIBE
                      </div>
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[10.5px] text-smoke">
                      Model 01: Creator Pill · Clicks from{' '}
                      <span className="text-red-400 font-semibold">SUBSCRIBE</span> to{' '}
                      <span className="text-zinc-300 font-semibold">SUBSCRIBED</span> + bell
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddMogrtText(
                          'mogrt-youtube-subscribe',
                          'CHANNEL NAME',
                          '1.2M SUBSCRIBERS',
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Creator Pill</span>
                    </button>
                  </div>
                </div>

                {/* Additional 7 YouTube Models Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Model 02: Minimal Red Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-youtube-minimal', 'SUBSCRIBE', 'CHANNEL')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-red-500/30 hover:border-red-500 hover:bg-[#221515] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
                      <YouTubeIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-red-300">
                      Minimal Red Button
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">▶ SUBSCRIBE Pill Pop</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">
                      Model 02
                    </span>
                  </button>

                  {/* Model 03: 3-in-1 Engagement Bar */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-youtube-like-bell', 'EPIC HERTZ', 'JOIN US')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-sky-400/30 hover:border-sky-400 hover:bg-[#151c22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-sm">
                      <span className="text-sm font-bold">👍</span>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-sky-300">
                      Like &amp; Bell Bar
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">
                      Like + Subscribe + Bell
                    </span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-sky-400/10 text-sky-300">
                      Model 03
                    </span>
                  </button>

                  {/* Model 04: Channel Profile Card */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-youtube-channel-card',
                        'CREATOR NAME',
                        '1.2M subscribers',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-white/10 hover:border-white/40 hover:bg-[#1d1d1c] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-sm">
                      <span className="text-xs font-bold">CARD</span>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-white">
                      Channel Profile Card
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">
                      Banner + Avatar + ✓ Badge
                    </span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-bone">
                      Model 04
                    </span>
                  </button>

                  {/* Model 05: Gold Metallic Subscribe */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-youtube-gold', 'VIP CHANNEL', 'Premium Member')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-amber-400/30 hover:border-amber-400 hover:bg-[#201d16] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-xs shadow-sm">
                      ★
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                      Gold Metallic Subscribe
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Luxury Gold Gradient</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">
                      Model 05
                    </span>
                  </button>

                  {/* Model 06: Cyber Neon Red */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-youtube-neon', 'CYBER CHANNEL', 'TECH UPLOAD')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-pink-500/30 hover:border-pink-500 hover:bg-[#22151c] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-lg bg-pink-500/20 border border-pink-500 flex items-center justify-center text-pink-400 shadow-sm">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-pink-300">
                      Cyber Neon Red
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">
                      Neon Glow · Tech Corners
                    </span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300">
                      Model 06
                    </span>
                  </button>

                  {/* Model 07: End Screen Round CTA */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-youtube-end-screen', 'CHANNEL NAME', 'SUBSCRIBE')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-red-500/30 hover:border-red-500 hover:bg-[#221515] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-sm">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-red-300">
                      End Screen Round CTA
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Circular Radar Waves</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">
                      Model 07
                    </span>
                  </button>

                  {/* Model 08: Bell Notification Ring */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-youtube-bell-ring',
                        'NOTIFICATIONS ON',
                        'Never miss an upload',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-amber-300/30 hover:border-amber-300 hover:bg-[#201d16] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center col-span-2"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                      Bell Notification Ring
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">
                      Swinging Golden Bell · Chime Soundwaves
                    </span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">
                      Model 08
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION: SOCIAL MEDIA LOWER THIRDS 2.0 (18 PLATFORMS)
          ────────────────────────────────────────────────────────────── */}
            {activeTabKey === 'socialGraphics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-bone">
                        Social Media Lower Thirds 2.0
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-pink-500/15 border-pink-500/30 text-pink-300">
                        18 PLATFORMS
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-white/10 border-white/20 text-smoke">
                        DEFAULT MODEL
                      </span>
                    </div>
                    <p className="text-[11px] text-smoke mt-0.5">
                      Smooth sliding mask wipe with authentic verified badge &amp; branding colors.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        '@username',
                        'FOLLOW ON INSTAGRAM',
                        'instagram',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-pink-500/30 hover:border-pink-500 hover:bg-[#20151c] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-pink-300">
                      Instagram Handle
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">@username · Follow</span>
                  </button>

                  {/* YouTube */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        '@channel',
                        'SUBSCRIBE ON YOUTUBE',
                        'youtube',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-red-500/30 hover:border-red-500 hover:bg-[#221515] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
                      <YouTubeIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-red-300">
                      YouTube Handle
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">@channel · Subscribe</span>
                  </button>

                  {/* X / Twitter */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        '@username',
                        'FOLLOW ON X',
                        'twitter',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-sky-500/30 hover:border-sky-500 hover:bg-[#151c22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-sm">
                      <span className="font-black text-xs">𝕏</span>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-sky-300">
                      X / Twitter
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">@handle · Follow</span>
                  </button>

                  {/* TikTok */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        '@username',
                        'FOLLOW ON TIKTOK',
                        'tiktok',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-cyan-500/30 hover:border-cyan-500 hover:bg-[#152020] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-sm">
                      <span className="font-bold text-xs">♪</span>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-cyan-300">
                      TikTok Handle
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">@username · Follow</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        '+1 (555) 0192',
                        'CHAT ON WHATSAPP',
                        'whatsapp',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-emerald-500/30 hover:border-emerald-500 hover:bg-[#152018] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                      💬
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-emerald-300">
                      WhatsApp
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">+phone · Message</span>
                  </button>

                  {/* Telegram */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        '@telegram_channel',
                        'JOIN TELEGRAM',
                        'telegram',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-sky-400/30 hover:border-sky-400 hover:bg-[#151d22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                      ✈
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-sky-300">
                      Telegram
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">@channel · Join</span>
                  </button>

                  {/* Discord */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'discord.gg/community',
                        'JOIN OUR DISCORD',
                        'discord',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-indigo-500/30 hover:border-indigo-500 hover:bg-[#181622] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                      🎮
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-indigo-300">
                      Discord
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Invite · Community</span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'facebook.com/page',
                        'FOLLOW ON FACEBOOK',
                        'facebook',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-blue-500/30 hover:border-blue-500 hover:bg-[#151922] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-black text-sm">
                      f
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-blue-300">
                      Facebook
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Page · Follow</span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'linkedin.com/in/user',
                        'CONNECT ON LINKEDIN',
                        'linkedin',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-blue-600/30 hover:border-blue-600 hover:bg-[#151a22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shadow-sm font-black text-xs">
                      in
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-blue-300">
                      LinkedIn
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Profile · Connect</span>
                  </button>

                  {/* Spotify */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'Artist Profile',
                        'LISTEN ON SPOTIFY',
                        'spotify',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-green-500/30 hover:border-green-500 hover:bg-[#152119] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1DB954] flex items-center justify-center text-black shadow-sm font-black text-xs">
                      ♫
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-green-300">
                      Spotify
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Music · Listen</span>
                  </button>

                  {/* Twitch */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'twitch.tv/streamer',
                        'WATCH LIVE ON TWITCH',
                        'twitch',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-purple-500/30 hover:border-purple-500 hover:bg-[#1d1522] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#9146FF] flex items-center justify-center text-white shadow-sm font-black text-xs">
                      👾
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-purple-300">
                      Twitch
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Live · Stream</span>
                  </button>

                  {/* Snapchat */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        '@snapchat_user',
                        'ADD ON SNAPCHAT',
                        'snapchat',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-yellow-400/30 hover:border-yellow-400 hover:bg-[#201f15] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FFFC00] flex items-center justify-center text-black shadow-sm font-black text-xs">
                      👻
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-yellow-300">
                      Snapchat
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Snap · Add</span>
                  </button>

                  {/* Pinterest */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'pinterest.com/boards',
                        'FOLLOW ON PINTEREST',
                        'pinterest',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-red-600/30 hover:border-red-600 hover:bg-[#221515] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#BD081C] flex items-center justify-center text-white shadow-sm font-black text-xs">
                      P
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-red-300">
                      Pinterest
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Boards · Pin</span>
                  </button>

                  {/* Behance */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'behance.net/portfolio',
                        'VIEW ON BEHANCE',
                        'behance',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-blue-500/30 hover:border-blue-500 hover:bg-[#151922] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1769FF] flex items-center justify-center text-white shadow-sm font-bold text-xs">
                      Bē
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-blue-300">
                      Behance
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Portfolio · View</span>
                  </button>

                  {/* Dribbble */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'dribbble.com/designer',
                        'FOLLOW ON DRIBBBLE',
                        'dribbble',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-pink-400/30 hover:border-pink-400 hover:bg-[#20151a] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#EA4C89] flex items-center justify-center text-white shadow-sm font-bold text-xs">
                      🏀
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-pink-300">
                      Dribbble
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Shots · Follow</span>
                  </button>

                  {/* Vimeo */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'vimeo.com/channel',
                        'WATCH ON VIMEO',
                        'vimeo',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-sky-400/30 hover:border-sky-400 hover:bg-[#151c22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1AB7EA] flex items-center justify-center text-white shadow-sm font-black text-xs">
                      v
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-sky-300">
                      Vimeo
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Films · Watch</span>
                  </button>

                  {/* GitHub */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'github.com/developer',
                        'STAR ON GITHUB',
                        'github',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-white/20 hover:border-white hover:bg-[#202020] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/20 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                      🐙
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-white">
                      GitHub
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Code · Star</span>
                  </button>

                  {/* Website / URL */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-social-handle',
                        'www.domain.com',
                        'VISIT WEBSITE',
                        'website',
                      )
                    }
                    className="group p-3 rounded-xl bg-[#181817] border border-teal-500/30 hover:border-teal-500 hover:bg-[#15201d] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                      🌐
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-teal-300">
                      Website URL
                    </span>
                    <span className="text-[9.5px] text-smoke font-mono">Domain · Visit</span>
                  </button>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
              SUB-SECTION: MOGRT TEXT ANIMATIONS (LOCKED MODELS)
          ────────────────────────────────────────────────────────────── */}
            {activeTabKey === 'mogrtAnimations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-bone">MOGRT Text Animations</span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-amber-400/15 border-amber-400/30 text-amber-300">
                        5 STYLES
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border bg-red-400/15 border-red-400/30 text-red-300">
                        NON-CUSTOMIZABLE
                      </span>
                    </div>
                    <p className="text-[11px] text-smoke mt-0.5">
                      Authentic After Effects motion titles recreated with exact vector &amp; liquid
                      physics.
                    </p>
                  </div>
                </div>

                {/* Locked Banner */}
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div className="text-[11px] leading-relaxed text-amber-200/90">
                    <span className="font-semibold text-amber-300">Authentic MOGRT Models:</span>{' '}
                    Animations, liquid splash collisions, and typography are locked to ensure 100%
                    fidelity to the original AE project. Text lines and timings can be customized in
                    the inspector.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. Spin & Twist (Mixkit 222) */}
                  <button
                    type="button"
                    onClick={() => handleAddMogrtText('mogrt-spin-twist', 'MOTION', 'DESIGN')}
                    className="group p-3.5 rounded-xl bg-[#181817] border border-amber-400/30 hover:border-amber-400 hover:bg-[#201d16] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/40 group-hover:bg-amber-400/25 group-hover:border-amber-400 flex items-center justify-center transition-colors">
                      <span className="text-sm font-mono font-bold text-amber-400 tracking-tighter">
                        [ ]
                      </span>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-amber-300">
                      Spin &amp; Twist
                    </span>
                    <span className="text-[9.5px] text-smoke">MOGRT 222 · Brackets</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">
                      5.5s duration
                    </span>
                  </button>

                  {/* 2. Mirror Splash (Mixkit 28) */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-mirror-splash', 'TYPE YOUR', 'TEXT HERE')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-sky-400/30 hover:border-sky-400 hover:bg-[#161d22] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-400/15 border border-sky-400/40 group-hover:bg-sky-400/25 group-hover:border-sky-400 flex items-center justify-center transition-colors">
                      <Sparkles className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-sky-300">
                      Mirror Splash
                    </span>
                    <span className="text-[9.5px] text-smoke">MOGRT 28 · Watercolor</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-sky-400/10 text-sky-300">
                      4.5s duration
                    </span>
                  </button>

                  {/* 3. RGB Glitch Title 01 */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-rgb-glitch', 'FUTURE VISION', 'TRENDY RGB TITLE')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-cyan-400/30 hover:border-cyan-400 hover:bg-[#152023] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-cyan-400/15 border border-cyan-400/40 group-hover:bg-cyan-400/25 group-hover:border-cyan-400 flex items-center justify-center transition-colors">
                      <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-cyan-300">
                      RGB Glitch 01
                    </span>
                    <span className="text-[9.5px] text-smoke">Trendy Titles · Chromatic</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300">
                      3.6s duration
                    </span>
                  </button>

                  {/* 4. Cyber Strobe 02 */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText('mogrt-rgb-cyber-02', 'CYBER STROBE', 'NEON FLASH INTRO')
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-yellow-400/30 hover:border-yellow-400 hover:bg-[#201f16] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-lg bg-yellow-400/15 border border-yellow-400/40 group-hover:bg-yellow-400/25 group-hover:border-yellow-400 flex items-center justify-center transition-colors">
                      <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-yellow-300">
                      Cyber Strobe 02
                    </span>
                    <span className="text-[9.5px] text-smoke">Trendy Titles · Neon Flash</span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-300">
                      3.6s duration
                    </span>
                  </button>

                  {/* 5. Minimal Kinetic Wipe 03 */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAddMogrtText(
                        'mogrt-trendy-minimal-03',
                        'KINETIC WIPE',
                        'CLEAN MODERN MOTION',
                      )
                    }
                    className="group p-3.5 rounded-xl bg-[#181817] border border-white/20 hover:border-white hover:bg-[#202020] flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm text-center relative overflow-hidden col-span-2"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/25 group-hover:bg-white/20 group-hover:border-white flex items-center justify-center transition-colors">
                      <span className="text-xs font-mono font-bold text-white">—</span>
                    </div>
                    <span className="text-xs font-bold text-bone group-hover:text-white">
                      Minimal Kinetic Wipe 03
                    </span>
                    <span className="text-[9.5px] text-smoke">
                      Trendy Titles · Clean Line Reveal
                    </span>
                    <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-bone">
                      3.6s duration
                    </span>
                  </button>
                </div>
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
