import { useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { certifications, profile, projects, type ProfileId } from '../data/portfolio';
import { useFinePointer } from '../hooks/useMedia';
import { useSmoothScroll } from '../hooks/smoothScroll';
import { EASE, Magnetic, Particles } from './fx';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } };
const item = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.85, ease: EASE } },
};

export default function Hero({ onPlay, onResume, profileId: _profileId }: { onPlay: () => void; onResume: () => void; profileId: ProfileId }) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const { scrollTo } = useSmoothScroll();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-24%']);
  const fade = useTransform(scrollYProgress, [0, 0.78], [1, 0]);

  // High-precision pointer parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 65, damping: 20 });
  const py = useSpring(my, { stiffness: 65, damping: 20 });

  // Multi-plane 3D depths
  const imgRotY = useTransform(px, [-1, 1], [-5, 5]);
  const imgRotX = useTransform(py, [-1, 1], [3, -3]);
  const imgShiftX = useTransform(px, [-1, 1], [-14, 14]);
  const wordShiftX = useTransform(px, [-1, 1], [18, -18]);
  const chipShiftX = useTransform(px, [-1, 1], [-22, 22]);
  const chipShiftY = useTransform(py, [-1, 1], [-16, 16]);
  const glowX = useTransform(px, [-1, 1], ['-8%', '8%']);

  const meta = [
    'Zai Labs · Aug 2026 – Present',
    'Kingston PGD',
    `${projects.length} Originals`,
    `${certifications.length} Credentials`,
  ];

  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';

  return (
    <section
      id="top"
      ref={ref}
      className="relative h-[100svh] min-h-[100svh] max-h-[100svh] overflow-hidden bg-[#050507] select-none"
      onPointerMove={(e) => {
        if (!fine) return;
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      }}
    >
      {/* 1. ATMOSPHERIC VOLUMETRIC GLOW & FILM PARTICLES */}
      <motion.div aria-hidden className="absolute inset-0 pointer-events-none" style={{ x: glowX }}>
        <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 h-[75vh] w-[92vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(222,27,28,0.36)_0%,rgba(140,12,24,0.18)_42%,rgba(5,5,7,0)_72%)] blur-3xl" />
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

      {/* Bottom-Right 3x6 Dot Matrix Grid */}
      <div aria-hidden className="pointer-events-none absolute bottom-8 right-8 z-20 hidden lg:grid grid-cols-6 gap-2">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
              i === 0 || i === 5 || i === 12 ? 'bg-crimson-2 shadow-[0_0_8px_rgba(255,61,90,0.9)]' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* 3. THE GIANT CINEMATIC WORDMARK ("SAI KRISHNA") */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[24svh] sm:top-[20svh] lg:top-[16svh] z-[2] flex flex-col items-center justify-center text-center"
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
            fontSize: 'clamp(5.2rem, 17.5vw, 17rem)',
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
      </motion.div>

      {/* 4. FOREGROUND MATTED SUBJECT WITH 3D TILT */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] flex h-[76svh] sm:h-[82svh] lg:h-[86svh] items-end justify-center"
        style={{ y: imgY, scale: imgScale, opacity: fade }}
      >
        <motion.div
          className="relative h-full w-auto max-w-[94vw] sm:max-w-[70vw] lg:max-w-[44vw]"
          style={{ rotateY: imgRotY, rotateX: imgRotX, x: imgShiftX, transformPerspective: 1400 }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
        >
          {/* Subtle back rim light behind character */}
          <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgba(222,27,28,0.32)_0%,transparent_70%)] blur-3xl" />

          {/* Portrait cutout with smooth vignette blend */}
          <img
            src={profile.portrait.src}
            srcSet={profile.portrait.srcSet}
            sizes="(max-width: 768px) 94vw, (max-width: 1200px) 70vw, 44vw"
            alt={profile.portrait.alt}
            className="h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
            style={{
              maskImage: 'radial-gradient(ellipse 70% 84% at 50% 50%, black 50%, rgba(0,0,0,0.85) 68%, transparent 94%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 84% at 50% 50%, black 50%, rgba(0,0,0,0.85) 68%, transparent 94%)',
            }}
          />

          {/* Crimson cinematic rim wash */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_78%_35%,rgba(255,61,90,0.22),transparent_72%)] mix-blend-screen" />
        </motion.div>
      </motion.div>

      {/* 5. GIREESH-STYLE CORNER HUD CHIPS (Interactive & 3D Floating) */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" style={{ x: chipShiftX, y: chipShiftY }}>
        {/* Bottom-Left Chip: •CREATIVE & TECHNICAL LEAD• (matching Gireesh ARTIST chip) */}
        <div className="absolute left-[3vw] sm:left-[5vw] bottom-[20vh] sm:bottom-[23vh]">
          <div className="inline-flex items-center gap-2 rounded bg-white px-3.5 py-1.5 font-['Oswald'] text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-black shadow-[0_10px_25px_rgba(0,0,0,0.6)] ring-1 ring-white/20">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson" />
            <span>•CREATIVE & TECHNICAL LEAD•</span>
          </div>
        </div>

        {/* Top-Right Chip: •DIRECTOR & AI FILMMAKER• (matching Gireesh LEGEND chip) */}
        <div className="absolute right-[3vw] sm:right-[5vw] top-[18vh] sm:top-[21vh]">
          <div className="inline-flex items-center gap-2 rounded bg-black/85 backdrop-blur-md px-4 py-1.5 font-['Oswald'] text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[0_10px_25px_rgba(0,0,0,0.7)] ring-1 ring-white/30 border-l-2 border-crimson">
            <span>•DIRECTOR & AI FILMMAKER•</span>
          </div>
        </div>
      </motion.div>

      {/* 6. BOTTOM HUD & ACTION BAR */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[10] bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent pb-8 pt-24">
        <motion.div
          className="gutter flex flex-col md:flex-row items-center justify-between gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Left Metadata & Role Description */}
          <motion.div variants={item} className="pointer-events-auto flex flex-col gap-2 text-center md:text-left max-w-md">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[12px] font-medium text-mist">
              <span className="rounded bg-crimson px-2 py-0.5 font-['Oswald'] text-[10px] font-bold tracking-wider text-white">
                LEAD
              </span>
              {meta.map((m, i) => (
                <span key={m} className="flex items-center gap-2">
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-smoke" />}
                  {m}
                </span>
              ))}
            </div>
            <p className="font-sans text-xs sm:text-sm leading-relaxed text-bone/75">
              {profile.intro}
            </p>
          </motion.div>

          {/* Right Action Buttons */}
          <motion.div variants={item} className="pointer-events-auto flex items-center gap-3">
            <Magnetic>
              <button
                type="button"
                data-cursor="play"
                onClick={onPlay}
                className="group flex min-h-12 items-center gap-2.5 rounded bg-crimson px-6 py-3 font-['Oswald'] text-[13px] font-bold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-crimson-2 hover:shadow-[0_0_25px_rgba(229,19,43,0.6)]"
              >
                <span className="text-sm">▶</span>
                <span>Play Reel</span>
              </button>
            </Magnetic>

            <Magnetic>
              <button
                type="button"
                onClick={onResume}
                className="group flex min-h-12 items-center gap-2 rounded border border-white/20 bg-white/5 backdrop-blur-md px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.2em] text-bone transition-all duration-300 hover:border-white/40 hover:bg-white/10"
              >
                <span>⤓</span>
                <span>Resume</span>
              </button>
            </Magnetic>

            <Magnetic>
              <button
                type="button"
                onClick={() => scrollTo('#originals')}
                aria-label="Scroll to projects"
                className="flex h-12 w-12 items-center justify-center rounded border border-white/20 bg-white/5 backdrop-blur-md text-bone transition hover:border-crimson hover:text-crimson"
              >
                ↓
              </button>
            </Magnetic>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
