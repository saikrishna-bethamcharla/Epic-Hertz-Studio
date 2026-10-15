# SAI KRISHNA — THE SERIES

A cinematic, streaming-inspired portfolio for **Sai Krishna Bethamcharla**: Creative & Technical Lead at Zai Labs Private Limited.
Every section is an episode, every project is an Original, and the entire portfolio plays like a series.

> A personal portfolio with a fictional streaming-platform look. It is not affiliated with Netflix or any other streaming service and uses none of their logos.

## Run it locally

Requires **Node.js 22.12+**.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Production build:

```bash
npm run build
npm run preview
```

The static site is written to `dist/` and can be deployed as-is to Vercel, Netlify, GitHub Pages, or any static host.

## Updating the content

**Portfolio content lives in [`src/data/portfolio.ts`](src/data/portfolio.ts).** Update the central data first so project cards, detail modals, and the resume stay consistent.

| To change… | Edit |
| --- | --- |
| Name, intro, email, LinkedIn, GitHub | `profile` |
| Projects & Originals | `projects` |
| Awards & professional highlights | `achievements`, `professionalHighlights` |
| Skills & categories | `skillCategories`, `skillEvidence` |
| Seasons and episodes (My Journey) | `seasons` |
| Top 10 row | `topPicks` |
| ▶ Play Intro highlight reel | `introSlides` |
| Profile ordering (Lead / Creative / Technical) | `viewerProfiles` |
| Opening studio card text | `profile.originalLabel` |

**Resume:** placed at `public/assets/Sai_Krishna_Bethamcharla_Resume.pdf`.

## What's inside

```
src/
  data/portfolio.ts        ← single source of truth
  App.tsx                  ← stages: direct home billboard; modal overlays
  components/
    Navbar                 ← hide-on-scroll nav, profile switcher, mobile menu
    Hero                   ← billboard: parallax portrait, particles, light streaks, floating chips
    PlayIntro              ← ▶ Play Intro: zoom into portrait → highlight reel
    ContinueWatching       ← cards with real "watched" progress bars
    About                  ← The Pilot
    Seasons / EpisodeCard  ← My Journey as seasons and episodes
    Originals / ProjectCard← pinned horizontal sequence on desktop, swipe rail on touch
    ProjectModal           ← full-screen project overlay with a shared-element transition
    TopPicks               ← Top 10-style row
    Skills                 ← skill genres; each card shows where the skill appears
    Achievements           ← award-poster cards + professional highlights rail
    ResumeViewer/ResumeModal ← designed resume sheet, PDF viewer, download
    FinalCTA               ← TO BE CONTINUED… + contact links
    CustomCursor, fx.tsx   ← cursor states, magnetic buttons, 3D tilt, text reveals, particles
  hooks/                   ← Lenis smooth scroll, media queries, watch progress
```

**Stack:** React 18, TypeScript, Vite 6, Tailwind CSS 4, Framer Motion 11, Lenis.
