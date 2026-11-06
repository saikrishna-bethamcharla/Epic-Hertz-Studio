import { renderCaptions } from '../src/subtitle-tool/engine/render';
import { CAPTION_TEMPLATES } from '../src/subtitle-tool/engine/templateCatalog';
import { templateToStyle } from '../src/subtitle-tool/engine/templateSchema';
import type { Segment } from '../src/subtitle-tool/types';

interface BenchmarkResult {
  id: string;
  name: string;
  category: string;
  hasBlur: boolean;
  hasGlow: boolean;
  avgMs: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
}

const sampleSegments: Segment[] = [
  {
    id: 'bench-1',
    index: 1,
    start: 0.5,
    end: 3.5,
    text: 'Real browser performance benchmark across all templates',
    words: [
      { word: 'Real', start: 0.5, end: 0.9 },
      { word: 'browser', start: 1.0, end: 1.5 },
      { word: 'performance', start: 1.6, end: 2.1 },
      { word: 'benchmark', start: 2.2, end: 2.7 },
      { word: 'across', start: 2.8, end: 3.1 },
      { word: 'templates', start: 3.2, end: 3.5 },
    ],
  },
];

async function run() {
  // Ensure all web fonts are loaded into the browser cache
  try {
    await document.fonts.ready;
  } catch (e) {
    console.warn('fonts.ready skipped:', e);
  }

  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
  const W = 1080;
  const H = 1920;

  // Warm-up run for every template so JIT, GPU textures, and font caches are hot
  for (const template of CAPTION_TEMPLATES) {
    const s = templateToStyle(template);
    renderCaptions(ctx, W, H, 1.5, sampleSegments, s);
  }

  const results: BenchmarkResult[] = [];
  const timestamps = [0.6, 0.7, 0.8, 1.2, 1.5, 1.8, 2.3, 2.7, 3.2, 3.4];
  const iterationsPerTimestamp = 5; // 50 frames per template

  for (const template of CAPTION_TEMPLATES) {
    const style = templateToStyle(template);
    const hasBlur =
      template.entrance.type === 'blur-in' ||
      template.exit.type === 'blur-out' ||
      !!style.glow?.blur;
    const hasGlow =
      template.emphasis.type === 'glow-pulse' ||
      (template.colors.glow && template.colors.glow.strength > 0) ||
      style.glow?.strength > 0;

    const timings: number[] = [];

    for (const t of timestamps) {
      for (let iter = 0; iter < iterationsPerTimestamp; iter++) {
        const t0 = performance.now();
        renderCaptions(ctx, W, H, t, sampleSegments, style);
        const elapsed = performance.now() - t0;
        timings.push(elapsed);
      }
    }

    timings.sort((a, b) => a - b);
    const sum = timings.reduce((a, b) => a + b, 0);
    const avgMs = +(sum / timings.length).toFixed(3);
    const p95Idx = Math.floor(timings.length * 0.95);
    const p95Ms = +timings[p95Idx].toFixed(3);
    const minMs = +timings[0].toFixed(3);
    const maxMs = +timings[timings.length - 1].toFixed(3);

    results.push({
      id: template.id,
      name: template.name,
      category: template.category,
      hasBlur,
      hasGlow,
      avgMs,
      p95Ms,
      minMs,
      maxMs,
    });
  }

  // Send results to collector server
  try {
    await fetch('http://localhost:5175/done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results),
    });
  } catch (err) {
    console.error('Failed to post benchmark results:', err);
  }
}

window.addEventListener('load', () => {
  setTimeout(run, 300);
});
