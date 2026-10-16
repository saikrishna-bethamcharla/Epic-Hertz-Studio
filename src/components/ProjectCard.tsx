import { motion } from 'framer-motion';
import type { Project } from '../data/portfolio';
import { EASE, Tilt } from './fx';
import { ProjectArt } from './Poster';

export default function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  return (
    <motion.article
      className="w-[86vw] shrink-0 snap-start sm:w-[64vw] lg:w-[46vw] xl:w-[41vw] max-w-[620px]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px -10% 0px 0px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: EASE }}
    >
      <Tilt max={4} glare={false} className="group rounded-2xl">
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen();
            }
          }}
          aria-label={`Open ${project.title}`}
          className="focus-ring relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-500 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] group-hover:ring-white/25 sm:aspect-[16/12] lg:aspect-auto lg:h-[70vh] lg:min-h-[580px] lg:max-h-[720px]"
        >
          {/* BACKGROUND POSTER ART */}
          <motion.div layoutId={`art-${project.id}`} className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[var(--ease-cine)] group-hover:scale-[1.05]">
              <ProjectArt project={project} />
            </div>
          </motion.div>

          {/* SINGLE ROBUST FLEX CONTAINER — SEPARATES TOP BAR FROM CONTENT STACK */}
          <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7 xl:p-8">
            {/* TOP HEADER ROW */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display text-xl leading-none text-crimson-2">S</span>
                <span className="text-[10px] font-bold tracking-[0.34em] text-bone/85">ORIGINAL</span>
              </div>
              <span className="rounded border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-bone backdrop-blur-sm">
                {project.year}
              </span>
            </div>

            {/* BOTTOM CONTENT DATA STACK */}
            <div className="flex flex-col [transform:translateZ(30px)]">
              {/* Category / Genre Tagline */}
              <p className="mb-1.5 line-clamp-1 text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-mist/90">
                {project.genre}
              </p>

              {/* Cinematic Title */}
              <motion.h3
                layoutId={`title-${project.id}`}
                className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[3rem] leading-[0.92] tracking-wide text-bone"
              >
                {project.title}
              </motion.h3>

              {/* Logline — 2 lines max with comfortable leading */}
              <p className="mt-2.5 line-clamp-2 max-w-lg text-xs sm:text-[13.5px] leading-relaxed text-bone/75">
                {project.logline}
              </p>

              {/* 2 Highlight Metric Badges */}
              <div className="mt-3 grid max-w-md grid-cols-2 gap-2" aria-label="Project highlights">
                {project.metrics.slice(0, 2).map((metric) => (
                  <div key={metric.label} className="min-w-0 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                    <p className="truncate font-display text-base sm:text-lg leading-tight" style={{ color: project.palette.accent }}>
                      {metric.value}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-mist">{metric.label}</p>
                  </div>
                ))}
              </div>

              {/* Included Websites or Videos Indicator */}
              {project.websites && (
                <div className="mt-2.5 flex items-center gap-2 overflow-hidden text-xs">
                  <span className="shrink-0 rounded border border-[#4cc9ff]/40 bg-[#4cc9ff]/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#4cc9ff] uppercase">
                    {project.websites.length} Websites Included
                  </span>
                  <span className="truncate text-[11px] text-bone/70">
                    {project.websites.map((w) => w.name.replace(' Chem Limited', '').replace(' — AP & Telangana Chapter', '').replace(' Private Limited', '')).join('  •  ')}
                  </span>
                </div>
              )}
              {project.videos && (
                <div className="mt-2.5 flex items-center gap-2 overflow-hidden text-xs">
                  <span className="shrink-0 flex items-center gap-1.5 rounded border border-[#ff3d5a]/40 bg-[#ff3d5a]/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#ff3d5a] uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff3d5a] animate-pulse" />
                    {project.videos.length} {project.videos.length === 1 ? 'Video Included' : 'Videos Included'}
                  </span>
                  <span className="truncate text-[11px] text-bone/70">
                    {project.videos.map((v) => v.title.split('—')[0].split('|')[0].trim()).join('  •  ')}
                  </span>
                </div>
              )}

              {/* Curated Tech Stack Pills (Clean Single Row) */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {project.stack.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-full border border-white/5 bg-black/40 px-2.5 py-0.5 text-[10.5px] font-medium text-bone/90 backdrop-blur">
                    {t}
                  </span>
                ))}
                {project.stack.length > 4 && (
                  <span className="rounded-full border border-white/5 bg-black/25 px-2 py-0.5 text-[10px] font-medium text-mist/70">
                    +{project.stack.length - 4} more
                  </span>
                )}
              </div>

              {/* Call-to-Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="flex h-10 items-center gap-2 rounded-md bg-bone px-4 text-xs sm:text-sm font-bold text-ink transition group-hover:bg-white cursor-pointer">
                  {project.videos ? '▶ Watch Video / Project' : (project.websites ? `▶ View Websites (${project.websites.length})` : '▶ View Project')}
                </span>
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-10 items-center gap-1.5 rounded-md border border-crimson-2/40 bg-crimson-2/20 px-3.5 text-xs sm:text-sm font-semibold text-bone backdrop-blur transition hover:border-crimson-2 hover:bg-crimson-2/30"
                  >
                    {project.liveUrl.includes('youtu') ? 'Watch on YouTube ↗' : 'Live Site ↗'}
                  </a>
                )}
                {project.github && !project.liveUrl && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-10 items-center gap-1.5 rounded-md border border-white/25 bg-black/30 px-3.5 text-xs sm:text-sm font-semibold text-bone backdrop-blur transition hover:border-bone"
                  >
                    GitHub ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </Tilt>
    </motion.article>
  );
}
