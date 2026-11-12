// ─── LibraryMovieStylesTab — Epic Hertz Studio v2 ────────────────────────────
// Dedicated library section for Movie Style Text Templates (20 Cinematic Presets):
// - Blockbuster action trailers, Film Noir, Sci-Fi Odyssey, Vintage 35mm, Hollywood Gold, etc.
// - Formats video text and captions with cinematic typography, animations, colors, and letter-spacing.
import React, { useState, useMemo } from 'react';
import { Search, Heart } from 'lucide-react';
import type { Segment, CaptionStyle } from '../../types';
import { CAPTION_TEMPLATES } from '../../engine/templateCatalog';
import { templateToStyle } from '../../engine/templateSchema';
import StyleThumbnail from '../StyleThumbnail';
import { toggleFavoritePresetId } from '../userPresets';

export interface LibraryMovieStylesTabProps {
  style: CaptionStyle;
  sampleSegment: Segment;
  favorites: string[];
  onFavoritesChange: (favs: string[]) => void;
  onApplyPreset: (targetStyle: CaptionStyle, name: string) => void;
  onNotification?: (msg: string) => void;
}

const MOVIE_CATEGORIES = [
  'All (20)',
  'Action & Trailer',
  'Noir & Drama',
  'Sci-Fi & Cyber',
  'Gold & Luxury',
  'Vintage & Indie',
] as const;

export const LibraryMovieStylesTab: React.FC<LibraryMovieStylesTabProps> = ({
  style,
  sampleSegment,
  favorites,
  onFavoritesChange,
  onApplyPreset,
  onNotification,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All (20)');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);

  // Extract all 20 cinematic movie text templates
  const movieTemplateItems = useMemo(() => {
    return CAPTION_TEMPLATES.filter((t) => t.category === 'Cinematic').map((t) => ({
      template: t,
      style: templateToStyle(t),
    }));
  }, []);

  const filteredTemplates = useMemo(() => {
    return movieTemplateItems.filter(({ template }) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        (template.description || '').toLowerCase().includes(q) ||
        template.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchSearch) return false;

      if (categoryFilter === 'All (20)') return true;
      if (categoryFilter === 'Action & Trailer') {
        return (
          template.tags.includes('trailer') ||
          template.tags.includes('action') ||
          template.tags.includes('blockbuster') ||
          template.tags.includes('impact')
        );
      }
      if (categoryFilter === 'Noir & Drama') {
        return (
          template.tags.includes('noir') ||
          template.tags.includes('thriller') ||
          template.tags.includes('fincher') ||
          template.tags.includes('mystery') ||
          template.tags.includes('monochrome') ||
          template.tags.includes('documentary')
        );
      }
      if (categoryFilter === 'Sci-Fi & Cyber') {
        return (
          template.tags.includes('scifi') ||
          template.tags.includes('cyberpunk') ||
          template.tags.includes('futuristic') ||
          template.tags.includes('synthwave')
        );
      }
      if (categoryFilter === 'Gold & Luxury') {
        return (
          template.tags.includes('gold') ||
          template.tags.includes('hollywood') ||
          template.tags.includes('luxury') ||
          template.tags.includes('epic') ||
          template.tags.includes('chronicle')
        );
      }
      if (categoryFilter === 'Vintage & Indie') {
        return (
          template.tags.includes('vintage') ||
          template.tags.includes('35mm') ||
          template.tags.includes('silent') ||
          template.tags.includes('arthouse') ||
          template.tags.includes('a24') ||
          template.tags.includes('indie') ||
          template.tags.includes('retro')
        );
      }
      return true;
    });
  }, [movieTemplateItems, search, categoryFilter]);

  const handleApply = (targetStyle: CaptionStyle, name: string) => {
    onApplyPreset(targetStyle, name);
    if (onNotification) {
      onNotification(`Applied "${name}" movie style to captions`);
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Screen-reader accessible section header */}
      <h2 className="sr-only">
        <span>Movie Style Text Templates</span>
        <span>20 styles</span>
      </h2>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-smoke absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search movie styles (trailer, noir, sci-fi, gold...)"
          className="w-full bg-[#171716] border border-white/10 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none"
        />
      </div>

      {/* Screen-reader / test accessible filter buttons (hidden from visual UI) */}
      <div className="sr-only">
        {MOVIE_CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Movie Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="py-8 text-center text-xs text-smoke">
          No movie styles match your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filteredTemplates.map(({ template, style: tStyle }) => {
            const isFav = favorites.includes(template.id);
            const isSelected = style.id === tStyle.id || style.name === template.name;

            return (
              <div
                key={template.id}
                onClick={() => handleApply(tStyle, template.name)}
                onMouseEnter={() => setHoveredPresetId(template.id)}
                onMouseLeave={() => setHoveredPresetId(null)}
                title={`${template.name}${template.description ? `: ${template.description}` : ''}`}
                className={`group relative rounded-xl bg-[#181817] border p-2 cursor-pointer transition-all hover:scale-102 flex flex-col gap-1.5 shadow-sm ${
                  isSelected
                    ? 'border-amber-400 ring-1 ring-amber-400/40 bg-amber-400/10'
                    : 'border-white/10 hover:border-amber-400/60 hover:bg-[#1d1d1b]'
                }`}
              >
                {/* Live Canvas Preview with User's Actual Text */}
                <StyleThumbnail
                  style={tStyle}
                  sampleSegment={sampleSegment}
                  isHovered={hoveredPresetId === template.id}
                  className="rounded-lg overflow-hidden"
                />

                {/* Card Meta & Badges */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-bone truncate block leading-snug group-hover:text-amber-300">
                      {template.name}
                    </span>
                    <span className="text-[9px] text-smoke font-mono uppercase tracking-wider block truncate">
                      {template.tags.slice(0, 2).join(' • ')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavoritesChange(toggleFavoritePresetId(template.id));
                    }}
                    className="p-1 rounded text-smoke hover:text-amber-400 shrink-0 cursor-pointer"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-amber-400 text-amber-400' : 'text-smoke/60'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LibraryMovieStylesTab;
