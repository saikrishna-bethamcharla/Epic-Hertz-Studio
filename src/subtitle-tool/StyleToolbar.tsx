// ─── StyleToolbar ─────────────────────────────────────────────────────────────
// Real-time styling studio: Reels bold, Cinema yellow, Boxed, Minimal, and custom tweaks.

import type { SubtitleStyle, SubtitlePreset } from './types';

interface StyleToolbarProps {
  style: SubtitleStyle;
  onChange: (newStyle: SubtitleStyle) => void;
}

export const PRESET_CONFIGS: Record<SubtitlePreset, Partial<SubtitleStyle>> = {
  'reel-bold': {
    preset: 'reel-bold',
    fontSize: 24,
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    outlineColor: '#000000',
    outlineWidth: 3,
    position: 'bottom',
    fontFamily: 'Inter',
    uppercase: false,
  },
  'cinema-yellow': {
    preset: 'cinema-yellow',
    fontSize: 22,
    textColor: '#FFE600',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    outlineColor: '#000000',
    outlineWidth: 2,
    position: 'bottom',
    fontFamily: 'Inter',
    uppercase: false,
  },
  'boxed': {
    preset: 'boxed',
    fontSize: 22,
    textColor: '#FFFFFF',
    backgroundColor: '#E5132B', // Crimson brand
    outlineColor: 'transparent',
    outlineWidth: 0,
    position: 'bottom',
    fontFamily: 'Inter',
    uppercase: true,
  },
  'clean-minimal': {
    preset: 'clean-minimal',
    fontSize: 20,
    textColor: '#F4F1EC',
    backgroundColor: 'transparent',
    outlineColor: '#000000',
    outlineWidth: 2,
    position: 'bottom',
    fontFamily: 'Inter',
    uppercase: false,
  },
  'headline': {
    preset: 'headline',
    fontSize: 28,
    textColor: '#FFFFFF',
    backgroundColor: '#000000',
    outlineColor: '#000000',
    outlineWidth: 0,
    position: 'middle',
    fontFamily: 'Inter',
    uppercase: true,
  },
};

export default function StyleToolbar({ style, onChange }: StyleToolbarProps) {
  const applyPreset = (preset: SubtitlePreset) => {
    onChange({
      ...style,
      ...PRESET_CONFIGS[preset],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-ink-3/70 border-b border-white/[0.08] backdrop-blur-md">
      {/* Preset Pills */}
      <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
        <span className="text-[11px] uppercase tracking-wider text-mist mr-1">Style</span>
        <PresetBtn active={style.preset === 'reel-bold'} label="Reel Bold" onClick={() => applyPreset('reel-bold')} />
        <PresetBtn active={style.preset === 'cinema-yellow'} label="Cinema" onClick={() => applyPreset('cinema-yellow')} />
        <PresetBtn active={style.preset === 'boxed'} label="Brand Box" onClick={() => applyPreset('boxed')} />
        <PresetBtn active={style.preset === 'clean-minimal'} label="Minimal" onClick={() => applyPreset('clean-minimal')} />
        <PresetBtn active={style.preset === 'headline'} label="Center Pop" onClick={() => applyPreset('headline')} />
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-3">
        <span className="text-[11px] text-smoke">Size</span>
        <input
          type="range"
          min={16}
          max={38}
          value={style.fontSize}
          onChange={(e) => onChange({ ...style, fontSize: Number(e.target.value) })}
          className="w-20 accent-crimson cursor-pointer"
        />
        <span className="text-xs text-bone font-mono w-5">{style.fontSize}</span>
      </div>

      {/* Position buttons */}
      <div className="flex items-center gap-1 border-r border-white/10 pr-3">
        <span className="text-[11px] text-smoke mr-1">Pos</span>
        <PosBtn active={style.position === 'top'} label="Top" onClick={() => onChange({ ...style, position: 'top' })} />
        <PosBtn active={style.position === 'middle'} label="Mid" onClick={() => onChange({ ...style, position: 'middle' })} />
        <PosBtn active={style.position === 'bottom'} label="Bottom" onClick={() => onChange({ ...style, position: 'bottom' })} />
      </div>

      {/* Color pickers */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 cursor-pointer" title="Text Color">
          <span className="text-[11px] text-smoke">Color</span>
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
            ${style.uppercase ? 'bg-crimson text-white' : 'text-smoke hover:text-bone bg-white/5'}
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
        px-2.5 py-1 rounded-md text-xs font-medium transition-all
        ${active
          ? 'bg-crimson text-white shadow-sm'
          : 'text-mist hover:text-bone bg-white/[0.04] hover:bg-white/[0.08]'
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
