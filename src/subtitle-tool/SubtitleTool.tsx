// ─── SubtitleTool — main page ─────────────────────────────────────────────────
// State machine: idle → extracting → uploading → transcribing → editing → burning → done

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import DropZone from './DropZone';
import VideoPreview, { type VideoPreviewHandle } from './VideoPreview';
import CaptionEditor from './CaptionEditor';
import ExportBar from './ExportBar';
import ProgressOverlay from './ProgressOverlay';
import StyleToolbar, { PRESET_CONFIGS } from './StyleToolbar';

import { extractAudio } from './utils/extractAudio';
import { transcribeAudio, getStoredApiKey, setStoredApiKey } from './api/transcribe';

import type { AppStage, Segment, SubtitleStyle } from './types';

export default function SubtitleTool() {
  const [stage, setStage] = useState<AppStage>('idle');
  const [statusText, setStatusText] = useState('');
  const [burnProgress, setBurnProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [style, setStyle] = useState<SubtitleStyle>(() => ({
    preset: 'reel-bold',
    fontSize: 24,
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    outlineColor: '#000000',
    outlineWidth: 3,
    position: 'bottom',
    fontFamily: 'Inter',
    uppercase: false,
    ...PRESET_CONFIGS['reel-bold'],
  }));

  const videoRef = useRef<VideoPreviewHandle>(null);

  // ── Find active segment from playhead time ───────────────────────────────
  const handleTimeUpdate = useCallback(
    (time: number) => {
      const active = segments.find(
        (s) => time >= s.start && time <= s.end,
      );
      setActiveId(active?.id ?? null);
    },
    [segments],
  );

  // ── Main pipeline: file drop → extract → transcribe ──────────────────────
  const handleFile = useCallback(async (file: File) => {
    setVideoFile(file);
    setError(null);

    try {
      // 1. Extract audio
      setStage('extracting');
      setStatusText('Extracting audio…');
      const audioBlob = await extractAudio(file);

      // 2. Transcribe
      setStage('uploading');
      setStatusText('Uploading to Gemini…');

      const segs = await transcribeAudio(audioBlob, {
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
      setVideoFile(null);
    }
  }, []);

  const handleReset = useCallback(() => {
    setStage('idle');
    setVideoFile(null);
    setSegments([]);
    setActiveId(null);
    setError(null);
    setBurnProgress(0);
  }, []);

  const showOverlay =
    stage === 'extracting' ||
    stage === 'uploading' ||
    stage === 'transcribing' ||
    stage === 'burning';

  return (
    <div className="min-h-screen bg-ink flex flex-col relative">
      {/* Film grain */}
      <div className="grain" aria-hidden />

      {/* ── Progress overlay ───────────────────────────────────────────── */}
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

      {/* ── Navbar strip ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-ink/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl text-crimson tracking-wider">EPIC HERTZ</span>
          <span className="text-smoke text-sm">/</span>
          <span className="text-mist text-sm tracking-wider">Auto-Subtitle Studio</span>
        </div>

        <button
          onClick={() => {
            const current = getStoredApiKey();
            const input = window.prompt(
              'Enter Gemini API Key (saved privately in your browser storage):',
              current,
            );
            if (input !== null) {
              setStoredApiKey(input);
              alert('API key updated!');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-mist hover:text-bone hover:border-white/25 transition-colors bg-white/[0.02]"
          title="Configure API Key"
        >
          <span>⚙</span>
          <span>API Key</span>
        </button>
      </header>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* ── Error banner ──────────────────────────────────────────── */}
          {error && stage === 'idle' && (
            <motion.div
              className="mx-6 mt-6 rounded-xl border border-crimson/40 bg-crimson/10 px-5 py-4 text-crimson-2 text-sm"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <strong>Error:</strong> {error}
              <button
                className="ml-4 text-xs underline text-mist hover:text-bone"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* ── Drop zone (idle) ─────────────────────────────────────── */}
          {stage === 'idle' && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DropZone onFile={handleFile} />
            </motion.div>
          )}

          {/* ── Editor (editing / burning / done) ───────────────────── */}
          {(stage === 'editing' || stage === 'burning' || stage === 'done') && videoFile && (
            <motion.div
              key="editor"
              className="flex flex-col lg:flex-row flex-1 min-h-0 gap-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* ── Left: video + export bar ─────────────────────────── */}
              <div className="flex flex-col lg:w-[58%] border-b lg:border-b-0 lg:border-r border-white/10">
                {/* Real-time Subtitle Styling Studio Toolbar */}
                <StyleToolbar style={style} onChange={setStyle} />

                <div className="flex-1 flex items-center p-5 bg-black/40">
                  <VideoPreview
                    ref={videoRef}
                    videoFile={videoFile}
                    segments={segments}
                    style={style}
                    onTimeUpdate={handleTimeUpdate}
                  />
                </div>
                <ExportBar
                  segments={segments}
                  videoFile={videoFile}
                  style={style}
                  onBurnStart={() => { setStage('burning'); setBurnProgress(0); setStatusText('Burning captions…'); }}
                  onBurnProgress={setBurnProgress}
                  onBurnDone={() => { setStage('done'); }}
                  onBurnError={(msg) => { setError(msg); setStage('editing'); }}
                  onReset={handleReset}
                />
              </div>

              {/* ── Right: caption editor ───────────────────────────── */}
              <div className="lg:w-[42%] flex flex-col min-h-0 max-h-[70vh] lg:max-h-none overflow-hidden">
                <CaptionEditor
                  segments={segments}
                  activeId={activeId}
                  onSegmentsChange={setSegments}
                  onSeek={(t) => videoRef.current?.seekTo(t)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Done toast ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'done' && (
          <motion.div
            role="status"
            className="glass fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(92vw,420px)] rounded-xl px-5 py-3 text-center text-sm text-bone z-50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            ✅ Captioned video downloaded! You can keep editing or{' '}
            <button
              className="underline text-crimson-2 hover:text-bone"
              onClick={handleReset}
            >
              start over
            </button>
            .
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
