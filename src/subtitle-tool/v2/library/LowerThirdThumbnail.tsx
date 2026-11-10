// ─── Lower Third Animated Thumbnail — Epic Hertz Studio v2 ───────────────────
// Real-time canvas thumbnail for lower third templates.
// Statically renders mid-hold preview by default; on hover, runs requestAnimationFrame
// looping the real template animation using renderTemplateLowerThird.

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { LowerThirdTemplate } from '../../engine/lowerThirdSchema';
import { renderTemplateLowerThird } from '../../engine/lowerThirdRenderer';
import { DEFAULT_LOWER_THIRD, type LowerThirdSpec } from '../../engine/spec';
import { isIndicText } from '../../engine/lowerThirdPrimitives';

interface LowerThirdThumbnailProps {
  template: LowerThirdTemplate;
  isSelected?: boolean;
  onSelect: () => void;
  language?: 'en' | 'te' | 'hi';
}

export default function LowerThirdThumbnail({
  template,
  isSelected,
  onSelect,
  language = 'en',
}: LowerThirdThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Sample localized text for preview
  const isIndicTemplate = template.packId === 'indic-pack' || isIndicText(template.name);
  let sampleName = 'SARATH CHANDRA';
  let sampleRole = 'DIRECTOR OF FILMS';

  if (isIndicTemplate || language === 'te') {
    sampleName = 'శ్రీనివాస రామానుజన్';
    sampleRole = 'గణిత శాస్త్రవేత్త';
  } else if (language === 'hi') {
    sampleName = 'श्रीनिवास रामानुजन';
    sampleRole = 'गणितज्ञ';
  }

  const spec = useMemo<LowerThirdSpec>(
    () => ({
      ...DEFAULT_LOWER_THIRD,
      id: `thumb-${template.id}`,
      templateId: template.id,
      name: sampleName,
      role: sampleRole,
      start: 0,
      end: 4.0,
      introDuration: 0.7,
      outroDuration: 0.6,
    }),
    [template.id, sampleName, sampleRole],
  );

  const drawFrame = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dark studio backdrop pattern
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render lower third at time t
      renderTemplateLowerThird(ctx, spec, t, canvas.width, canvas.height);
    },
    [spec],
  );

  // Static preview when not hovering (at mid-hold t = 2.0)
  useEffect(() => {
    if (!isHovered) {
      drawFrame(2.0);
    }
  }, [isHovered, drawFrame]);

  // Animated hover loop
  useEffect(() => {
    if (!isHovered) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const startTime = performance.now();
    const loopDurationMs = 3600; // 3.6s loop

    const tick = (now: number) => {
      const elapsed = (now - startTime) % loopDurationMs;
      const t = (elapsed / loopDurationMs) * 4.0;
      drawFrame(t);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isHovered, drawFrame]);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={`Select template ${template.name}`}
      className={`group relative flex flex-col w-full text-left rounded-lg overflow-hidden border transition-all ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5'
          : 'border-white/10 hover:border-white/30 bg-[#18181b]'
      }`}
    >
      <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          className="w-full h-full object-cover block"
        />
        {isHovered && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-amber-300">
            PLAYING
          </div>
        )}
      </div>

      <div className="p-2 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-semibold text-bone truncate">{template.name}</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 text-smoke shrink-0">
            {template.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-smoke truncate">
          {template.tags.slice(0, 3).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </div>
    </button>
  );
}
