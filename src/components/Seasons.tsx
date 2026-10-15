import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { seasons } from '../data/portfolio';
import { useReducedMotionPref } from '../hooks/useMedia';
import { EASE, SectionHeading } from './fx';
import EpisodeCard from './EpisodeCard';
import { RailButtons } from './Rail';

// Chrono Time Machine Years mapped to Seasons
const CHRONO_NODES = [
  { year: '2022', label: 'ACADEMIC FOUNDATION', subtitle: 'Kingston University, London', seasonIndex: 0, angle: -58 },
  { year: '2023', label: 'POST-PRODUCTION CRAFT', subtitle: 'DaVinci Resolve & Premiere', seasonIndex: 1, angle: -32 },
  { year: '2024', label: 'BRAND & MOTION SYSTEMS', subtitle: 'After Effects & Design', seasonIndex: 1, angle: -6 },
  { year: '2025', label: 'WEB & CLIENT ARCHITECTURE', subtitle: 'Frontend, CRM & Hosting', seasonIndex: 2, angle: 22 },
  { year: '2026', label: 'CREATIVE & TECHNICAL LEAD', subtitle: 'Zai Labs · AI Filmmaking', seasonIndex: 3, angle: 52 },
];

export default function Seasons() {
  const [activeNodeIndex, setActiveNodeIndex] = useState(CHRONO_NODES.length - 1); // Default to 2026
  const [isInteracted, setIsInteracted] = useState(false);
  const activeNode = CHRONO_NODES[activeNodeIndex];
  const season = seasons[activeNode.seasonIndex] ?? seasons[seasons.length - 1];

  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  const reduced = useReducedMotionPref();

  // Mechanical spring-driven needle physics
  const springAngle = useSpring(CHRONO_NODES[CHRONO_NODES.length - 1].angle, { stiffness: 85, damping: 18 });

  // 1. Scroll-driven boot animation: Sweeps across the eras when scrolling into view
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 85%', 'center center'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // Only drive needle via scroll if the user hasn't actively scrubbed / clicked
    if (isInteracted || reduced) return;

    // Map scroll progress (0.1 -> 0.9) to nodes 0 -> 4
    const clamped = Math.max(0, Math.min(1, (latest - 0.1) / 0.8));
    const targetIdx = Math.min(CHRONO_NODES.length - 1, Math.floor(clamped * CHRONO_NODES.length));

    // Smoothly seek needle angle
    const startAngle = CHRONO_NODES[0].angle;
    const endAngle = CHRONO_NODES[CHRONO_NODES.length - 1].angle;
    const interpolated = startAngle + clamped * (endAngle - startAngle);

    springAngle.set(interpolated);
    if (targetIdx !== activeNodeIndex) {
      setActiveNodeIndex(targetIdx);
    }
  });

  // Rotate mechanical gear rings on scroll
  const gearScrollRotate = useTransform(scrollYProgress, [0, 1], [0, 75]);
  const counterGearScrollRotate = useTransform(scrollYProgress, [0, 1], [0, -55]);

  const handleSelectNode = (idx: number) => {
    setIsInteracted(true);
    setActiveNodeIndex(idx);
    springAngle.set(CHRONO_NODES[idx].angle);
    rail.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  // Continuous pointer tracking over stage
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Clock center pivot (400, 100 in 800x380 viewBox proportion)
    const cx = rect.width / 2;
    const cy = (100 / 380) * rect.height;

    // Calculate angle in degrees relative to downward vertical
    const dx = px - cx;
    const dy = py - cy;
    if (dy <= 0) return; // Cursor is above the pivot

    let angleDeg = Math.atan2(dx, dy) * (180 / Math.PI);
    // Clamp to arc range
    angleDeg = Math.max(-65, Math.min(60, angleDeg));

    // Seek continuous angle with high responsiveness
    setIsInteracted(true);
    springAngle.set(angleDeg);

    // Find closest node
    let closestIdx = 0;
    let minDist = 999;
    CHRONO_NODES.forEach((n, idx) => {
      const dist = Math.abs(n.angle - angleDeg);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeNodeIndex && minDist < 24) {
      setActiveNodeIndex(closestIdx);
    }
  };

  const handlePointerLeave = () => {
    // Snap needle gracefully to current active node
    springAngle.set(CHRONO_NODES[activeNodeIndex].angle);
  };

  return (
    <div ref={sectionRef} id="journey" className="relative overflow-hidden select-none">
      <SectionHeading
        kicker="Interactive Chrono Dial"
        title="My Journey Through Time"
        aside={
          <p className="max-w-xs text-sm text-mist">
            Rotate the mechanical clock dial to travel across eras — from London PGD to Creative &amp; Technical Lead at Zai Labs.
          </p>
        }
      />

      {/* 1. MECHANICAL CHRONO TIME MACHINE STAGE */}
      <div className="gutter relative mb-8 flex flex-col items-center">
        {/* Ambient Warm Golden/Amber Volumetric Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-[420px] w-[88vw] max-w-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.22)_0%,rgba(222,27,28,0.1)_45%,transparent_72%)] blur-3xl"
        />

        {/* The Interactive Mechanical Clock Stage */}
        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative w-full max-w-4xl h-[280px] sm:h-[340px] md:h-[380px] flex items-center justify-center cursor-crosshair"
        >
          {/* SVG Concentric Calibrated Rings and Mechanical Dial */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 800 380"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="chronoAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#ffedd5" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#de1b1c" stopOpacity="0.8" />
              </linearGradient>
              <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
              </radialGradient>
              <filter id="chronoGlow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Dial Center: (400, 100) */}
            {/* 1. Outer Concentric Tick Gear Ring (Continuously Rotating) */}
            <motion.g
              style={{
                transformOrigin: '400px 100px',
                rotate: gearScrollRotate,
              }}
            >
              <circle cx="400" cy="100" r="180" stroke="#f59e0b" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 8" />
              <circle cx="400" cy="100" r="172" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" />
              
              {/* Precision Calibrated Tick Marks around Circumference */}
              {Array.from({ length: 64 }).map((_, i) => {
                const deg = (i / 64) * 360;
                const rad = (deg * Math.PI) / 180;
                const r1 = i % 4 === 0 ? 162 : 168;
                const r2 = 172;
                const x1 = 400 + Math.sin(rad) * r1;
                const y1 = 100 + Math.cos(rad) * r1;
                const x2 = 400 + Math.sin(rad) * r2;
                const y2 = 100 + Math.cos(rad) * r2;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={i % 4 === 0 ? '#f59e0b' : '#ffffff'}
                    strokeOpacity={i % 4 === 0 ? 0.65 : 0.22}
                    strokeWidth={i % 4 === 0 ? 1.4 : 0.8}
                  />
                );
              })}
            </motion.g>

            {/* 2. Inner Counter-Rotating Mechanical Ring */}
            <motion.g
              style={{
                transformOrigin: '400px 100px',
                rotate: counterGearScrollRotate,
              }}
            >
              <circle cx="400" cy="100" r="120" stroke="#f59e0b" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="2 6" />
              <circle cx="400" cy="100" r="80" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
            </motion.g>

            {/* 3. Curved Energy Timeline Rail connecting nodes */}
            <path
              d="M 120 280 Q 250 250 400 240 Q 550 250 680 280"
              stroke="url(#chronoAmber)"
              strokeWidth="2.8"
              fill="none"
              filter="url(#chronoGlow)"
            />
            
            {/* 4. Flowing Energy Pulse current that streams along the rail */}
            <path
              d="M 120 280 Q 250 250 400 240 Q 550 250 680 280"
              stroke="#fff275"
              strokeWidth="2.2"
              fill="none"
              className="chrono-flow"
              filter="url(#chronoGlow)"
            />

            {/* Fine Rail Track Guides */}
            <path
              d="M 120 284 Q 250 254 400 244 Q 550 254 680 284"
              stroke="#f59e0b"
              strokeOpacity="0.35"
              strokeWidth="1"
              fill="none"
              strokeDasharray="2 4"
            />
          </svg>

          {/* Animated Mechanical Clock Needle & Pivot Hub */}
          <div className="absolute top-[100px] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            {/* The Rotating Needle Arm and Volumetric Beam */}
            <motion.div
              style={{
                rotate: springAngle,
                width: '40px',
                height: '40px',
              }}
              className="relative flex items-center justify-center origin-center"
            >
              {/* Additive Volumetric Conical Light Beam cast onto the timeline */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 h-[200px] w-[65px] origin-top bg-gradient-to-b from-amber-300/40 via-amber-500/15 to-transparent blur-md chrono-pulse"
                style={{ transform: 'rotate(180deg)' }}
              />

              {/* The Mechanical Brass Needle */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 h-[162px] w-[3px] origin-top bg-gradient-to-b from-white via-amber-300 to-amber-500 shadow-[0_0_14px_#f59e0b]"
                style={{ transform: 'rotate(180deg)' }}
              >
                {/* Pointer Tip Diamond with Spark Flare */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-amber-200 border border-white shadow-[0_0_18px_#f59e0b,0_0_30px_#ffffff]" />
              </div>

              {/* Counter-Weight Stylized Tail */}
              <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 h-[34px] w-[2.5px] bg-amber-500/80 shadow-[0_0_8px_#f59e0b]" />
            </motion.div>

            {/* Dial Center Hub Brass Jewel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 via-amber-500 to-neutral-900 p-[2px] shadow-[0_0_24px_rgba(245,158,11,0.9)]">
              <div className="w-full h-full rounded-full bg-[#120a06] flex items-center justify-center border border-amber-300/50">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-[0_0_8px_#fff]" />
              </div>
            </div>
          </div>

          {/* Interactive Year Node Stations along the Rail */}
          <div className="absolute bottom-4 sm:bottom-6 inset-x-0 flex items-center justify-around px-4 sm:px-12 md:px-20 z-20">
            {CHRONO_NODES.map((n, i) => {
              const isSelected = i === activeNodeIndex;
              return (
                <button
                  key={n.year}
                  type="button"
                  onClick={() => handleSelectNode(i)}
                  onPointerEnter={() => handleSelectNode(i)}
                  className="group relative flex flex-col items-center focus:outline-none transition-transform duration-300 hover:scale-110 cursor-pointer"
                >
                  {/* Glowing Energy Node Ring */}
                  <div className="relative mb-2 flex items-center justify-center">
                    <span
                      className={`block rounded-full transition-all duration-300 ${
                        isSelected
                          ? 'h-4 w-4 bg-white shadow-[0_0_18px_#f59e0b,0_0_35px_#de1b1c] ring-4 ring-amber-500/60'
                          : 'h-2.5 w-2.5 bg-amber-500/50 group-hover:bg-amber-300 group-hover:scale-125'
                      }`}
                    />
                    {isSelected && (
                      <motion.span
                        layoutId="node-pulse"
                        className="absolute -inset-3 rounded-full border-2 border-amber-400/90 animate-ping pointer-events-none"
                      />
                    )}
                  </div>

                  {/* Year Tag in Bold Oswald/Anton */}
                  <span
                    className={`font-['Anton',Impact,sans-serif] text-xl sm:text-2xl md:text-3xl tracking-wide transition-all duration-300 ${
                      isSelected
                        ? 'text-amber-300 drop-shadow-[0_0_18px_rgba(245,158,11,0.9)] scale-110'
                        : 'text-bone/50 group-hover:text-bone/90'
                    }`}
                  >
                    {n.year}
                  </span>

                  {/* Node Subtitle Tag */}
                  <span
                    className={`hidden sm:block text-[9px] sm:text-[10px] font-['Oswald'] uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isSelected ? 'text-bone font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-smoke/60 group-hover:text-smoke'
                    }`}
                  >
                    {n.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Era Status Indicator Strip */}
        <motion.div
          key={activeNode.year}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-3 inline-flex items-center gap-3 rounded-full border border-amber-500/40 bg-black/75 px-5 py-2 backdrop-blur-md shadow-[0_4px_24px_rgba(245,158,11,0.25)]"
        >
          <span className="flex items-center gap-2 text-amber-400 text-xs font-bold font-['Oswald'] tracking-[0.22em]">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_#f59e0b]" />
            ERA {activeNode.year}
          </span>
          <span className="h-3.5 w-px bg-white/20" />
          <span className="text-xs font-medium text-bone/95 tracking-wide">
            {activeNode.subtitle}
          </span>
        </motion.div>
      </div>

      {/* 2. THE SEASON'S EPISODES & PRODUCTION NARRATIVE */}
      <AnimatePresence mode="wait">
        <motion.div
          key={season.number}
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <div className="gutter mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="font-display text-4xl tracking-wide text-bone sm:text-5xl">
              <span className="text-outline mr-3 text-amber-500/80">S{String(season.number).padStart(2, '0')}</span>
              {season.title}
            </h3>
            <span className="text-sm font-['Oswald'] tracking-wider text-amber-400/90">
              {season.period} · {season.episodes.length} {season.episodes.length === 1 ? 'Episode' : 'Episodes'}
            </span>
          </div>
          <p className="gutter max-w-3xl text-[15px] leading-relaxed text-bone/75">{season.synopsis}</p>

          <div className="group/rail relative">
            <div ref={rail} className="rail gutter flex snap-x snap-mandatory gap-4 overflow-x-auto py-8 [perspective:1200px]">
              {season.episodes.map((e, i) => (
                <EpisodeCard key={e.code} episode={e} index={i} />
              ))}
            </div>
            <RailButtons rail={rail} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
