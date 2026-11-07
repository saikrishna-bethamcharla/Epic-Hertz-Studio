// ─── LandingScrollCraft — Epic Hertz Studio ─────────────────────────────────
// High-performance, un-slopped studio landing experience:
// - Direct, human typography without cliché marketing blur gradients or AI tropes
// - Precision vertical video preview with word-level karaoke sync
// - Interactive A/B split-wipe comparing word sync vs traditional static blocks
// - Dialect & script mode inspector with real acoustic timestamp tokens
// - Authentic caption preset catalogue with typography specimens
// - Transparent technical pipeline specifications and client-side drop zone

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload, Play, Check } from 'lucide-react';
import { PRESET_LIBRARY } from './landingPresets';
import type { ScriptOutput } from './types';

interface LandingScrollCraftProps {
  onFileSelect: (file: File) => void;
  onTryDemo?: () => void;
}

const DEMO_SCRIPTS: Record<
  'te' | 'hi' | 'ta' | 'en',
  { romanized: string[]; native: string[]; label: string }
> = {
  te: {
    label: 'Telugu',
    romanized: ['Prathi', 'frame', 'lo', 'oka', 'katha', 'undali'],
    native: ['ప్రతి', 'ఫ్రేమ్', 'లో', 'ఒక', 'కథ', 'ఉండాలి'],
  },
  hi: {
    label: 'Hindi',
    romanized: ['Har', 'ek', 'kahani', 'mein', 'dum', 'hona', 'chahiye'],
    native: ['हर', 'एक', 'कहानी', 'में', 'दम', 'होना', 'चाहिए'],
  },
  ta: {
    label: 'Tamil',
    romanized: ['Ovvoru', 'frame-layum', 'oru', 'kadhai', 'irukku'],
    native: ['ஒவ்வொரு', 'ஃபிரேமிலும்', 'ஒரு', 'கதை', 'இருக்கு'],
  },
  en: {
    label: 'English',
    romanized: ['Every', 'single', 'frame', 'tells', 'a', 'story'],
    native: ['Every', 'single', 'frame', 'tells', 'a', 'story'],
  },
};

const DEMO_TIMESTAMPS: Record<'te' | 'hi' | 'ta' | 'en', Array<{ word: string; time: string }>> = {
  te: [
    { word: 'Prathi', time: '0.40s' },
    { word: 'frame', time: '0.72s' },
    { word: 'lo', time: '1.10s' },
    { word: 'oka', time: '1.40s' },
    { word: 'katha', time: '1.70s' },
    { word: 'undali', time: '2.10s' },
  ],
  hi: [
    { word: 'Har', time: '0.35s' },
    { word: 'ek', time: '0.57s' },
    { word: 'kahani', time: '0.90s' },
    { word: 'mein', time: '1.30s' },
    { word: 'dum', time: '1.61s' },
    { word: 'hona', time: '1.90s' },
    { word: 'chahiye', time: '2.26s' },
  ],
  ta: [
    { word: 'Ovvoru', time: '0.38s' },
    { word: 'frame-layum', time: '0.74s' },
    { word: 'oru', time: '1.12s' },
    { word: 'kadhai', time: '1.45s' },
    { word: 'irukku', time: '1.85s' },
  ],
  en: [
    { word: 'Every', time: '0.30s' },
    { word: 'single', time: '0.61s' },
    { word: 'frame', time: '0.95s' },
    { word: 'tells', time: '1.36s' },
    { word: 'a', time: '1.66s' },
    { word: 'story', time: '1.95s' },
  ],
};

