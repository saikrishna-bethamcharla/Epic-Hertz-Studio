import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTrackProgress } from '../hooks/sectionProgress';
import { useReducedMotionPref } from '../hooks/useMedia';

/**
 * A section of the series. Fades and elevates smoothly with spring-damped physics,
 * and reports viewing progress for the Continue Exploring row.
 */
export default function Scene({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useTrackProgress(id, ref);
  const reduced = useReducedMotionPref();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.55'] });
  const rawOpacity = useTransform(scrollYProgress, [0, 0.85], [0.08, 1]);
  const rawScale = useTransform(scrollYProgress, [0, 1], [0.975, 1]);
  const rawY = useTransform(scrollYProgress, [0, 1], [36, 0]);

  const opacity = useSpring(rawOpacity, { stiffness: 120, damping: 28, mass: 0.2 });
  const scale = useSpring(rawScale, { stiffness: 120, damping: 28, mass: 0.2 });
  const y = useSpring(rawY, { stiffness: 120, damping: 28, mass: 0.2 });

  return (
    <motion.section
      id={id}
      ref={ref}
      style={reduced ? {} : { opacity, scale, y }}
      className={`relative scroll-mt-16 py-16 sm:py-24 ${className}`}
    >
      {children}
    </motion.section>
  );
}
