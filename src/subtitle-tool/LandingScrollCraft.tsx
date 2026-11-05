// ─── LandingScrollCraft — Epic Hertz Studio ─────────────────────────────────
// High-performance, clutter-free 3D landing experience:
// - Refined 3D perspective phone mockup with fluid physics and live word-karaoke
// - Tactile "Raw vs. Viral" Split-Scrub Curtain with smooth drag interaction
// - Cultural Dialect & Script Switcher (Tanglish, Hinglish, Native Indic)
// - Creator Style Runway with 5 live animated viral presets
// - Sleek Engineering Architecture highlights & Magnetic Drop Zone

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Zap,
  Sparkles,
  Check,
  AlertTriangle,
  Target,
  ShieldCheck,
  UploadCloud,
  ArrowRight,
} from 'lucide-react';
import { PRESET_LIBRARY } from './landingPresets';
import type { SubtitlePreset, ScriptOutput } from './types';

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

const RUNWAY_STYLES: Array<{
  id: SubtitlePreset;
  title: string;
  badge: string;
  highlightColor: string;
  textColor: string;
  bgBadge: string;
  words: string[];
}> = [
  {
    id: 'capcut-viral',
    title: 'Slide Up Mask',
    badge: 'REVEAL',
    highlightColor: '#FFE600',
    textColor: '#FFFFFF',
    bgBadge: 'rgba(0,0,0,0.75)',
    words: ['SMOOTH', 'VERTICAL', 'MASK', 'REVEAL', 'CADENCE'],
  },
  {
    id: 'premiere-glow',
    title: 'Whip Left Snap',
    badge: 'KINETIC',
    highlightColor: '#00F0FF',
    textColor: '#FFFFFF',
    bgBadge: 'rgba(10,10,25,0.85)',
    words: ['FAST', 'LATERAL', 'WHIP', 'INTO', 'POSITION'],
  },
  {
    id: 'mrbeast-comic',
    title: 'Punch Zoom In',
    badge: 'ACTION',
    highlightColor: '#FF4500',
    textColor: '#FFFFFF',
    bgBadge: 'rgba(0,0,0,0.8)',
    words: ['DYNAMIC', 'PUNCH', 'ZOOM', 'FOR', 'CREATORS'],
  },
  {
    id: 'fire-hype',
    title: 'Word Cascade',
    badge: 'RHYTHM',
    highlightColor: '#00FF66',
    textColor: '#FFFFFF',
    bgBadge: 'rgba(0,0,0,0.85)',
    words: ['STAGGERED', 'WORD', 'BY', 'WORD', 'RISE'],
  },
  {
    id: 'clean-minimal',
    title: 'Clean Minimal',
    badge: 'EDITORIAL',
    highlightColor: '#F59E0B',
    textColor: '#FFFFFF',
    bgBadge: 'rgba(18,18,18,0.7)',
    words: ['CRISP', 'LEGIBLE', 'PRISTINE', 'CLEAN', 'TYPE'],
  },
];

