import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { viewerProfiles, type ProfileId, type Project, type SectionId } from './data/portfolio';
import { SmoothScrollProvider, useSmoothScroll } from './hooks/smoothScroll';
import CustomCursor from './components/CustomCursor';
import OpeningSequence from './components/OpeningSequence';
import ProfileSelector from './components/ProfileSelector';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ContinueWatching from './components/ContinueWatching';
import Scene from './components/Scene';
import About from './components/About';
import Seasons from './components/Seasons';
import Originals from './components/Originals';
import TopPicks from './components/TopPicks';
import Skills from './components/Skills';
import Achievements from './components/Achievements';
import ResumeSection from './components/ResumeViewer';
import FinalCTA from './components/FinalCTA';
import { EASE } from './components/fx';
import SubtitleTool from './subtitle-tool/SubtitleTool';

// Overlays are only needed on demand — split them out of the first load.
const PlayIntro = lazy(() => import('./components/PlayIntro'));
const ProjectModal = lazy(() => import('./components/ProjectModal'));
const ResumeModal = lazy(() => import('./components/ResumeModal'));

type Stage = 'opening' | 'profiles' | 'home';

const STORAGE_KEY = 'sai-krishna-series-profile';

function readStoredProfile(): ProfileId | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return viewerProfiles.some((p) => p.id === v) ? (v as ProfileId) : null;
  } catch {
    return null;
  }
}

/**
 * Strict Environment & Route Isolation:
 * - Portfolio (saikrishna-bethamcharla.github.io/Portfolio/): Strictly renders Sai Krishna Portfolio
 * - Epic Hertz Studio (epic-hertz-studio.vercel.app OR /Epic-Hertz-Studio/): Strictly renders Epic Hertz Studio
 */
export function isStudioApp(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = (window.location.hostname || '').toLowerCase();
  const pathname = (window.location.pathname || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();

  // 1. Explicit query or hash overrides
  if (
    search.includes('view=studio') ||
    search.includes('app=studio') ||
    search.includes('tool=subtitles') ||
    search.includes('app=epic-hertz') ||
    hash.includes('#studio') ||
    hash.includes('#subtitles')
  ) {
    return true;
  }

  if (
    search.includes('view=portfolio') ||
    search.includes('app=portfolio') ||
    hash.includes('#portfolio')
  ) {
    return false;
  }

  // 2. Strict isolation for Portfolio repository on GitHub Pages
  // e.g. saikrishna-bethamcharla.github.io/Portfolio/
  if (pathname.startsWith('/portfolio') || pathname.includes('/portfolio/')) {
    return false;
  }

  // 3. Strict isolation for Epic Hertz Studio repository on GitHub Pages
  // e.g. saikrishna-bethamcharla.github.io/Epic-Hertz-Studio/
  if (pathname.startsWith('/epic-hertz-studio') || pathname.includes('/epic-hertz-studio/')) {
    return true;
  }

  // 4. Strict isolation for Epic Hertz Studio on Vercel
  // e.g. epic-hertz-studio.vercel.app
  if (hostname.includes('epic-hertz-studio') || hostname.includes('epic-hertz')) {
    return true;
  }

  // 5. Standalone Vercel deployment of this project
  if (hostname.includes('vercel.app')) {
    return true;
  }

  // Localhost or standard domain default: Portfolio
  return false;
}

export default function App() {
  const [isStudio] = useState(() => isStudioApp());

  if (isStudio) {
    return <SubtitleTool />;
  }

  return (
    <SmoothScrollProvider>
      <Series />
    </SmoothScrollProvider>
  );
}

export function Series() {
  const stored = readStoredProfile();
  const [stage, setStage] = useState<Stage>('home');
  const [profileId, setProfileId] = useState<ProfileId>(stored ?? 'saikrishna');
  const [playing, setPlaying] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { scrollTo, lock, unlock } = useSmoothScroll();

  const order = viewerProfiles.find((p) => p.id === profileId)!.order;

  useEffect(() => {
    document.title = 'Sai Krishna | AI Video, Web Development & Creative Design';
  }, []);

  useEffect(() => {
    // Guarantee scroll opens at top hero section on load / refresh
    window.scrollTo(0, 0);
    scrollTo(0, { immediate: true, offset: 0 });
  }, [scrollTo]);

  useEffect(() => {
    if (stage === 'home') return;
    lock();
    return unlock;
  }, [stage, lock, unlock]);

  const pickProfile = useCallback(
    (id: ProfileId) => {
      setProfileId(id);
      try {
        sessionStorage.setItem(STORAGE_KEY, id);
      } catch {
        /* storage unavailable — profile simply won't persist */
      }
      if (stage !== 'home') {
        window.scrollTo(0, 0);
        setStage('home');
      } else {
        const p = viewerProfiles.find((v) => v.id === id)!;
        setToast(`Now watching as ${p.name} · ${p.blurb.toLowerCase()}`);
        scrollTo(0, { offset: 0 });
      }
    },
    [stage, scrollTo],
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const closeIntro = useCallback(() => setPlaying(false), []);
  const closeProject = useCallback(() => setProject(null), []);
  const closeResume = useCallback(() => setResumeOpen(false), []);

  const sections: Record<SectionId, ReactNode> = {
    about: <About />,
    journey: <Seasons />,
    originals: <Originals onOpen={setProject} />,
    picks: <TopPicks />,
    skills: <Skills />,
    moments: <Achievements />,
    story: <ResumeSection onView={() => setResumeOpen(true)} />,
  };

  return (
    <LayoutGroup>
      <div className="grain" aria-hidden />
      <CustomCursor />

      <AnimatePresence>
        {stage === 'opening' && <OpeningSequence key="opening" onDone={() => setStage('profiles')} />}
        {stage === 'profiles' && <ProfileSelector key="profiles" onPick={pickProfile} />}
      </AnimatePresence>

      {stage === 'home' && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <Navbar order={order} profileId={profileId} onSwitch={pickProfile} />
          <main>
            <Hero key={`hero-${profileId}`} onPlay={() => setPlaying(true)} onResume={() => setResumeOpen(true)} profileId={profileId} />
            <ContinueWatching order={order} />
            {order.map((id) => (
              <Scene key={id} id={id} className={id === 'originals' ? '!py-0 sm:!py-0' : ''}>
                {sections[id]}
              </Scene>
            ))}
            <FinalCTA onReplay={() => setStage('opening')} />
          </main>
        </motion.div>
      )}

      <Suspense fallback={null}>
        <AnimatePresence>{playing && <PlayIntro key="intro" onClose={closeIntro} />}</AnimatePresence>
        <AnimatePresence>{project && <ProjectModal key="project" project={project} onClose={closeProject} onSwitch={setProject} />}</AnimatePresence>
        <AnimatePresence>{resumeOpen && <ResumeModal key="resume" onClose={closeResume} />}</AnimatePresence>
      </Suspense>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="glass fixed bottom-6 left-1/2 z-[150] w-[min(92vw,420px)] -translate-x-1/2 rounded-xl px-5 py-3 text-center text-sm text-bone"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
