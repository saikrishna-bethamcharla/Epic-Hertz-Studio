// ─── LibraryTitleCardsTab — Epic Hertz Studio v2 ──────────────────────────────
// Dedicated library section for cinematic Title Cards & End Cards:
// - 12 cinematic full-frame presets (6 opening/chapter cards + 6 end cards/credits)
// - Sub-filter chips: All (12), Title Cards (6), End Cards (6)
// - Real-time animated hover preview with LowerThirdThumbnail
// - Instant click-to-add at playhead or swap onto selected card

import { useState, useMemo } from 'react';
import { Search, Clapperboard, Film, Check, Sparkles } from 'lucide-react';
import { TITLE_END_TEMPLATES } from '../../engine/title-end-cards';
import type { LowerThirdTemplate } from '../../engine/lowerThirdSchema';
import type { LowerThirdSpec } from '../../engine/spec';
import { DEFAULT_LOWER_THIRD } from '../../engine/spec';
import LowerThirdThumbnail from './LowerThirdThumbnail';
import { nanoid } from 'nanoid';

export interface LibraryTitleCardsTabProps {
  currentTime: number;
  selectedLowerThirdId?: string | null;
  selectedLowerThirdSpec?: LowerThirdSpec | null;
  onAddLowerThird: (spec: LowerThirdSpec) => void;
  onUpdateLowerThird?: (spec: LowerThirdSpec) => void;
  onAddMultipleLowerThirds?: (specs: LowerThirdSpec[]) => void;
}

type FilterCategory = 'all' | 'Title Card' | 'End Card';

export default function LibraryTitleCardsTab({
  currentTime,
  selectedLowerThirdId,
  selectedLowerThirdSpec,
  onAddLowerThird,
  onUpdateLowerThird,
}: LibraryTitleCardsTabProps) {
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const titleCardsCount = useMemo(
    () => TITLE_END_TEMPLATES.filter((t) => t.category === 'Title Card').length,
    [],
  );
  const endCardsCount = useMemo(
    () => TITLE_END_TEMPLATES.filter((t) => t.category === 'End Card').length,
    [],
  );

  const filteredTemplates = useMemo(() => {
    return TITLE_END_TEMPLATES.filter((tmpl) => {
      if (filterCategory !== 'all' && tmpl.category !== filterCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = tmpl.name.toLowerCase().includes(q);
      const matchCategory = tmpl.category.toLowerCase().includes(q);
      const matchTag = tmpl.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchCategory || matchTag;
    });
  }, [filterCategory, searchQuery]);

  const handleTemplateClick = (template: LowerThirdTemplate) => {
    if (selectedLowerThirdId && selectedLowerThirdSpec && onUpdateLowerThird) {
      // Swap template on currently selected card (preserves user text)
      onUpdateLowerThird({
        ...selectedLowerThirdSpec,
        templateId: template.id,
      });
      setAppliedTemplateId(template.id);
      setTimeout(() => setAppliedTemplateId(null), 1500);
    } else {
      // Add new title/end card at playhead (4s default duration)
      const newSpec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: nanoid(),
        templateId: template.id,
        name: template.category === 'End Card' ? 'THE END' : 'EPIC TITLE',
        role: template.category === 'End Card' ? 'Thank You For Watching' : 'A Film By Director',
        start: currentTime,
        end: currentTime + 4.0,
      };
      onAddLowerThird(newSpec);
      setAppliedTemplateId(template.id);
      setTimeout(() => setAppliedTemplateId(null), 1500);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#141413]">
      {/* Search Header */}
      <div className="p-3 border-b border-white/10 flex flex-col gap-2 shrink-0 bg-[#121211]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 12 title & end cards..."
            aria-label="Search title cards"
            className="w-full bg-[#18181b] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Feature Blurb */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-xs text-amber-200">
          <Clapperboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] leading-snug">
            Full-frame movie titles, chapter headers, credits & ending cards.
          </span>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="px-3 py-2 border-b border-white/10 shrink-0 flex items-center gap-1.5 bg-[#121211]/50">
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            filterCategory === 'all'
              ? 'bg-amber-400 text-black'
              : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
          }`}
        >
          All ({TITLE_END_TEMPLATES.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('Title Card')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
            filterCategory === 'Title Card'
              ? 'bg-amber-400 text-black'
              : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
          }`}
        >
          <Film className="w-2.5 h-2.5" />
          <span>Title Cards ({titleCardsCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('End Card')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
            filterCategory === 'End Card'
              ? 'bg-amber-400 text-black'
              : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>End Cards ({endCardsCount})</span>
        </button>
      </div>

      {/* Grid of Title & End Cards */}
      <div className="flex-1 overflow-y-auto p-3">
        {selectedLowerThirdId && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-between text-xs text-amber-200">
            <span className="truncate">Editing card. Click template to swap style.</span>
            <Clapperboard className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
          </div>
        )}

        {filteredTemplates.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-smoke text-xs">
            <p>No title cards match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredTemplates.map((template) => {
              const isSelected =
                selectedLowerThirdSpec?.templateId === template.id ||
                appliedTemplateId === template.id;

              return (
                <div key={template.id} className="relative group/card">
                  <LowerThirdThumbnail
                    template={template}
                    isSelected={isSelected}
                    onSelect={() => handleTemplateClick(template)}
                  />
                  {appliedTemplateId === template.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-lg pointer-events-none">
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-400 text-black text-[10px] font-bold shadow-lg">
                        <Check className="w-3 h-3" />
                        APPLIED
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