export default function LandingScrollCraft({ onFileSelect, onTryDemo }: LandingScrollCraftProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active state for interactive dialect switcher
  const [sampleLang, setSampleLang] = useState<'te' | 'hi' | 'ta' | 'en'>('te');
  const [scriptMode, setScriptMode] = useState<ScriptOutput>('romanized');

  // Active style for runway
  const [activePresetId, setActivePresetId] = useState<SubtitlePreset>('capcut-viral');
  const [activeWordIdx, setActiveWordIdx] = useState(0);

  // Split-curtain state
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Fluid 3D tilt physics using Framer Motion springs (no React re-renders on mousemove!)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });

  const handleHeroMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
      rotateX.set(-y * 14);
      rotateY.set(x * 14);
    },
    [rotateX, rotateY],
  );

  const handleHeroMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

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
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Subtle background ambient radial lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-20"
          style={{
            background:
              'radial-gradient(circle, #f59e0b 0%, rgba(217, 167, 74, 0.1) 60%, transparent 80%)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[400px] rounded-full blur-[140px] opacity-10"
          style={{
            background: 'radial-gradient(circle, #d97706 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Global Drag overlay indicator */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-400"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3 animate-pulse">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Release to Caption Video</h2>
            <p className="text-zinc-400 text-xs mt-1">
              Instant word-level sync in Telugu, Hindi, Tamil & English
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
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative min-h-[88vh] flex items-center justify-center px-6 pt-16 pb-20 z-10"
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-14">
          {/* Left Column: Clear Value Proposition */}
          <div className="flex-1 max-w-xl text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>AI Auto-Caption Studio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Subtitles that{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
                hold attention
              </span>{' '}
              until the last second.
            </h1>

            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-lg">
              Studio-grade kinetic captions for Reels, Shorts, and ads. Natural Tanglish, Hinglish,
              and native Indic scripts with 60fps word-by-word karaoke sync.
            </p>

            {/* Clean Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Select Video</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onTryDemo}
                className="px-5 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-200 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Try Instant Demo</span>
              </button>
            </div>

            {/* Trust specs */}
            <div className="pt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400" /> 100% In-Browser Audio
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400" /> Tanglish & Hinglish
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400" /> Broadcast Safe Zones
              </span>
            </div>
          </div>

          {/* Right Column: 3D Phone Preview with Smooth Spring Physics */}
          <div className="relative w-full lg:w-[420px] flex items-center justify-center perspective-[1000px]">
            <motion.div
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              className="relative w-[280px] sm:w-[300px] aspect-[9/16] rounded-[36px] p-3 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.12)] border border-white/15"
            >
              {/* Phone Dynamic Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-8 h-1 rounded-full bg-zinc-800" />
              </div>

              {/* Inner Screen Display */}
              <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-zinc-950 flex flex-col justify-between p-4">
                {/* Background Poster Visual */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter brightness-90"
                  style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}assets/landing-hero-reel.jpg)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/60" />
                </div>

                {/* Top Overlay Badge */}
                <div className="relative z-20 flex items-center justify-between text-[10px] text-white/90">
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                    Reel 9:16
                  </span>
                  <span className="font-mono text-amber-300 text-[10px] bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                    {activePreset.title}
                  </span>
                </div>

                {/* Center Word-Level Animated Karaoke Subtitle */}
                <div className="relative z-20 my-auto text-center px-1">
                  <div
                    className="inline-block px-3.5 py-2.5 rounded-xl backdrop-blur-md shadow-2xl transition-all"
                    style={{
                      backgroundColor: activePreset.config.backgroundColor || 'rgba(0,0,0,0.7)',
                    }}
                  >
                    <div className="text-base sm:text-lg font-black tracking-tight leading-snug">
                      {DEMO_SCRIPTS.te.romanized.map((word, idx) => {
                        const isCurrent = idx === activeWordIdx % DEMO_SCRIPTS.te.romanized.length;
                        return (
                          <span
                            key={idx}
                            className="inline-block mr-1.5 transition-all duration-150"
                            style={{
                              color: isCurrent
                                ? activePreset.config.highlightColor || '#FFE600'
                                : '#FFFFFF',
                              transform: isCurrent ? 'scale(1.18) translateY(-2px)' : 'scale(1)',
                              textShadow: isCurrent
                                ? '0 0 16px rgba(255,230,0,0.8)'
                                : '0 2px 4px rgba(0,0,0,0.9)',
                            }}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Simple Audio Bar */}
                <div className="relative z-20 flex items-center justify-between text-[11px] text-zinc-300 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[8px]">
                      ▶
                    </span>
                    <span className="font-mono text-[10px]">0:04 / 0:18</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">60fps RAF Sync</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. BESPOKE SIGNATURE MOVE: RAW VS. VIRAL SPLIT-CURTAIN                 */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-t border-white/[0.08] bg-[#0c0c0e] z-10">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Visual Difference
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Drag the Curtain. See the Contrast.
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Drag the handle to compare plain, delayed captions with the word-by-word kinetic style
              Epic Hertz generates.
            </p>
          </div>

          {/* Interactive Split-Scrub Frame */}
          <div
            ref={splitContainerRef}
            onMouseDown={() => setIsDraggingSplit(true)}
            onTouchStart={() => setIsDraggingSplit(true)}
            className="relative w-full max-w-3xl mx-auto h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl cursor-ew-resize select-none"
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

            {/* RIGHT LAYER: Epic Hertz Kinetic Caption */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
              <div className="self-end px-3 py-1 rounded-full bg-amber-400 text-black text-[11px] font-bold shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-black" />
                <span>Epic Hertz 60fps Kinetic Sync</span>
              </div>

              <div className="my-auto text-center">
                <div className="inline-block p-4 rounded-xl bg-black/75 backdrop-blur-md border border-amber-400/40 shadow-xl">
                  <div className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug flex items-center justify-center gap-2 flex-wrap">
                    <span>THE</span>
                    <span className="text-amber-300 drop-shadow-[0_0_16px_rgba(255,230,0,0.8)]">
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
                Word Sync: <span className="text-emerald-400 font-bold">Real-time Lead Timing</span>
              </div>
            </div>

            {/* LEFT LAYER: Dull Raw Caption (Clipped by splitPos, fully opaque so layers never overlap) */}
            <div
              className="absolute inset-0 isolate flex flex-col justify-between p-6 pointer-events-none overflow-hidden bg-zinc-950"
              style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
            >
              {/* Opaque grayscale copy of the frame, so the styled layer underneath never shows through */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-zinc-950 bg-cover bg-center grayscale brightness-50"
                style={{
                  backgroundImage: `url(${import.meta.env.BASE_URL}assets/landing-split-stage.jpg)`,
                }}
              />
              <div className="self-start px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>Generic Delayed Subtitles</span>
              </div>

              <div className="my-auto text-center">
                <div className="inline-block p-3 bg-zinc-900/90 border border-zinc-700 max-w-sm rounded">
                  <p className="text-sm sm:text-base font-normal text-zinc-300 leading-normal">
                    the best stories are told live... (1.5s lag)
                  </p>
                </div>
              </div>

              <div className="self-start text-[11px] text-zinc-400 font-mono">
                Lag: <span className="text-red-400 font-bold">+1.5s Delay</span>
              </div>
            </div>

            {/* Draggable Divider Line & Knob */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)] z-30 pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-[10px] shadow-lg pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
                ◀▶
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400 font-mono">
            Drag the handle across to inspect the timing and styling difference.
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. REGIONAL DIALECT & SCRIPT ENGINE                                     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-t border-white/[0.08] bg-[#09090b] z-10">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Conversational Transliteration
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Colloquial Regional Dialects & Native Scripts
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Social media audiences read natural Tanglish and Hinglish. Switch between
              conversational Romanized scripts and authentic native typography.
            </p>
          </div>

          {/* Interactive Dialect Box */}
          <div className="rounded-2xl bg-[#121214] border border-white/10 p-6 shadow-xl max-w-2xl mx-auto space-y-5">
            {/* Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              {/* Language Pills */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10">
                {(['te', 'hi', 'ta', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSampleLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      sampleLang === lang
                        ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-400/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {DEMO_SCRIPTS[lang].label}
                  </button>
                ))}
              </div>

              {/* Script Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setScriptMode('romanized')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    scriptMode === 'romanized'
                      ? 'bg-amber-400 text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tanglish / Hinglish
                </button>
                <button
                  type="button"
                  onClick={() => setScriptMode('native')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    scriptMode === 'native'
                      ? 'bg-amber-400 text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Native Script
                </button>
              </div>
            </div>

            {/* Live Output */}
            <div className="p-5 rounded-xl bg-zinc-950 border border-white/10 text-center space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                Live Subtitle Output
              </span>
              <div className="text-xl sm:text-2xl font-bold text-white leading-relaxed min-h-[3rem] flex items-center justify-center">
                <span className="text-amber-400 mr-2">“</span>
                {currentWords.join(' ')}
                <span className="text-amber-400 ml-2">”</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. CREATOR PRESET RUNWAY                                               */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-t border-white/[0.08] bg-[#0c0c0e] z-10">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Style Wardrobe
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Creator Motion Presets
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Click any style to preview its kinetic typography and make it your active preset.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {RUNWAY_STYLES.map((preset) => {
              const isSelected = activePresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => setActivePresetId(preset.id)}
                  className={`relative rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-zinc-900 border-amber-400/80 shadow-lg ring-1 ring-amber-400/40'
                      : 'bg-[#121214] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{preset.title}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded text-black"
                        style={{ backgroundColor: preset.highlightColor }}
                      >
                        {preset.badge}
                      </span>
                    </div>

                    {/* Word Sample */}
                    <div
                      className="p-3 rounded-xl text-center min-h-[70px] flex items-center justify-center"
                      style={{ backgroundColor: preset.bgBadge }}
                    >
                      <span
                        className="text-xs font-extrabold"
                        style={{ color: preset.highlightColor }}
                      >
                        {preset.words[0]} {preset.words[1]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400">Style ID: {preset.id}</span>
                    {isSelected && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-400" />
                        <span>Selected</span>
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
      {/* 5. STUDIO ENGINE ARCHITECTURE (CLEAN 3-CARD HIGHLIGHTS)                 */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-t border-white/[0.08] bg-[#09090b] z-10">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Engineered for Speed, Precision & Privacy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Spec 1 */}
            <div className="p-5 rounded-2xl bg-[#121214] border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Instant Audio Extraction</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Uses the browser-native Web Audio API to decode and downmix audio to 16kHz in under
                150ms without multi-megabyte binary stalls.
              </p>
            </div>

            {/* Spec 2 */}
            <div className="p-5 rounded-2xl bg-[#121214] border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Sub-Word Karaoke Sync</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Captures start and end timestamps per vocal syllable, illuminating words
                synchronously with vocal breaths rather than laggy block chunks.
              </p>
            </div>

            {/* Spec 3 */}
            <div className="p-5 rounded-2xl bg-[#121214] border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">100% Private Video</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Video files never leave your device. Only the extracted 16kHz audio track is sent to
                the AI endpoint, preserving bandwidth and privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 6. CLEAN DROP ZONE & CALL TO ACTION                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-6 border-t border-white/[0.08] bg-gradient-to-b from-[#0c0c0e] to-black z-10">
        <div className="w-full max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ready to Caption Your Next Video?
          </h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-400/60 p-8 bg-[#121214]/60 hover:bg-[#18181a] transition-all cursor-pointer flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 group-hover:bg-amber-400/20 text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Click to browse or drop video here</p>
              <p className="text-[11px] text-zinc-400 font-mono">Supports MP4, MOV, WEBM, MKV</p>
            </div>
            <button
              type="button"
              className="mt-1 px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Select File
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={onTryDemo}
              className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-amber-300 transition-colors font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or launch studio instantly with sample demo video</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
