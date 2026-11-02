import { lazy, Suspense, useState } from 'react';

// Each product is its own chunk, so a visitor only downloads the code for the
// site they actually opened (Studio visitors no longer pay for the portfolio, and vice versa).
const SubtitleTool = lazy(() => import('./subtitle-tool/SubtitleTool'));
const PortfolioApp = lazy(() => import('./PortfolioApp'));

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

  // Default for Epic Hertz Studio repository
  return true;
}

export default function App() {
  const [isStudio] = useState(() => isStudioApp());

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050507' }} aria-busy="true" />}>
      {isStudio ? <SubtitleTool /> : <PortfolioApp />}
    </Suspense>
  );
}
