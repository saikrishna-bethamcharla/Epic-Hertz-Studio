// ─── Workspace TopBar — Epic Hertz Studio v2 ──────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Keyboard,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Edit2,
  Check,
} from 'lucide-react';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  onNewVideo?: () => void;
  onOpenShortcuts: () => void;
  onOpenExport: () => void;
}

export default function TopBar({
  projectName,
  onProjectNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  lastSavedAt,
  onNewVideo,
  onOpenShortcuts,
  onOpenExport,
}: TopBarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameInput(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const commitName = () => {
    const trimmed = nameInput.trim() || 'Untitled Video';
    setNameInput(trimmed);
    onProjectNameChange(trimmed);
    setIsEditingName(false);
  };

  const formattedSaveTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="h-12 w-full bg-[#141413] border-b border-white/10 px-3 sm:px-4 flex items-center justify-between select-none z-40 shrink-0 gap-2">
      {/* ── Left Side: Brand Logo, Editable Project Name, Undo/Redo & Save Status ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Brand Logo & Studio title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-sm font-black text-xs">
            EH
          </div>
          <span className="text-xs font-bold text-bone tracking-tight hidden sm:inline">
            Epic Hertz <span className="text-amber-400 font-medium">Studio</span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0 hidden sm:block" />

        {/* Project Name Editor */}
        <div className="flex items-center min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') {
                    setNameInput(projectName);
                    setIsEditingName(false);
                  }
                }}
                onBlur={commitName}
                maxLength={60}
                className="bg-[#20201e] text-bone text-xs font-semibold px-2 py-1 rounded-md border border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400 w-36 sm:w-56"
              />
              <button
                type="button"
                onClick={commitName}
                className="p-1 rounded text-amber-400 hover:bg-white/10"
                title="Save name"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="group flex items-center gap-1.5 text-xs font-semibold text-bone hover:text-amber-300 px-2 py-1 rounded-md hover:bg-white/5 transition-colors max-w-[140px] sm:max-w-[240px] md:max-w-[300px] truncate"
              title="Click to rename project"
            >
              <span className="truncate">{projectName || 'Untitled Video'}</span>
              <Edit2 className="w-3 h-3 text-smoke group-hover:text-amber-300 opacity-60 group-hover:opacity-100 shrink-0" />
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0 hidden md:block" />

        {/* History Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-[#1b1b1a] rounded-lg p-0.5 border border-white/5 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-colors ${
              canUndo
                ? 'text-mist hover:text-bone hover:bg-white/10 active:scale-95'
                : 'text-smoke/30 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last change"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-colors ${
              canRedo
                ? 'text-mist hover:text-bone hover:bg-white/10 active:scale-95'
                : 'text-smoke/30 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo last undone change"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Autosave Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-smoke font-mono shrink-0 pl-1">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>Saving…</span>
            </>
          ) : saveStatus === 'error' ? (
            <span className="text-rose-400">Error saving</span>
          ) : formattedSaveTime ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Saved {formattedSaveTime}</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* ── Right Side: Top Strip Options (New Video, Shortcuts, Download .SRT, Export) ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onNewVideo && (
          <button
            type="button"
            onClick={onNewVideo}
            className="px-2.5 sm:px-3 py-1.5 text-xs text-mist hover:text-bone hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
            title="Upload or start a new video"
          >
            New Video
          </button>
        )}

        <button
          type="button"
          onClick={onOpenShortcuts}
          aria-label="Keyboard shortcuts (?)"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs text-mist hover:text-bone hover:bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Shortcuts</span>
          <kbd className="hidden md:inline px-1 py-0.5 rounded bg-white/10 text-[10px] text-smoke font-mono font-semibold">?</kbd>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="px-3.5 sm:px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>Export</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
