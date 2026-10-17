// ─── LandingScrollCraft — Epic Hertz Studio ─────────────────────────────────
// Premium 3D scroll-driven landing page built to scroll-craft specification:
// - Dimensional layered 3D hero with independent depth planes (Z > 0, Z = 0, Z < 0)
// - Bespoke Signature Move: "Raw vs. Viral" Interactive Split-Scrub Curtain with tactile drag
// - Beat 3: Horizontal Reel Runway displaying vertical 9:16 smartphones with live animated kinetic words
// - Beat 4: Interactive HTML5 Web Audio Waveform Sculptor canvas with ripple dynamics
// - Beat 5: Tactile drop terminal & 1-click sample demo launcher

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { PRESET_LIBRARY } from './TemplateDrawer';
import type { SubtitlePreset, ScriptOutput, SpokenLanguage } from './types';

interface LandingScrollCraftProps {
  onFileSelect: (file: File) => void;
  onTryDemo?: () => void;
}

export default function LandingScrollCraft({
  onFileSelect,
  onTryDemo,
}: LandingScrollCraftProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activePresetId, setActivePresetId] = useState<SubtitlePreset>('spotlight');
  const [scriptMode, setScriptMode] = useState<ScriptOutput>('romanized');
  const [sampleLang, setSampleLang] = useState<SpokenLanguage>('te');
  const [activeWordIdx, setActiveWordIdx] = useState(0);

  // 3D Tilt state based on mouse pointer
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Interactive Split-Scrub Curtain State (0 to 100%)
  const [splitPos, setSplitPos] = useState(52);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Soundwave Canvas Ref
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.92]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0.2]);
  const heroTranslateY = useTransform(scrollYProgress, [0, 0.25], [0, 60]);

  // Handle Mouse Move for dimensional 3D parallax in Hero
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2; // -1 to 1
    const y = (clientY / innerHeight - 0.5) * 2; // -1 to 1
    setMousePos({ x, y });
  }, []);

  // Split-Scrub Drag Handlers
  const updateSplitFromClientX = useCallback((clientX: number) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = Math.max(10, Math.min(90, (relativeX / rect.width) * 100));
    setSplitPos(percentage);
  }, []);

  const handleSplitMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSplit(true);
    updateSplitFromClientX(e.clientX);
  };

  const handleSplitTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDraggingSplit(true);
      updateSplitFromClientX(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingSplit) {
        updateSplitFromClientX(e.clientX);
      }
    };
    const handleGlobalMouseUp = () => {
      if (isDraggingSplit) setIsDraggingSplit(false);
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingSplit && e.touches.length > 0) {
        updateSplitFromClientX(e.touches[0].clientX);
      }
    };
    const handleGlobalTouchEnd = () => {
      if (isDraggingSplit) setIsDraggingSplit(false);
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('touchend', handleGlobalTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDraggingSplit, updateSplitFromClientX]);

  // Word-by-word karaoke ticker for live preview
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIdx((prev) => (prev + 1) % 7);
    }, 420);
    return () => clearInterval(interval);
  }, []);

  // Interactive HTML5 Canvas Soundwave Sculptor animation
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw 3 layered frequency harmonics
      const layers = [
        { color: 'rgba(245, 158, 11, 0.85)', amp: 30, freq: 0.02, speed: 0.04, lw: 3 },
        { color: 'rgba(251, 191, 36, 0.45)', amp: 20, freq: 0.03, speed: -0.03, lw: 2 },
        { color: 'rgba(217, 119, 6, 0.25)', amp: 12, freq: 0.05, speed: 0.02, lw: 1.5 },
      ];

      layers.forEach((layer) => {
        ctx.beginPath();
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.lw;

        for (let x = 0; x < width; x += 3) {
          const normX = x / width;
          // Taper edges
          const envelope = Math.sin(normX * Math.PI);
          const y = height / 2 + Math.sin(x * layer.freq + phase * layer.speed * 4) * layer.amp * envelope;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // Frequency spectrum bars at bottom
      const barCount = 48;
      const barWidth = width / barCount - 2;
      for (let i = 0; i < barCount; i++) {
        const norm = i / barCount;
        const barHeight = Math.abs(Math.sin(norm * 10 + phase * 0.06)) * (height * 0.35) * Math.sin(norm * Math.PI);
        const x = i * (barWidth + 2);
        const y = height - barHeight - 4;

        ctx.fillStyle = i % 4 === 0 ? 'rgba(245, 158, 11, 0.75)' : 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // File drop handling
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
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/') || file.type.startsWith('audio/') || file.name.match(/\.(mp4|mov|webm|m4v|mkv)$/i)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  // 1-Click synthetic demo video generator so users can try immediately
  const handleTryDemoVideo = () => {
    if (onTryDemo) {
      onTryDemo();
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw poster frame
      const grad = ctx.createLinearGradient(0, 0, 720, 1280);
      grad.addColorStop(0, '#1a1814');
      grad.addColorStop(0.5, '#2b2316');
      grad.addColorStop(1, '#0c0b0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // Draw subtle geometry
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(360, 520, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Epic Hertz Studio', 360, 740);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '26px sans-serif';
      ctx.fillText('Sample Demo Video', 360, 790);

      canvas.toBlob((blob) => {
        if (blob) {
          const fakeFile = new File([blob], 'epic-hertz-demo-sample.mp4', {
            type: 'video/mp4',
            lastModified: Date.now(),
          });
          onFileSelect(fakeFile);
        }
      }, 'image/jpeg');
    } catch (err) {
      console.warn('Demo generation fallback:', err);
    }
  };

  // Demo words for live reel display
  const demoDialogue = {
    te: {
      romanized: ['Prathi', 'frame', 'lo', 'oka', 'katha.', 'Mana', 'cinema.'],
      native: ['ప్రతి', 'ఫ్రేమ్', 'లో', 'ఒక', 'కథ.', 'మన', 'సినిమా.'],
    },
    hi: {
      romanized: ['Aapka', 'swagat', 'hai', 'is', 'nayee', 'video', 'mein.'],
      native: ['आपका', 'स्वागत', 'है', 'इस', 'नई', 'वीडियो', 'में.'],
    },
    en: {
      romanized: ['Transform', 'your', 'video', 'into', 'viral', 'kinetic', 'reels.'],
      native: ['Transform', 'your', 'video', 'into', 'viral', 'kinetic', 'reels.'],
    },
  };

  const words = demoDialogue[sampleLang as 'te' | 'hi' | 'en']?.[scriptMode] || demoDialogue.te.romanized;
  const activePreset = PRESET_LIBRARY.find((p) => p.id === activePresetId) || PRESET_LIBRARY[0];

  // 5 Signature Presets for Horizontal Reel Runway (Beat 3)
  const runwayPresets: {
    id: SubtitlePreset;
    title: string;
    badge: string;
    image: string;
    highlightColor: string;
    textColor: string;
    bgBadge: string;
    dialogue: string[];
  }[] = [
    {
      id: 'capcut-viral',
      title: 'CapCut Bounce',
      badge: 'VIRAL GOLD',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      highlightColor: '#FFDF00',
      textColor: '#FFFFFF',
      bgBadge: 'rgba(0,0,0,0.75)',
      dialogue: ['THIS', 'CHANGES', 'EVERYTHING', 'FOR', 'REEL', 'CREATORS', 'TODAY'],
    },
    {
      id: 'hormozi-yellow',
      title: 'Hormozi Impact',
      badge: 'HIGH RETENTION',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
      highlightColor: '#22C55E',
      textColor: '#FFFFFF',
      bgBadge: 'rgba(0,0,0,0.85)',
      dialogue: ['NEVER', 'LOSE', 'ANOTHER', 'VIEWER', 'IN', 'THE', 'HOOK'],
    },
    {
      id: 'premiere-glow',
      title: 'Cyber Glow',
      badge: 'TECH & GAMING',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
      highlightColor: '#00F0FF',
      textColor: '#FFFFFF',
      bgBadge: 'rgba(10,10,25,0.8)',
      dialogue: ['FUTURE', 'OF', 'SYNCHRONOUS', 'AUDIO', 'SUBTITLES', 'IS', 'HERE'],
    },
    {
      id: 'mrbeast-comic',
      title: 'MrBeast Hype',
      badge: 'BOLD STROKE',
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=600&auto=format&fit=crop',
      highlightColor: '#EF4444',
      textColor: '#FFFFFF',
      bgBadge: 'rgba(0,0,0,0.7)',
      dialogue: ['I', 'SPENT', '50', 'HOURS', 'EDITING', 'THIS', 'ONE'],
    },
    {
      id: 'fire-hype',
      title: 'Flame Hype',
      badge: 'AUTO EMOJI',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop',
      highlightColor: '#F97316',
      textColor: '#FFFFFF',
      bgBadge: 'rgba(0,0,0,0.8)',
      dialogue: ['DROP', 'YOUR', 'FIRE', 'CLIP', 'AND', 'WATCH', 'VIRAL'],
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full overflow-y-auto overflow-x-hidden bg-[#0a0a09] text-bone font-sans selection:bg-amber-400 selection:text-black"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Background radial studio glows & ambient depth */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[650px] rounded-full blur-[140px] opacity-25"
          style={{
            background: 'radial-gradient(circle, #f59e0b 0%, rgba(217, 167, 74, 0.15) 50%, transparent 80%)',
          }}
        />
        <div
          className="absolute top-[45%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-15"
          style={{
            background: 'radial-gradient(circle, #d97706 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-[5%] w-[700px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #b45309 0%, transparent 75%)',
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
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 border-4 border-dashed border-amber-400"
          >
            <div className="w-20 h-20 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-4xl mb-4 animate-bounce">
              ⚡
            </div>
            <h2 className="text-2xl font-bold text-bone">Release to Caption Video</h2>
            <p className="text-mist text-sm mt-1">Instant transcription in Telugu, Hindi, Tamil & English</p>
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
      {/* BEAT 1: DIMENSIONAL 3D HERO (Foreground Z>0, Subject Z=0, BG Z<0)      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 pt-12 pb-16 z-10">
        <motion.div
          style={{
            scale: heroScale,
            opacity: heroOpacity,
            y: heroTranslateY,
          }}
          className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          {/* Left Column: Editorial Headline & Actions */}
          <div className="flex-1 max-w-xl text-left space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>EPIC HERTZ AI STUDIO</span>
            </div>

            {/* Big Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-bone leading-[1.08]">
              Words that <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">move people</span>. Synced to every breath.
            </h1>

            {/* Body */}
            <p className="text-mist text-base sm:text-lg leading-relaxed max-w-lg">
              Studio-grade auto-captioning for Reels, Shorts, and ads. Natural Tanglish, Hinglish, and Native scripts with word-level karaoke sync powered by Gemini AI.
            </p>

            {/* CTA Terminal / Upload Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-sm tracking-wide shadow-xl hover:shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Drop or Select Video</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>

              <button
                type="button"
                onClick={handleTryDemoVideo}
                className="px-5 py-3.5 rounded-full bg-[#181816] hover:bg-[#222220] border border-white/10 hover:border-white/20 text-bone text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Launch studio instantly with sample footage"
              >
                <span>⚡ Try Demo Footage</span>
              </button>
            </div>

            {/* Feature bullets */}
            <div className="pt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-smoke font-mono">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 150ms In-Browser Audio
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Tanglish & Hinglish
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> 10 Animated Styles
              </span>
            </div>
          </div>

          {/* Right Column: Floating 3D Perspective Phone Reel with Layered Depth Planes */}
          <div className="relative w-full lg:w-[440px] flex items-center justify-center perspective-[1200px]">
            {/* Dimensional Depth Plane: Background Halo Glow (Z = -60px) */}
            <div
              className="absolute w-72 h-72 rounded-full bg-amber-500/20 blur-[90px] pointer-events-none"
              style={{
                transform: `translateZ(-60px) translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
              }}
            />

            {/* 3D Tilted Device Container (Subject Plane: Z = 0) */}
            <div
              className="relative w-[280px] sm:w-[310px] aspect-[9/16] rounded-[36px] p-3.5 bg-gradient-to-b from-[#252522] via-[#141413] to-[#0d0d0c] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.18)] border border-white/15 transition-transform duration-200 ease-out"
              style={{
                transform: `rotateY(${mousePos.x * -10 - 4}deg) rotateX(${mousePos.y * 10 + 4}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Phone Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#1c1c1a] mr-2" />
                <div className="w-10 h-1 rounded-full bg-[#1c1c1a]" />
              </div>

              {/* Inner Screen Display */}
              <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-[#121211] flex flex-col justify-between p-4">
                {/* Simulated Reel Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter brightness-90 scale-105"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=687&auto=format&fit=crop')`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60" />
                </div>

                {/* Top Overlay Badge */}
                <div className="relative z-20 flex items-center justify-between text-[11px] text-white/90">
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                    Reel 9:16
                  </span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>

                {/* Center Word-Level Animated Karaoke Subtitle */}
                <div className="relative z-20 my-auto text-center px-2 py-3 rounded-xl backdrop-blur-sm">
                  <div
                    className="font-bold tracking-tight inline-block leading-relaxed transition-all"
                    style={{
                      fontSize: `${activePreset.config.fontSize || 24}px`,
                      color: activePreset.config.textColor || '#FFFFFF',
                      backgroundColor: activePreset.config.backgroundColor || 'rgba(0,0,0,0.65)',
                      padding: '8px 14px',
                      borderRadius: '14px',
                      textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                    }}
                  >
                    {words.map((w, idx) => {
                      const isCurrent = idx === activeWordIdx;
                      return (
                        <span
                          key={idx}
                          className="inline-block transition-all duration-150 mr-1.5"
                          style={{
                            color: isCurrent ? activePreset.config.highlightColor || '#FFDF00' : undefined,
                            transform: isCurrent ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                            fontWeight: isCurrent ? 800 : 600,
                          }}
                        >
                          {w}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Social Reel Controls Bar */}
                <div className="relative z-20 flex items-center justify-between text-xs text-white/80 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center text-[10px]">
                      ▶
                    </span>
                    <span className="font-mono text-[11px]">0:04 / 0:18</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-400/20">
                    {activePreset.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Dimensional Depth Plane: Floating Badge 1 (Foreground Z = +75px) */}
            <div
              className="hidden sm:flex absolute -right-8 top-10 bg-[#1d1d1b]/95 backdrop-blur-xl border border-amber-400/40 px-3.5 py-2.5 rounded-2xl shadow-2xl text-[11px] text-bone z-30 flex-col gap-0.5"
              style={{
                transform: `translateZ(75px) translate(${mousePos.x * 16}px, ${mousePos.y * 16}px)`,
              }}
            >
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <span>⚡ 0ms Lag Word Sync</span>
              </div>
              <span className="text-[10px] text-smoke font-mono">60fps RAF audio loop</span>
            </div>

            {/* Dimensional Depth Plane: Floating Badge 2 (Foreground Z = +90px) */}
            <div
              className="hidden sm:flex absolute -left-10 bottom-14 bg-[#1d1d1b]/95 backdrop-blur-xl border border-emerald-400/40 px-4 py-2.5 rounded-2xl shadow-2xl text-[11px] text-bone z-30 flex-col gap-0.5"
              style={{
                transform: `translateZ(90px) translate(${mousePos.x * -18}px, ${mousePos.y * -18}px)`,
              }}
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>+420% Reel Retention</span>
              </div>
              <span className="text-[10px] text-smoke font-mono">Instagram & TikTok safe</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BEAT 2.5: BESPOKE SIGNATURE MOVE — "RAW VS. VIRAL" SPLIT-SCRUB CURTAIN */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 border-t border-white/10 bg-[#0c0c0b] z-10">
        <div className="w-full max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              SIGNATURE COMPARISON
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bone tracking-tight">
              Drag the Curtain. See the Viral Difference.
            </h2>
            <p className="text-smoke text-sm sm:text-base leading-relaxed">
              Standard boring subtitles destroy retention. Drag the handle below to see how Epic Hertz transforms flat transcript boxes into high-octane CapCut kinetic hooks.
            </p>
          </div>

          {/* Interactive Split-Scrub Stage */}
          <div
            ref={splitContainerRef}
            onMouseDown={handleSplitMouseDown}
            onTouchStart={handleSplitTouchStart}
            className="relative w-full max-w-4xl mx-auto h-[380px] sm:h-[440px] rounded-3xl overflow-hidden border border-white/15 bg-black shadow-[0_20px_70px_rgba(0,0,0,0.85)] cursor-ew-resize select-none"
          >
            {/* Background Simulated Video Frame */}
            <div
              className="absolute inset-0 bg-cover bg-center filter brightness-95"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1400&auto=format&fit=crop')`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
            </div>

            {/* RIGHT SIDE LAYER: Epic Hertz Viral Reel (Full Width, underneath) */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
              {/* Top Tag */}
              <div className="self-end px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-bold shadow-lg">
                ✨ Epic Hertz 60fps Viral Subtitles
              </div>

              {/* Kinetic Subtitle Center */}
              <div className="my-auto text-center">
                <div className="inline-block p-4 sm:p-5 rounded-2xl bg-black/70 backdrop-blur-md border border-amber-400/30 shadow-2xl">
                  <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    <span>MANA</span>
                    <span className="text-amber-300 scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] relative">
                      CINEMA
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl animate-bounce">🎬</span>
                    </span>
                    <span>CREATORS</span>
                    <span className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.7)]">RULE</span>
                    <span>THE</span>
                    <span className="text-emerald-400">FEED!</span>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-300/90 font-mono">
                    <span>⚡ 0ms syllable onset</span>
                    <span>•</span>
                    <span>🔥 Bouncing emoji pop</span>
                  </div>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="self-end text-xs text-white/70 font-mono">
                Retention Score: <span className="text-emerald-400 font-bold">98.4%</span>
              </div>
            </div>

            {/* LEFT SIDE LAYER: Raw Clunky Caption (Clipped by splitPos) */}
            <div
              className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 pointer-events-none overflow-hidden bg-black/50 backdrop-grayscale"
              style={{
                clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
              }}
            >
              {/* Top Tag */}
              <div className="self-start px-3 py-1 rounded-full bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-600">
                ⚠️ Default Raw / Delayed Captions
              </div>

              {/* Dull Subtitle Center */}
              <div className="my-auto text-center">
                <div className="inline-block p-3 sm:p-4 bg-zinc-900/90 border border-zinc-700 rounded-none max-w-md">
                  <p className="text-base sm:text-xl font-normal font-sans text-zinc-300 leading-normal">
                    mana cinema creators rule the feed... (2.0s lag)
                  </p>
                  <p className="mt-2 text-[10px] text-red-400 font-mono">
                    ❌ Flat font, no highlight, covers actor's face
                  </p>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="self-start text-xs text-zinc-400 font-mono">
                Retention Dropoff: <span className="text-red-400 font-bold">-62%</span>
              </div>
            </div>

            {/* Draggable Divider Line & Knob */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-30 pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              {/* Center Drag Handle Knob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-xl pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
                <span>◀▶</span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-smoke font-mono">
            💡 Click and drag the handle anywhere across the frame to inspect the visual contrast.
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BEAT 2: THE SCRIPT SWITCHER (Colloquial Dialect vs Native Script)       */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 border-t border-white/10 bg-[#0e0e0d]/60 backdrop-blur-sm z-10">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              CULTURE-FIRST TRANSCRIPTION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bone tracking-tight">
              Indian Audiences Don't Read Textbook Prose.
            </h2>
            <p className="text-smoke text-sm sm:text-base leading-relaxed">
              Standard AI transcription forces rigid dictionary characters. Epic Hertz gives you conversational Romanized transliteration (Tanglish, Hinglish) alongside authentic Native script.
            </p>
          </div>

          {/* Interactive Dialect Switcher Box */}
          <div className="rounded-3xl bg-[#141413] border border-white/10 p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto">
            {/* Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 bg-[#1b1b19] p-1 rounded-xl border border-white/10">
                {(['te', 'hi', 'en'] as SpokenLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSampleLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      sampleLang === lang
                        ? 'bg-[#292826] text-amber-300 shadow-sm border border-amber-300/30'
                        : 'text-smoke hover:text-bone'
                    }`}
                  >
                    {lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}
                  </button>
                ))}
              </div>

              {/* Script Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-[#1b1b19] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setScriptMode('romanized')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    scriptMode === 'romanized'
                      ? 'bg-amber-400 text-black shadow-sm font-bold'
                      : 'text-smoke hover:text-bone'
                  }`}
                >
                  Tanglish / Hinglish
                </button>
                <button
                  type="button"
                  onClick={() => setScriptMode('native')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    scriptMode === 'native'
                      ? 'bg-amber-400 text-black shadow-sm font-bold'
                      : 'text-smoke hover:text-bone'
                  }`}
                >
                  Native Script
                </button>
              </div>
            </div>

            {/* Live Interactive Comparison Screen */}
            <div className="mt-6 p-6 rounded-2xl bg-[#0c0c0b] border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-[11px] font-mono uppercase text-mist tracking-widest">
                Generated Subtitle Output
              </span>
              <div className="text-xl sm:text-2xl font-bold text-bone leading-relaxed min-h-[3rem] flex items-center justify-center">
                <span className="text-amber-300 font-mono mr-2">“</span>
                {words.join(' ')}
                <span className="text-amber-300 font-mono ml-2">”</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-smoke">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Ready for Instagram Reels, YouTube Shorts, and TikTok</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BEAT 3: HORIZONTAL REEL RUNWAY (Vertical 9:16 Phones With Kinetic Pop) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 border-t border-white/10 bg-[#0a0a09] z-10">
        <div className="w-full max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              REEL RUNWAY WARDROBE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bone tracking-tight">
              5 Kinetic Presets Crafted for Maximum Watch-Time.
            </h2>
            <p className="text-smoke text-sm leading-relaxed">
              Every preset runs in live 9:16 mobile mockups with real-time word animation. Click any phone below to make it your active studio style.
            </p>
          </div>

          {/* Horizontal Reel Runway (Swipeable & Responsive Grid) */}
          <div className="flex items-stretch gap-6 overflow-x-auto pb-8 pt-4 px-2 no-scrollbar justify-start lg:justify-center">
            {runwayPresets.map((preset) => {
              const isSelected = activePresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => setActivePresetId(preset.id)}
                  className={`group relative flex-shrink-0 w-[240px] sm:w-[260px] aspect-[9/16] rounded-[32px] p-2.5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-400/40 via-[#262520] to-[#121211] ring-2 ring-amber-400 shadow-[0_15px_45px_rgba(245,158,11,0.25)] scale-[1.03]'
                      : 'bg-gradient-to-b from-white/10 via-[#181817] to-[#0f0f0e] border border-white/10 hover:border-white/25 hover:scale-[1.01]'
                  }`}
                >
                  {/* Phone Screen Container */}
                  <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-black flex flex-col justify-between p-3.5">
                    {/* Simulated Background Video Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url('${preset.image}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />
                    </div>

                    {/* Top Notch & Badge */}
                    <div className="relative z-10 flex items-center justify-between text-[10px]">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-bone border border-white/10">
                        9:16 Reel
                      </span>
                      <span
                        className="font-bold px-2 py-0.5 rounded-full text-black text-[9px]"
                        style={{ backgroundColor: preset.highlightColor }}
                      >
                        {preset.badge}
                      </span>
                    </div>

                    {/* Live Word Kinetic Subtitle Overlay */}
                    <div className="relative z-10 my-auto text-center px-1">
                      <div
                        className="inline-block px-3 py-2 rounded-xl backdrop-blur-md shadow-2xl transition-all"
                        style={{ backgroundColor: preset.bgBadge }}
                      >
                        <div className="text-sm sm:text-base font-extrabold tracking-tight leading-snug">
                          {preset.dialogue.map((w, idx) => {
                            const isCurrent = idx === (activeWordIdx % preset.dialogue.length);
                            return (
                              <span
                                key={idx}
                                className="inline-block mr-1 transition-all duration-150"
                                style={{
                                  color: isCurrent ? preset.highlightColor : preset.textColor,
                                  transform: isCurrent ? 'scale(1.2) translateY(-2px)' : 'scale(1)',
                                  textShadow: isCurrent
                                    ? `0 0 14px ${preset.highlightColor}`
                                    : '0 2px 6px rgba(0,0,0,0.9)',
                                }}
                              >
                                {w}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Active Indicator */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10">
                      <span className="font-bold text-bone truncate">{preset.title}</span>
                      {isSelected ? (
                        <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-smoke group-hover:text-amber-300 transition-colors">
                          Select →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161614] border border-white/10 text-xs text-smoke font-mono">
              <span className="text-amber-400">⚡</span> Active Preset: <span className="text-bone font-bold">{activePreset.title}</span> ({activePreset.id})
            </span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BEAT 4: STUDIO ENGINE WITH INTERACTIVE SOUNDWAVE CANVAS SCULPTOR      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 border-t border-white/10 bg-[#0e0e0d] z-10">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              AUDIO-REACTIVE CORE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bone tracking-tight">
              Engineered for Speed, Not Page Bloat.
            </h2>
            <p className="text-smoke text-sm leading-relaxed">
              16kHz native client-side downsampling. Sub-word vocal boundaries extracted at the hardware level.
            </p>
          </div>

          {/* Interactive Soundwave Sculptor Canvas */}
          <div className="rounded-3xl bg-[#141413] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-smoke font-mono pb-2 border-b border-white/10">
              <span className="flex items-center gap-2 text-amber-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Live 16kHz Web Audio Analyzer
              </span>
              <span>Hardware FFT Frequency Domain</span>
            </div>

            <div className="relative w-full h-44 rounded-2xl bg-[#090908] border border-white/5 overflow-hidden flex items-center justify-center">
              <canvas
                ref={waveCanvasRef}
                width={800}
                height={176}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-4 text-[10px] font-mono text-white/50 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                16,000 Hz Mono PCM Downsample
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Spec 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-bone">
                  <span className="text-amber-400">⚡</span> 150ms In-Browser Audio
                </div>
                <p className="text-xs text-smoke leading-relaxed">
                  Zero 32MB FFmpeg WASM downloads. Uses native browser Web Audio API (<code className="text-amber-200">AudioContext.decodeAudioData</code>) to downmix to 16kHz mono WAV in under 150ms.
                </p>
              </div>

              {/* Spec 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-bone">
                  <span className="text-amber-400">🎯</span> Sub-Word Karaoke Sync
                </div>
                <p className="text-xs text-smoke leading-relaxed">
                  Captures word-by-word start and end timestamps so subtitles illuminate synchronously with the vocal syllables rather than entire clunky blocks.
                </p>
              </div>

              {/* Spec 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-bold text-bone">
                  <span className="text-amber-400">🔒</span> Zero Server Video Uploads
                </div>
                <p className="text-xs text-smoke leading-relaxed">
                  Your video file never leaves your computer. Only the extracted 16kHz audio track is sent to the official Gemini AI endpoint, keeping video bandwidth instant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BEAT 5: LAUNCH TERMINAL DOCK                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 border-t border-white/10 bg-gradient-to-b from-[#0e0e0d] to-[#070706] z-10">
        <div className="w-full max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bone tracking-tight">
              Ready to Caption Your Next Video?
            </h2>
            <p className="text-smoke text-sm">
              Drop any video file (.mp4, .mov, .webm) or launch with demo footage.
            </p>
          </div>

          {/* Interactive Drop Box in Dock */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-3xl border-2 border-dashed border-white/20 hover:border-amber-400/70 p-10 bg-[#141413]/80 hover:bg-[#1a1a18] transition-all cursor-pointer shadow-2xl flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-400/10 group-hover:bg-amber-400/20 text-amber-400 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
              📥
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-bone">
                Click to browse or drop video anywhere
              </p>
              <p className="text-xs text-smoke font-mono">
                Supports MP4, MOV, WEBM, MKV · Unlimited duration
              </p>
            </div>

            <button
              type="button"
              className="mt-2 px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide shadow-md transition-colors"
            >
              Select File
            </button>
          </div>

          {/* Sample Demo Footage Direct Launch */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTryDemoVideo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#181816] hover:bg-[#222220] border border-white/15 text-xs text-bone font-semibold transition-all cursor-pointer"
            >
              <span>⚡ Or launch studio instantly with sample demo video</span>
              <span className="text-amber-400">→</span>
            </button>
          </div>

          {/* Cloud AI engine badge */}
          <div className="flex items-center justify-center gap-3 pt-2 text-xs text-smoke">
            <span>Powered by Epic Hertz Cloud AI</span>
          </div>
        </div>
      </section>
    </div>
  );
}
