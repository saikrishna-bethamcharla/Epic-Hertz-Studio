// ─── Chunk Reload Handler ──────────────────────────────────────────────────
// Automatically reloads once if a dynamic chunk fails to load after a deployment.

if (typeof window !== 'undefined') {
  function reloadOnce(key: string) {
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      return;
    }
    window.location.reload();
  }

  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault();
    reloadOnce('chunk_reload_preload');
  });

  window.addEventListener(
    'error',
    (e: ErrorEvent) => {
      const target = e.target as (HTMLElement & { src?: string; href?: string }) | null;
      const url = target?.src || target?.href;
      if (url && url.indexOf('/assets/index-') !== -1 && target?.tagName === 'SCRIPT') {
        reloadOnce('chunk_reload_' + url);
      }
    },
    true,
  );
}
