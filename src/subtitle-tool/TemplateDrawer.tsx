// ─── TemplateDrawer ──────────────────────────────────────────────────────────
// Right-hand visual preset gallery matching ReplixCaptions reference:
// Visual style cards (Classic, Yellow, Minimal, Punch, Spotlight, Noir, Gold Luxe, etc.)
// plus fine-tuning controls (font size, position, uppercase, outline).

import { useState } from 'react';
import type { SubtitleStyle, SubtitlePreset, SubtitlePosition } from './types';

interface TemplateDrawerProps {
  style: SubtitleStyle;
  onChange: (newStyle: SubtitleStyle) => void;
}

interface PresetItem {
  id: SubtitlePreset;
  title: string;
  badge?: string;
  category: 'templates' | 'animated';
  previewTextColor: string;
  previewBg: string;
  previewOutline?: string;
  previewHighlight?: string;
  config: Partial<SubtitleStyle>;
}

export const PRESET_LIBRARY: PresetItem[] = [
  // ── Standard Templates ──
  {
    id: 'cinema-yellow',
    title: 'Yellow',
    category: 'templates',
    previewTextColor: '#FFE600',
    previewBg: '#181816',
    previewOutline: '2px #000',
    config: {
      preset: 'cinema-yellow',
      fontSize: 24,
      textColor: '#FFE600',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'bottom',
      uppercase: false,
      highlightCurrentWord: false,
    },
  },
  {
    id: 'clean-minimal',
    title: 'Minimal',
    category: 'templates',
    previewTextColor: '#FFFFFF',
    previewBg: '#1f1f1d',
    config: {
      preset: 'clean-minimal',
      fontSize: 22,
      textColor: '#FFFFFF',
      backgroundColor: 'transparent',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'bottom',
      uppercase: false,
      highlightCurrentWord: false,
    },
  },

  // ── Animated & Social Presets ──
  {
    id: 'reel-bold',
    title: 'Classic',
    badge: 'STUDIO',
    category: 'animated',
    previewTextColor: '#FFFFFF',
    previewBg: '#2a221b',
    previewHighlight: '#FFD700',
    config: {
      preset: 'reel-bold',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      uppercase: false,
      highlightCurrentWord: true,
      highlightColor: '#FFD700',
    },
  },
  {
    id: 'dark',
    title: 'Dark',
    category: 'animated',
    previewTextColor: '#F0F0EE',
    previewBg: '#141413',
    config: {
      preset: 'dark',
      fontSize: 24,
      textColor: '#F0F0EE',
      backgroundColor: 'rgba(15, 15, 15, 0.85)',
      outlineColor: '#000000',
      outlineWidth: 0,
      position: 'bottom',
      uppercase: false,
      highlightCurrentWord: false,
    },
  },
  {
    id: 'punch',
    title: 'Punch',
    badge: 'CREATOR',
    category: 'animated',
    previewTextColor: '#FFFFFF',
    previewBg: '#3B1812',
    previewOutline: '2px #E5132B',
    config: {
      preset: 'punch',
      fontSize: 28,
      textColor: '#FFFFFF',
      backgroundColor: '#E5132B',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'middle',
      uppercase: true,
      highlightCurrentWord: false,
    },
  },
  {
    id: 'spotlight',
    title: 'Spotlight',
    badge: 'CREATOR',
    category: 'animated',
    previewTextColor: '#FFEE55',
    previewBg: '#1e201a',
    previewHighlight: '#FFEE55',
    config: {
      preset: 'spotlight',
      fontSize: 26,
      textColor: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      outlineColor: '#000000',
      outlineWidth: 2,
      position: 'bottom',
      uppercase: false,
      highlightCurrentWord: true,
      highlightColor: '#FFDF00',
    },
  },
  {
    id: 'boxed',
    title: 'Reel',
    badge: 'CREATOR',
    category: 'animated',
    previewTextColor: '#FFFFFF',
    previewBg: '#181b24',
    previewOutline: '3px #000',
    config: {
      preset: 'boxed',
      fontSize: 28,
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      outlineColor: '#000000',
      outlineWidth: 3,
      position: 'bottom',
      uppercase: true,
      highlightCurrentWord: false,
    },
  },
  {
    id: 'neon-pop',
    title: 'Neon Pop',
    badge: 'STUDIO',
    category: 'animated',
    previewTextColor: '#00F0FF',
    previewBg: '#121720',
    config: {
      preset: 'neon-pop',
      fontSize: 26,
      textColor: '#00F0FF',
      backgroundColor: 'rgba(0, 10, 20, 0.85)',
      outlineColor: '#003366',
      outlineWidth: 2,
      position: 'bottom',
      uppercase: true,
      highlightCurrentWord: true,
      highlightColor: '#FF007F',
    },
  },
  {
    id: 'noir',
    title: 'Noir',
    badge: 'CREATOR',
    category: 'animated',
    previewTextColor: '#EAEAEA',
    previewBg: '#101010',
    previewOutline: '1px #444',
    config: {
      preset: 'noir',
      fontSize: 22,
      textColor: '#F5F5F7',
      backgroundColor: '#000000',
      outlineColor: '#222222',
      outlineWidth: 1,
      position: 'bottom',
      uppercase: false,
      highlightCurrentWord: false,
    },
  },
  {
    id: 'gold-luxe',
    title: 'Gold Luxe',
    badge: 'STUDIO',
    category: 'animated',
    previewTextColor: '#E6C687',
    previewBg: '#211c14',
    config: {
      preset: 'gold-luxe',
      fontSize: 25,
      textColor: '#F3E5AB',
      backgroundColor: 'rgba(25, 20, 10, 0.85)',
      outlineColor: '#5C4018',
      outlineWidth: 2,
      position: 'bottom',
      uppercase: false,
      highlightCurrentWord: true,
      highlightColor: '#FFD700',
    },
  },
];

