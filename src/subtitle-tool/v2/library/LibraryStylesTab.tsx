// ─── LibraryStylesTab — Epic Hertz Studio v2 ──────────────────────────────────
import React, { useState } from 'react';
import { Search, Heart } from 'lucide-react';
import type { Segment, CaptionStyle } from '../../types';
import { PRESETS } from '../../engine/presets';
import StyleThumbnail from '../StyleThumbnail';
import { toggleFavoritePresetId, type UserPreset } from '../userPresets';

export interface LibraryStylesTabProps {
  style: CaptionStyle;
  sampleSegment: Segment;
  userPresetsList: UserPreset[];
  favorites: string[];
  onFavoritesChange: (favs: string[]) => void;
  onApplyPreset: (targetStyle: CaptionStyle, name: string) => void;
}

export const LibraryStylesTab: React.FC<LibraryStylesTabProps> = ({
  style,
  sampleSegment,
  userPresetsList,
  favorites,
  onFavoritesChange,
  onApplyPreset,
}) => {
  const [search, setSearch] = useState('');
  const [styleCategory, setStyleCategory] = useState<string>('All');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-smoke absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search styles (Pulse, Block, Neon)…"
          className="w-full bg-[#171716] border border-white/10 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none"
        />
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {['All', 'Yours', 'Favourites', 'Viral', 'Kinetic', 'Glow & colour', 'Film & clean'].map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setStyleCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors shrink-0 cursor-pointer ${
                styleCategory === cat
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ),
        )}
      </div>

      {/* Style Cards Grid (3-columns: small icons, 3 in a line) */}
      <div className="grid grid-cols-3 gap-2">
        {/* User presets if in 'All' or 'Yours' */}
        {(styleCategory === 'All' || styleCategory === 'Yours') &&
          userPresetsList.map((up) => (
            <div
              key={up.id}
              onClick={() => onApplyPreset(up.style, up.name)}
              onMouseEnter={() => setHoveredPresetId(up.id)}
              onMouseLeave={() => setHoveredPresetId(null)}
              title={up.name}
              className="group relative rounded-lg bg-[#181817] border border-amber-400/30 hover:border-amber-400 p-1.5 cursor-pointer transition-all hover:scale-102 flex flex-col gap-1 shadow-xs"
            >
              <StyleThumbnail
                style={up.style}
                sampleSegment={sampleSegment}
                isHovered={hoveredPresetId === up.id}
              />
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-bone truncate leading-tight">
                  {up.name}
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono shrink-0">
                  Yours
                </span>
              </div>
            </div>
          ))}

        {/* Engine Presets */}
        {PRESETS.filter((p) => {
          const matchSearch =
            p.style.name.toLowerCase().includes(search.toLowerCase()) ||
            p.blurb.toLowerCase().includes(search.toLowerCase());
          if (!matchSearch) return false;
          if (styleCategory === 'All') return true;
          if (styleCategory === 'Favourites') return favorites.includes(p.style.id);
          if (styleCategory === 'Yours') return false;
          return p.group.toLowerCase().includes(styleCategory.toLowerCase());
        }).map((p) => {
          const isFav = favorites.includes(p.style.id);
          const isSelected = style.id === p.style.id;

          return (
            <div
              key={p.style.id}
              onClick={() => onApplyPreset(p.style, p.style.name)}
              onMouseEnter={() => setHoveredPresetId(p.style.id)}
              onMouseLeave={() => setHoveredPresetId(null)}
              title={`${p.style.name}: ${p.blurb}`}
              className={`group relative rounded-lg bg-[#181817] border p-1.5 cursor-pointer transition-all hover:scale-102 flex flex-col gap-1 shadow-xs ${
                isSelected
                  ? 'border-amber-400 ring-1 ring-amber-400/40 bg-amber-400/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <StyleThumbnail
                style={p.style}
                sampleSegment={sampleSegment}
                isHovered={hoveredPresetId === p.style.id}
              />

              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-bone truncate leading-tight">
                  {p.style.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoritesChange(toggleFavoritePresetId(p.style.id));
                  }}
                  className="p-0.5 rounded text-smoke hover:text-amber-400 shrink-0 cursor-pointer"
                  title={isFav ? 'Favorited' : 'Add to favorites'}
                >
                  <Heart
                    className={`w-3 h-3 ${
                      isFav ? 'fill-amber-400 text-amber-400' : 'text-smoke/60'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryStylesTab;
