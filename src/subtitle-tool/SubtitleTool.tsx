// ─── SubtitleTool — Epic Hertz Studio ─────────────────────────────────────────
// Full professional realtime auto-captioning studio matching ReplixCaptions reference:
// - "Prepare your media" pre-processing modal with thumbnail, language selector & Tanglish toggle
// - Pro 3-column editor layout (Captions list, Center Reel player, Right Template drawer)
// - Bottom multi-track audio waveform timeline with split/merge/delete/undo/redo/dictionary
// - Export modal with lossless stream-copy MP4, hardsubbed burn MP4, SRT, VTT & TXT

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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

import type {
  AppStage,
  Segment,
  SubtitleStyle,
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'Epic Hertz | Auto-Subtitle Studio';
    try {
      localStorage.removeItem('epic_gemini_api_key');
      sessionStorage.removeItem('epic_gemini_api_key');
    } catch {}
  }, []);

  // Subtitle styling state — Defaults to CapCut Viral bouncy pop
  const [style, setStyle] = useState<SubtitleStyle>(() => ({
    preset: 'capcut-viral',
    animationEffect: 'capcut-bounce',
    fontSize: 26,
    textColor: '#FFFFFF',
    backgroundColor: 'transparent',
    outlineColor: '#000000',
    outlineWidth: 3,
    position: 'bottom',
    fontFamily: 'Montserrat, Inter, sans-serif',
    uppercase: true,
    highlightCurrentWord: true,
    highlightColor: '#FFE600',
    shadowEffect: true,
  }));

  const videoRef = useRef<VideoPreviewHandle>(null);

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
      setSpokenLanguage('te');
      setScriptOutput('romanized');
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

  const handleReset = useCallback(() => {
    setStage('idle');
    setVideoFile(null);
    setSegments([]);
    setActiveId(null);
    setError(null);
    setBurnProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
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

      {/* ── Top Header Navigation Bar ───────────────────────────────────── */}
      <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-white/10 bg-[#141413]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl text-amber-400 tracking-wider">
            EPIC HERTZ
          </span>
          <span className="text-white/20">|</span>
          <span className="text-mist text-xs tracking-wide">
            Auto-Subtitle Studio
          </span>

          {stage === 'editing' && (
            <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Saved</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {stage === 'editing' && (
            <>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-mist hover:text-bone hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
              >
                New Video
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
              className="flex-1 min-h-0 w-full h-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <LandingScrollCraft
                onFileSelect={handleFileDrop}
                onTryDemo={handleTryDemo}
              />
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
              {/* Top Row: 3 Columns */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Column 1: Captions List */}
                <div className="w-[280px] lg:w-[320px] shrink-0 h-full overflow-hidden">
                  <CaptionEditor
                    segments={segments}
                    activeId={activeId}
                    scriptOutput={scriptOutput}
                    spokenLanguage={spokenLanguage}
                    onSegmentsChange={setSegments}
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
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={setDuration}
                    onPlayStateChange={setIsPlaying}
                  />
                </div>

                {/* Column 3: Right Templates Drawer */}
                <div className="w-[280px] lg:w-[310px] shrink-0 h-full overflow-hidden">
                  <TemplateDrawer
                    style={style}
                    onChange={setStyle}
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
                  onSegmentsChange={setSegments}
                  onSelectSegment={(id) => setActiveId(id)}
                />
              </div>
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
            <span>✅ Video export complete and downloaded!</span>
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
