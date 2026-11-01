// ─── TemplateDrawer ──────────────────────────────────────────────────────────
// Right-hand visual preset gallery with motion templates and slide effects:
// - Physical text slide & movement transitions (Slide Up, Whip Left, Punch Zoom, Cascade, 3D Flip, etc.)
// - Unified single gallery — all motion templates in one place for easy selection
// - Fine-tuning controls: Typography, Size, Vibrant Swatches, Outline Stroke, and Background.

import { useState, memo } from 'react';
import {
  Sparkles,
  Zap,
  Tv,
  MoveRight,
  Highlighter,
  Layers,
  Film,
  Minus,
  Sliders,
  ArrowUp,
  Maximize2,
  ListOrdered,
  RotateCw,
} from 'lucide-react';
import type { SubtitleStyle, SubtitlePreset, SubtitlePosition, CaptionAnimationEffect } from './types';

interface TemplateDrawerProps {
  style: SubtitleStyle;
  onChange: (newStyle: SubtitleStyle) => void;
}

interface PresetItem {
  id: SubtitlePreset;
  title: string;
  badge?: string;
  motionLabel: string;
  previewTextColor: string;
  previewBg: string;
  previewOutline?: string;
  previewHighlight?: string;
  config: Partial<SubtitleStyle>;
}

