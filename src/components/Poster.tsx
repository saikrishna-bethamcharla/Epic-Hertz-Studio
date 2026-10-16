import type { ReactNode } from 'react';
import type { Palette, Project } from '../data/portfolio';

/**
 * Generated "key art" for thumbnails — layered gradients, light falloff and a motif.
 * No stock imagery: every card is art-directed from its palette.
 */
export function PosterBackdrop({ palette, image, children, className = '' }: { palette: Palette; image?: string; children?: ReactNode; className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 85% 10%, ${palette.via} 0%, transparent 60%),
          radial-gradient(90% 80% at 0% 100%, ${palette.from} 0%, transparent 70%),
          linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
    >
      {image && (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-18 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105 group-hover:opacity-28"
        />
      )}
      <div
        aria-hidden
        className="absolute -right-1/4 -top-1/3 h-[140%] w-[70%] rotate-[18deg] opacity-30 blur-3xl"
        style={{ background: `linear-gradient(90deg, transparent, ${palette.accent}40, transparent)` }}
      />
      <div aria-hidden className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_4px)]" />
      {children}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-[#050507]/35" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_30%,rgba(5,5,7,0.75)_100%)]" />
    </div>
  );
}

/** Motif illustrations for each Original, built from the project's own architecture. */
export function ProjectArt({ project, className = '' }: { project: Project; className?: string }) {
  const a = project.palette.accent;
  return (
    <PosterBackdrop palette={project.palette} image={project.image} className={className}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
        <defs>
          <radialGradient id={`g-${project.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={a} stopOpacity="0.25" />
            <stop offset="100%" stopColor={a} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="310" cy="110" r="140" fill={`url(#g-${project.id})`} />
        {project.motif === 'shield' && (
          <g transform="translate(236 40)" fill="none" stroke={a} strokeOpacity="0.32">
            <path d="M58 0 L116 22 V78 C116 120 90 146 58 160 C26 146 0 120 0 78 V22 Z" strokeWidth="1.8" />
            <path d="M58 16 L102 33 V78 C102 111 82 132 58 144 C34 132 14 111 14 78 V33 Z" strokeWidth="1" strokeOpacity="0.18" />
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1="30" x2={i % 2 ? 72 : 86} y1={56 + i * 14} y2={56 + i * 14} strokeWidth="2.5" strokeLinecap="round" strokeOpacity={0.15 + i * 0.05} />
            ))}
            <path d="M40 124 l12 12 l26 -28" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" />
          </g>
        )}
        {project.motif === 'flow' && (
          <g fill="none" stroke={a}>
            <rect x="220" y="56" width="130" height="84" rx="12" strokeWidth="1.5" strokeOpacity="0.25" />
            <rect x="234" y="70" width="24" height="18" rx="4" strokeWidth="1" strokeOpacity="0.2" />
            <line x1="234" x2="330" y1="120" y2="120" strokeWidth="2" strokeOpacity="0.15" strokeDasharray="14 6" />
            <g transform="translate(196 186)" fontFamily="Inter" fontSize="10" fill={a} stroke="none" letterSpacing="2">
              <circle cx="16" cy="16" r="14" fill="none" stroke={a} strokeWidth="1.5" strokeOpacity="0.28" />
              <path d="M30 16 h42" stroke={a} strokeWidth="1.5" strokeOpacity="0.2" />
              <circle cx="86" cy="16" r="14" fill="none" stroke={a} strokeWidth="1.5" strokeOpacity="0.25" />
              <path d="M100 8 l34 -18 M100 24 l34 18" stroke={a} strokeWidth="1.5" strokeOpacity="0.18" />
              <circle cx="146" cy="-10" r="8" fill={a} fillOpacity="0.3" />
              <circle cx="146" cy="42" r="8" fill="none" stroke={a} strokeWidth="1.5" strokeOpacity="0.2" />
            </g>
          </g>
        )}
        {project.motif === 'tenants' && (
          <g fill="none" stroke={a}>
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={196 + c * 44}
                  y={50 + r * 44}
                  width="34"
                  height="34"
                  rx="7"
                  strokeWidth="1.2"
                  strokeOpacity={0.12 + ((r + c) % 3) * 0.1}
                  fill={(r + c) % 4 === 0 ? a : 'none'}
                  fillOpacity="0.12"
                />
              )),
            )}
            <path d="M188 200 h190" strokeWidth="1.5" strokeOpacity="0.25" />
            <path d="M188 214 h190" strokeWidth="1" strokeOpacity="0.15" />
            <path d="M188 228 h190" strokeWidth="1" strokeOpacity="0.1" />
          </g>
        )}
      </svg>
    </PosterBackdrop>
  );
}

/** Small fictional platform mark used in the nav and on cards. */
export function SeriesMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg viewBox="0 0 24 32" className="h-[1.1em] w-auto" aria-hidden>
        <path d="M18 6c-1.8-1.8-4-2.6-6.5-2.6C7.6 3.4 5 5.6 5 9c0 7.6 14 4.6 14 11.6 0 3-2.8 5-6.4 5-3 0-5.4-1.2-7.2-3" fill="none" stroke="#e5132b" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="font-sans text-[0.62em] font-bold tracking-[0.36em] text-mist">SERIES</span>
    </span>
  );
}
