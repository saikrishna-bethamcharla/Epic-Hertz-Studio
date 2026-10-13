import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useSmoothScroll } from '../hooks/smoothScroll';
import { EASE } from './fx';

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'top', label: 'Home' },
  { id: 'skills', label: 'Universe' },
  { id: 'journey', label: 'Journey' },
  { id: 'originals', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'story', label: 'Resume' },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [active, setActive] = useState<string>('top');
  const { scrollTo } = useSmoothScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 40);
    setHidden(y > 400 && y > prev && !mobileNav);
  });

  useEffect(() => {
    const ids = ['top', 'skills', 'journey', 'originals', 'about', 'story', 'contact'];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: '-40% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    setMobileNav(false);
    scrollTo(`#${id}`, { offset: id === 'top' ? 0 : -64 });
  };

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-[60]"
      animate={{ y: hidden ? '-100%' : '0%' }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div
        className={`gutter flex h-16 items-center justify-between gap-6 transition-[background,backdrop-filter] duration-500 md:h-[72px] ${
          solid || mobileNav ? 'bg-[#050507]/90 backdrop-blur-xl border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        {/* Left: Gireesh-Style Brand Wordmark & Role Subtitle */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => go('top')}
            className="flex items-center gap-2 text-left group"
            aria-label="Sai Krishna, home"
          >
            <span className="font-['Anton'] text-xl sm:text-2xl tracking-wider text-white transition-colors group-hover:text-crimson-2">
              SAI KRISHNA
            </span>
          </button>

          <span className="hidden sm:block h-4 w-px bg-white/20" aria-hidden="true" />

          <p className="hidden sm:flex items-center gap-2 font-['Oswald'] text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.24em] text-mist/80">
            <span>Creative</span>
            <span className="h-1 w-1 rounded-full bg-crimson" />
            <span>Technical</span>
            <span className="h-1 w-1 rounded-full bg-crimson" />
            <span>Director</span>
          </p>
        </div>

        {/* Center: Sleek Cinematic Nav Links */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`relative font-['Oswald'] text-xs font-bold uppercase tracking-[0.22em] transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-smoke hover:text-bone'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="hdr-dot"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-crimson-2 shadow-[0_0_8px_#ff3d5a]"
                    transition={{ duration: 0.35, ease: EASE }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Portfolio MMXXVI & Contact Action */}
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-2 font-['Oswald'] text-[11px] tracking-[0.24em] text-smoke uppercase">
            <span>Portfolio — MMXXVI</span>
            <span className="flex items-center gap-1 text-crimson-2">
              <span className="h-1 w-1 rounded-full bg-crimson-2" />
              <span className="h-1 w-1 rounded-full bg-crimson-2" />
              <span className="h-1 w-1 rounded-full bg-crimson-2" />
            </span>
          </div>

          <button
            type="button"
            onClick={() => go('contact')}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 font-['Oswald'] text-xs font-bold uppercase tracking-[0.18em] text-bone transition-all duration-300 hover:border-crimson hover:text-white hover:bg-crimson/20"
          >
            Contact
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label={mobileNav ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((v) => !v)}
          >
            <motion.span className="block h-0.5 w-5 bg-bone" animate={{ rotate: mobileNav ? 45 : 0, y: mobileNav ? 4 : 0 }} />
            <motion.span className="block h-0.5 w-5 bg-bone" animate={{ rotate: mobileNav ? -45 : 0, y: mobileNav ? -4 : 0 }} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileNav && (
          <motion.nav
            aria-label="Sections"
            className="gutter border-b border-white/10 bg-[#050507]/98 pb-8 pt-4 backdrop-blur-2xl lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {NAV_ITEMS.map((l, i) => (
              <motion.button
                key={l.id}
                type="button"
                onClick={() => go(l.id)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className={`block w-full py-3 text-left font-['Anton'] text-2xl tracking-wider uppercase ${
                  active === l.id ? 'text-crimson-2' : 'text-bone'
                }`}
              >
                {l.label}
              </motion.button>
            ))}
            <motion.button
              type="button"
              onClick={() => go('contact')}
              className="mt-4 block w-full py-3 text-left font-['Anton'] text-2xl tracking-wider text-crimson-2 uppercase border-t border-white/10"
            >
              Contact
            </motion.button>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