export const PRESET_LIBRARY: PresetItem[] = [
  {
    id: 'slide-up-modern',
    title: 'Slide Up Mask',
    badge: 'REVEAL',
    motionLabel: 'Smooth upward mask reveal',
    previewTextColor: '#FFFFFF',
    previewBg: '#161a1d',
    previewHighlight: '#FFE600',
    config: {
      preset: 'slide-up-modern',
      animationEffect: 'slide-up',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      fontFamily: 'Montserrat, Inter, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FFE600',
      shadowEffect: true,
    },
  },
  {
    id: 'whip-left-bold',
    title: 'Whip Left Snap',
    badge: 'KINETIC',
    motionLabel: 'High-speed lateral snap',
    previewTextColor: '#FFFFFF',
    previewBg: '#191524',
    previewHighlight: '#00F0FF',
    config: {
      preset: 'whip-left-bold',
      animationEffect: 'slide-left',
      fontSize: 27,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      fontFamily: 'Montserrat, Inter, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#00F0FF',
      shadowEffect: true,
    },
  },
  {
    id: 'punch-zoom-action',
    title: 'Punch Zoom In',
    badge: 'ACTION',
    motionLabel: 'Impact punch scale zoom',
    previewTextColor: '#FFFFFF',
    previewBg: '#1f1315',
    previewHighlight: '#FF4500',
    config: {
      preset: 'punch-zoom-action',
      animationEffect: 'punch-zoom',
      fontSize: 28,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 3.5,
      position: 'bottom',
      fontFamily: 'Impact, Montserrat, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FF4500',
      shadowEffect: true,
    },
  },
  {
    id: 'word-cascade-reel',
    title: 'Word Cascade',
    badge: 'CADENCE',
    motionLabel: 'Staggered rising word rhythm',
    previewTextColor: '#FFFFFF',
    previewBg: '#181b16',
    previewHighlight: '#00FF66',
    config: {
      preset: 'word-cascade-reel',
      animationEffect: 'word-cascade',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      fontFamily: 'Montserrat, Inter, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#00FF66',
      shadowEffect: true,
    },
  },
  {
    id: 'flip-3d-title',
    title: '3D Perspective Flip',
    badge: '3D FLIP',
    motionLabel: '3D perspective tumble & roll',
    previewTextColor: '#FFFFFF',
    previewBg: '#131b24',
    previewHighlight: '#38BDF8',
    config: {
      preset: 'flip-3d-title',
      animationEffect: 'flip-3d',
      fontSize: 27,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#002B4D',
      outlineWidth: 2.5,
      position: 'bottom',
      fontFamily: 'Montserrat, Inter, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#38BDF8',
      shadowEffect: true,
    },
  },
  {
    id: 'bounce-rise-kinetic',
    title: 'Bounce & Rise',
    badge: 'SPRING',
    motionLabel: 'Elastic spring overshoot pop',
    previewTextColor: '#FFFFFF',
    previewBg: '#1f1c12',
    previewHighlight: '#FFE600',
    config: {
      preset: 'bounce-rise-kinetic',
      animationEffect: 'bounce-rise',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      fontFamily: 'Rubik, Montserrat, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FFE600',
      shadowEffect: true,
    },
  },
  {
    id: 'glitch-whip-cyber',
    title: 'Glitch Whip Snap',
    badge: 'RGB SPLIT',
    motionLabel: 'Chromatic aberration snap',
    previewTextColor: '#FFFFFF',
    previewBg: '#0e111a',
    previewHighlight: '#00FFFF',
    config: {
      preset: 'glitch-whip-cyber',
      animationEffect: 'glitch-whip',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2.5,
      position: 'bottom',
      fontFamily: 'Montserrat, Inter, monospace',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#00FFFF',
      shadowEffect: true,
    },
  },
  {
    id: 'highlight-sweep',
    title: 'Highlighter Sweep',
    badge: 'MARKER',
    motionLabel: 'Expanding highlighter bar wipe',
    previewTextColor: '#000000',
    previewBg: '#1a1912',
    previewHighlight: '#FFE600',
    config: {
      preset: 'highlight-sweep',
      animationEffect: 'highlight-wipe',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'bottom',
      fontFamily: 'Rubik, Montserrat, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FFE600',
      shadowEffect: true,
    },
  },
  {
    id: 'broadcast-lower-third',
    title: 'Broadcast Lower 3rd',
    badge: 'STUDIO',
    motionLabel: 'Glass card with gold rule',
    previewTextColor: '#FFFFFF',
    previewBg: '#0f141f',
    previewHighlight: '#FFD700',
    config: {
      preset: 'broadcast-lower-third',
      animationEffect: 'premiere-lower-third',
      fontSize: 23,
      textColor: '#FFFFFF',
      backgroundColor: 'rgba(15, 15, 18, 0.85)',
      outlineColor: '#000000',
      outlineWidth: 1.5,
      position: 'bottom',
      fontFamily: 'Inter, sans-serif',
      uppercase: false,
      highlightCurrentWord: true,
      highlightColor: '#FFD700',
      shadowEffect: true,
    },
  },
  {
    id: 'editorial-typewriter',
    title: 'Editorial Typewriter',
    badge: 'DOCU',
    motionLabel: 'Typewriter text reveal',
    previewTextColor: '#FFFFFF',
    previewBg: '#121415',
    previewHighlight: '#00FF66',
    config: {
      preset: 'editorial-typewriter',
      animationEffect: 'typewriter',
      fontSize: 24,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'bottom',
      fontFamily: 'Inter, monospace',
      uppercase: false,
      highlightCurrentWord: true,
      highlightColor: '#00FF66',
      shadowEffect: true,
    },
  },
  {
    id: 'cinema-drift',
    title: 'Cinematic Drift',
    badge: '4K FILM',
    motionLabel: 'Slow floating parallax drift',
    previewTextColor: '#FFD700',
    previewBg: '#1c1810',
    previewHighlight: '#FFE600',
    config: {
      preset: 'cinema-drift',
      animationEffect: 'float-drift',
      fontSize: 24,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'bottom',
      fontFamily: 'Inter, sans-serif',
      uppercase: false,
      highlightCurrentWord: true,
      highlightColor: '#FFE600',
      shadowEffect: true,
    },
  },
  {
    id: 'clean-minimal',
    title: 'Clean Minimal',
    badge: 'PRISTINE',
    motionLabel: 'Crisp static subtitles',
    previewTextColor: '#FFFFFF',
    previewBg: '#151515',
    previewOutline: '2px #000',
    config: {
      preset: 'clean-minimal',
      animationEffect: 'none',
      fontSize: 24,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2.5,
      position: 'bottom',
      fontFamily: 'Inter, sans-serif',
      uppercase: false,
      highlightCurrentWord: false,
      shadowEffect: true,
    },
  },
];

