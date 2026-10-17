// ─── StyleToolbar ─────────────────────────────────────────────────────────────
// Real-time styling studio: CapCut Bounce, Hormozi Box, Premiere Glow, MrBeast 3D, Cinema Gold.

import type { SubtitleStyle, SubtitlePreset, CaptionAnimationEffect } from './types';

interface StyleToolbarProps {
  style: SubtitleStyle;
  onChange: (newStyle: SubtitleStyle) => void;
}

export const PRESET_CONFIGS: Partial<Record<SubtitlePreset, Partial<SubtitleStyle>>> = {
  'capcut-viral': {
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
  'hormozi-yellow': {
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
  'premiere-glow': {
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
  'mrbeast-comic': {
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
  'cinema-gold': {
    preset: 'cinema-gold',
    animationEffect: 'cinematic-clean',
    fontSize: 24,
    textColor: '#FFE600',
    backgroundColor: 'transparent',
    outlineColor: '#000000',
    outlineWidth: 2.5,
    position: 'bottom',
    fontFamily: 'Inter, sans-serif',
    uppercase: false,
    highlightCurrentWord: false,
    shadowEffect: true,
  },
  'clean-minimal': {
    preset: 'clean-minimal',
    animationEffect: 'none',
    fontSize: 22,
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
};

export default function StyleToolbar({ style, onChange }: StyleToolbarProps) {
  const applyPreset = (preset: SubtitlePreset) => {
    const config = PRESET_CONFIGS[preset];
    if (config) {
      onChange({
        ...style,
        ...config,
      });
    }
  };

  const setAnimation = (anim: CaptionAnimationEffect) => {
    onChange({
      ...style,
      animationEffect: anim,
      highlightCurrentWord: anim !== 'none',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-[#121211]/90 border-b border-white/[0.08] backdrop-blur-md overflow-x-auto scrollbar-thin">
      {/* Preset Pills */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 mr-1">Style</span>
        <PresetBtn active={style.preset === 'capcut-viral'} label="⚡ CapCut" onClick={() => applyPreset('capcut-viral')} />
        <PresetBtn active={style.preset === 'hormozi-yellow'} label="📦 Hormozi" onClick={() => applyPreset('hormozi-yellow')} />
        <PresetBtn active={style.preset === 'premiere-glow'} label="✨ Glow" onClick={() => applyPreset('premiere-glow')} />
        <PresetBtn active={style.preset === 'mrbeast-comic'} label="💥 3D Pop" onClick={() => applyPreset('mrbeast-comic')} />
        <PresetBtn active={style.preset === 'cinema-gold'} label="🎬 Gold" onClick={() => applyPreset('cinema-gold')} />
        <PresetBtn active={style.preset === 'clean-minimal'} label="Minimal" onClick={() => applyPreset('clean-minimal')} />
      </div>

      {/* Animation Effect Quick Selector */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-mist mr-1">Effect</span>
        <EffectBtn active={style.animationEffect === 'capcut-bounce'} label="Bounce" onClick={() => setAnimation('capcut-bounce')} />
        <EffectBtn active={style.animationEffect === 'hormozi-box'} label="Badge" onClick={() => setAnimation('hormozi-box')} />
        <EffectBtn active={style.animationEffect === 'premiere-glow'} label="Glow" onClick={() => setAnimation('premiere-glow')} />
        <EffectBtn active={style.animationEffect === 'comic-pop'} label="Pop" onClick={() => setAnimation('comic-pop')} />
        <EffectBtn active={style.animationEffect === 'none'} label="Static" onClick={() => setAnimation('none')} />
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-3 shrink-0">
        <span className="text-[11px] text-smoke">Size</span>
        <input
          type="range"
          min={18}
          max={42}
          value={style.fontSize}
          onChange={(e) => onChange({ ...style, fontSize: Number(e.target.value) })}
          className="w-20 accent-amber-400 cursor-pointer"
        />
        <span className="text-xs text-bone font-mono w-5">{style.fontSize}</span>
      </div>

      {/* Position buttons */}
      <div className="flex items-center gap-1 border-r border-white/10 pr-3 shrink-0">
        <span className="text-[11px] text-smoke mr-1">Pos</span>
        <PosBtn active={style.position === 'top'} label="Top" onClick={() => onChange({ ...style, position: 'top' })} />
        <PosBtn active={style.position === 'middle'} label="Mid" onClick={() => onChange({ ...style, position: 'middle' })} />
        <PosBtn active={style.position === 'bottom'} label="Bottom" onClick={() => onChange({ ...style, position: 'bottom' })} />
      </div>

      {/* Color pickers */}
      <div className="flex items-center gap-2 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer" title="Highlight / Accent Color">
          <span className="text-[11px] text-smoke">Highlight</span>
          <input
            type="color"
            value={style.highlightColor && style.highlightColor.startsWith('#') ? style.highlightColor : '#FFE600'}
            onChange={(e) => onChange({ ...style, highlightColor: e.target.value, highlightCurrentWord: true })}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer" title="Text Color">
          <span className="text-[11px] text-smoke">Text</span>
          <input
            type="color"
            value={style.textColor.startsWith('#') ? style.textColor : '#ffffff'}
            onChange={(e) => onChange({ ...style, textColor: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </label>

        {/* Uppercase toggle */}
        <button
          onClick={() => onChange({ ...style, uppercase: !style.uppercase })}
          className={`
            px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors
            ${style.uppercase ? 'bg-amber-400 text-black shadow-sm' : 'text-smoke hover:text-bone bg-white/5'}
          `}
          title="Toggle UPPERCASE"
        >
          AA
        </button>
      </div>
    </div>
  );
}

function PresetBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2.5 py-1 rounded-md text-xs font-semibold transition-all
        ${active
          ? 'bg-amber-400 text-black shadow-sm shadow-amber-400/20'
          : 'text-mist hover:text-bone bg-white/[0.04] hover:bg-white/[0.08]'
        }
      `}
    >
      {label}
    </button>
  );
}

function EffectBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-0.5 rounded text-[11px] font-medium transition-all
        ${active
          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
          : 'text-smoke hover:text-mist bg-white/[0.03] border border-transparent'
        }
      `}
    >
      {label}
    </button>
  );
}

function PosBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-0.5 rounded text-[11px] font-medium transition-colors
        ${active ? 'bg-white/20 text-bone' : 'text-smoke hover:text-mist bg-white/[0.02]'}
      `}
    >
      {label}
    </button>
  );
}

