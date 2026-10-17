// ─── TemplateDrawer ──────────────────────────────────────────────────────────
// Right-hand visual preset gallery matching CapCut & Premiere Pro reference:
// - High-visibility presets (CapCut Bounce, Hormozi Box, Cyber Glow, MrBeast Comic, Fire Hype, Cinema Gold)
// - Animation Effect Selector (Bounce, Box Highlight, Neon Glow, 3D Comic, Flame, Clean)
// - Fine-tuning controls: Typography, Size, Vibrant Swatches, Outline Stroke, and Background.

import { useState, memo } from 'react';
import type { SubtitleStyle, SubtitlePreset, SubtitlePosition, CaptionAnimationEffect } from './types';

interface TemplateDrawerProps {
  style: SubtitleStyle;
  onChange: (newStyle: SubtitleStyle) => void;
}

interface PresetItem {
  id: SubtitlePreset;
  title: string;
  badge?: string;
  category: 'capcut' | 'cinematic';
  previewTextColor: string;
  previewBg: string;
  previewOutline?: string;
  previewHighlight?: string;
  config: Partial<SubtitleStyle>;
}

export const PRESET_LIBRARY: PresetItem[] = [
  // ── CapCut & Viral Social Presets ──
  {
    id: 'capcut-viral',
    title: 'CapCut Bounce',
    badge: 'VIRAL',
    category: 'capcut',
    previewTextColor: '#FFFFFF',
    previewBg: '#1c1b18',
    previewHighlight: '#FFE600',
    previewOutline: '3px #000',
    config: {
      preset: 'capcut-viral',
      animationEffect: 'capcut-bounce',
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
    id: 'hormozi-yellow',
    title: 'Hormozi Box',
    badge: 'HOT',
    category: 'capcut',
    previewTextColor: '#FFFFFF',
    previewBg: '#1f1e14',
    previewHighlight: '#FFE600',
    config: {
      preset: 'hormozi-yellow',
      animationEffect: 'hormozi-box',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2.5,
      position: 'bottom',
      fontFamily: 'Rubik, Montserrat, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FFE600',
      shadowEffect: true,
    },
  },
  {
    id: 'premiere-glow',
    title: 'Cyber Glow',
    badge: 'PREMIERE',
    category: 'capcut',
    previewTextColor: '#00F0FF',
    previewBg: '#091520',
    previewHighlight: '#00F0FF',
    config: {
      preset: 'premiere-glow',
      animationEffect: 'premiere-glow',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#002B4D',
      outlineWidth: 2,
      position: 'bottom',
      fontFamily: 'Inter, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#00F0FF',
      shadowEffect: true,
    },
  },
  {
    id: 'mrbeast-comic',
    title: 'MrBeast 3D',
    badge: 'YOUTUBE',
    category: 'capcut',
    previewTextColor: '#00FF66',
    previewBg: '#0c2012',
    previewOutline: '4px #000',
    config: {
      preset: 'mrbeast-comic',
      animationEffect: 'comic-pop',
      fontSize: 28,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 3.5,
      position: 'bottom',
      fontFamily: 'Impact, Rubik, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#00FF66',
      shadowEffect: true,
    },
  },
  {
    id: 'fire-hype',
    title: 'Flame Hype',
    badge: 'HYPE',
    category: 'capcut',
    previewTextColor: '#FF4500',
    previewBg: '#2a0e08',
    previewHighlight: '#FFD700',
    config: {
      preset: 'fire-hype',
      animationEffect: 'fire-flame',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      fontFamily: 'Montserrat, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FF4500',
      shadowEffect: true,
    },
  },
  {
    id: 'neon-tokyo',
    title: 'Neon Tokyo',
    badge: 'STUDIO',
    category: 'capcut',
    previewTextColor: '#FF007F',
    previewBg: '#220c1a',
    previewHighlight: '#00F0FF',
    config: {
      preset: 'neon-tokyo',
      animationEffect: 'premiere-glow',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#3d0024',
      outlineWidth: 2,
      position: 'bottom',
      fontFamily: 'Montserrat, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FF007F',
      shadowEffect: true,
    },
  },

  // ── Cinematic & Film Templates ──
  {
    id: 'cinema-gold',
    title: 'Cinema Gold',
    badge: '4K FILM',
    category: 'cinematic',
    previewTextColor: '#FFD700',
    previewBg: '#1f1b10',
    config: {
      preset: 'cinema-gold',
      animationEffect: 'cinematic-clean',
      fontSize: 24,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'bottom',
      fontFamily: 'Inter, sans-serif',
      uppercase: false,
      highlightCurrentWord: true,
      highlightColor: '#FFD700',
      shadowEffect: true,
    },
  },
  {
    id: 'clean-minimal',
    title: 'Pristine White',
    badge: 'NETFLIX',
    category: 'cinematic',
    previewTextColor: '#FFFFFF',
    previewBg: '#181816',
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
  {
    id: 'boxed',
    title: 'Brand Crimson',
    badge: 'BADGE',
    category: 'cinematic',
    previewTextColor: '#FFFFFF',
    previewBg: '#590a14',
    config: {
      preset: 'boxed',
      animationEffect: 'capcut-bounce',
      fontSize: 24,
      textColor: '#FFFFFF',
      backgroundColor: '#E5132B',
      outlineColor: 'transparent',
      outlineWidth: 0,
      position: 'bottom',
      fontFamily: 'Montserrat, sans-serif',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FFE600',
      shadowEffect: true,
    },
  },
  {
    id: 'spotlight',
    title: 'Spotlight Box',
    badge: 'CLASSIC',
    category: 'cinematic',
    previewTextColor: '#FFEE55',
    previewBg: '#201f18',
    config: {
      preset: 'spotlight',
      animationEffect: 'capcut-bounce',
      fontSize: 25,
      textColor: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
];

const ANIMATION_OPTIONS: { id: CaptionAnimationEffect; label: string; desc: string; icon: string }[] = [
  { id: 'capcut-bounce', label: 'CapCut Bounce', desc: 'Elastic spring pop & active tilt', icon: '⚡' },
  { id: 'hormozi-box', label: 'Hormozi Box', desc: 'Jumping high-contrast word badge', icon: '🟨' },
  { id: 'premiere-glow', label: 'Premiere Glow', desc: 'Electric neon aura & pulse', icon: '🔮' },
  { id: 'comic-pop', label: 'MrBeast 3D', desc: 'Bold 3D comic shadow & jump', icon: '💥' },
  { id: 'fire-flame', label: 'Flame Hype', desc: 'Fiery color pop & vertical jump', icon: '🔥' },
  { id: 'cinematic-clean', label: 'Cinematic', desc: 'Subtle warm gold word sync', icon: '🎬' },
  { id: 'none', label: 'Static', desc: 'No animation, clean subtitles', icon: '⏹' },
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

  const capcutList = PRESET_LIBRARY.filter((p) => p.category === 'capcut');
  const cinematicList = PRESET_LIBRARY.filter((p) => p.category === 'cinematic');

  return (
    <div className="flex flex-col h-full bg-[#141413] border-l border-white/10 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-xs font-bold text-mist uppercase tracking-widest flex items-center gap-2">
          <span>✨</span>
          <span>Caption Styles</span>
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
          <>
            {/* CapCut & Viral Presets */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                  ⚡ CapCut & Viral Reels
                </div>
                <span className="text-[9px] text-smoke">High-Engagement</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {capcutList.map((item) => (
                  <PresetCard
                    key={item.id}
                    item={item}
                    isSelected={style.preset === item.id}
                    onSelect={() => applyPreset(item)}
                  />
                ))}
              </div>
            </div>

            {/* Cinematic & Film Templates */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[10px] font-bold tracking-wider text-mist uppercase">
                  🎬 Cinematic & Film
                </div>
                <span className="text-[9px] text-smoke">Ultra Contrast</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {cinematicList.map((item) => (
                  <PresetCard
                    key={item.id}
                    item={item}
                    isSelected={style.preset === item.id}
                    onSelect={() => applyPreset(item)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Fine-tune customize & animation controls */
          <div className="space-y-5 text-xs text-mist">
            {/* Animation Effect Selector */}
            <div>
              <label className="font-semibold text-bone block mb-1.5 flex items-center justify-between">
                <span>Animation Effect</span>
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-mono">
                  {style.animationEffect || 'capcut-bounce'}
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
                      <span className="text-base">{opt.icon}</span>
                      <div>
                        <div className="font-bold text-xs text-bone">{opt.label}</div>
                        <div className="text-[10px] text-smoke">{opt.desc}</div>
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
                <div className="text-smoke text-[11px]">CapCut / Reels signature typography</div>
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
        {item.id === 'hormozi-yellow' ? (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_#000]">
            WATCH <span className="bg-[#FFE600] text-black px-1.5 py-0.5 rounded font-black text-[10px]">THIS</span>
          </span>
        ) : item.id === 'premiere-glow' ? (
          <span className="text-[11px] font-black tracking-wider text-white drop-shadow-[0_0_10px_#00F0FF]">
            CYBER <span className="text-[#00F0FF]">GLOW</span>
          </span>
        ) : item.id === 'mrbeast-comic' ? (
          <span className="text-[12px] font-black tracking-wide text-white drop-shadow-[0_2px_0_#000]">
            MR<span className="text-[#00FF66]">BEAST</span>
          </span>
        ) : item.id === 'fire-hype' ? (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_0_8px_#FF4500]">
            FLAME <span className="text-[#FFD700]">HYPE</span>
          </span>
        ) : item.id === 'neon-tokyo' ? (
          <span className="text-[11px] font-black tracking-wider text-white drop-shadow-[0_0_8px_#EC4899]">
            NEON <span className="text-[#EC4899]">TOKYO</span>
          </span>
        ) : item.id === 'cinema-gold' ? (
          <span className="text-[11px] font-bold tracking-wide text-[#FFE600] drop-shadow-[0_2px_4px_#000]">
            CINEMA GOLD
          </span>
        ) : item.id === 'clean-minimal' ? (
          <span className="text-[11px] font-medium tracking-wide text-white drop-shadow-[0_1px_3px_#000]">
            Pristine White
          </span>
        ) : item.id === 'boxed' ? (
          <span className="text-[10px] font-black tracking-wide bg-[#E5132B] text-white px-2 py-0.5 rounded shadow">
            CRIMSON BOX
          </span>
        ) : item.id === 'spotlight' ? (
          <span className="text-[10px] font-bold tracking-wide bg-black/80 text-white px-2 py-0.5 rounded border border-white/20">
            SPOT<span className="text-[#FFE600]">LIGHT</span>
          </span>
        ) : (
          <span className="text-[11px] font-black tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            CAPCUT <span className="text-[#FFE600]">BOUNCE</span>
          </span>
        )}
      </div>

      {/* Label and Badge */}
      <div className="flex items-center justify-between w-full mt-0.5">
        <span className="text-xs font-bold text-bone group-hover:text-amber-300 transition-colors">
          {item.title}
        </span>
        {item.badge && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 tracking-wider">
            {item.badge}
          </span>
        )}
      </div>
    </button>
  );
}

export default memo(TemplateDrawer);
