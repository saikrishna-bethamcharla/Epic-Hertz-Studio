import { motion } from 'framer-motion';
import { education, experience, profile } from '../data/portfolio';
import { EASE, SectionHeading, Tilt } from './fx';

export default function About() {
  const facts = [
    { k: 'Current Role', v: `${experience[0].role}`, s: `${experience[0].company} · ${experience[0].period}` },
    { k: 'Education', v: `${education[0].degree}`, s: `${education[0].school} · ${education[0].period}` },
    { k: 'Core Focus', v: 'AI Video & Web Delivery', s: 'Seedance · Kling · DaVinci · JavaScript' },
    { k: 'Based in', v: profile.location, s: 'India' },
  ];

  return (
    <>
      <SectionHeading kicker="The Pilot" title="About Me" />
      <div className="gutter grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <motion.div
          className="mx-auto w-full max-w-md lg:max-w-none"
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.85, ease: EASE }}
        >
        <Tilt max={4} glare={false} className="rounded-2xl">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-[#06080e]" />
            <img
              src={profile.portrait.src}
              srcSet={profile.portrait.srcSet}
              sizes="(max-width: 1024px) 90vw, 40vw"
              alt={profile.portrait.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-35% to-transparent pointer-events-none" />
            <div className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between pointer-events-none">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff3d5a] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  STARRING
                </span>
                <span className="block font-display text-2xl tracking-wide text-bone drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  {profile.displayName}
                </span>
              </div>
              <span className="rounded border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-mono tracking-wider text-mist backdrop-blur-sm">
                S01–S05
              </span>
            </div>
          </div>
        </Tilt>
        </motion.div>

        <div>
          <motion.p
            className="font-serif text-[clamp(1.6rem,3.2vw,2.6rem)] italic leading-[1.15] text-bone"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            “{profile.intro}”
          </motion.p>
          <p className="mt-4 text-sm text-mist">— {profile.fullName}</p>

          <motion.dl
            className="mt-10 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.08 }}
          >
            {facts.map((f) => (
              <motion.div
                key={f.k}
                className="bg-ink-2 p-5"
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
              >
                <dt className="text-[10px] font-bold uppercase tracking-[0.28em] text-smoke">{f.k}</dt>
                <dd className="mt-2 text-base font-semibold text-bone">{f.v}</dd>
                <dd className="mt-0.5 text-xs text-mist">{f.s}</dd>
              </motion.div>
            ))}
          </motion.dl>

          <div className="mt-8">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-smoke">Interests</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => (
                <span key={i} className="glass rounded-full px-3 py-1.5 text-xs font-medium text-bone">
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
