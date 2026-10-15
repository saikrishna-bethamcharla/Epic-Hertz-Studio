import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { projects, type Project } from '../data/portfolio';
import { useScrollLock } from '../hooks/smoothScroll';
import { EASE, Magnetic } from './fx';
import { ProjectArt } from './Poster';

const block = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
};

export default function ProjectModal({ project, onClose, onSwitch }: { project: Project; onClose: () => void; onSwitch: (p: Project) => void }) {
  useScrollLock(true);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [project.id]);

  const more = projects.filter((p) => p.id !== project.id);

  return (
    <motion.div className="fixed inset-0 z-[140]" role="dialog" aria-modal="true" aria-labelledby={`title-${project.id}-modal`}>
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <div ref={scroller} data-lenis-prevent className="absolute inset-0 overflow-y-auto overscroll-contain" onClick={onClose}>
        <motion.div
          className="relative mx-auto min-h-full max-w-5xl bg-ink-2 shadow-2xl sm:my-10 sm:min-h-0 sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 30, transition: { duration: 0.3 } }}
        >
          {/* billboard */}
          <div className="relative h-[52vh] min-h-[340px] overflow-hidden sm:rounded-t-2xl">
            <motion.div layoutId={`art-${project.id}`} className="absolute inset-0" transition={{ duration: 0.7, ease: EASE }}>
              <ProjectArt project={project} />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/30 to-transparent" />
            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              aria-label="Close project"
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-lg text-bone backdrop-blur transition hover:bg-black"
            >
              ✕
            </button>
            <div className="absolute inset-x-0 bottom-0 px-5 pb-6 sm:px-10">
              <motion.p className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.34em] text-bone/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <span className="font-display text-xl tracking-normal text-crimson-2">S</span> ORIGINAL
              </motion.p>
              <motion.h2
                id={`title-${project.id}-modal`}
                layoutId={`title-${project.id}`}
                className="font-display text-[clamp(2.8rem,8vw,6rem)] leading-[0.86] tracking-wide text-bone"
                transition={{ duration: 0.7, ease: EASE }}
              >
                {project.title}
              </motion.h2>
            </div>
          </div>

          <motion.div className="px-5 pb-12 sm:px-10" initial="hidden" animate="show" transition={{ staggerChildren: 0.08, delayChildren: 0.25 }}>
            <motion.div variants={block} className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-mist">
              <span className="font-semibold text-[#46e3a8]">{project.year}</span>
              <span className="h-1 w-1 rounded-full bg-smoke" />
              <span>{project.genre}</span>
            </motion.div>

            <motion.p variants={block} className="mt-4 max-w-3xl text-lg leading-relaxed text-bone sm:text-xl">
              {project.logline}
            </motion.p>

            {(project.liveUrl || project.github) && (
              <motion.div variants={block} className="mt-6 flex flex-wrap gap-3">
                {project.liveUrl && (
                  <Magnetic>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center gap-2 rounded-md bg-crimson px-6 text-[15px] font-bold text-white transition hover:bg-crimson-2"
                    >
                      {project.liveUrl.includes('youtu') ? 'Watch on YouTube ↗' : 'Visit Live Site ↗'}
                    </a>
                  </Magnetic>
                )}
                {project.github && (
                  <Magnetic>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center gap-2 rounded-md border border-white/25 bg-black/40 px-6 text-[15px] font-bold text-bone backdrop-blur transition hover:border-bone hover:bg-black/60"
                    >
                      GitHub Repository ↗
                    </a>
                  </Magnetic>
                )}
              </motion.div>
            )}

            {/* Embedded Videos / Film Trailers */}
            {project.videos && project.videos.length > 0 && (
              <motion.section variants={block} className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-7 backdrop-blur-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-crimson-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-crimson-2 animate-ping" />
                      Cinema Screening Room
                    </h3>
                    <p className="mt-1 text-sm text-mist">Embedded video production & original film showcase streaming below.</p>
                  </div>
                  <span className="rounded-full border border-crimson-2/40 bg-crimson-2/15 px-3 py-1 text-xs font-bold text-crimson-2">
                    {project.videos.length} {project.videos.length === 1 ? 'Production Video' : 'Production Videos'}
                  </span>
                </div>

                <div className="space-y-8">
                  {project.videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/[0.03] p-4 transition duration-300 hover:border-crimson-2/40 hover:bg-white/[0.05] sm:p-6"
                    >
                      {/* Responsive 16:9 YouTube Iframe */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${vid.youtubeId}?rel=0&modestbranding=1`}
                          title={vid.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                          loading="lazy"
                        />
                      </div>

                      <div className="mt-5 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-display text-2xl tracking-wide text-bone sm:text-3xl">{vid.title}</h4>
                            {vid.author && (
                              <span className="rounded border border-white/20 bg-black/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mist">
                                {vid.author}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-crimson-2">{vid.category}</p>
                          <p className="mt-2 text-sm leading-relaxed text-bone/85 sm:text-base">{vid.logline}</p>

                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {vid.tags.map((t) => (
                              <span key={t} className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-bone/80">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3 pt-2">
                          <a
                            href={vid.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-h-10 items-center gap-2 rounded-md bg-crimson px-5 text-xs font-bold text-white transition hover:bg-crimson-2"
                          >
                            Watch on YouTube ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Featured Sub-Websites if present */}
            {project.websites && project.websites.length > 0 && (
              <motion.section variants={block} className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-7 backdrop-blur-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#4cc9ff]">All Production Websites</h3>
                    <p className="mt-1 text-sm text-mist">Complete digital platforms engineered from architecture through cloud launch.</p>
                  </div>
                  <span className="rounded-full border border-[#4cc9ff]/40 bg-[#4cc9ff]/15 px-3 py-1 text-xs font-bold text-[#4cc9ff]">
                    {project.websites.length} Deployed Platforms
                  </span>
                </div>

                <div className="space-y-6">
                  {project.websites.map((site) => (
                    <div
                      key={site.id}
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 transition duration-300 hover:border-[#4cc9ff]/40 hover:bg-white/[0.06] sm:p-5"
                    >
                      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/10 bg-black/60">
                          <img
                            src={site.image}
                            alt={site.name}
                            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex flex-col justify-between">
                          <div>
                            <h4 className="font-display text-2xl tracking-wide text-bone sm:text-3xl">{site.name}</h4>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#4cc9ff]">{site.category}</p>
                            <p className="mt-2 text-sm leading-relaxed text-bone/85">{site.logline}</p>
                            
                            <div className="mt-3.5 flex flex-wrap gap-1.5">
                              {site.tags.map((t) => (
                                <span key={t} className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-bone/80">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-3 pt-2">
                            {site.liveUrl && (
                              <a
                                href={site.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-h-9 items-center gap-2 rounded-md bg-crimson px-4 text-xs font-bold text-white transition hover:bg-crimson-2"
                              >
                                Visit Live Site ↗
                              </a>
                            )}
                            {site.github && (
                              <a
                                href={site.github}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-h-9 items-center gap-2 rounded-md border border-white/20 bg-black/40 px-4 text-xs font-semibold text-bone transition hover:border-bone hover:bg-black/70"
                              >
                                GitHub Repo ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* impact */}
            <motion.section variants={block} className="mt-12">
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-crimson-2">Result / Impact</h3>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
                {project.metrics.map((m, i) => (
                  <motion.div
                    key={m.label}
                    className="bg-ink p-4 sm:p-5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.5, ease: EASE }}
                  >
                    <p className="font-display text-4xl leading-none text-bone sm:text-5xl" style={{ color: i === 0 ? project.palette.accent : undefined }}>
                      {m.value}
                    </p>
                    <p className="mt-2 text-xs leading-snug text-mist">{m.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <div className="mt-12 grid gap-10 lg:grid-cols-[3fr_2fr]">
              <motion.section variants={block}>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-crimson-2">My Contribution</h3>
                <ul className="space-y-4">
                  {project.build.map((b) => (
                    <li key={b} className="flex gap-3 text-[15px] leading-relaxed text-bone/85">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: project.palette.accent }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.section>
              <div className="space-y-10">
                <motion.section variants={block}>
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-crimson-2">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((t) => (
                      <span key={t} className="glass rounded-full px-3 py-1.5 text-sm font-medium text-bone">
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.section>
                <motion.section variants={block}>
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-crimson-2">Key Features</h3>
                  <ul className="space-y-2.5">
                    {project.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-bone/85">
                        <span className="text-crimson-2">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.section>
              </div>
            </div>

            {/* more like this */}
            <motion.section variants={block} className="mt-14 border-t border-white/10 pt-8">
              <h3 className="mb-4 font-sans text-lg font-semibold text-bone">More Originals</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {more.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSwitch(p)}
                    className="group relative aspect-video overflow-hidden rounded-xl text-left ring-1 ring-white/10 transition hover:ring-white/30"
                  >
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                      <ProjectArt project={p} />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-mist">{p.genre}</p>
                      <p className="font-display text-3xl leading-none tracking-wide text-bone">{p.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
