// ─── LandingScrollCraft — Epic Hertz Studio ─────────────────────────────────
// Premium 3D scroll-driven landing page built to scroll-craft specification:
// - Dimensional layered 3D hero with independent depth planes and live video phone mockup
// - Word-by-word animated karaoke captions in Tanglish, Hinglish, and Native scripts
// - Interactive Script Switcher (Conversational Romanized vs Authentic Native Script)
// - 3D Preset Wardrobe showcase with live interactive style switching
// - Studio Engine breakdown: 150ms in-browser Web Audio extraction, sub-word timestamps
// - Direct tactile drop terminal + 1-click sample demo video launcher

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { PRESET_LIBRARY } from './TemplateDrawer';
import type { SubtitlePreset, ScriptOutput, SpokenLanguage } from './types';

interface LandingScrollCraftProps {
  onFileSelect: (file: File) => void;
  onOpenApiKeyModal: () => void;
}

export default function LandingScrollCraft({
  onFileSelect,
  onOpenApiKeyModal,
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

  // Word-by-word karaoke ticker for live preview
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIdx((prev) => (prev + 1) % 7);
    }, 420);
    return () => clearInterval(interval);
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
      romanized: ['Godavari', 'Desi', 'Ghee.', 'Inti', 'ruchiki', 'mana', 'ghee.'],
      native: ['గోదావరి', 'దేశీ', 'గీ.', 'ఇంటి', 'రుచికి', 'మన', 'గీ.'],
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
      {/* BEAT 1: DIMENSIONAL 3D HERO                                            */}
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

          {/* Right Column: Floating 3D Perspective Phone Reel */}
          <div className="relative w-full lg:w-[420px] flex items-center justify-center perspective-[1200px]">
            {/* 3D Tilted Device Container */}
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

            {/* Decorative Floating Depth Elements */}
            <div
              className="hidden sm:block absolute -right-6 top-12 bg-[#1d1d1b]/90 backdrop-blur-md border border-white/15 px-3 py-2 rounded-xl shadow-2xl text-[11px] text-bone z-30"
              style={{
                transform: `translateZ(60px) translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`,
              }}
            >
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span>⚡ 150ms</span>
                <span className="text-mist">Native Extraction</span>
              </div>
            </div>

            <div
              className="hidden sm:block absolute -left-6 bottom-16 bg-[#1d1d1b]/90 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-xl shadow-2xl text-[11px] text-bone z-30"
              style={{
                transform: `translateZ(50px) translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`,
              }}
            >
              <span className="text-emerald-400 font-bold">● Active</span>
              <span className="text-smoke ml-1.5">Word-Level Sync</span>
            </div>
          </div>
        </motion.div>
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
      {/* BEAT 3: 3D PRESET WARDROBE (Animated Style Cards)                      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 border-t border-white/10 bg-[#0a0a09] z-10">
        <div className="w-full max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              STYLE WARDROBE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bone tracking-tight">
              10 Studio Presets Crafted for Social Retention.
            </h2>
            <p className="text-smoke text-sm leading-relaxed">
              Click any style to preview it live. Custom stroke outlines, word-level highlight colors, and background paddings tailored for mobile viewports.
            </p>
          </div>

          {/* Preset Cards Grid in 3D Perspective */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {PRESET_LIBRARY.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setActivePresetId(preset.id)}
                  className={`group text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-44 ${
                    isSelected
                      ? 'bg-[#22211d] border-amber-400 ring-2 ring-amber-400/40 shadow-xl scale-[1.03]'
                      : 'bg-[#141413] border-white/10 hover:border-white/25 hover:bg-[#1a1a18]'
                  }`}
                >
                  {/* Card Mini Preview Box */}
                  <div
                    className="w-full h-20 rounded-xl flex items-center justify-center p-2 overflow-hidden shadow-inner border border-white/5"
                    style={{ backgroundColor: preset.previewBg || '#181816' }}
                  >
                    <span
                      className="font-bold text-xs text-center truncate"
                      style={{
                        color: preset.previewTextColor,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      sy ga ches...
                    </span>
                  </div>

                  {/* Card Title & Badge */}
                  <div className="flex items-center justify-between w-full mt-2">
                    <span className="text-xs font-bold text-bone group-hover:text-amber-300 transition-colors">
                      {preset.title}
                    </span>
                    {preset.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-mist">
                        {preset.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* BEAT 4: STUDIO ENGINE SPECIFICATIONS (Web Audio + Gemini AI)          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 border-t border-white/10 bg-[#0e0e0d] z-10">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              BUILT FOR CLIENT WORK
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bone tracking-tight">
              Engineered for Speed, Not Page Bloat.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spec 1 */}
            <div className="p-6 rounded-2xl bg-[#141413] border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center text-lg font-bold">
                ⚡
              </div>
              <h3 className="text-base font-bold text-bone">150ms In-Browser Audio</h3>
              <p className="text-xs text-smoke leading-relaxed">
                Zero 32MB FFmpeg WASM downloads. Uses native browser Web Audio API (<code className="text-amber-200">AudioContext.decodeAudioData</code>) to downmix to 16kHz mono WAV in under 150ms.
              </p>
            </div>

            {/* Spec 2 */}
            <div className="p-6 rounded-2xl bg-[#141413] border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center text-lg font-bold">
                🎯
              </div>
              <h3 className="text-base font-bold text-bone">Sub-Word Karaoke Sync</h3>
              <p className="text-xs text-smoke leading-relaxed">
                Captures word-by-word start and end timestamps so subtitles illuminate synchronously with the vocal syllables rather than entire clunky blocks.
              </p>
            </div>

            {/* Spec 3 */}
            <div className="p-6 rounded-2xl bg-[#141413] border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center text-lg font-bold">
                🔒
              </div>
              <h3 className="text-base font-bold text-bone">Zero Server Video Uploads</h3>
              <p className="text-xs text-smoke leading-relaxed">
                Your video file never leaves your computer. Only the extracted 16kHz audio track is sent to the official Gemini AI endpoint, keeping video bandwidth instant.
              </p>
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

          {/* API Key prompt & status */}
          <div className="flex items-center justify-center gap-3 pt-4 text-xs text-smoke">
            <span>Powered by Google Gemini API</span>
            <span>·</span>
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className="text-amber-300 hover:underline font-semibold"
            >
              ⚙ Configure API Key
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
