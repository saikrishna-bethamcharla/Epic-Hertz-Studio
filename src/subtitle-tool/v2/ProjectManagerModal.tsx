// ─── Project Manager Modal — Epic Hertz Studio v2 ───────────────────────────
// Multiple projects manager: search, open, duplicate, rename, delete, and view storage usage.

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Search,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  X,
  HardDrive,
  Film,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  listProjects,
  deleteProject,
  duplicateProject,
  renameProject,
  requestPersistentStorage,
  formatRelativeTime,
  type ProjectRecord,
} from '../utils/projectStorage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId?: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

export default function ProjectManagerModal({
  isOpen,
  onClose,
  currentProjectId,
  onSelectProject,
  onNewProject,
}: ProjectManagerModalProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [search, setSearch] = useState('');
  const [storageInfo, setStorageInfo] = useState<{ usageMB?: number; quotaMB?: number }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const refresh = async () => {
    const list = await listProjects();
    setProjects(list);
    const est = await requestPersistentStorage();
    if (est.usageBytes) {
      setStorageInfo({
        usageMB: Math.round(est.usageBytes / (1024 * 1024)),
        quotaMB: est.quotaBytes ? Math.round(est.quotaBytes / (1024 * 1024)) : undefined,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      void refresh();
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.videoName.toLowerCase().includes(q) ||
        p.segments.some((s) => s.text.toLowerCase().includes(q)),
    );
  }, [projects, search]);

  if (!isOpen) return null;

  const handleStartRename = (p: ProjectRecord) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const handleSaveRename = async (id: string) => {
    if (editName.trim()) {
      await renameProject(id, editName.trim());
      await refresh();
    }
    setEditingId(null);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateProject(id);
    await refresh();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete project "${name}"? This cannot be undone.`)) {
      await deleteProject(id);
      await refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        className="w-full max-w-2xl rounded-2xl bg-[#171716] border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-bone">Your Projects</h2>
              <p className="text-[11px] text-smoke">
                Switch, duplicate, or manage saved caption workflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewProject();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Video</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-smoke hover:text-bone hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Storage stats bar */}
        <div className="px-5 py-3 border-b border-white/5 bg-[#141413] flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-smoke absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects or dialogue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1c1c1a] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-bone placeholder:text-smoke/60 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          {storageInfo.usageMB !== undefined && (
            <div className="flex items-center gap-1.5 text-[11px] text-smoke font-mono shrink-0">
              <HardDrive className="w-3 h-3 text-smoke/70" />
              <span>{storageInfo.usageMB} MB stored</span>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1 min-h-[240px]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-smoke text-xs space-y-2">
              <Film className="w-8 h-8 text-smoke/40 mx-auto" />
              <p>{search ? 'No projects matching your search.' : 'No saved projects found.'}</p>
            </div>
          ) : (
            filtered.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              const isEditing = editingId === proj.id;

              return (
                <div
                  key={proj.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#22211c] border-amber-400/50 shadow-xs'
                      : 'bg-[#1a1a18] border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Left: Info & Title */}
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(proj.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="bg-[#20201d] text-bone text-xs font-semibold px-2 py-1 rounded border border-amber-400 focus:outline-none flex-1 max-w-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(proj.id)}
                          className="p-1 rounded text-amber-400 hover:bg-white/10"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-smoke hover:bg-white/10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-bone truncate">
                          {proj.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono shrink-0">
                            Current
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartRename(proj)}
                          className="p-1 rounded text-smoke/60 hover:text-bone transition-colors"
                          title="Rename project"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-smoke font-mono">
                      <span className="truncate max-w-[160px] sm:max-w-xs text-smoke/80">
                        {proj.videoName}
                      </span>
                      <span>·</span>
                      <span>{proj.segmentCount} captions</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-smoke/70">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatRelativeTime(proj.updatedAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(proj.id)}
                      className="p-2 rounded-lg text-smoke hover:text-bone hover:bg-white/5 transition-colors cursor-pointer"
                      title="Duplicate project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(proj.id, proj.name)}
                      className="p-2 rounded-lg text-smoke hover:text-crimson-2 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      disabled={isCurrent}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        isCurrent
                          ? 'bg-white/5 text-smoke cursor-default'
                          : 'bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400/30 cursor-pointer active:scale-95'
                      }`}
                    >
                      <span>{isCurrent ? 'Active' : 'Open'}</span>
                      {!isCurrent && <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
