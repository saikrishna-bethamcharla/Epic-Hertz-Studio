// ─── SubtitleTool — Epic Hertz Studio ─────────────────────────────────────────
// Full professional realtime auto-captioning studio matching ReplixCaptions reference:
// - "Prepare your media" pre-processing modal with thumbnail, language selector & Tanglish toggle
// - Pro 3-column editor layout (Captions list, Center Reel player, Right Template drawer)
// - Bottom multi-track audio waveform timeline with split/merge/delete/undo/redo/dictionary
// - Export modal with lossless stream-copy MP4, hardsubbed burn MP4, SRT, VTT & TXT

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Upload, RotateCcw, Trash2, Keyboard } from 'lucide-react';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { useDesktop } from '../hooks/useMedia';
import { DEFAULT_STYLE } from './engine/presets';

import LandingScrollCraft from './LandingScrollCraft';
import VideoPreview, { type VideoPreviewHandle } from './VideoPreview';
import CaptionEditor from './CaptionEditor';
import TemplateDrawer from './TemplateDrawer';
import Timeline from './Timeline';
import PrepareMediaModal from './PrepareMediaModal';
import ExportModal from './ExportModal';
import ProgressOverlay from './ProgressOverlay';

import { extractAudio } from './utils/extractAudio';
import { transcribeAudio } from './api/transcribe';
import { toSRT, downloadText } from './utils/srt';
import { createDemoVideo } from './utils/createDemoVideo';
import {
  saveMediaAsset,
  saveProjectMeta,
  getSavedProjectMeta,
  restoreFullProject,
  clearSavedProject,
  formatRelativeTime,
  type SavedProjectMeta,
} from './utils/projectStorage';

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const isDesktop = useDesktop();
  const [mobileTab, setMobileTab] = useState<'captions' | 'styles' | 'timeline'>('captions');
  const [style, setStyle] = useState<CaptionStyle>(() => structuredClone(DEFAULT_STYLE));
  const [savedDraft, setSavedDraft] = useState<SavedProjectMeta | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const videoRef = useRef<VideoPreviewHandle>(null);

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

    const updated = [
      ...segments.slice(0, idx),
      newSeg1,
      newSeg2,
      ...segments.slice(idx + 1),
    ].map((s, i) => ({ ...s, index: i + 1 }));

    updateSegments(updated);
    setActiveId(newId);
  }, [currentTime, segments, updateSegments]);

  const handleDeleteActive = useCallback(() => {
    if (!activeId) return;
    const next = segments
      .filter((s) => s.id !== activeId)
      .map((s, i) => ({ ...s, index: i + 1 }));
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

      // Escape key: close dialogs or blur textareas
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (target && typeof target.blur === 'function') {
          target.blur();
        }
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
        const step = e.shiftKey ? 1.0 : (1 / 30);
        videoRef.current?.seekTo(Math.max(0, currentTime - step));
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : (1 / 30);
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

  // Check for saved project draft in IndexedDB on initial mount
  useEffect(() => {
    let mounted = true;
    getSavedProjectMeta().then((meta) => {
      if (mounted && meta && meta.segmentCount > 0) {
        setSavedDraft(meta);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Browser-side debounced autosave to IndexedDB
  useEffect(() => {
    if (stage !== 'editing' || !videoFile || segments.length === 0) return;
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      await saveProjectMeta({
        videoName: videoFile.name,
        videoType: videoFile.type || 'video/mp4',
        segmentCount: segments.length,
        segments,
        style,
        spokenLanguage,
        scriptOutput,
        aspectRatio,
        updatedAt: Date.now(),
      });
      setSaveStatus('saved');
      setLastSavedAt(Date.now());
    }, 800);
    return () => clearTimeout(timer);
  }, [stage, videoFile, segments, style, spokenLanguage, scriptOutput, aspectRatio]);

  // Edits live in this browser tab and IndexedDB. Warn before an accidental reload.
  useEffect(() => {
    if (stage !== 'editing' && stage !== 'burning') return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [stage]);

  useEffect(() => {
    document.title = 'Epic Hertz | Auto-Subtitle Studio';
    try {
      localStorage.removeItem('epic_gemini_api_key');
      sessionStorage.removeItem('epic_gemini_api_key');
    } catch {}
  }, []);

  // ── Sync Playhead Time ───────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      const active = segments.find(
        (s) => time >= s.start && time <= s.end,
      );
      setActiveId(active?.id ?? null);
    },
    [segments],
  );

  // ── 1. File Selected → Go to 'configuring' modal ─────────────────────────
  const handleFileDrop = useCallback((file: File) => {
    setVideoFile(file);
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

      try {
        // Step A: Extract audio in-browser
        setStage('extracting');
        setStatusText('Extracting audio track…');
        const audioBlob = await extractAudio(videoFile);

        // Step B: Upload & Transcribe via Gemini
        setStage('uploading');
        setStatusText('Uploading to AI studio…');

        const segs = await transcribeAudio(audioBlob, {
          spokenLanguage: config.spokenLanguage,
          scriptOutput: config.scriptOutput,
          onStatus: (msg) => {
            setStatusText(msg);
            if (msg.toLowerCase().includes('transcrib')) setStage('transcribing');
          },
        });

        setSegments(segs);
        setHistory([]);
        setRedoStack([]);
        setStage('editing');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStage('idle');
      }
    },
    [videoFile],
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

  // ── Resume Last Project from IndexedDB ──────────────────────────────────
  const handleResumeProject = useCallback(async () => {
    try {
      setStatusText('Restoring saved project draft…');
      const project = await restoreFullProject();
      if (!project) {
        setError('Could not restore saved project from browser storage.');
        setSavedDraft(null);
        return;
      }
      setVideoFile(project.videoFile);
      setSegments(project.segments);
      setHistory([]);
      setRedoStack([]);
      setStyle(project.style);
      setSpokenLanguage(project.spokenLanguage);
      setScriptOutput(project.scriptOutput);
      setAspectRatio(project.aspectRatio);
      setSavedDraft(null);
      setStage('editing');
      setSaveStatus('saved');
      setLastSavedAt(project.updatedAt);
    } catch (err) {
      console.warn('Restore failed:', err);
      setError('Failed to restore project draft.');
    }
  }, []);

  // ── Discard Saved Project ────────────────────────────────────────────────
  const handleDiscardDraft = useCallback(async () => {
    await clearSavedProject();
    setSavedDraft(null);
  }, []);

  const handleReset = useCallback(async () => {
    setStage('idle');
    setVideoFile(null);
    setSegments([]);
    setHistory([]);
    setRedoStack([]);
    setActiveId(null);
    setError(null);
    setBurnProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setSaveStatus('idle');
    const draft = await getSavedProjectMeta();
    setSavedDraft(draft);
  }, []);

  const handleDownloadSRT = () => {
    if (!videoFile || segments.length === 0) return;
    const baseName = videoFile.name.replace(/\.[^.]+$/, '');
    downloadText(toSRT(segments), `${baseName}.srt`, 'text/plain');
  };

  const showOverlay =
    stage === 'extracting' ||
    stage === 'uploading' ||
    stage === 'transcribing' ||
    stage === 'burning';

  return (
    <div className="h-screen w-screen bg-[#0e0e0d] text-bone flex flex-col overflow-hidden relative font-sans">
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
      {videoFile && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          videoFile={videoFile}
          segments={segments}
          style={style}
          onBurnStart={() => {
            setStage('burning');
            setBurnProgress(0);
            setStatusText('Exporting subtitled video…');
          }}
          onBurnProgress={setBurnProgress}
          onBurnDone={() => setStage('done')}
          onBurnError={(msg) => {
            setError(msg);
            setStage('editing');
          }}
        />
      )}

      {/* ── Keyboard Shortcuts Modal ───────────────────────────────────── */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* ── Top Header Navigation Bar ───────────────────────────────────── */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 border-b border-white/10 bg-[#141413]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display text-lg sm:text-xl whitespace-nowrap text-amber-400 tracking-wider">
            EPIC HERTZ
          </span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="hidden sm:inline text-mist text-xs tracking-wide">
            Auto-Subtitle Studio
          </span>

          {stage === 'editing' && (
            <div
              className="flex items-center gap-1.5 ml-2 sm:ml-3 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border"
              style={{
                backgroundColor: saveStatus === 'saving' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                borderColor: saveStatus === 'saving' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                color: saveStatus === 'saving' ? '#fcd34d' : '#6ee7b7',
              }}
              title={
                saveStatus === 'saved'
                  ? `Autosaved to IndexedDB ${lastSavedAt ? `(${formatRelativeTime(lastSavedAt)})` : ''}`
                  : 'Saving changes to local IndexedDB…'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              <span className="whitespace-nowrap">
                {saveStatus === 'saving' ? 'Saving…' : 'Autosaved'}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {stage === 'idle' && (
            <>
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
              <label
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs tracking-wide shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
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

          {stage === 'editing' && (
            <>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-mist hover:text-bone hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
              >
                New Video
              </button>

              <button
                type="button"
                onClick={() => setIsShortcutsOpen(true)}
                aria-label="Keyboard shortcuts (?)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-mist hover:text-bone hover:bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Shortcuts</span>
                <kbd className="hidden md:inline px-1 py-0.5 rounded bg-white/10 text-[10px] text-smoke font-mono font-semibold">?</kbd>
              </button>

              <button
                onClick={handleDownloadSRT}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 text-xs text-mist hover:text-bone hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
                title="Download standard SRT subtitle file"
              >
                <span>Download .SRT</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Export</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main Viewport ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {/* Error Banner */}
          {error && stage === 'idle' && (
            <motion.div
              className="m-6 rounded-xl border border-crimson/40 bg-crimson/10 px-5 py-3 text-crimson-2 text-xs flex flex-wrap items-center justify-between gap-2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex-1 min-w-[200px]">
                <strong>Error:</strong> {error}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="text-mist hover:text-bone underline text-[11px]"
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
                      ({savedDraft.segmentCount} captions · saved {formatRelativeTime(savedDraft.updatedAt)})
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
                <LandingScrollCraft
                  onFileSelect={handleFileDrop}
                  onTryDemo={handleTryDemo}
                />
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
              {isDesktop ? (
                <>
                  {/* Top Row: 3 Columns */}
                  <div className="flex-1 flex min-h-0 overflow-hidden">
                    {/* Column 1: Captions List */}
                    <div className="w-[280px] lg:w-[320px] shrink-0 h-full overflow-hidden">
                      <CaptionEditor
                        segments={segments}
                        activeId={activeId}
                        scriptOutput={scriptOutput}
                        spokenLanguage={spokenLanguage}
                        onSegmentsChange={updateSegments}
                        onSeek={(t) => videoRef.current?.seekTo(t)}
                      />
                    </div>

                    {/* Column 2: Center Reel / Video Player */}
                    <div className="flex-1 h-full overflow-hidden bg-[#0c0c0b] flex items-center justify-center relative p-3">
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

                    {/* Column 3: Right Templates Drawer */}
                    <div className="w-[300px] lg:w-[340px] shrink-0 h-full overflow-hidden">
                      <TemplateDrawer
                        style={style}
                        onChange={setStyle}
                        segments={segments}
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Multi-track Audio Timeline */}
                  <div className="h-44 shrink-0">
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
                  </div>
                </>
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

                  <div role="tablist" aria-label="Editor panels" className="shrink-0 grid grid-cols-3 border-y border-white/10 bg-[#141413]">
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
                    {mobileTab === 'styles' && <TemplateDrawer style={style} onChange={setStyle} segments={segments} />}
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