const ANIMATION_OPTIONS: { id: CaptionAnimationEffect; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'slide-up', label: 'Slide Up Mask', desc: 'Smooth upward mask reveal', icon: <ArrowUp className="w-4 h-4 text-amber-400" /> },
  { id: 'slide-left', label: 'Whip Left Snap', desc: 'Kinetic slide in from left', icon: <MoveRight className="w-4 h-4 text-cyan-400" /> },
  { id: 'punch-zoom', label: 'Punch Zoom In', desc: 'Impact punch scale zoom', icon: <Maximize2 className="w-4 h-4 text-red-400" /> },
  { id: 'word-cascade', label: 'Word Cascade', desc: 'Staggered rhythmic word rise', icon: <ListOrdered className="w-4 h-4 text-emerald-400" /> },
  { id: 'flip-3d', label: '3D Perspective Flip', desc: '3D perspective tumble & roll', icon: <RotateCw className="w-4 h-4 text-sky-400" /> },
  { id: 'bounce-rise', label: 'Bounce & Rise', desc: 'Elastic spring overshoot pop', icon: <Zap className="w-4 h-4 text-amber-300" /> },
  { id: 'glitch-whip', label: 'Glitch Whip Snap', desc: 'Chromatic aberration snap', icon: <Tv className="w-4 h-4 text-pink-400" /> },
  { id: 'highlight-wipe', label: 'Highlighter Sweep', desc: 'Fluorescent marker wipe', icon: <Highlighter className="w-4 h-4 text-yellow-300" /> },
  { id: 'float-drift', label: 'Cinematic Drift', desc: 'Slow floating parallax drift', icon: <Film className="w-4 h-4 text-amber-200" /> },
  { id: 'typewriter', label: 'Editorial Typewriter', desc: 'Typewriter character cadence', icon: <Layers className="w-4 h-4 text-green-400" /> },
  { id: 'none', label: 'Static Clean', desc: 'No animation, pristine subtitles', icon: <Minus className="w-4 h-4 text-smoke" /> },
];

const QUICK_COLORS = [
  { label: 'White', color: '#FFFFFF' },
  { label: 'Yellow', color: '#FFE600' },
  { label: 'Lime', color: '#00FF66' },
  { label: 'Cyan', color: '#00F0FF' },
  { label: 'Orange', color: '#FF4500' },
  { label: 'Magenta', color: '#FF007F' },
];

