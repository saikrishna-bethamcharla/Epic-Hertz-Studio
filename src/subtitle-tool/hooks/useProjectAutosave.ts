// ─── useProjectAutosave Hook — Epic Hertz Studio ────────────────────────────
// Handles IndexedDB v2 debounced autosave, project restoration, and multi-project lifecycle.

import { useState, useEffect, useCallback } from 'react';
import type {
  AppStage,
  Segment,
  CaptionStyle,
  SpokenLanguage,
  ScriptOutput,
  VideoAspectRatio,
  LowerThirdSpec,
} from '../types';
import {
  saveProjectMeta,
  getSavedProjectMeta,
  restoreFullProject,
  clearSavedProject,
  loadProjectWithMedia,
  getActiveProjectId,
  setActiveProjectId,
  type SavedProjectMeta,
} from '../utils/projectStorage';

export interface UseProjectAutosaveParams {
  stage: AppStage;
  videoFile: File | null;
  segments: Segment[];
  style: CaptionStyle;
  spokenLanguage: SpokenLanguage;
  scriptOutput: ScriptOutput;
  aspectRatio: VideoAspectRatio;
  projectName: string;
  lowerThirds?: LowerThirdSpec[];
  setLowerThirds?: (lowerThirds: LowerThirdSpec[]) => void;
  setVideoFile: (file: File | null) => void;
  setSegments: (segments: Segment[]) => void;
  setHistory: (history: Segment[][]) => void;
  setRedoStack: (redo: Segment[][]) => void;
  setStyle: (style: CaptionStyle) => void;
  setSpokenLanguage: (lang: SpokenLanguage) => void;
  setScriptOutput: (output: ScriptOutput) => void;
  setAspectRatio: (ratio: VideoAspectRatio) => void;
  setProjectName: (name: string) => void;
  setStage: (stage: AppStage) => void;
  setStatusText: (text: string) => void;
  setError: (err: string | null) => void;
}

export function useProjectAutosave({
  stage,
  videoFile,
  segments,
  style,
  spokenLanguage,
  scriptOutput,
  aspectRatio,
  projectName,
  lowerThirds = [],
  setLowerThirds,
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
}: UseProjectAutosaveParams) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedDraft, setSavedDraft] = useState<SavedProjectMeta | null>(null);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

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
      try {
        await saveProjectMeta({
          name: projectName,
          videoName: videoFile.name,
          videoType: videoFile.type || 'video/mp4',
          segmentCount: segments.length,
          segments,
          style,
          spokenLanguage,
          scriptOutput,
          aspectRatio,
          lowerThirds,
          updatedAt: Date.now(),
        });
        setSaveStatus('saved');
        setLastSavedAt(Date.now());
      } catch (err) {
        console.warn('Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [
    stage,
    videoFile,
    segments,
    style,
    spokenLanguage,
    scriptOutput,
    aspectRatio,
    projectName,
    lowerThirds,
  ]);

  // Explicitly flush active project to IndexedDB immediately (e.g. before navigating to Home)
  const flushAutosaveNow = useCallback(async () => {
    if (stage !== 'editing' || !videoFile || segments.length === 0) return;
    try {
      await saveProjectMeta({
        name: projectName,
        videoName: videoFile.name,
        videoType: videoFile.type || 'video/mp4',
        segmentCount: segments.length,
        segments,
        style,
        spokenLanguage,
        scriptOutput,
        aspectRatio,
        lowerThirds,
        updatedAt: Date.now(),
      });
      setSaveStatus('saved');
      setLastSavedAt(Date.now());
    } catch (err) {
      console.warn('Manual save before exit failed:', err);
    }
  }, [
    stage,
    videoFile,
    segments,
    style,
    spokenLanguage,
    scriptOutput,
    aspectRatio,
    projectName,
    lowerThirds,
  ]);

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

  // Resume Last Project from IndexedDB
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
      setProjectName(project.name || project.videoFile.name.replace(/\.[^/.]+$/, ''));
      if (setLowerThirds) setLowerThirds(project.lowerThirds || []);
      setSavedDraft(null);
      setStage('editing');
      setSaveStatus('saved');
      setLastSavedAt(project.updatedAt);
    } catch (err) {
      console.warn('Restore failed:', err);
      setError('Failed to restore project draft.');
    }
  }, [
    setStatusText,
    setError,
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
  ]);

  // Load Specific Project from ProjectManagerModal
  const handleSelectProject = useCallback(
    async (projectId: string) => {
      try {
        setStatusText('Loading project…');
        setActiveProjectId(projectId);
        const project = await loadProjectWithMedia(projectId);
        if (!project) {
          setError('Could not load project media from browser storage.');
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
        setProjectName(project.name || project.videoFile.name.replace(/\.[^/.]+$/, ''));
        if (setLowerThirds) setLowerThirds(project.lowerThirds || []);
        setSavedDraft(null);
        setStage('editing');
        setSaveStatus('saved');
        setLastSavedAt(project.updatedAt);
        setIsProjectManagerOpen(false);
      } catch (err) {
        console.warn('Failed to load project:', err);
        setError('Failed to load project from storage.');
      }
    },
    [
      setStatusText,
      setError,
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
    ],
  );

  // Discard Saved Project
  const handleDiscardDraft = useCallback(async () => {
    await clearSavedProject();
    setSavedDraft(null);
  }, []);

  const refreshDraft = useCallback(async () => {
    const draft = await getSavedProjectMeta();
    setSavedDraft(draft);
    setSaveStatus('idle');
  }, []);

  return {
    saveStatus,
    lastSavedAt,
    savedDraft,
    setSavedDraft,
    isProjectManagerOpen,
    setIsProjectManagerOpen,
    handleResumeProject,
    handleSelectProject,
    handleDiscardDraft,
    refreshDraft,
    flushAutosaveNow,
    activeProjectId: getActiveProjectId(),
  };
}