const SHOWCASE_STYLES: Array<{
  id: string;
  title: string;
  tag: string;
  highlightColor: string;
  textColor: string;
  sampleWords: string[];
  description: string;
}> = [
  {
    id: 'capcut-viral',
    title: 'Viral Bounce',
    tag: 'Word Highlight',
    highlightColor: '#FFE600',
    textColor: '#FFFFFF',
    sampleWords: ['SUB-FRAME', 'WORD', 'KARAOKE'],
    description: 'High-contrast yellow word emphasis on black stroke',
  },
  {
    id: 'hormozi-yellow',
    title: 'Kinetic Box',
    tag: 'Solid Plate',
    highlightColor: '#FFE600',
    textColor: '#FFFFFF',
    sampleWords: ['CONTRAST', 'BACKING', 'PLATE'],
    description: 'Legible solid plate suited for noisy backgrounds',
  },
  {
    id: 'premiere-glow',
    title: 'Cyan Stroke',
    tag: 'Edge Contour',
    highlightColor: '#00F0FF',
    textColor: '#FFFFFF',
    sampleWords: ['CYAN', 'ACCENT', 'CONTOUR'],
    description: 'Crisp outline definition for vertical gaming & tech clips',
  },
  {
    id: 'mrbeast-comic',
    title: 'Comic Scale',
    tag: 'Dynamic Scale',
    highlightColor: '#FF5500',
    textColor: '#FFFFFF',
    sampleWords: ['PUNCHY', 'SCALE', 'BOUNCE'],
    description: 'Expressive scale emphasis for fast dialogue hooks',
  },
  {
    id: 'clean-minimal',
    title: 'Clean Minimal',
    tag: 'Editorial',
    highlightColor: '#F59E0B',
    textColor: '#FFFFFF',
    sampleWords: ['EDITORIAL', 'SERIF', 'MINIMAL'],
    description: 'Understated cinematic typography with balanced tracking',
  },
];

