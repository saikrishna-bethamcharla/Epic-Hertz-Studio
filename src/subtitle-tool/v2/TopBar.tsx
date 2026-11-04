// ─── Workspace TopBar — Epic Hertz Studio v2 ──────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  HelpCircle,
  Download,
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
    <header className="h-12 w-full bg-[#141413] border-b border-white/10 px-3.5 flex items-center justify-between select-none z-40 shrink-0">
      {/* Left: Brand Logo & Editable Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-sm font-black text-xs">
            EH
          </div>
          <span className="text-xs font-bold text-bone tracking-tight hidden sm:inline">
            Epic Hertz <span className="text-amber-400 font-medium">Studio</span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 mx-1 shrink-0 hidden sm:block" />

        {/* Project Name Editor */}
        <div className="flex items-center gap-1.5 min-w-0">
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
                className="bg-[#20201e] text-bone text-xs font-semibold px-2 py-1 rounded-md border border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400 w-48 sm:w-64"
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
              className="group flex items-center gap-1.5 text-xs font-semibold text-bone hover:text-amber-300 px-2 py-1 rounded-md hover:bg-white/5 transition-colors max-w-[200px] sm:max-w-[320px] truncate"
              title="Click to rename project"
            >
              <span className="truncate">{projectName || 'Untitled Video'}</span>
              <Edit2 className="w-3 h-3 text-smoke group-hover:text-amber-300 opacity-60 group-hover:opacity-100 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Center: History (Undo/Redo) & Autosave Status */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-[#1b1b1a] rounded-lg p-0.5 border border-white/5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-colors ${
              canUndo
                ? 'text-mist hover:text-bone hover:bg-white/10 active:scale-95'
                : 'text-smoke/40 cursor-not-allowed'
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
                : 'text-smoke/40 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo last undone change"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Autosave Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-smoke font-mono">
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

      {/* Right: Keyboard Shortcuts & Primary Export Action */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg text-smoke hover:text-bone hover:bg-white/5 transition-colors"
          title="Keyboard Shortcuts (?)"
          aria-label="Open keyboard shortcuts cheat sheet"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-md hover:shadow-amber-500/20 active:scale-98 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
