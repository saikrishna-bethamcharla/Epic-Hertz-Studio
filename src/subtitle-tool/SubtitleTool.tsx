// ─── SubtitleTool — Epic Hertz Studio ─────────────────────────────────────────
// Full professional realtime auto-captioning studio matching ReplixCaptions reference:
// - "Prepare your media" pre-processing modal with thumbnail, language selector & Tanglish toggle
// - Pro 3-column editor layout (Captions list, Center Reel player, Right Template drawer)
// - Bottom multi-track audio waveform timeline with split/merge/delete/undo/redo/dictionary
// - Export modal with lossless stream-copy MP4, hardsubbed burn MP4, SRT, VTT & TXT

import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Upload, RotateCcw, Trash2, FolderOpen } from 'lucide-react';
import { useDesktop } from './utils/useMedia';
import { DEFAULT_STYLE } from './engine/presets';

const KeyboardShortcutsModal = lazy(() => import('./KeyboardShortcutsModal'));
const ProjectManagerModal = lazy(() => import('./v2/ProjectManagerModal'));
const LandingScrollCraft = lazy(() => import('./LandingScrollCraft'));
const ExportModal = lazy(() => import('./ExportModal'));

import VideoPreview, { type VideoPreviewHandle } from './VideoPreview';
import CaptionEditor from './CaptionEditor';
import Timeline from './Timeline';
import PrepareMediaModal from './PrepareMediaModal';
import ProgressOverlay from './ProgressOverlay';

import TopBar from './v2/TopBar';
import ResizeHandle from './v2/ResizeHandle';
import LibraryPanel, { type LibraryTab } from './v2/LibraryPanel';
import InspectorPanel from './v2/InspectorPanel';
import {
  getStoredLayout,
  saveStoredLayout,
  DEFAULT_LAYOUT,
  type WorkspaceLayout,
} from './v2/userPresets';

import { createDemoVideo } from './utils/createDemoVideo';
import { saveMediaAsset, formatRelativeTime, listCustomFonts } from './utils/projectStorage';
import { extractAudio } from './utils/extractAudio';
import { refineSegmentsFromAudio } from './utils/alignWords';
import { usePlayback } from './hooks/usePlayback';
import { useTranscription } from './hooks/useTranscription';
import { useProjectAutosave } from './hooks/useProjectAutosave';

import type {
  AppStage,
  Segment,
  SegmentStyleOverride,
  CaptionStyle,
  SpokenLanguage,
  ScriptOutput,
  VideoAspectRatio,
} from './types';