export default function LandingScrollCraft({ onFileSelect, onTryDemo }: LandingScrollCraftProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active state for interactive dialect switcher
  const [sampleLang, setSampleLang] = useState<'te' | 'hi' | 'ta' | 'en'>('te');
  const [scriptMode, setScriptMode] = useState<ScriptOutput>('romanized');

  // Active style for runway
  const [activePresetId, setActivePresetId] = useState<string>('capcut-viral');
  const [activeWordIdx, setActiveWordIdx] = useState(0);

  // Split-curtain state
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Accessibility: detect OS/browser reduced-motion setting
  const shouldReduceMotion = useReducedMotion();

  // Live word ticker interval for hero preview
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIdx((prev) => (prev + 1) % 6);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  // Split curtain drag handlers
  const updateSplit = useCallback((clientX: number) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const pct = Math.max(10, Math.min(90, (relativeX / rect.width) * 100));
    setSplitPos(pct);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMove = (e: MouseEvent) => updateSplit(e.clientX);
    const handleUp = () => setIsDraggingSplit(false);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateSplit(e.touches[0].clientX);
    };
    const handleTouchEnd = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingSplit, updateSplit]);

  // File drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      const file = files[0];
      if (
        file.type.startsWith('video/') ||
        file.type.startsWith('audio/') ||
        file.name.match(/\.(mp4|mov|webm|m4v|mkv)$/i)
      ) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      onFileSelect(files[0]);
    }
  };

  const currentWords = DEMO_SCRIPTS[sampleLang][scriptMode];
  const activePreset = PRESET_LIBRARY.find((p) => p.id === activePresetId) || PRESET_LIBRARY[0];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full overflow-y-auto overflow-x-hidden bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-amber-400 selection:text-black"
      style={{ scrollBehavior: shouldReduceMotion ? 'auto' : 'smooth' }}
    >
      {/* Global Drag overlay indicator */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-400"
          >
            <div className="w-14 h-14 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white">Drop video file here</h2>
            <p className="text-zinc-400 text-xs mt-1 font-mono">
              Accepts MP4, MOV, WEBM, MKV · In-browser processing
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,.mp4,.mov,.webm,.m4v"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 pt-16 pb-20 border-b border-white/[0.08]">
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Column: Direct, human value proposition */}
          <div className="flex-1 max-w-xl text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono">
              <span className="font-semibold text-white">Epic Hertz Studio</span>
              <span className="text-zinc-600">/</span>
              <span className="text-amber-400 font-medium">Word-level sync</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Subtitles that hold attention until the last second.
            </h1>

            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-lg">
              Kinetic, word-synced subtitles for Reels, Shorts, and vertical video. Natural
              Tanglish, Hinglish, and Indic scripts with sub-frame timing and browser-native
              rendering.
            </p>

            {/* Direct action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm tracking-wide shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-black" />
                <span>Upload Video</span>
              </button>

              <button
                type="button"
                onClick={onTryDemo}
                className="px-5 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-200 text-sm font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Sample Video</span>
              </button>
            </div>

            {/* Technical specifications row */}
            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 font-mono">
              <span className="text-zinc-300">Web Audio API</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300">Tanglish & Hinglish</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300">Broadcast Safe Zones</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300">60fps Export</span>
            </div>
          </div>

          {/* Right Column: Studio 9:16 Monitor Preview */}
          <div className="relative w-full lg:w-[420px] flex items-center justify-center">
            <div className="relative w-[280px] sm:w-[310px] aspect-[9/16] rounded-2xl p-2 bg-[#121215] border border-white/15 shadow-2xl">
              {/* Inner Screen Display */}
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-950 flex flex-col justify-between p-4">
                {/* Background Poster Visual */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter brightness-90"
                  style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}assets/landing-hero-reel.jpg)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/60" />
                </div>

                {/* Top Video Header Overlay */}
                <div className="relative z-20 flex items-center justify-between text-[11px] text-white/90">
                  <span className="font-mono px-2 py-0.5 rounded bg-black/60 border border-white/10">
                    Reel · 9:16
                  </span>
                  <span className="font-mono text-amber-400 text-[11px] bg-black/60 px-2 py-0.5 rounded border border-white/10">
                    {activePreset.title}
                  </span>
                </div>

                {/* Center Word-Level Animated Karaoke Subtitle */}
                <div className="relative z-20 my-auto text-center px-1">
                  <div
                    className="inline-block px-3.5 py-2.5 rounded-lg backdrop-blur-xs shadow-xl transition-all"
                    style={{
                      backgroundColor: activePreset.config.backgroundColor || 'rgba(0,0,0,0.75)',
                    }}
                  >
                    <div className="text-base sm:text-lg font-bold tracking-tight leading-snug">
                      {DEMO_SCRIPTS.te.romanized.map((word, idx) => {
                        const isCurrent = idx === activeWordIdx % DEMO_SCRIPTS.te.romanized.length;
                        return (
                          <span
                            key={idx}
                            className={`inline-block mr-1.5 ${shouldReduceMotion ? '' : 'transition-colors duration-150'}`}
                            style={{
                              color: isCurrent
                                ? activePreset.config.highlightColor || '#FFE600'
                                : '#FFFFFF',
                              fontWeight: isCurrent ? 800 : 600,
                              textShadow: isCurrent
                                ? '0 1px 8px rgba(0,0,0,0.8)'
                                : '0 1px 3px rgba(0,0,0,0.9)',
                            }}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Audio Scrub Bar */}
                <div className="relative z-20 flex items-center justify-between text-[10px] text-zinc-300 bg-black/70 p-2 rounded-lg border border-white/10 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>00:04.20 / 00:18.00</span>
                  </div>
                  <span className="text-zinc-400">60fps RAF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. INTERACTIVE SPLIT-WIPE COMPARISON                                   */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-b border-white/[0.08] bg-[#0c0c0e]">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Compare Standard Subtitles with Word-Level Sync
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Slide the divider to compare traditional delayed block captions with 60fps kinetic
              word highlighting.
            </p>
          </div>

          {/* Precision Split-Scrub Frame */}
          <div
            ref={splitContainerRef}
            onMouseDown={() => setIsDraggingSplit(true)}
            onTouchStart={() => setIsDraggingSplit(true)}
            className="relative w-full max-w-3xl mx-auto h-[320px] sm:h-[380px] rounded-xl overflow-hidden border border-white/15 bg-black shadow-2xl cursor-ew-resize select-none"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center filter brightness-95"
              style={{
                backgroundImage: `url(${import.meta.env.BASE_URL}assets/landing-split-stage.jpg)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60" />
            </div>

            {/* RIGHT LAYER: Word-by-Word Highlight */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
              <div className="self-end px-2.5 py-1 rounded bg-black/70 border border-white/10 text-white text-[11px] font-mono">
                Word-level sync · <span className="text-emerald-400 font-bold">0ms latency</span>
              </div>

              <div className="my-auto text-center">
                <div className="inline-block p-4 rounded-lg bg-black/80 border border-white/15 shadow-xl">
                  <div className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug flex items-center justify-center gap-2 flex-wrap">
                    <span>THE</span>
                    <span className="text-amber-400 underline decoration-amber-400/60 decoration-2 underline-offset-4">
                      BEST
                    </span>
                    <span>STORIES</span>
                    <span>ARE</span>
                    <span className="text-emerald-400">TOLD</span>
                    <span>LIVE</span>
                  </div>
                </div>
              </div>

              <div className="self-end text-[11px] text-zinc-400 font-mono">
                Acoustic onset alignment: <span className="text-emerald-400">Snapped</span>
              </div>
            </div>

            {/* LEFT LAYER: Static Block Caption (Clipped by splitPos) */}
            <div
              className="absolute inset-0 isolate flex flex-col justify-between p-6 pointer-events-none overflow-hidden bg-zinc-950"
              style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-zinc-950 bg-cover bg-center grayscale brightness-50"
                style={{
                  backgroundImage: `url(${import.meta.env.BASE_URL}assets/landing-split-stage.jpg)`,
                }}
              />
              <div className="self-start px-2.5 py-1 rounded bg-black/70 border border-white/10 text-zinc-300 text-[11px] font-mono">
                Traditional subtitle · <span className="text-red-400 font-bold">+1.5s lag</span>
              </div>

              <div className="my-auto text-center">
                <div className="inline-block p-3 bg-zinc-900/95 border border-zinc-700 max-w-sm rounded">
                  <p className="text-sm sm:text-base font-normal text-zinc-300 leading-normal">
                    the best stories are told live...
                  </p>
                </div>
              </div>

              <div className="self-start text-[11px] text-zinc-400 font-mono">
                Static block delay: <span className="text-red-400">+1.5s</span>
              </div>
            </div>

            {/* Draggable Divider Line & Minimal Grab Handle */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white/80 z-30 pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-md pointer-events-auto cursor-ew-resize hover:scale-105 active:scale-95 transition-transform">
                <span className="flex items-center gap-0.5">
                  <span className="w-0.5 h-2.5 bg-black rounded-full" />
                  <span className="w-0.5 h-2.5 bg-black rounded-full" />
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400 font-mono">
            Drag divider to compare timing precision and highlight cadence.
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. REGIONAL DIALECT & SCRIPT ENGINE                                     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-b border-white/[0.08] bg-[#09090b]">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Tanglish, Hinglish, and Native Indic Scripts
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Social feeds run on conversational romanized speech. Switch between natural Tanglish,
              Hinglish, and authentic native Indic typography with accurate conjunct rendering.
            </p>
          </div>

          {/* Interactive Dialect Box */}
          <div className="rounded-xl bg-[#121215] border border-white/10 p-6 shadow-xl max-w-2xl mx-auto space-y-5">
            {/* Segmented Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              {/* Language Pills */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-white/10">
                {(['te', 'hi', 'ta', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSampleLang(lang)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                      sampleLang === lang
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {DEMO_SCRIPTS[lang].label}
                  </button>
                ))}
              </div>

              {/* Script Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setScriptMode('romanized')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    scriptMode === 'romanized'
                      ? 'bg-amber-400 text-black font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tanglish / Hinglish
                </button>
                <button
                  type="button"
                  onClick={() => setScriptMode('native')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    scriptMode === 'native'
                      ? 'bg-amber-400 text-black font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Native Script
                </button>
              </div>
            </div>

            {/* Word Timing Token Readout */}
            <div className="p-4 rounded-lg bg-zinc-950 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Word-level timestamp tokens</span>
                <span className="text-emerald-400">Aligned</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_TIMESTAMPS[sampleLang].map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-xs font-mono"
                  >
                    <span className="text-zinc-400 text-[10px]">{t.time}</span>
                    <span className="text-zinc-200">{t.word}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Live Visual Subtitle Preview */}
            <div className="p-5 rounded-lg bg-zinc-950 border border-white/10 text-center space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                Rendered Subtitle Output
              </span>
              <div className="text-xl sm:text-2xl font-bold text-white leading-relaxed min-h-[3rem] flex items-center justify-center">
                {currentWords.join(' ')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. PRESETS SPECIMEN SHOWCASE                                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-b border-white/[0.08] bg-[#0c0c0e]">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Presets Built for Vertical Video
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Select any preset below to test its entrance, emphasis, and layout animations.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SHOWCASE_STYLES.map((preset) => {
              const isSelected = activePresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => setActivePresetId(preset.id)}
                  className={`relative rounded-xl p-4 transition-all duration-150 cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-[#121215] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{preset.title}</span>
                      <span className="text-[10px] font-mono text-zinc-400">{preset.tag}</span>
                    </div>

                    {/* Word Sample Preview */}
                    <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-center min-h-[64px] flex items-center justify-center">
                      <span
                        className="text-xs font-extrabold tracking-wide"
                        style={{ color: preset.highlightColor }}
                      >
                        {preset.sampleWords[0]} {preset.sampleWords[1]}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-tight">{preset.description}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-400">ID: {preset.id}</span>
                    {isSelected && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-400" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 5. IN-BROWSER ARCHITECTURE & TECHNICAL SPECS                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-b border-white/[0.08] bg-[#09090b]">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for In-Browser Performance
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Local processing pipeline for speed, precision, and privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Spec 1 */}
            <div className="p-5 rounded-xl bg-[#121215] border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-400">01 / Audio Extraction</span>
                <span className="text-amber-400 font-semibold">&lt;150ms</span>
              </div>
              <h3 className="text-sm font-bold text-white">Browser-Native Web Audio</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Decodes and downmixes audio to 16kHz mono directly in browser memory without
                multi-megabyte video uploads.
              </p>
            </div>

            {/* Spec 2 */}
            <div className="p-5 rounded-xl bg-[#121215] border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-400">02 / Word Alignment</span>
                <span className="text-emerald-400 font-semibold">Sub-frame</span>
              </div>
              <h3 className="text-sm font-bold text-white">Acoustic Onset Snapping</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Gemini word timestamps are calibrated against local acoustic energy onsets to
                eliminate audio-visual drift.
              </p>
            </div>

            {/* Spec 3 */}
            <div className="p-5 rounded-xl bg-[#121215] border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-400">03 / Privacy by Design</span>
                <span className="text-zinc-300 font-semibold">0 byte video upload</span>
              </div>
              <h3 className="text-sm font-bold text-white">100% Client-Side Video</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Video frames never leave your computer. Subtitle burning and MP4 export execute
                directly on your machine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 6. CLEAN DROP ZONE & CALL TO ACTION                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-[#0c0c0e] to-black">
        <div className="w-full max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to Caption Your Next Video?
          </h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-xl border border-dashed border-white/20 hover:border-amber-400/60 p-8 bg-[#121215]/80 hover:bg-[#161619] transition-all cursor-pointer flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 group-hover:border-amber-400/40 text-zinc-300 group-hover:text-amber-400 flex items-center justify-center transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Drop video file here or click to browse
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Supports MP4, MOV, WebM, MKV · In-browser decoding up to 250MB
              </p>
            </div>
            <button
              type="button"
              className="mt-1 px-4 py-2 rounded-md bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Select Video File
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={onTryDemo}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
            >
              <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Or launch editor with sample demo video</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
