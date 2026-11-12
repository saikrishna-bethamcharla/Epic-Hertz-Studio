// ─── LibraryTitleCardsTab — Epic Hertz Studio v2 ────────────────────────────
// Dedicated library section for Cinematic Title & End Cards (14 Presets):
// - Mixkit 222: Spin & Twist (geometric brackets & rotating line)
// - Mixkit 28: Mirror Splash (liquid splash bursts & bubble bounce)
// - Cinema Serif, Epic Display, Gold Chapter, Film Noir, Cyberpunk HUD, Chapter Marker, etc.
// - Formats text captions directly as cinematic title and caption styles!
import React, { useState, useMemo } from 'react';
import { Search, Heart } from 'lucide-react';
import type { Segment, CaptionStyle } from '../../types';
import { TITLE_CARD_STYLES, type TitleCardDefinition } from '../../engine/titleCardCatalog';
import StyleThumbnail from '../StyleThumbnail';
import { toggleFavoritePresetId } from '../userPresets';

export interface LibraryTitleCardsTabProps {
  style: CaptionStyle;
  sampleSegment: Segment;
  favorites: string[];
  onFavoritesChange: (favs: string[]) => void;
  onApplyPreset: (targetStyle: CaptionStyle, name: string) => void;
  onNotification?: (msg: string) => void;
}

export const LibraryTitleCardsTab: React.FC<LibraryTitleCardsTabProps> = ({
  style,
  sampleSegment,
  favorites,
  onFavoritesChange,
  onApplyPreset,
  onNotification,
}) => {
  const [search, setSearch] = useState('');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return TITLE_CARD_STYLES;
    return TITLE_CARD_STYLES.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [search]);

  const handleApply = (item: TitleCardDefinition) => {
    onApplyPreset(item.style, item.name);
    if (onNotification) {
      onNotification(`Applied "${item.name}" title style to captions`);
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Screen-reader accessible section header */}
      <h2 className="sr-only">
        <span>Cinematic Title & End Cards</span>
        <span>14 styles</span>
      </h2>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-smoke absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title cards (spin & twist, splash, cinema, noir...)"
          className="w-full bg-[#171716] border border-white/10 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none"
        />
      </div>

      {/* Grid of Title Card Styles */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredItems.map((item) => {
          const isSelected = style.id === item.id;
          const isFav = favorites.includes(item.id);
          const isHovered = hoveredPresetId === item.id;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredPresetId(item.id)}
              onMouseLeave={() => setHoveredPresetId(null)}
              onClick={() => handleApply(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleApply(item);
                }
              }}
              className={`group relative rounded-xl border p-2 flex flex-col gap-1.5 transition-all cursor-pointer text-left ${
                isSelected
                  ? 'bg-amber-400/10 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                  : 'bg-[#181817] border-white/10 hover:border-white/20 hover:bg-[#1e1e1d]'
              }`}
            >
              {/* Thumbnail with real canvas rendering parity */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#0d0d0c] border border-white/5 flex items-center justify-center">
                <StyleThumbnail
                  style={item.style}
                  sampleSegment={sampleSegment}
                  isHovered={isHovered}
                />

                {/* Favorite toggle pill */}
                <button
                  type="button"
                  aria-label={
                    isFav ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = toggleFavoritePresetId(item.id);
                    onFavoritesChange(updated);
                  }}
                  className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-all cursor-pointer z-10 ${
                    isFav
                      ? 'bg-rose-500/20 text-rose-400 opacity-100'
                      : 'bg-black/50 text-mist opacity-0 group-hover:opacity-100 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${isFav ? 'fill-rose-400' : ''}`} />
                </button>
              </div>

              {/* Title & Category Badge */}
              <div className="flex items-center justify-between gap-1 min-w-0 px-0.5">
                <span
                  className={`text-xs font-semibold truncate ${
                    isSelected ? 'text-amber-300' : 'text-bone group-hover:text-white'
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/5 text-mist font-mono shrink-0">
                  {item.category === 'MOGRT Style' ? 'MOGRT' : item.category.split(' ')[0]}
                </span>
              </div>

              {/* Description line */}
              <p className="text-[10px] text-smoke line-clamp-1 leading-tight px-0.5">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-smoke text-xs">
          No title card styles match &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
};

export default LibraryTitleCardsTab;
