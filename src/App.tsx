import { lazy, Suspense, useCallback, useState, type ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { type ProfileId, type Project, type SectionId } from './data/portfolio';
import { SmoothScrollProvider } from './hooks/smoothScroll';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Scene from './components/Scene';
import Skills from './components/Skills';
import Seasons from './components/Seasons';
import Originals from './components/Originals';
import About from './components/About';
import Achievements from './components/Achievements';
import ResumeSection from './components/ResumeViewer';
import FinalCTA from './components/FinalCTA';
import { EASE } from './components/fx';

// Modals loaded on demand
const PlayIntro = lazy(() => import('./components/PlayIntro'));
const ProjectModal = lazy(() => import('./components/ProjectModal'));
const ResumeModal = lazy(() => import('./components/ResumeModal'));

export default function App() {
  return (
    <SmoothScrollProvider>
      <Series />
    </SmoothScrollProvider>
  );
}

// Master Cinematic Scene Sequence (matching Gireesh flow)
const CINEMATIC_SCENES: SectionId[] = ['skills', 'journey', 'originals', 'about', 'moments', 'story'];

function Series() {
  const [profileId] = useState<ProfileId>('saikrishna');
  const [playing, setPlaying] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);

  const closeIntro = useCallback(() => setPlaying(false), []);
  const closeProject = useCallback(() => setProject(null), []);
  const closeResume = useCallback(() => setResumeOpen(false), []);

  const sceneComponents: Record<SectionId, ReactNode> = {
    skills: <Skills />,
    journey: <Seasons />,
    originals: <Originals onOpen={setProject} />,
    about: <About />,
    moments: <Achievements />,
    story: <ResumeSection onView={() => setResumeOpen(true)} />,
    picks: null,
  };

  return (
    <LayoutGroup>
      <div className="grain" aria-hidden />
      <CustomCursor />

      <motion.div
        initial={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1, ease: EASE }}
      >
        <Navbar />

        <main>
          {/* Scene 01: Welcome to My World · SAI KRISHNA */}
          <Hero
            key={`hero-${profileId}`}
            onPlay={() => setPlaying(true)}
            onResume={() => setResumeOpen(true)}
            profileId={profileId}
          />

          {/* Sequential Cinematic Scenes */}
          {CINEMATIC_SCENES.map((id) => (
            <Scene key={id} id={id} className={id === 'originals' ? '!py-0 sm:!py-0' : ''}>
              {sceneComponents[id]}
            </Scene>
          ))}

          {/* Closing Finale & Contact */}
          <FinalCTA />
        </main>
      </motion.div>

      <Suspense fallback={null}>
        <AnimatePresence>{playing && <PlayIntro key="intro" onClose={closeIntro} />}</AnimatePresence>
        <AnimatePresence>{project && <ProjectModal key="project" project={project} onClose={closeProject} onSwitch={setProject} />}</AnimatePresence>
        <AnimatePresence>{resumeOpen && <ResumeModal key="resume" onClose={closeResume} />}</AnimatePresence>
      </Suspense>
    </LayoutGroup>
  );
}
