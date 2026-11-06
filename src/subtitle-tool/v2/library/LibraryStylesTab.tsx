// ─── LibraryStylesTab — Epic Hertz Studio v2 ──────────────────────────────────
import React, { useState, useMemo, useRef } from 'react';
import { Search, Heart, Download, Upload, Trash2 } from 'lucide-react';
import type { Segment, CaptionStyle } from '../../types';
import { PRESETS } from '../../engine/presets';
import { CAPTION_TEMPLATES } from '../../engine/templateCatalog';
import { templateToStyle } from '../../engine/templateSchema';
import StyleThumbnail from '../StyleThumbnail';
import {
  toggleFavoritePresetId,
  exportTemplatePackAsJson,
  importTemplatePackFromJson,
  getUserPresets,
  deleteUserPreset,
  type UserPreset,
} from '../userPresets';

export interface LibraryStylesTabProps {
  style: CaptionStyle;
  sampleSegment: Segment;
  userPresetsList: UserPreset[];
  favorites: string[];
  onFavoritesChange: (favs: string[]) => void;
  onApplyPreset: (targetStyle: CaptionStyle, name: string) => void;
  onUserPresetsChange?: (presets: UserPreset[]) => void;
  onNotification?: (msg: string) => void;
}

const CATEGORIES = [
  'All',
  'Yours',
  'Favourites',
  'Social',
  'Minimal',
  'Fun',
  'Gaming',
  'Cinematic',
  'Bold',
  'Podcast',
  'Motivational',
  'News',
  'Devotional',
] as const;

export const LibraryStylesTab: React.FC<LibraryStylesTabProps> = ({
  style,
  sampleSegment,
  userPresetsList,
  favorites,
  onFavoritesChange,
  onApplyPreset,
  onUserPresetsChange,
  onNotification,
}) => {
  const [search, setSearch] = useState('');
  const [styleCategory, setStyleCategory] = useState<string>('All');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-convert 40 catalog templates into CaptionStyle instances for rendering and application
  const templateItems = useMemo(() => {
    return CAPTION_TEMPLATES.map((t) => ({
      template: t,
      style: templateToStyle(t),
    }));
  }, []);

  const filteredTemplates = useMemo(() => {
    return templateItems.filter(({ template }) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        (template.description || '').toLowerCase().includes(q) ||
        template.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        template.category.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (styleCategory === 'All') return true;
      if (styleCategory === 'Favourites') return favorites.includes(template.id);
      if (styleCategory === 'Yours') return false;
      return template.category.toLowerCase() === styleCategory.toLowerCase();
    });
  }, [templateItems, search, styleCategory, favorites]);

  const filteredUserPresets = useMemo(() => {
    if (styleCategory !== 'All' && styleCategory !== 'Yours') return [];
    return userPresetsList.filter((up) => {
      const q = search.toLowerCase().trim();
      return !q || up.name.toLowerCase().includes(q);
    });
  }, [userPresetsList, search, styleCategory]);

  const filteredLegacyPresets = useMemo(() => {
    if (styleCategory === 'Yours') return [];
    return PRESETS.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q || p.style.name.toLowerCase().includes(q) || p.blurb.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (styleCategory === 'All') return true;
      if (styleCategory === 'Favourites') return favorites.includes(p.style.id);
      return p.group.toLowerCase().includes(styleCategory.toLowerCase());
    });
  }, [search, styleCategory, favorites]);

  const handleExportPack = () => {
    const json = exportTemplatePackAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caption-templates-pack-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotification) onNotification('Template pack exported as JSON');
  };

  const handleImportPack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importTemplatePackFromJson(text);
      if (res.errors.length > 0) {
        if (onNotification) onNotification(`Import failed: ${res.errors[0]}`);
      } else {
        const updated = getUserPresets();
        if (onUserPresetsChange) onUserPresetsChange(updated);
        if (onNotification) onNotification(`Imported ${res.importedCount} templates successfully`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteUserPreset = (id: string, name: string) => {
    const updated = deleteUserPreset(id);
    if (onUserPresetsChange) onUserPresetsChange(updated);
    if (onNotification) onNotification(`Deleted preset "${name}"`);
  };

  const totalResultsCount =
    filteredUserPresets.length + filteredTemplates.length + filteredLegacyPresets.length;

  return (
    <div className="space-y-3">
      {/* Top Pack Actions (Import / Export) */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
        <span className="text-[10px] font-medium text-smoke uppercase tracking-wider">
          Templates & Presets
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportPack}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-mist hover:text-bone bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Import template pack JSON"
          >
            <Upload className="w-2.5 h-2.5" />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={handleExportPack}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-mist hover:text-bone bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Export all templates as JSON pack"
          >
            <Download className="w-2.5 h-2.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-smoke absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search styles and templates..."
          className="w-full bg-[#171716] border border-white/10 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none"
        />
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {CATEGORIES.map((cat) => (
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
        ))}
      </div>

      {/* Style Cards Grid (3-columns: clean cards with animated thumbnail preview) */}
      {totalResultsCount === 0 ? (
        <div className="py-8 text-center text-xs text-smoke">
          No templates match your search or filter.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {/* User presets */}
          {filteredUserPresets.map((up) => (
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUserPreset(up.id, up.name);
                  }}
                  className="p-0.5 rounded text-smoke hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete preset"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}

          {/* 40 Animated Caption Templates */}
          {filteredTemplates.map(({ template, style: tStyle }) => {
            const isFav = favorites.includes(template.id);
            const isSelected = style.id === tStyle.id || style.name === template.name;

            return (
              <div
                key={template.id}
                onClick={() => onApplyPreset(tStyle, template.name)}
                onMouseEnter={() => setHoveredPresetId(template.id)}
                onMouseLeave={() => setHoveredPresetId(null)}
                title={`${template.name}${template.description ? `: ${template.description}` : ''}`}
                className={`group relative rounded-lg bg-[#181817] border p-1.5 cursor-pointer transition-all hover:scale-102 flex flex-col gap-1 shadow-xs ${
                  isSelected
                    ? 'border-amber-400 ring-1 ring-amber-400/40 bg-amber-400/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <StyleThumbnail
                  style={tStyle}
                  sampleSegment={sampleSegment}
                  isHovered={hoveredPresetId === template.id}
                />

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-bone truncate leading-tight">
                    {template.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavoritesChange(toggleFavoritePresetId(template.id));
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

          {/* Legacy Presets */}
          {filteredLegacyPresets.map((p) => {
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
      )}
    </div>
  );
};

export default LibraryStylesTab;