export default function TemplateDrawer({ style, onChange }: TemplateDrawerProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'customize'>('presets');

  const applyPreset = (preset: PresetItem) => {
    onChange({
      ...style,
      ...preset.config,
    });
  };

  const templatesList = PRESET_LIBRARY.filter((p) => p.category === 'templates');
  const animatedList = PRESET_LIBRARY.filter((p) => p.category === 'animated');

  return (
    <div className="flex flex-col h-full bg-[#141413] border-l border-white/10 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
        <h2 className="text-xs font-bold text-mist uppercase tracking-widest">
          Templates
        </h2>

        {/* Tab switcher: Presets vs Customize */}
        <div className="flex bg-[#1d1d1b] p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
              activeTab === 'presets'
                ? 'bg-[#292826] text-amber-300 shadow-sm'
                : 'text-smoke hover:text-bone'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
              activeTab === 'customize'
                ? 'bg-[#292826] text-amber-300 shadow-sm'
                : 'text-smoke hover:text-bone'
            }`}
          >
            Customize
          </button>
        </div>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" data-lenis-prevent>
        {activeTab === 'presets' ? (
          <>
            {/* Standard templates section */}
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-smoke uppercase mb-2.5">
                Templates
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {templatesList.map((item) => (
                  <PresetCard
                    key={item.id}
                    item={item}
                    isSelected={style.preset === item.id}
                    onSelect={() => applyPreset(item)}
                  />
                ))}
              </div>
            </div>

            {/* Animated templates section */}
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-smoke uppercase mb-2.5">
                Animated
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {animatedList.map((item) => (
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
          /* Fine-tune customize controls */
          <div className="space-y-5 text-xs text-mist">
            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-medium text-bone">Font Size</label>
                <span className="font-mono text-amber-300 text-xs">{style.fontSize}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={44}
                value={style.fontSize}
                onChange={(e) => onChange({ ...style, fontSize: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Position */}
            <div>
              <label className="font-medium text-bone block mb-2">Screen Position</label>
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

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-smoke text-[11px] mb-1.5">Text Color</label>
                <div className="flex items-center gap-2 bg-[#1c1c1a] p-2 rounded-xl border border-white/10">
                  <input
                    type="color"
                    value={style.textColor.startsWith('#') ? style.textColor : '#ffffff'}
                    onChange={(e) => onChange({ ...style, textColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-bone uppercase">{style.textColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-smoke text-[11px] mb-1.5">Background</label>
                <div className="flex items-center gap-2 bg-[#1c1c1a] p-2 rounded-xl border border-white/10">
                  <input
                    type="color"
                    value={style.backgroundColor.startsWith('#') ? style.backgroundColor : '#000000'}
                    onChange={(e) => onChange({ ...style, backgroundColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-bone uppercase">Badge</span>
                </div>
              </div>
            </div>

            {/* Karaoke Word-Highlighting Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1a] border border-white/10 mt-3">
              <div>
                <div className="text-bone font-medium">Word Karaoke Glow</div>
                <div className="text-smoke text-[11px]">Highlights the spoken word in real-time</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...style, highlightCurrentWord: !style.highlightCurrentWord })
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  style.highlightCurrentWord ? 'bg-amber-400' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                    style.highlightCurrentWord ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Uppercase toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1c1c1a] border border-white/10">
              <div>
                <div className="text-bone font-medium">All Caps (UPPERCASE)</div>
                <div className="text-smoke text-[11px]">Great for bold commercial reel hooks</div>
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
      className={`relative text-left p-2.5 rounded-xl transition-all duration-150 flex flex-col justify-between group ${
        isSelected
          ? 'bg-[#242320] border-2 border-amber-400 shadow-md ring-1 ring-amber-400/40'
          : 'bg-[#1b1b19] border border-white/10 hover:border-white/25 hover:bg-[#20201e]'
      }`}
    >
      {/* Visual Subtitle Preview Badge */}
      <div
        className="w-full h-14 rounded-lg flex items-center justify-center p-2 mb-2 relative overflow-hidden"
        style={{ backgroundColor: item.previewBg }}
      >
        <span
          className="font-bold text-xs truncate max-w-[95%] tracking-wide"
          style={{
            color: item.previewTextColor,
            textShadow: item.previewOutline ? '0 1px 3px rgba(0,0,0,0.9)' : undefined,
          }}
        >
          {item.previewHighlight ? (
            <>
              sy ga <span style={{ color: item.previewHighlight }}>chesukovad</span>
            </>
          ) : (
            'sy ga chesukovac'
          )}
        </span>
      </div>

      {/* Label and Badge */}
      <div className="flex items-center justify-between w-full mt-0.5">
        <span className="text-xs font-semibold text-bone group-hover:text-amber-300 transition-colors">
          {item.title}
        </span>
        {item.badge && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-mist tracking-wider">
            {item.badge}
          </span>
        )}
      </div>
    </button>
  );
}
