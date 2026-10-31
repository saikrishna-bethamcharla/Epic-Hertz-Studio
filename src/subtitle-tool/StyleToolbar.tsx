// ─── StyleToolbar ─────────────────────────────────────────────────────────────
// Real-time styling studio: Premiere Pro style motion templates and slide effects.

import type { SubtitleStyle, SubtitlePreset, CaptionAnimationEffect } from './types';

interface StyleToolbarProps {
  style: SubtitleStyle;
  onChange: (newStyle: SubtitleStyle) => void;
}

export const PRESET_CONFIGS: Partial<Record<SubtitlePreset, Partial<SubtitleStyle>>> = {
  'slide-up-modern': {
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
  'whip-left-bold': {
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
  'punch-zoom-action': {
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
  'word-cascade-reel': {
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
  'flip-3d-title': {
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
  'bounce-rise-kinetic': {
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
  'glitch-whip-cyber': {
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
  'highlight-sweep': {
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
  'broadcast-lower-third': {
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
  'editorial-typewriter': {
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
  'cinema-drift': {
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
  'clean-minimal': {
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
  // Legacy aliases
  'capcut-viral': {
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
  'hormozi-yellow': {
    preset: 'bounce-rise-kinetic',
    animationEffect: 'bounce-rise',
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
    preset: 'whip-left-bold',
    animationEffect: 'slide-left',
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
    preset: 'punch-zoom-action',
    animationEffect: 'punch-zoom',
    fontSize: 28,
    textColor: '#FFFFFF',
    backgroundColor: 'transparent',
    outlineColor: '#000000',
    outlineWidth: 3.5,
    position: 'bottom',
    fontFamily: 'Impact, Rubik, sans-serif',
    uppercase: true,
    highlightCurrentWord: true,
    highlightColor: '#FF4500',
    shadowEffect: true,
  },
  'cinema-gold': {
    preset: 'cinema-drift',
    animationEffect: 'float-drift',
    fontSize: 24,
    textColor: '#FFE600',
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
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 mr-1">Motion</span>
        <PresetBtn active={style.preset === 'slide-up-modern'} label="Slide Up" onClick={() => applyPreset('slide-up-modern')} />
        <PresetBtn active={style.preset === 'whip-left-bold'} label="Whip Snap" onClick={() => applyPreset('whip-left-bold')} />
        <PresetBtn active={style.preset === 'punch-zoom-action'} label="Punch Zoom" onClick={() => applyPreset('punch-zoom-action')} />
        <PresetBtn active={style.preset === 'word-cascade-reel'} label="Word Cascade" onClick={() => applyPreset('word-cascade-reel')} />
        <PresetBtn active={style.preset === 'flip-3d-title'} label="3D Flip" onClick={() => applyPreset('flip-3d-title')} />
        <PresetBtn active={style.preset === 'bounce-rise-kinetic'} label="Bounce Rise" onClick={() => applyPreset('bounce-rise-kinetic')} />
        <PresetBtn active={style.preset === 'glitch-whip-cyber'} label="Glitch Whip" onClick={() => applyPreset('glitch-whip-cyber')} />
        <PresetBtn active={style.preset === 'highlight-sweep'} label="Highlighter" onClick={() => applyPreset('highlight-sweep')} />
        <PresetBtn active={style.preset === 'broadcast-lower-third'} label="Lower 3rd" onClick={() => applyPreset('broadcast-lower-third')} />
        <PresetBtn active={style.preset === 'editorial-typewriter'} label="Typewriter" onClick={() => applyPreset('editorial-typewriter')} />
        <PresetBtn active={style.preset === 'cinema-drift'} label="Cinematic Drift" onClick={() => applyPreset('cinema-drift')} />
        <PresetBtn active={style.preset === 'clean-minimal'} label="Minimal" onClick={() => applyPreset('clean-minimal')} />
      </div>

      {/* Animation Effect Quick Selector */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-mist mr-1">Movement</span>
        <EffectBtn active={style.animationEffect === 'slide-up'} label="Slide Up" onClick={() => setAnimation('slide-up')} />
        <EffectBtn active={style.animationEffect === 'slide-left'} label="Whip Left" onClick={() => setAnimation('slide-left')} />
        <EffectBtn active={style.animationEffect === 'punch-zoom'} label="Punch Zoom" onClick={() => setAnimation('punch-zoom')} />
        <EffectBtn active={style.animationEffect === 'word-cascade'} label="Cascade" onClick={() => setAnimation('word-cascade')} />
        <EffectBtn active={style.animationEffect === 'flip-3d'} label="3D Flip" onClick={() => setAnimation('flip-3d')} />
        <EffectBtn active={style.animationEffect === 'bounce-rise'} label="Bounce" onClick={() => setAnimation('bounce-rise')} />
        <EffectBtn active={style.animationEffect === 'glitch-whip'} label="Glitch" onClick={() => setAnimation('glitch-whip')} />
        <EffectBtn active={style.animationEffect === 'highlight-wipe'} label="Highlighter" onClick={() => setAnimation('highlight-wipe')} />
        <EffectBtn active={style.animationEffect === 'float-drift'} label="Drift" onClick={() => setAnimation('float-drift')} />
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

      {/* Audio Sync / Timing Lead Offset Controls */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 mr-1" title="Lead timing offset: advances text pop to match the speaker's voice onset">
          Sync
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...style, syncOffset: Math.round(((style.syncOffset ?? -0.35) - 0.15) * 100) / 100 })}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-mist hover:text-bone border border-white/10 active:scale-95 cursor-pointer"
          title="Nudge earlier (pops text earlier to fix vocal lag)"
        >
          ◀ Earlier
        </button>
        <span className="text-[11px] font-mono font-bold text-amber-300 px-1" title="Active audio sync lead time">
          {(style.syncOffset ?? -0.35) > 0 ? `+${(style.syncOffset ?? -0.35).toFixed(2)}s` : `${(style.syncOffset ?? -0.35).toFixed(2)}s`}
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...style, syncOffset: Math.round(((style.syncOffset ?? -0.35) + 0.15) * 100) / 100 })}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-mist hover:text-bone border border-white/10 active:scale-95 cursor-pointer"
          title="Nudge later"
        >
          Later ▶
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...style, syncOffset: -0.35 })}
          className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 cursor-pointer"
          title="Reset to optimal zero-lag lead time (-0.35s)"
        >
          Zero Lag
        </button>
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

