// ─── assetUrl helper ────────────────────────────────────────────────────────
// Robustly resolves public assets (ffmpeg, fonts, etc.) across:
// - Localhost (/)
// - Vercel (/)
// - GitHub Pages (/Portfolio/ or /Epic-Hertz-Studio/)

export function getAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  try {
    const href = window.location.href;
    const url = new URL(href);
    if (!url.pathname.endsWith('/') && !url.pathname.includes('.')) {
      url.pathname += '/';
    }
    const base = document.querySelector('base')?.getAttribute('href') || import.meta.env.BASE_URL || './';
    return new URL(clean, new URL(base, url.href)).href;
  } catch {
    return `/${clean}`;
  }
}
