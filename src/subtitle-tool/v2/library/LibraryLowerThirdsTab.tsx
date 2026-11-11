// ─── LibraryLowerThirdsTab — Epic Hertz Studio v2 ────────────────────────────
// Dedicated library tab for lower third templates:
// - Pack filter chips (All, Favorites, and 6 packs)
// - Search filter
// - Animated hover previews using real renderer
// - Add at playhead (4s default) or Apply to selected lower third (keeps text)
// - Speaker roster paste helper
// - Import/Export packs

import { useState, useMemo } from 'react';
import { Search, Layers, Users, FileJson, Check } from 'lucide-react';
import { ALL_PACK_TEMPLATES, LOWER_THIRD_PACKS } from '../../engine/lowerThirdPacks';
import type { LowerThirdTemplate, LowerThirdPack } from '../../engine/lowerThirdSchema';
import type { LowerThirdSpec } from '../../engine/spec';
import { DEFAULT_LOWER_THIRD } from '../../engine/spec';
import LowerThirdThumbnail from './LowerThirdThumbnail';
import SpeakerListModal from './SpeakerListModal';
import PackImportExportModal from './PackImportExportModal';
import { nanoid } from 'nanoid';

interface LibraryLowerThirdsTabProps {
  currentTime: number;
  selectedLowerThirdId?: string | null;
  selectedLowerThirdSpec?: LowerThirdSpec | null;
  onAddLowerThird: (spec: LowerThirdSpec) => void;
  onUpdateLowerThird?: (spec: LowerThirdSpec) => void;
  onAddMultipleLowerThirds?: (specs: LowerThirdSpec[]) => void;
  excludePackId?: string;
}

export default function LibraryLowerThirdsTab({
  currentTime,
  selectedLowerThirdId,
  selectedLowerThirdSpec,
  onAddLowerThird,
  onUpdateLowerThird,
  onAddMultipleLowerThirds,
  excludePackId,
}: LibraryLowerThirdsTabProps) {
  const [selectedPackId, setSelectedPackId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<LowerThirdTemplate[]>([]);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const packs = useMemo(() => {
    return excludePackId
      ? LOWER_THIRD_PACKS.filter((p) => p.id !== excludePackId)
      : LOWER_THIRD_PACKS;
  }, [excludePackId]);

  // Combine built-in templates with custom imported templates
  const allTemplates = useMemo(() => {
    const base = excludePackId
      ? ALL_PACK_TEMPLATES.filter((t) => t.packId !== excludePackId)
      : ALL_PACK_TEMPLATES;
    return [...base, ...customTemplates];
  }, [customTemplates, excludePackId]);

  // Filter templates by pack and search query
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((tmpl) => {
      if (selectedPackId !== 'all' && tmpl.packId !== selectedPackId) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = tmpl.name.toLowerCase().includes(q);
      const matchCategory = tmpl.category.toLowerCase().includes(q);
      const matchTag = tmpl.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchCategory || matchTag;
    });
  }, [allTemplates, selectedPackId, searchQuery]);

  const handleTemplateClick = (template: LowerThirdTemplate) => {
    if (selectedLowerThirdId && selectedLowerThirdSpec && onUpdateLowerThird) {
      // Apply template to currently selected lower third (preserves text)
      onUpdateLowerThird({
        ...selectedLowerThirdSpec,
        templateId: template.id,
      });
      setAppliedTemplateId(template.id);
      setTimeout(() => setAppliedTemplateId(null), 1500);
    } else {
      // Add new lower third at playhead (4s default length)
      const newSpec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: nanoid(),
        templateId: template.id,
        start: currentTime,
        end: currentTime + 4.0,
      };
      onAddLowerThird(newSpec);
      setAppliedTemplateId(template.id);
      setTimeout(() => setAppliedTemplateId(null), 1500);
    }
  };

  const handleImportPack = (pack: LowerThirdPack) => {
    setCustomTemplates((prev) => [...prev, ...pack.templates]);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#141413]">
      {/* Top Controls: Search & Action Buttons */}
      <div className="p-3 border-b border-white/10 flex flex-col gap-2 shrink-0 bg-[#121211]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${allTemplates.length} lower thirds...`}
            aria-label="Search lower third templates"
            className="w-full bg-[#18181b] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => setIsSpeakerModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-medium text-smoke hover:text-bone border border-white/5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Paste Roster</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImportExportOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-medium text-smoke hover:text-bone border border-white/5 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>Packs / JSON</span>
          </button>
        </div>
      </div>

      {/* Pack Filter Chips */}
      <div className="px-3 py-2 border-b border-white/10 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-[#121211]/50">
        <button
          type="button"
          onClick={() => setSelectedPackId('all')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
            selectedPackId === 'all'
              ? 'bg-amber-400 text-black'
              : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
          }`}
        >
          All ({allTemplates.length})
        </button>
        {packs.map((pack) => {
          const isActive = selectedPackId === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => setSelectedPackId(pack.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-400 text-black'
                  : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
              }`}
            >
              {pack.name}
            </button>
          );
        })}
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {selectedLowerThirdId && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-between text-xs text-amber-200">
            <span className="truncate">Editing lower third. Click template to swap style.</span>
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
          </div>
        )}

        {filteredTemplates.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-smoke text-xs">
            <p>No lower thirds match "{searchQuery}"</p>
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

      {/* Modals */}
      <SpeakerListModal
        isOpen={isSpeakerModalOpen}
        onClose={() => setIsSpeakerModalOpen(false)}
        currentTime={currentTime}
        onAddLowerThirds={(specs) => {
          if (onAddMultipleLowerThirds) {
            onAddMultipleLowerThirds(specs);
          } else if (specs[0]) {
            onAddLowerThird(specs[0]);
          }
        }}
      />

      <PackImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportPack={handleImportPack}
      />
    </div>
  );
}
