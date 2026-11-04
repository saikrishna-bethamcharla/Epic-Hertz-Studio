// ─── Font Popover — Epic Hertz Studio v2 ──────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, Upload, Loader2, Check } from 'lucide-react';
import { FONT_FAMILIES, SCRIPT_FONTS } from '../engine/spec';
import { ensureFamily } from '../engine/fonts';

interface FontPopoverProps {
  currentFamilyId: string;
  onSelectFamily: (id: string) => void;
  onClose: () => void;
  onGoToBrand?: () => void;
}

const FAVORITE_FONTS_KEY = 'ehs.favorite_fonts.v2';
const RECENT_FONTS_KEY = 'ehs.recent_fonts.v2';

function getFavoriteFonts(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_FONTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ['montserrat', 'anton', 'poppins'];
}

function getRecentFonts(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_FONTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ['montserrat', 'anton', 'inter'];
}

export default function FontPopover({
  currentFamilyId,
  onSelectFamily,
  onClose,
  onGoToBrand,
}: FontPopoverProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>(() => getFavoriteFonts());
  const [recents, setRecents] = useState<string[]>(() => getRecentFonts());
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [onClose]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITE_FONTS_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleSelect = async (id: string) => {
    // Record recent
    const nextRecents = [id, ...recents.filter((r) => r !== id)].slice(0, 8);
    setRecents(nextRecents);
    try {
      localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(nextRecents));
    } catch {}

    setLoadingMap((prev) => ({ ...prev, [id]: true }));
    try {
      await ensureFamily(id);
    } catch (e) {
      console.warn('Font load warning:', e);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [id]: false }));
      onSelectFamily(id);
      onClose();
    }
  };

  // Filter fonts
  const groups = ['All', 'Favorites', 'Recent', 'Sans', 'Display', 'Serif', 'Comic', 'Indic'];

  const filteredFonts = FONT_FAMILIES.filter((f) => {
    const matchesSearch =
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.group.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (activeGroup === 'All') return true;
    if (activeGroup === 'Favorites') return favorites.includes(f.id);
    if (activeGroup === 'Recent') return recents.includes(f.id);
    if (activeGroup === 'Indic') return false; // Indic section handled below
    return f.group.toLowerCase() === activeGroup.toLowerCase();
  });

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full mt-1.5 z-50 w-80 max-h-[420px] flex flex-col rounded-xl bg-[#1c1c1b] border border-white/15 shadow-2xl p-3 text-xs text-bone animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-smoke pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search font families…"
          className="w-full bg-[#141413] border border-white/15 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-white/10 mb-2 no-scrollbar shrink-0">
        {groups.map((grp) => (
          <button
            key={grp}
            type="button"
            onClick={() => setActiveGroup(grp)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors shrink-0 ${
              activeGroup === grp
                ? 'bg-amber-400 text-black'
                : 'bg-white/5 text-smoke hover:text-bone hover:bg-white/10'
            }`}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* Font Family List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-64" data-lenis-prevent>
        {activeGroup === 'Indic' ? (
          <div className="space-y-1.5">
            <p className="text-[10px] text-smoke italic px-1">
              Indic script typography auto-activates when subtitles contain Telugu, Hindi, Tamil, Kannada, Malayalam, or Bengali characters:
            </p>
            {SCRIPT_FONTS.map((sf) => (
              <div
                key={sf.name}
                className="p-2 rounded-lg bg-[#141413] border border-white/5 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                  <span>{sf.css}</span>
                  <span className="text-[10px] text-smoke uppercase font-mono">{sf.name}</span>
                </div>
                <div className="text-xs text-mist font-normal">
                  నమస్కారం · नमस्ते · வணக்கம் · ನಮಸ್ಕಾರ
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredFonts.map((fam) => {
            const isSelected = fam.id === currentFamilyId;
            const isFav = favorites.includes(fam.id);
            const isLoading = loadingMap[fam.id];

            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => handleSelect(fam.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors group ${
                  isSelected ? 'bg-amber-400/15 border border-amber-400/40' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span
                    style={{ fontFamily: fam.css }}
                    className={`text-sm truncate ${isSelected ? 'text-amber-300 font-bold' : 'text-bone'}`}
                  >
                    {fam.label}
                  </span>
                  <span className="text-[10px] text-smoke">{fam.group}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(fam.id, e)}
                    className="p-1 rounded text-smoke hover:text-amber-300 transition-colors"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-amber-400 text-amber-400' : 'text-smoke/60'
                      }`}
                    />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer: Upload Custom Font Link */}
      <div className="pt-2 border-t border-white/10 mt-1 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onGoToBrand) onGoToBrand();
          }}
          className="flex items-center gap-1.5 text-[11px] text-amber-300 hover:text-amber-200 transition-colors font-medium"
        >
          <Upload className="w-3 h-3" />
          <span>Upload custom font in Brand tab…</span>
        </button>
      </div>
    </div>
  );
}
