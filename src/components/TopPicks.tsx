import { useRef } from 'react';
import { motion } from 'framer-motion';
import { profile, topPicks } from '../data/portfolio';
import { EASE, SectionHeading } from './fx';
import { PosterBackdrop } from './Poster';
import { RailButtons } from './Rail';

export default function TopPicks() {
  const rail = useRef<HTMLDivElement>(null);
  return (
    <>
      <SectionHeading kicker="Top 10 · from the resume" title={`${profile.displayName}'s Top Picks`} />
      <div className="group/rail relative">
        <div ref={rail} className="rail gutter flex snap-x snap-mandatory gap-2 overflow-x-auto py-6">
          {topPicks.map((pick, i) => (
            <motion.div
              key={pick.title}
              className="group relative flex h-[260px] shrink-0 snap-start items-end sm:h-[300px]"
              initial={{ opacity: 0, y: 36, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-4% 0px' }}
              transition={{ duration: 0.75, delay: Math.min(i, 5) * 0.07, ease: EASE }}
            >
              <span
                aria-hidden
                className="text-outline -mr-6 select-none font-display leading-[0.78] transition duration-500 group-hover:[-webkit-text-stroke-color:rgba(255,61,90,0.85)] sm:-mr-8"
                style={{ fontSize: i === 9 ? 'clamp(9rem, 22vw, 15rem)' : 'clamp(11rem, 26vw, 19rem)', letterSpacing: i === 9 ? '-0.06em' : 0 }}
              >
                {i + 1}
              </span>
              <div className="relative z-10 h-[85%] w-[150px] overflow-hidden rounded-lg shadow-[-12px_0_30px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-2 group-hover:ring-white/30 sm:w-[180px]">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                  {pick.image ? (
                    <img
                      src={pick.image}
                      alt={pick.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : (
                    <PosterBackdrop palette={pick.palette} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 via-45% to-transparent to-75% pointer-events-none" />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-between p-3.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-bone/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {pick.label}
                  </span>
                  <div>
                    <p className="font-display text-[1.75rem] leading-[0.92] tracking-wide text-bone drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                      {pick.title}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-snug text-mist drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                      {pick.detail}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <RailButtons rail={rail} />
      </div>
    </>
  );
}
