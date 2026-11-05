// ─── Style Thumbnail — Epic Hertz Studio v2 ──────────────────────────────────
// Draws thumbnail canvas with engine/render.ts for 100% preview/export parity.
import { useEffect, useRef } from 'react';
import type { CaptionStyle, Segment } from '../types';
import { renderCaptions } from '../engine/render';
import { ensureFonts } from '../engine/fonts';

const VW = 270;
const VH = 480;
const CROP_H = 168;

let offscreenCanvas: HTMLCanvasElement | null = null;

function peakTime(style: CaptionStyle, sample: Segment): number {
  const words = sample.words ?? [];
  const count = words.length;
  if (!count) return sample.start + 0.35;
  const target = Math.min(Math.max(1, (style.layout.wordsPerPage || count) - 1), count - 1);
  return (words[target].start + words[target].end) / 2;
}

interface StyleThumbnailProps {
  style: CaptionStyle;
  sampleSegment: Segment;
  isHovered?: boolean;
  className?: string;
}

export default function StyleThumbnail({
  style,
  sampleSegment,
  isHovered = false,
  className = '',
}: StyleThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    void ensureFonts(style, sampleSegment.text);
  }, [style, sampleSegment.text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = VW;
      offscreenCanvas.height = VH;
    }

    const o = offscreenCanvas.getContext('2d');
    const c = canvas.getContext('2d');
    if (!o || !c) return;

    const renderFrame = (t: number) => {
      // Background gradient
      const g = o.createLinearGradient(0, 0, VW, VH);
      g.addColorStop(0, '#2d3342');
      g.addColorStop(0.55, '#1e212b');
      g.addColorStop(1, '#111319');
      o.fillStyle = g;
      o.fillRect(0, 0, VW, VH);

      const r = o.createRadialGradient(VW * 0.7, VH * 0.35, 10, VW * 0.7, VH * 0.35, VW * 0.9);
      r.addColorStop(0, 'rgba(251,191,36,0.18)');
      r.addColorStop(1, 'rgba(251,191,36,0)');
      o.fillStyle = r;
      o.fillRect(0, 0, VW, VH);

      const st: CaptionStyle = {
        ...style,
        syncOffset: 0,
        layout: { ...style.layout, x: 0.5, y: 0.5 },
      };
      renderCaptions(o, VW, VH, t, [sampleSegment], st);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 135;
      const cssH = Math.round((cssW * CROP_H) / VW);
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.drawImage(
        offscreenCanvas!,
        0,
        (VH - CROP_H) / 2,
        VW,
        CROP_H,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    };

    if (isHovered) {
      startTimeRef.current = performance.now();
      const loop = (now: number) => {
        const elapsed = (now - startTimeRef.current) / 1000;
        const dur = Math.max(1.5, sampleSegment.end - sampleSegment.start);
        const loopTime = sampleSegment.start + (elapsed % dur);
        renderFrame(loopTime);
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animRef.current);
    } else {
      const stillTime = peakTime(style, sampleSegment);
      renderFrame(stillTime);
    }
  }, [style, sampleSegment, isHovered]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full aspect-[270/168] rounded-lg block bg-[#161615] ${className}`}
    />
  );
}
