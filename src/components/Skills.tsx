import { useState, useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { EASE, SectionHeading } from './fx';
import { useFinePointer } from '../hooks/useMedia';

// Tool Universe Data with verified tools from Sai Krishna's Resume & Pipeline
interface UniverseTool {
  id: string;
  name: string;
  role: string;
  category: 'ai' | 'post' | 'code' | 'brand';
  badge: string;
  iconPath?: string;
  accent: string;
  description: string;
  context: string;
}

const UNIVERSE_TOOLS: UniverseTool[] = [
  // 1. AI Film Engines
  {
    id: 'seedance',
    name: 'Seedance 2.0',
    role: 'Flagship AI Film Engine',
    category: 'ai',
    badge: 'SD',
    accent: '#ff3d5a',
    description: 'Multi-shot cinematic scene generation with camera continuity and prompt control.',
    context: 'Directing commercial film reels and client narratives at Zai Labs.',
  },
  {
    id: 'kling',
    name: 'Kling 3.0',
    role: 'Motion Dynamics Engine',
    category: 'ai',
    badge: 'KL',
    accent: '#ff7849',
    description: 'High-frame-rate physical realism, dynamic motion trajectories, and character physics.',
    context: 'Multi-shot AI video production for commercial client campaigns.',
  },
  {
    id: 'higgsfield',
    name: 'Higgsfield',
    role: 'Virtual Camera & Staging',
    category: 'ai',
    badge: 'HF',
    accent: '#ffb547',
    description: 'Precision camera motion control, dolly sweeps, and generative visual prototypes.',
    context: 'Rapid cinematic visual ideation and reference shot creation.',
  },
  {
    id: 'bilingual-prompting',
    name: 'Prompt Bibles',
    role: 'Bilingual (EN + ZH)',
    category: 'ai',
    badge: 'EN/ZH',
    accent: '#a78bfa',
    description: 'Structured bilingual prompt engineering ensuring character and environmental continuity.',
    context: 'Standardized shot documentation across multi-scene generative productions.',
  },

  // 2. Post-Production & Motion
  {
    id: 'davinci',
    name: 'DaVinci Resolve',
    role: 'Color & Editorial Master',
    category: 'post',
    badge: 'DR',
    accent: '#38bdf8',
    description: 'Narrative color grading, pacing rhythm, audio synchronization, and final master conform.',
    context: 'Final cinematic grading and master audio/visual delivery.',
  },
  {
    id: 'premiere',
    name: 'Premiere Pro',
    role: 'Multi-Track Editorial',
    category: 'post',
    badge: 'Pr',
    iconPath: 'assets/tools/premiere.png',
    accent: '#9333ea',
    description: 'Timeline assembly, multi-camera sequences, audio mixing, and commercial montages.',
    context: 'Core editing suite for fast-turnaround video productions.',
  },
  {
    id: 'aftereffects',
    name: 'After Effects',
    role: 'Motion Graphics & VFX',
    category: 'post',
    badge: 'Ae',
    iconPath: 'assets/tools/aftereffects.png',
    accent: '#a855f7',
    description: 'Compositing, title design, logo animations, tracking, and visual polish.',
    context: 'Broadcast title sequences and brand motion graphics.',
  },
  {
    id: 'capcut',
    name: 'CapCut Pro',
    role: 'Short-Form Velocity',
    category: 'post',
    badge: 'CC',
    accent: '#f43f5e',
    description: 'Fast-paced rhythmic montage, beat-synced dynamic cuts, and social reels.',
    context: 'High-engagement social campaign video edits.',
  },

  // 3. Code & Technical Systems
  {
    id: 'javascript',
    name: 'JavaScript / TS',
    role: 'Modern Frontend Logic',
    category: 'code',
    badge: 'JS',
    accent: '#facc15',
    description: 'Responsive user interactions, state management, and modern web application logic.',
    context: 'Client website platforms and interactive portfolio experiences.',
  },
  {
    id: 'html-css',
    name: 'HTML5 & CSS3',
    role: 'Semantic Architecture',
    category: 'code',
    badge: 'Web',
    accent: '#22c55e',
    description: 'Fluid grid layouts, responsive typography, CSS motion graphics, and hardware acceleration.',
    context: 'Engineered high-converting web applications with 100% responsiveness.',
  },
  {
    id: 'crm-hosting',
    name: 'CRM & Cloud Hosting',
    role: 'Production Architecture',
    category: 'code',
    badge: 'CRM',
    accent: '#06b6d4',
    description: 'Lead flow pipelines, customer data automation, custom domain setup, and cloud hosting.',
    context: 'Full-scope client website, CRM, and hosting engagements at Zai Labs.',
  },

  // 4. Brand Systems & Visual Design
  {
    id: 'photoshop',
    name: 'Photoshop',
    role: 'Digital Art & Key Art',
    category: 'brand',
    badge: 'Ps',
    iconPath: 'assets/tools/photoshop.png',
    accent: '#3b82f6',
    description: 'Character key art, composite matte paintings, asset retouching, and document templates.',
    context: 'Formal brand collateral and high-resolution campaign assets.',
  },
  {
    id: 'illustrator',
    name: 'Illustrator',
    role: 'Vector Systems & Marks',
    category: 'brand',
    badge: 'Ai',
    accent: '#ea580c',
    description: 'Precision vector brand marks, corporate typography, icon systems, and layout bibles.',
    context: 'Standardized client brand identities, quotations, and invoice systems.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'ALL UNIVERSE' },
  { id: 'ai', label: 'AI FILM ENGINES' },
  { id: 'post', label: 'POST & EDITORIAL' },
  { id: 'code', label: 'CODE & CRM SYSTEMS' },
  { id: 'brand', label: 'BRAND & DESIGN' },
];

export default function Skills() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<UniverseTool>(UNIVERSE_TOOLS[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();

  // 3D Parallax Mouse Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  // Scroll-driven energy ribbon flow
  const { scrollYProgress: skillsScroll } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const scrollRibbonX = useTransform(skillsScroll, [0, 1], [-80, 80]);
  const ribbonSpring = useSpring(scrollRibbonX, { stiffness: 70, damping: 22 });
  const combinedRibbonX = useTransform([springX, ribbonSpring], ([sX, rX]: number[]) => (sX * 25) + rX);

  const stageRotateX = useTransform(springY, [-1, 1], [6, -6]);
  const stageRotateY = useTransform(springX, [-1, 1], [-8, 8]);
  const ribbonShiftX = combinedRibbonX;

  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';

  const filteredTools = filter === 'all' ? UNIVERSE_TOOLS : UNIVERSE_TOOLS.filter((t) => t.category === filter);

  return (
    <div className="relative overflow-hidden">
      <SectionHeading
        kicker="Scene 02"
        title="The Creative Universe"
      />

      {/* Filter Tabs */}
      <div className="gutter mb-8 flex flex-wrap items-center gap-2" role="tablist">
        {CATEGORIES.map((c) => {
          const isActive = filter === c.id;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`relative rounded-full px-4 py-2 font-['Oswald'] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                isActive ? 'text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-smoke hover:text-bone hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="universe-tab"
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ duration: 0.4, ease: EASE }}
                />
              )}
              <span className="relative z-10">{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3D FLOATING UNIVERSE STAGE */}
      <div
        ref={containerRef}
        onPointerMove={(e) => {
          if (!fine || !containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
          mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
        }}
        className="gutter relative min-h-[520px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#09090d] via-[#050508] to-[#020204] p-6 sm:p-10 [perspective:1400px] overflow-hidden select-none"
      >
        {/* Reflective Studio Floor Grid & Crimson Ambience */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(222,27,28,0.18)_0%,rgba(140,12,24,0.06)_45%,transparent_75%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-black via-black/40 to-transparent"
        />

        {/* Snaking Glowing Neon Energy Ribbon */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ x: ribbonShiftX }}
        >
          <svg className="w-full h-full opacity-60" viewBox="0 0 1000 500" fill="none" preserveAspectRatio="none">
            <path
              d="M -50 320 C 200 120, 320 420, 520 220 C 720 40, 840 380, 1050 200"
              stroke="#de1b1c"
              strokeWidth="3"
              strokeLinecap="round"
              filter="drop-shadow(0 0 12px #ff3d5a)"
            />
            <path
              d="M -50 320 C 200 120, 320 420, 520 220 C 720 40, 840 380, 1050 200"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="8 16"
              className="animate-pulse"
            />
          </svg>
        </motion.div>

        {/* 3D Floating Tool Blocks */}
        <motion.div
          style={{ rotateX: stageRotateX, rotateY: stageRotateY, transformStyle: 'preserve-3d' }}
          className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
        >
          {filteredTools.map((t, idx) => {
            const isSelected = selectedTool.id === t.id;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.03, ease: EASE }}
                whileHover={{ scale: 1.06, translateZ: 30 }}
                onClick={() => setSelectedTool(t)}
                className={`group relative flex flex-col justify-between rounded-xl p-4.5 cursor-pointer transition-all duration-300 backdrop-blur-md ${
                  isSelected
                    ? 'bg-white/[0.12] border-2 border-white shadow-[0_15px_35px_rgba(222,27,28,0.35)] ring-2 ring-crimson-2/40'
                    : 'bg-black/60 border border-white/10 hover:border-white/30 hover:bg-white/[0.08]'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Glowing Corner Halo */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                  style={{ background: t.accent }}
                />

                {/* Top Row: Icon / Monogram & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-black/80 shadow-md group-hover:scale-110 transition-transform duration-300"
                    style={{ borderColor: isSelected ? t.accent : undefined }}
                  >
                    {t.iconPath ? (
                      <img src={`${base}${t.iconPath}`} alt={t.name} className="h-7 w-7 object-contain" />
                    ) : (
                      <span
                        className="font-['Anton'] text-base tracking-wider"
                        style={{ color: t.accent }}
                      >
                        {t.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className="h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-150"
                    style={{ background: t.accent, boxShadow: `0 0 10px ${t.accent}` }}
                  />
                </div>

                {/* Name & Role */}
                <div>
                  <h4 className="font-['Oswald'] text-sm sm:text-base font-bold tracking-wider text-bone group-hover:text-white uppercase">
                    {t.name}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-medium text-mist line-clamp-1">
                    {t.role}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* HUD INSPECTION DOCK (Active Tool Telemetry) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTool.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="relative z-20 mt-8 rounded-xl border border-white/15 bg-black/85 p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Tool Telemetry Title */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-black/90 shadow-lg"
                  style={{ borderColor: selectedTool.accent }}
                >
                  {selectedTool.iconPath ? (
                    <img src={`${base}${selectedTool.iconPath}`} alt={selectedTool.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="font-['Anton'] text-lg" style={{ color: selectedTool.accent }}>
                      {selectedTool.badge}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-['Anton'] text-xl sm:text-2xl tracking-wide text-white uppercase">
                      {selectedTool.name}
                    </h3>
                    <span
                      className="rounded px-2 py-0.5 font-['Oswald'] text-[10px] font-bold uppercase tracking-wider text-black"
                      style={{ background: selectedTool.accent }}
                    >
                      {selectedTool.role}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-bone/80 mt-1 max-w-2xl">
                    {selectedTool.description}
                  </p>
                </div>
              </div>

              {/* Verified Production Context Badge */}
              <div className="w-full md:w-auto shrink-0 rounded-lg border border-white/10 bg-white/5 p-3 md:text-right">
                <span className="block font-['Oswald'] text-[10px] font-bold tracking-[0.2em] text-crimson-2 uppercase">
                  VERIFIED PRODUCTION CONTEXT
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-bone">
                  {selectedTool.context}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