function TemplateDrawer({ style, onChange }: TemplateDrawerProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'customize'>('presets');

  const applyPreset = (preset: PresetItem) => {
    onChange({
      ...style,
      ...preset.config,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#141413] border-l border-white/10 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-xs font-bold text-mist uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Motion Styles</span>
        </h2>

        {/* Tab switcher: Gallery vs Customize */}
        <div className="flex bg-[#1d1d1b] p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
              activeTab === 'presets'
                ? 'bg-[#292826] text-amber-300 shadow-sm'
                : 'text-smoke hover:text-bone'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${
              activeTab === 'customize'
                ? 'bg-[#292826] text-amber-300 shadow-sm'
                : 'text-smoke hover:text-bone'
            }`}
          >
            Effects
          </button>
        </div>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" data-lenis-prevent>
        {activeTab === 'presets' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Motion & Text Templates</span>
              </div>
              <span className="text-xs text-mist font-mono">{PRESET_LIBRARY.length} Effects</span>
            </div>
            {/* Unified 2-column grid containing all presets */}
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_LIBRARY.map((item) => (
                <PresetCard
                  key={item.id}
                  item={item}
                  isSelected={style.preset === item.id}
                  onSelect={() => applyPreset(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Fine-tune customize & animation controls */
          <div className="space-y-5 text-xs text-mist">
            {/* Animation Effect Selector */}
            <div>
              <label className="font-semibold text-bone block mb-1.5 flex items-center justify-between">
                <span>Animation Effect</span>
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-mono">
                  {style.animationEffect || 'slide-up'}
                </span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {ANIMATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ ...style, animationEffect: opt.id })}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      style.animationEffect === opt.id
                        ? 'bg-[#282622] border-amber-400 text-bone shadow-md'
                        : 'bg-[#1a1a18] border-white/10 text-smoke hover:text-bone hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {opt.icon}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-bone">{opt.label}</div>
                        <div className="text-xs text-mist">{opt.desc}</div>
                      </div>
                    </div>
                    {style.animationEffect === opt.id && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlight Color (Spoken Word Color) */}
            <div>
              <label className="font-semibold text-bone block mb-1.5">
                Spoken Word Highlight Color
              </label>
              <div className="flex items-center gap-2 mb-2">
                {QUICK_COLORS.map((qc) => (
                  <button
                    key={qc.color}
                    type="button"
                    title={qc.label}
                    onClick={() => onChange({ ...style, highlightColor: qc.color })}
                    className="w-7 h-7 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center relative shadow-sm"
                    style={{ backgroundColor: qc.color }}
                  >
                    {style.highlightColor?.toLowerCase() === qc.color.toLowerCase() && (
                      <span className="w-2 h-2 rounded-full bg-black" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-bone">Font Size</label>
                <span className="font-mono text-amber-300 text-xs">{style.fontSize}px</span>
              </div>
              <input
                type="range"
                min={18}
                max={48}
                value={style.fontSize}
                onChange={(e) => onChange({ ...style, fontSize: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Audio Sync / Timing Lead Offset Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-bone flex items-center gap-1.5">
                  <span>Audio Sync (Timing Lead)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-bold">
                    Zero Lag
                  </span>
                </label>
                <span className="font-mono text-amber-300 text-xs font-bold">
                  {(style.syncOffset ?? -0.35) > 0 ? `+${(style.syncOffset ?? -0.35).toFixed(2)}s` : `${(style.syncOffset ?? -0.35).toFixed(2)}s`}
                </span>
              </div>
              <input
                type="range"
                min={-1.0}
                max={0.5}
                step={0.05}
                value={style.syncOffset ?? -0.35}
                onChange={(e) => onChange({ ...style, syncOffset: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-mist mt-1 font-mono">
                <span>◀ Earlier (-1.0s)</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...style, syncOffset: -0.35 })}
                  className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Optimal (-0.35s)
                </button>
                <span>Later (+0.5s) ▶</span>
              </div>
            </div>

            {/* Outline Stroke Width */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-bone">Black Contrast Outline</label>
                <span className="font-mono text-amber-300 text-xs">{style.outlineWidth}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                step={0.5}
                value={style.outlineWidth}
                onChange={(e) => onChange({ ...style, outlineWidth: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Position */}
            <div>
              <label className="font-semibold text-bone block mb-2">Screen Position</label>
              <div className="grid grid-cols-3 gap-1 bg-[#1c1c1a] p-1 rounded-xl border border-white/10">
                {(['top', 'middle', 'bottom'] as SubtitlePosition[]).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => onChange({ ...style, position: pos })}
                    className={`py-1.5 text-xs capitalize font-medium rounded-lg transition-colors ${
                      style.position === pos
                        ? 'bg-[#2b2a28] text-amber-300 border border-amber-300/30'
                        : 'text-smoke hover:text-bone'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style Toggle */}
            <div>
              <label className="font-semibold text-bone block mb-2">Background Style</label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#1c1c1a] p-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => onChange({ ...style, backgroundColor: 'transparent' })}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all ${
                    style.backgroundColor === 'transparent'
                      ? 'bg-[#2b2a28] text-amber-300 border border-amber-300/30'
                      : 'text-smoke hover:text-bone'
                  }`}
                >
                  Float (Clean)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...style, backgroundColor: 'rgba(0,0,0,0.65)' })}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all ${
                    style.backgroundColor.includes('rgba')
                      ? 'bg-[#2b2a28] text-amber-300 border border-amber-300/30'
                      : 'text-smoke hover:text-bone'
                  }`}
                >
                  Dark Glass
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...style, backgroundColor: '#E5132B' })}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all ${
                    style.backgroundColor === '#E5132B'
                      ? 'bg-[#2b2a28] text-amber-300 border border-amber-300/30'
                      : 'text-smoke hover:text-bone'
                  }`}
                >
                  Red Box
                </button>
              </div>
            </div>

            {/* Uppercase toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1a] border border-white/10">
              <div>
                <div className="text-bone font-medium">All Caps (UPPERCASE)</div>
                <div className="text-smoke text-[11px]">Clean high-visibility typography</div>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...style, uppercase: !style.uppercase })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  style.uppercase ? 'bg-amber-400' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                    style.uppercase ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Preset Card Component ──────────────────────────────────────────────────

function PresetCard({
  item,
  isSelected,
  onSelect,
}: {
  item: PresetItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left p-2.5 rounded-xl transition-all duration-150 flex flex-col justify-between group cursor-pointer ${
        isSelected
          ? 'bg-[#242320] border-2 border-amber-400 shadow-md ring-1 ring-amber-400/40'
          : 'bg-[#181816] border border-white/10 hover:border-white/25 hover:bg-[#20201e]'
      }`}
    >
      {/* Visual Subtitle Preview Badge */}
      <div
        className="w-full h-14 rounded-lg flex items-center justify-center p-2 mb-2 relative overflow-hidden border border-white/5"
        style={{
          backgroundColor: item.previewBg || '#141412',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 80%)',
        }}
      >
        {item.id === 'slide-up-modern' ? (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_#000] anim-slide-up">
            SLIDE <span className="text-[#FFE600]">UP</span>
          </span>
        ) : item.id === 'whip-left-bold' ? (
          <span className="text-[11px] font-black italic tracking-wide text-white drop-shadow-[0_2px_4px_#000] anim-slide-left">
            WHIP <span className="text-[#00F0FF]">SNAP</span>
          </span>
        ) : item.id === 'punch-zoom-action' ? (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_#000] anim-punch-zoom">
            PUNCH <span className="text-[#FF4500]">ZOOM</span>
          </span>
        ) : item.id === 'word-cascade-reel' ? (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_#000] flex gap-1">
            <span className="anim-slide-up inline-block">WORD</span>
            <span className="anim-slide-up inline-block text-[#00FF66]" style={{ animationDelay: '0.12s' }}>CASCADE</span>
          </span>
        ) : item.id === 'flip-3d-title' ? (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_#000] anim-flip-3d">
            3D <span className="text-[#38BDF8]">FLIP</span>
          </span>
        ) : item.id === 'bounce-rise-kinetic' ? (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_#000] anim-bounce-rise">
            BOUNCE <span className="text-[#FFE600]">& RISE</span>
          </span>
        ) : item.id === 'glitch-whip-cyber' ? (
          <span className="text-[11px] font-black tracking-wider text-white drop-shadow-[2px_0_#FF0055] anim-glitch-whip">
            GLITCH <span className="text-[#00FFFF]">WHIP</span>
          </span>
        ) : item.id === 'highlight-sweep' ? (
          <span className="text-[10px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_#000]">
            <span className="bg-[#FFE600] text-black px-1.5 py-0.5 rounded font-black">MARKER</span> WIPE
          </span>
        ) : item.id === 'broadcast-lower-third' ? (
          <span className="text-[10px] font-bold tracking-wide bg-black/90 text-white px-2 py-0.5 rounded border-l-2 border-[#FFD700]">
            LOWER <span className="text-[#FFD700]">3RD</span>
          </span>
        ) : item.id === 'editorial-typewriter' ? (
          <span className="text-[11px] font-mono tracking-tight text-white">
            TYPE<span className="text-[#00FF66]">WRITER</span>_
          </span>
        ) : item.id === 'cinema-drift' ? (
          <span className="text-[11px] font-bold tracking-wide text-[#FFE600] drop-shadow-[0_2px_4px_#000] anim-float-drift">
            CINEMA DRIFT
          </span>
        ) : (
          <span className="text-[11px] font-medium tracking-wide text-white drop-shadow-[0_1px_3px_#000]">
            Clean Minimal
          </span>
        )}
      </div>

      {/* Label and Badge */}
      <div className="flex items-center justify-between w-full mt-0.5">
        <span className="text-xs font-bold text-bone group-hover:text-amber-300 transition-colors">
          {item.title}
        </span>
        {item.badge && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/20 tracking-wider">
            {item.badge}
          </span>
        )}
      </div>
      <div className="text-xs text-mist truncate mt-0.5 w-full">
        {item.motionLabel}
      </div>
    </button>
  );
}

export default memo(TemplateDrawer);