export default function SubtitleTool() {
  const [stage, setStage] = useState<AppStage>('idle');
  const [statusText, setStatusText] = useState('');
  const [burnProgress, setBurnProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [spokenLanguage, setSpokenLanguage] = useState<SpokenLanguage>('te');
  const [scriptOutput, setScriptOutput] = useState<ScriptOutput>('romanized');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('9:16');

  const [segments, setSegments] = useState<Segment[]>([]);
  const [history, setHistory] = useState<Segment[][]>([]);
  const [redoStack, setRedoStack] = useState<Segment[][]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [hideCaptions, setHideCaptions] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const isDesktop = useDesktop();
  const [mobileTab, setMobileTab] = useState<'captions' | 'styles' | 'timeline'>('captions');
  const [style, setStyle] = useState<CaptionStyle>(() => structuredClone(DEFAULT_STYLE));
  const [layout, setLayout] = useState<WorkspaceLayout>(() => getStoredLayout());
  const [scope, setScope] = useState<'all' | 'caption' | 'words'>('all');
  const [leftTab, setLeftTab] = useState<LibraryTab>('captions');
  const [selectedWordIndices, setSelectedWordIndices] = useState<number[]>([]);
  const [projectName, setProjectName] = useState<string>('Untitled Video');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modular custom hooks (Phase 6.2)
  const {
    currentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    activeId,
    setActiveId,
    handleTimeUpdate,
    resetPlayback,
  } = usePlayback(segments);

  const { processVideo } = useTranscription({
    setStage,
    setStatusText,
    setError,
    setSegments,
    setHistory,
    setRedoStack,
  });

  const {
    saveStatus,
    lastSavedAt,
    savedDraft,
    isProjectManagerOpen,
    setIsProjectManagerOpen,
    handleResumeProject,
    handleSelectProject,
    handleDiscardDraft,
    refreshDraft,
    activeProjectId,
  } = useProjectAutosave({
    stage,
    videoFile,
    segments,
    style,
    spokenLanguage,
    scriptOutput,
    aspectRatio,
    projectName,
    setVideoFile,
    setSegments,
    setHistory,
    setRedoStack,
    setStyle,
    setSpokenLanguage,
    setScriptOutput,
    setAspectRatio,
    setProjectName,
    setStage,
    setStatusText,
    setError,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  }, []);

  const videoRef = useRef<VideoPreviewHandle>(null);
  const exportAbortRef = useRef<AbortController | null>(null);

  const updateSegments = useCallback(
    (newSegments: Segment[] | ((prev: Segment[]) => Segment[]), recordUndo: boolean = true) => {
      setSegments((prev) => {
        const next = typeof newSegments === 'function' ? newSegments(prev) : newSegments;
        if (recordUndo) {
          setHistory((h) => [...h.slice(-30), prev]);
          setRedoStack([]);
        }
        return next;
      });
    },
    [],
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setSegments((curr) => {
        setRedoStack((r) => [curr, ...r]);
        return prev;
      });
      return h.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[0];
      setSegments((curr) => {
        setHistory((h) => [...h.slice(-30), curr]);
        return next;
      });
      return r.slice(1);
    });
  }, []);

  const handleSegmentOverride = useCallback(
    (segId: string, override: Partial<SegmentStyleOverride> | null) => {
      updateSegments((prev) =>
        prev.map((s) => {
          if (s.id !== segId) return s;
          if (!override) {
            const { styleOverride: _, ...rest } = s;
            return rest;
          }
          return {
            ...s,
            styleOverride: {
              ...(s.styleOverride || {}),
              ...override,
            },
          };
        }),
      );
    },
    [updateSegments],
  );

  const handleSplitAtPlayhead = useCallback(() => {
    const curTime = currentTime;
    const target = segments.find((s) => curTime >= s.start && curTime <= s.end);
    if (!target) return;
    if (curTime <= target.start + 0.15 || curTime >= target.end - 0.15) return;

    const idx = segments.findIndex((s) => s.id === target.id);
    const words = target.text.split(' ');
    const ratio = (curTime - target.start) / (target.end - target.start);
    const wordSplitIdx = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));
    const text1 = words.slice(0, wordSplitIdx).join(' ');
    const text2 = words.slice(wordSplitIdx).join(' ');

    const newSeg1: Segment = {
      ...target,
      end: curTime,
      text: text1,
      words: target.words ? target.words.filter((w) => w.start < curTime) : undefined,
    };
    const newId = 'seg-' + Date.now();
    const newSeg2: Segment = {
      id: newId,
      index: target.index + 1,
      start: curTime,
      end: target.end,
      text: text2,
      words: target.words ? target.words.filter((w) => w.start >= curTime) : undefined,
    };

    const updated = [...segments.slice(0, idx), newSeg1, newSeg2, ...segments.slice(idx + 1)].map(
      (s, i) => ({ ...s, index: i + 1 }),
    );

    updateSegments(updated);
    setActiveId(newId);
  }, [currentTime, segments, updateSegments]);

  const handleDeleteActive = useCallback(() => {
    if (!activeId) return;
    const next = segments.filter((s) => s.id !== activeId).map((s, i) => ({ ...s, index: i + 1 }));
    updateSegments(next);
    setActiveId(null);
  }, [activeId, segments, updateSegments]);

  const handleJumpPrevCaption = useCallback(() => {
    const prev = [...segments].reverse().find((s) => s.start < currentTime - 0.25);
    if (prev) {
      videoRef.current?.seekTo(prev.start);
      setActiveId(prev.id);
    }
  }, [currentTime, segments]);

  const handleJumpNextCaption = useCallback(() => {
    const next = segments.find((s) => s.start > currentTime + 0.25);
    if (next) {
      videoRef.current?.seekTo(next.start);
      setActiveId(next.id);
    }
  }, [currentTime, segments]);

  const handleAutoAlignTimings = useCallback(async () => {
    if (!videoFile || segments.length === 0) return;
    try {
      showToast('Extracting audio to align word timings…');
      const audioBlob = await extractAudio(videoFile);
      const refined = await refineSegmentsFromAudio(audioBlob, segments);
      updateSegments(refined);
      showToast('Word timings aligned with audio onsets!');
    } catch (err) {
      console.warn('Auto align failed:', err);
      showToast('Could not align timings: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [videoFile, segments, updateSegments, showToast]);

  // Restore persisted brand fonts from IndexedDB on startup
  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) return;
    listCustomFonts()
      .then((fonts) => {
        for (const f of fonts) {
          try {
            const face = new FontFace(f.name, f.buffer);
            face.load().then(() => document.fonts.add(face));
          } catch (e) {
            console.warn('Failed restoring font:', f.name, e);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (stage !== 'editing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable);

      // Global Undo: Ctrl+Z / Cmd+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
          return;
        } else {
          e.preventDefault();
          handleUndo();
          return;
        }
      }

      // Global Redo: Ctrl+Y / Cmd+Y
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Cheat sheet: ?
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Escape key: close dialogs or return scope to 'all'
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (target && typeof target.blur === 'function') {
          target.blur();
        }
        setScope('all');
        setSelectedWordIndices([]);
        return;
      }

      // Toggle Left Library Panel: [
      if (e.key === '[' && !isTyping) {
        e.preventDefault();
        setLayout((prev) => {
          const next = { ...prev, isLeftCollapsed: !prev.isLeftCollapsed };
          saveStoredLayout(next);
          return next;
        });
        return;
      }

      // Toggle Right Inspector Panel: ]
      if (e.key === ']' && !isTyping) {
        e.preventDefault();
        setLayout((prev) => {
          const next = { ...prev, isRightCollapsed: !prev.isRightCollapsed };
          saveStoredLayout(next);
          return next;
        });
        return;
      }

      // Shortcuts below only fire when outside input fields
      if (isTyping) return;

      // Hold \ to compare clean video (hide captions)
      if (e.code === 'Backslash' || e.key === '\\') {
        e.preventDefault();
        setHideCaptions(true);
        return;
      }

      // F for Fullscreen preview
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        videoRef.current?.toggleFullscreen();
        return;
      }

      if (e.code === 'Space' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        videoRef.current?.togglePlay();
        return;
      }

      if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        videoRef.current?.seekTo(Math.max(0, currentTime - 1));
        return;
      }

      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        videoRef.current?.seekTo(Math.min(duration || 0, currentTime + 1));
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / 30;
        videoRef.current?.seekTo(Math.max(0, currentTime - step));
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / 30;
        videoRef.current?.seekTo(Math.min(duration || 0, currentTime + step));
        return;
      }

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSplitAtPlayhead();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteActive();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleJumpPrevCaption();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleJumpNextCaption();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Backslash' || e.key === '\\') {
        setHideCaptions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    stage,
    currentTime,
    duration,
    isShortcutsOpen,
    handleUndo,
    handleRedo,
    handleSplitAtPlayhead,
    handleDeleteActive,
    handleJumpPrevCaption,
    handleJumpNextCaption,
  ]);

  useEffect(() => {
    document.title = 'Epic Hertz | Auto-Subtitle Studio';
    try {
      localStorage.removeItem('epic_gemini_api_key');
      sessionStorage.removeItem('epic_gemini_api_key');
    } catch {}
  }, []);

  // ── 1. File Selected → Go to 'configuring' modal ─────────────────────────
  const handleFileDrop = useCallback((file: File) => {
    setVideoFile(file);
    setProjectName(file.name.replace(/\.[^/.]+$/, ''));
    setError(null);
    setStage('configuring');
    saveMediaAsset(file, file.name);
  }, []);

  // ── 2. Modal Confirmed → Extract Audio & Transcribe ──────────────────────
  const handleContinueProcessing = useCallback(
    async (config: { spokenLanguage: SpokenLanguage; scriptOutput: ScriptOutput }) => {
      if (!videoFile) return;
      setSpokenLanguage(config.spokenLanguage);
      setScriptOutput(config.scriptOutput);
      await processVideo(videoFile, config);
    },
    [videoFile, processVideo],
  );

  const handleTryDemo = useCallback(async () => {
    try {
      setError(null);
      const file = await createDemoVideo();
      setVideoFile(file);
      saveMediaAsset(file, file.name);
      setSpokenLanguage('te');
      setScriptOutput('romanized');
      setHistory([]);
      setRedoStack([]);
      setSegments([
        {
          id: 'demo-1',
          index: 1,
          start: 0.1,
          end: 1.4,
          text: 'Prathi frame lo oka katha',
          words: [
            { word: 'Prathi', start: 0.1, end: 0.4 },
            { word: 'frame', start: 0.4, end: 0.7 },
            { word: 'lo', start: 0.7, end: 0.9 },
            { word: 'oka', start: 0.9, end: 1.1 },
            { word: 'katha', start: 1.1, end: 1.4 },
          ],
        },
        {
          id: 'demo-2',
          index: 2,
          start: 1.5,
          end: 2.7,
          text: 'Mana cinema mana passion',
          words: [
            { word: 'Mana', start: 1.5, end: 1.8 },
            { word: 'cinema', start: 1.8, end: 2.1 },
            { word: 'mana', start: 2.1, end: 2.4 },
            { word: 'passion', start: 2.4, end: 2.7 },
          ],
        },
        {
          id: 'demo-3',
          index: 3,
          start: 2.8,
          end: 3.9,
          text: 'Epic Hertz AI auto captions',
          words: [
            { word: 'Epic', start: 2.8, end: 3.1 },
            { word: 'Hertz', start: 3.1, end: 3.4 },
            { word: 'AI', start: 3.4, end: 3.6 },
            { word: 'auto', start: 3.6, end: 3.8 },
            { word: 'captions', start: 3.8, end: 3.9 },
          ],
        },
      ]);
      setStage('editing');
    } catch (err) {
      console.warn('Demo video generation failed:', err);
    }
  }, []);

  const handleReset = useCallback(async () => {
    setStage('idle');
    setVideoFile(null);
    setSegments([]);
    setHistory([]);
    setRedoStack([]);
    setError(null);
    setBurnProgress(0);
    resetPlayback();
    await refreshDraft();
  }, [resetPlayback, refreshDraft]);

  const showOverlay =
    stage === 'extracting' ||
    stage === 'uploading' ||
    stage === 'transcribing' ||
    stage === 'burning';

  return (
    <div className="h-screen h-[100dvh] w-screen bg-[#0e0e0d] text-bone flex flex-col overflow-hidden relative font-sans">
      {/* Background grain */}
      <div className="grain" aria-hidden />

      {/* ── Progress Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOverlay && (
          <ProgressOverlay
            key="overlay"
            stage={stage}
            statusText={statusText}
            progress={burnProgress}
            onCancel={() => {
              exportAbortRef.current?.abort();
              setStage('editing');
              setStatusText('');
              setBurnProgress(0);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Prepare Media Modal (Replix-style) ─────────────────────────── */}
      <AnimatePresence>
        {stage === 'configuring' && videoFile && (
          <PrepareMediaModal
            videoFile={videoFile}
            onContinue={handleContinueProcessing}
            onCancel={handleReset}
          />
        )}
      </AnimatePresence>

      {/* ── Export Dialog Modal ─────────────────────────────────────────── */}
      {videoFile && isExportModalOpen && (
        <Suspense fallback={null}>
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            videoFile={videoFile}
            segments={segments}
            style={style}
            signal={exportAbortRef.current?.signal}
            onBurnStart={() => {
              exportAbortRef.current = new AbortController();
              setStage('burning');
              setBurnProgress(0);
              setStatusText('Exporting subtitled video…');
            }}
            onBurnProgress={setBurnProgress}
            onBurnStatus={setStatusText}
            onBurnDone={() => setStage('done')}
            onBurnError={(msg) => {
              setError(msg);
              setStage('editing');
            }}
          />
        </Suspense>
      )}

      {/* ── Keyboard Shortcuts Modal ───────────────────────────────────── */}
      {isShortcutsOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        </Suspense>
      )}

      {/* ── Project Manager Modal ───────────────────────────────────────── */}
      {isProjectManagerOpen && (
        <Suspense fallback={null}>
          <ProjectManagerModal
            isOpen={isProjectManagerOpen}
            onClose={() => setIsProjectManagerOpen(false)}
            onSelectProject={handleSelectProject}
            onNewProject={() => {
              setIsProjectManagerOpen(false);
              handleReset();
            }}
            currentProjectId={activeProjectId}
          />
        </Suspense>
      )}

      {/* ── Top Header Navigation Bar (Shown on Landing / Idle / Config Stages) ── */}
      {stage !== 'editing' && (
        <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 border-b border-white/10 bg-[#141413]/90 backdrop-blur-md z-30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display text-lg sm:text-xl whitespace-nowrap text-amber-400 tracking-wider">
              EPIC HERTZ
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="hidden sm:inline text-mist text-xs tracking-wide">
              Auto-Subtitle Studio
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {stage === 'idle' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsProjectManagerOpen(true)}
                  className="px-3 py-1.5 text-xs text-smoke hover:text-bone hover:bg-white/10 rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
                  title="Manage all saved projects"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Projects</span>
                </button>
                {savedDraft && (
                  <button
                    type="button"
                    onClick={handleResumeProject}
                    className="px-3 py-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5 font-medium shadow-sm"
                    title={`Resume draft: ${savedDraft.videoName}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Resume Draft</span>
                    <span className="sm:hidden">Resume</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Try Demo</span>
                </button>
                <label className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs tracking-wide shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-black" />
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/*,audio/*,.mp4,.mov,.webm,.m4v"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileDrop(f);
                    }}
                  />
                </label>
              </>
            )}
          </div>
        </header>
      )}

      {/* ── Main Viewport ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {/* Error Banner */}
          {error && stage === 'idle' && (
            <motion.div
              className="m-6 rounded-xl border border-crimson/40 bg-crimson/10 px-5 py-3 text-crimson-2 text-xs flex flex-wrap items-center justify-between gap-3"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex-1 min-w-[200px]">
                <strong>Error:</strong> {error}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  Try Demo Video
                </button>
                <button
                  type="button"
                  className="text-mist hover:text-bone underline text-[11px] ml-1 cursor-pointer"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          {/* Idle Stage: 3D ScrollCraft Detailed Motion Landing Page */}
          {stage === 'idle' && (
            <motion.div
              key="landing-scrollcraft"
              className="flex-1 min-h-0 w-full h-full overflow-hidden flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Saved Project Draft Recovery Banner */}
              {savedDraft && (
                <div
                  role="region"
                  aria-label="Saved project draft banner"
                  className="bg-gradient-to-r from-amber-500/15 via-[#181816] to-[#181816] border-b border-amber-400/25 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0"
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="text-bone font-medium">Saved project draft found:</span>
                    <span className="text-amber-300 font-mono font-semibold truncate max-w-[180px] sm:max-w-xs">
                      {savedDraft.videoName}
                    </span>
                    <span className="text-mist hidden sm:inline">
                      ({savedDraft.segmentCount} captions · saved{' '}
                      {formatRelativeTime(savedDraft.updatedAt)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResumeProject}
                      className="px-3.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs rounded-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3 text-black" />
                      <span>Resume Project</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="px-2.5 py-1 text-mist hover:text-bone hover:bg-white/5 text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      title="Discard saved draft"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Discard</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-0 w-full h-full overflow-hidden">
                <Suspense
                  fallback={
                    <div className="h-full w-full flex items-center justify-center bg-[#09090b]">
                      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  }
                >
                  <LandingScrollCraft onFileSelect={handleFileDrop} onTryDemo={handleTryDemo} />
                </Suspense>
              </div>
            </motion.div>
          )}

          {/* Editing Studio: 3 Columns + Bottom Waveform Timeline */}
          {(stage === 'editing' || stage === 'burning' || stage === 'done') && videoFile && (
            <motion.div
              key="studio-layout"
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* TopBar (48px Unified Single Header Strip) */}
              <TopBar
                projectName={projectName}
                onProjectNameChange={setProjectName}
                canUndo={history.length > 0}
                canRedo={redoStack.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
                saveStatus={saveStatus}
                lastSavedAt={lastSavedAt}
                onNewVideo={handleReset}
                onOpenProjects={() => setIsProjectManagerOpen(true)}
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
                onOpenExport={() => setIsExportModalOpen(true)}
              />

              {isDesktop ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Middle Work Area: Left Library | Player | Right Inspector */}
                  <div className="flex-1 flex min-h-0 overflow-hidden relative">
                    {/* Zone 1: Left Library Panel */}
                    {!layout.isLeftCollapsed && (
                      <>
                        <div
                          style={{ width: `${layout.leftWidth}px` }}
                          className="shrink-0 h-full overflow-hidden"
                        >
                          <LibraryPanel
                            leftTab={leftTab}
                            onTabChange={setLeftTab}
                            segments={segments}
                            activeId={activeId}
                            onSelectSegment={(id) => {
                              setActiveId(id);
                              setScope('caption');
                            }}
                            onSegmentsChange={updateSegments}
                            onSeek={(t) => videoRef.current?.seekTo(t)}
                            style={style}
                            onStyleChange={setStyle}
                            onSegmentOverrideChange={handleSegmentOverride}
                            spokenLanguage={spokenLanguage}
                            scriptOutput={scriptOutput}
                            onRetranscribe={() => setStage('configuring')}
                            scope={scope}
                            onNotification={(msg) => showToast(msg)}
                            onToggleCollapse={() => {
                              setLayout((p) => {
                                const next = { ...p, isLeftCollapsed: true };
                                saveStoredLayout(next);
                                return next;
                              });
                            }}
                          />
                        </div>

                        {/* Resize handle between Left Panel and Player */}
                        <ResizeHandle
                          direction="horizontal"
                          onResize={(delta) => {
                            setLayout((p) => {
                              const newW = Math.max(320, Math.min(480, p.leftWidth + delta));
                              const next = { ...p, leftWidth: newW };
                              saveStoredLayout(next);
                              return next;
                            });
                          }}
                          onReset={() => {
                            setLayout((p) => {
                              const next = { ...p, leftWidth: DEFAULT_LAYOUT.leftWidth };
                              saveStoredLayout(next);
                              return next;
                            });
                          }}
                        />
                      </>
                    )}

                    {/* Zone 2: Center Player */}
                    <div className="flex-1 h-full overflow-hidden bg-[#0c0c0b] flex flex-col items-center justify-center relative p-2 min-w-0">
                      <VideoPreview
                        ref={videoRef}
                        videoFile={videoFile}
                        segments={segments}
                        style={style}
                        onStyleChange={setStyle}
                        onSegmentOverrideChange={handleSegmentOverride}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                        onTimeUpdate={handleTimeUpdate}
                        onDurationChange={setDuration}
                        onPlayStateChange={setIsPlaying}
                        hideCaptions={hideCaptions}
                        onToggleHideCaptions={() => setHideCaptions((prev) => !prev)}
                        isLeftCollapsed={layout.isLeftCollapsed}
                        onToggleLeftCollapsed={() => {
                          setLayout((p) => {
                            const next = { ...p, isLeftCollapsed: !p.isLeftCollapsed };
                            saveStoredLayout(next);
                            return next;
                          });
                        }}
                        isRightCollapsed={layout.isRightCollapsed}
                        onToggleRightCollapsed={() => {
                          setLayout((p) => {
                            const next = { ...p, isRightCollapsed: !p.isRightCollapsed };
                            saveStoredLayout(next);
                            return next;
                          });
                        }}
                      />
                    </div>

                    {/* Zone 3: Right Contextual Inspector */}
                    {!layout.isRightCollapsed && (
                      <>
                        {/* Resize handle between Player and Right Inspector */}
                        <ResizeHandle
                          direction="horizontal"
                          onResize={(delta) => {
                            setLayout((p) => {
                              const newW = Math.max(300, Math.min(440, p.rightWidth - delta));
                              const next = { ...p, rightWidth: newW };
                              saveStoredLayout(next);
                              return next;
                            });
                          }}
                          onReset={() => {
                            setLayout((p) => {
                              const next = { ...p, rightWidth: DEFAULT_LAYOUT.rightWidth };
                              saveStoredLayout(next);
                              return next;
                            });
                          }}
                        />

                        <div
                          style={{ width: `${layout.rightWidth}px` }}
                          className="shrink-0 h-full overflow-hidden"
                        >
                          <InspectorPanel
                            scope={scope}
                            onScopeChange={setScope}
                            style={style}
                            onStyleChange={setStyle}
                            activeSegment={segments.find((s) => s.id === activeId) || null}
                            onUpdateActiveSegment={(override) => {
                              if (!activeId) return;
                              const updated = segments.map((s) =>
                                s.id === activeId ? { ...s, ...override } : s,
                              );
                              updateSegments(updated);
                            }}
                            onSegmentOverrideChange={handleSegmentOverride}
                            selectedWordIndices={selectedWordIndices}
                            onSelectWordIndex={(idx) => {
                              setSelectedWordIndices([idx]);
                              setScope('words');
                            }}
                            totalSegmentsCount={segments.length}
                            onPlayPreview={() => {
                              const active = segments.find((s) => s.id === activeId);
                              if (active) {
                                videoRef.current?.seekTo(active.start);
                                videoRef.current?.play();
                              }
                            }}
                            onGoToBrand={() => setLeftTab('brand')}
                            onAutoAlignTimings={videoFile ? handleAutoAlignTimings : undefined}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Horizontal Resize Handle above Timeline */}
                  <ResizeHandle
                    direction="vertical"
                    onResize={(delta) => {
                      setLayout((p) => {
                        const newH = Math.max(180, Math.min(360, p.timelineHeight - delta));
                        const next = { ...p, timelineHeight: newH };
                        saveStoredLayout(next);
                        return next;
                      });
                    }}
                    onReset={() => {
                      setLayout((p) => {
                        const next = { ...p, timelineHeight: DEFAULT_LAYOUT.timelineHeight };
                        saveStoredLayout(next);
                        return next;
                      });
                    }}
                  />

                  {/* Zone 4: Bottom Multi-track Audio Timeline */}
                  <div
                    style={{ height: `${layout.timelineHeight}px` }}
                    className="shrink-0 w-full overflow-hidden bg-[#121211]"
                  >
                    <Timeline
                      duration={duration}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      segments={segments}
                      activeId={activeId}
                      onSeek={(t) => videoRef.current?.seekTo(t)}
                      onTogglePlay={() => videoRef.current?.togglePlay()}
                      onSegmentsChange={updateSegments}
                      onSelectSegment={(id) => {
                        setActiveId(id);
                        setScope('caption');
                      }}
                      canUndo={history.length > 0}
                      canRedo={redoStack.length > 0}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                    />
                  </div>
                </div>
              ) : (
                /* Phones & small tablets: preview on top, one panel at a time below */
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="shrink-0 h-[52%] min-h-[280px] max-h-[500px] bg-[#0c0c0b] flex items-center justify-center relative p-2 overflow-hidden">
                    <VideoPreview
                      ref={videoRef}
                      videoFile={videoFile}
                      segments={segments}
                      style={style}
                      onStyleChange={setStyle}
                      onSegmentOverrideChange={handleSegmentOverride}
                      aspectRatio={aspectRatio}
                      onAspectRatioChange={setAspectRatio}
                      onTimeUpdate={handleTimeUpdate}
                      onDurationChange={setDuration}
                      onPlayStateChange={setIsPlaying}
                      hideCaptions={hideCaptions}
                      onToggleHideCaptions={() => setHideCaptions((prev) => !prev)}
                    />
                  </div>

                  <div
                    role="tablist"
                    aria-label="Editor panels"
                    className="shrink-0 grid grid-cols-3 border-y border-white/10 bg-[#141413]"
                  >
                    {(['captions', 'styles', 'timeline'] as const).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={mobileTab === tab}
                        onClick={() => setMobileTab(tab)}
                        className={`py-2.5 text-xs font-semibold tracking-wide capitalize border-b-2 transition-colors ${
                          mobileTab === tab
                            ? 'text-amber-300 border-amber-400 bg-white/5'
                            : 'text-mist border-transparent hover:text-bone'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div role="tabpanel" className="flex-1 min-h-0 overflow-hidden">
                    {mobileTab === 'captions' && (
                      <CaptionEditor
                        segments={segments}
                        activeId={activeId}
                        scriptOutput={scriptOutput}
                        spokenLanguage={spokenLanguage}
                        onSegmentsChange={updateSegments}
                        onSeek={(t) => videoRef.current?.seekTo(t)}
                      />
                    )}
                    {mobileTab === 'styles' && (
                      <LibraryPanel
                        leftTab="styles"
                        onTabChange={() => {}}
                        segments={segments}
                        activeId={activeId}
                        onSelectSegment={setActiveId}
                        onSegmentsChange={updateSegments}
                        onSeek={(t) => videoRef.current?.seekTo(t)}
                        style={style}
                        onStyleChange={setStyle}
                        spokenLanguage={spokenLanguage}
                        scriptOutput={scriptOutput}
                        scope="all"
                        onNotification={(msg) => showToast(msg)}
                      />
                    )}
                    {mobileTab === 'timeline' && (
                      <Timeline
                        duration={duration}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        segments={segments}
                        activeId={activeId}
                        onSeek={(t) => videoRef.current?.seekTo(t)}
                        onTogglePlay={() => videoRef.current?.togglePlay()}
                        onSegmentsChange={updateSegments}
                        onSelectSegment={(id) => setActiveId(id)}
                        canUndo={history.length > 0}
                        canRedo={redoStack.length > 0}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                      />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#1c1c1b] border border-amber-400/40 text-bone text-xs shadow-2xl backdrop-blur-md"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => {
                handleUndo();
                setToastMessage(null);
              }}
              className="text-amber-300 hover:text-white font-bold ml-2 underline underline-offset-2"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done notification toast */}
      <AnimatePresence>
        {stage === 'done' && (
          <motion.div
            role="status"
            className="fixed bottom-48 left-1/2 -translate-x-1/2 bg-[#1a1a18] border border-amber-400/40 text-bone text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Video export complete and downloaded!</span>
            </div>
            <button
              onClick={() => setStage('editing')}
              className="text-amber-300 hover:text-amber-200 underline font-medium"
            >
              Continue editing
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
