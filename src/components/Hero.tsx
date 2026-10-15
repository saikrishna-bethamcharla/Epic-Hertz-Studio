import { useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { profile, type ProfileId } from '../data/portfolio';
import { useFinePointer } from '../hooks/useMedia';
import { EASE, Particles } from './fx';
import { useSmoothScroll } from '../hooks/smoothScroll';

export default function Hero({ onPlay, onResume, profileId: _profileId }: { onPlay?: () => void; onResume?: () => void; profileId?: ProfileId }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const fine = useFinePointer();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-24%']);
  const fade = useTransform(scrollYProgress, [0, 0.78], [1, 0]);

  // High-precision pointer parallax
  const mx = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 65, damping: 20 });

  // Multi-plane 3D depths
  const wordShiftX = useTransform(px, [-1, 1], [18, -18]);
  const glowX = useTransform(px, [-1, 1], ['-8%', '8%']);

  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';

  return (
    <section
      id="top"
      ref={ref}
      className="relative h-[100svh] min-h-[100svh] max-h-[100svh] overflow-hidden bg-[#050507] select-none"
      onPointerMove={(e) => {
        if (!fine) return;
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
      }}
    >
      {/* 1. ATMOSPHERIC VOLUMETRIC GLOW & FILM PARTICLES */}
      <motion.div aria-hidden className="absolute inset-0 pointer-events-none" style={{ x: glowX }}>
        <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 h-[75vh] w-[92vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(222,27,28,0.36)_0%,rgba(140,12,24,0.18)_42%,rgba(5,5,7,0)_72%)] blur-3xl" />
        <div className="absolute right-[-10%] top-[-10%] h-[70vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(255,42,43,0.14),transparent_65%)] blur-2xl" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[60vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(70,10,20,0.22),transparent_65%)] blur-2xl" />
      </motion.div>
      <Particles className="z-[1] opacity-75" />

      {/* 2. GIREESH-STYLE TECHNICAL FURNITURE OVERLAYS */}
      {/* Lateral Glowing Arrow Chevrons (Left & Right) */}
      <div aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-6 text-bone/25">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="text-xs transition-opacity duration-300 hover:text-crimson-2" style={{ opacity: 0.25 + i * 0.15 }}>
            ◀
          </span>
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-6 text-bone/25">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="text-xs transition-opacity duration-300 hover:text-crimson-2" style={{ opacity: 0.25 + i * 0.15 }}>
            ▶
          </span>
        ))}
      </div>

      {/* 3. THE GIANT CINEMATIC WORDMARK ("SAI KRISHNA") */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center text-center px-4"
        style={{ x: wordShiftX, y: textY, opacity: fade }}
      >
        {/* "WELCOME TO MY WORLD" BANNER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-2 sm:mb-4 flex items-center gap-3 font-['Oswald'] text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.42em] text-bone"
        >
          <span className="flex items-center gap-1 text-crimson-2">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-2 shadow-[0_0_8px_#ff3d5a]" />
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-2" />
          </span>
          <span className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">WELCOME TO MY WORLD</span>
          <span className="flex items-center gap-1 text-crimson-2">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-2 shadow-[0_0_8px_#ff3d5a]" />
          </span>
        </motion.div>

        {/* MASSIVE DISTRESSED RED TITLE */}
        <h1
          className="font-['Anton',Impact,sans-serif] uppercase leading-[0.84] tracking-[-0.01em] select-none text-center"
          style={{
            fontSize: 'clamp(3.1rem, 16vw, 17rem)',
            backgroundImage: `url("${base}assets/grunge.png"), linear-gradient(180deg, #ff2627 0%, #de1b1c 60%, #a80c0d 100%)`,
            backgroundBlendMode: 'multiply',
            backgroundSize: '320px 320px, 100% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 50px rgba(222,27,28,0.45)) drop-shadow(0 15px 35px rgba(0,0,0,0.95))',
          }}
        >
          SAI KRISHNA
        </h1>

        <p className="mt-2 font-['Oswald',sans-serif] text-xs sm:text-sm font-semibold tracking-[0.58em] text-bone/80 uppercase">
          {profile.seriesTag}
        </p>

        <div className="pointer-events-auto relative z-10 mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-9">
          <button
            type="button"
            onClick={() => scrollTo('#originals', { offset: -64 })}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-crimson px-6 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_30px_rgba(222,27,28,0.24)] transition hover:bg-crimson-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Explore My Work <span aria-hidden="true" className="ml-2">↘</span>
          </button>
          <button
            type="button"
            onClick={onResume}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 bg-black/35 px-6 text-xs font-bold uppercase tracking-[0.18em] text-bone backdrop-blur-sm transition hover:border-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            View Resume
          </button>
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex min-h-12 items-center justify-center rounded-md px-4 text-xs font-semibold uppercase tracking-[0.16em] text-bone/75 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span aria-hidden="true" className="mr-2 text-crimson-2">▶</span> Play Intro
          </button>
        </div>

        {/* Animated Scroll Indicator Cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-6 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="font-['Oswald'] text-[10px] tracking-[0.35em] uppercase text-bone/50">
            Scroll To Explore
          </span>
          <motion.div
            animate={{ y: [0, 6, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="flex flex-col items-center text-crimson-2 text-xs"
          >
            ▼
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
