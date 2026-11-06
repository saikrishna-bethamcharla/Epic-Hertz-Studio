// ─── CaptionCanvas ──────────────────────────────────────────────────────────
// Draws captions over the preview video with the same engine the export uses, so the
// preview is exactly what you will get. The canvas tracks the *displayed video image*
// (not the surrounding frame) so sizes and positions match the exported pixels.
// Drag the caption block to reposition it (snaps to the centre lines).

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import type { CaptionStyle, Segment, SegmentStyleOverride, LowerThirdSpec } from './types';
import { renderLowerThirds } from './engine/lowerThirds';
import { renderCaptions, findSegment } from './engine/render';
import { ensureFonts, ensureLowerThirdFonts, fontsVersion, onFontsChange } from './engine/fonts';

interface CaptionCanvasProps {
  segments: Segment[];
  style: CaptionStyle;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Element that receives pointer events for dragging (the video frame). */
  hostRef: RefObject<HTMLElement | null>;
  onStyleChange?: (style: CaptionStyle) => void;
  onSegmentOverrideChange?: (segmentId: string, override: Partial<SegmentStyleOverride>) => void;
  lowerThirds?: LowerThirdSpec[];
  photoCache?: Map<string, HTMLImageElement>;
  visible?: boolean;
}

interface Geometry {
  cssW: number;
  cssH: number;
  left: number;
  top: number;
  dpr: number;
}

const SNAP = 0.02;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function CaptionCanvas({
  segments,
  style,
  videoRef,
  hostRef,
  onStyleChange,
  onSegmentOverrideChange,
  lowerThirds,
  photoCache,
  visible = true,
}: CaptionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Latest props, readable from the animation loop without re-subscribing
  const live = useRef({ segments, style, lowerThirds, photoCache, onStyleChange, onSegmentOverrideChange, visible });
  live.current = { segments, style, lowerThirds, photoCache, onStyleChange, onSegmentOverrideChange, visible };

  const geom = useRef<Geometry>({ cssW: 0, cssH: 0, left: 0, top: 0, dpr: 1 });
  const geomVersion = useRef(0);
  const bounds = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const hover = useRef(false);
  const drag = useRef<{
    x: number;
    y: number;
    snapX: boolean;
    snapY: boolean;
    segId?: string;
  } | null>(null);

  // ── Fonts: make sure the chosen family (and any Indic script in the text) is loaded
  const allText = useMemo(() => segments.map((s) => s.text).join(' '), [segments]);
  useEffect(() => {
    void ensureFonts(style, allText);
    void ensureLowerThirdFonts(lowerThirds);
  }, [style.font.family, style.font.weight, style.font.italic, allText, style]);

  // ── Track the displayed video rectangle (object-contain inside the frame)
  useEffect(() => {
    const host = hostRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const measure = () => {
      const hr = host.getBoundingClientRect();
      const vw = video?.videoWidth || 0;
      const vh = video?.videoHeight || 0;
      let w = hr.width;
      let h = hr.height;
      if (vw && vh && hr.width && hr.height) {
        const s = Math.min(hr.width / vw, hr.height / vh);
        w = vw * s;
        h = vh * s;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      geom.current = { cssW: w, cssH: h, left: (hr.width - w) / 2, top: (hr.height - h) / 2, dpr };
      canvas.style.left = `${geom.current.left}px`;
      canvas.style.top = `${geom.current.top}px`;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.max(2, Math.round(w * dpr));
      canvas.height = Math.max(2, Math.round(h * dpr));
      geomVersion.current++;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    video?.addEventListener('loadedmetadata', measure);
    return () => {
      ro.disconnect();
      video?.removeEventListener('loadedmetadata', measure);
    };
  }, [hostRef, videoRef]);

  // ── Render loop: draws only when something actually changed
  useEffect(() => {
    let raf = 0;
    let last = {
      t: -1,
      style: null as CaptionStyle | null,
      segs: null as Segment[] | null,
      g: -1,
      f: -1,
      drag: false,
      hover: false,
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const { segments: segs, style: st, visible } = live.current;
      const dragging = drag.current;
      const t = videoRef.current?.currentTime ?? 0;

      let effSegs = segs;
      let effStyle = st;
      if (dragging) {
        if (dragging.segId && live.current.onSegmentOverrideChange) {
          effSegs = segs.map((s) =>
            s.id === dragging.segId
              ? {
                  ...s,
                  styleOverride: {
                    ...(s.styleOverride || {}),
                    positionX: dragging.x,
                    positionY: dragging.y,
                  },
                }
              : s,
          );
        } else {
          effStyle = { ...st, layout: { ...st.layout, x: dragging.x, y: dragging.y } };
        }
      }

      if (!visible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bounds.current = null;
        last.t = t;
        return;
      }

      const changed =
        t !== last.t ||
        effStyle !== last.style ||
        effSegs !== last.segs ||
        geomVersion.current !== last.g ||
        fontsVersion() !== last.f ||
        !!dragging !== last.drag ||
        hover.current !== last.hover;
      if (!changed && !dragging) return;
      last = {
        t,
        style: effStyle,
        segs: effSegs,
        g: geomVersion.current,
        f: fontsVersion(),
        drag: !!dragging,
        hover: hover.current,
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const res = renderCaptions(ctx, canvas.width, canvas.height, t, effSegs, effStyle);
      renderLowerThirds(ctx, canvas.width, canvas.height, t, live.current.lowerThirds, live.current.photoCache);
      bounds.current = res.bounds;

      // Editing aids: bounding box on hover/drag, centre guides while dragging
      if (res.bounds && (hover.current || dragging)) {
        const b = res.bounds;
        const pad = canvas.width * 0.012;
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = Math.max(1, canvas.width * 0.003);
        ctx.strokeStyle = 'rgba(251,191,36,0.9)';
        ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);

        // Subtle indicator badge while dragging
        if (dragging) {
          const isAll = !dragging.segId;
          const label = isAll ? 'Repositioning: All Captions' : 'Repositioning: This Caption Only';
          ctx.font = `600 ${Math.max(10, canvas.width * 0.016)}px sans-serif`;
          const tw = ctx.measureText(label).width;
          const th = Math.max(14, canvas.width * 0.024);
          const lx = Math.max(pad + 4, Math.min(b.x, canvas.width - tw - pad * 2 - 8));
          const ly = Math.max(th + 6, b.y - pad - 6);
          ctx.fillStyle = 'rgba(20,20,19,0.88)';
          ctx.beginPath();
          ctx.roundRect(lx - 6, ly - th + 3, tw + 12, th + 2, 4);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(label, lx, ly);
        }
        ctx.restore();
      }
      if (dragging) {
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = Math.max(1, canvas.width * 0.003);
        ctx.strokeStyle = 'rgba(251,191,36,0.75)';
        if (dragging.snapX) {
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, 0);
          ctx.lineTo(canvas.width / 2, canvas.height);
          ctx.stroke();
        }
        if (dragging.snapY) {
          ctx.beginPath();
          ctx.moveTo(0, canvas.height / 2);
          ctx.lineTo(canvas.width, canvas.height / 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    raf = requestAnimationFrame(tick);
    const off = onFontsChange(() => {
      last.f = -1;
    });
    return () => {
      cancelAnimationFrame(raf);
      off();
    };
  }, [videoRef]);

  // ── Direct manipulation: drag the caption block
  useEffect(() => {
    const host = hostRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const toCanvas = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * canvas.width,
        y: ((e.clientY - r.top) / r.height) * canvas.height,
        r,
      };
    };
    const hit = (e: PointerEvent) => {
      const b = bounds.current;
      if (!b) return false;
      const { x, y } = toCanvas(e);
      const pad = canvas.width * 0.03;
      return x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
    };

    let start: {
      cx: number;
      cy: number;
      bx: number;
      by: number;
      moved: boolean;
      segId?: string;
      isShiftOrAlt: boolean;
    } | null = null;
    let suppressClick = false;

    const onMove = (e: PointerEvent) => {
      if (start) {
        const r = canvas.getBoundingClientRect();
        const dx = e.clientX - start.cx;
        const dy = e.clientY - start.cy;
        if (Math.abs(dx) + Math.abs(dy) > 3) start.moved = true;
        let nx = clamp(start.bx + dx / r.width, 0.04, 0.96);
        let ny = clamp(start.by + dy / r.height, 0.04, 0.96);
        const snapX = Math.abs(nx - 0.5) < SNAP;
        const snapY = Math.abs(ny - 0.5) < SNAP;
        if (snapX) nx = 0.5;
        if (snapY) ny = 0.5;
        drag.current = { x: nx, y: ny, snapX, snapY, segId: start.segId };
        return;
      }
      const over = hit(e);
      if (over !== hover.current) {
        hover.current = over;
        if (video) video.style.cursor = over ? 'move' : '';
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !hit(e)) return;
      e.preventDefault();
      e.stopPropagation();
      const { style: st, segments: segs } = live.current;
      const t = (video?.currentTime ?? 0) - st.syncOffset;
      const activeSeg = findSegment(segs, t);
      const isShiftOrAlt = e.shiftKey || e.altKey;

      const initX =
        activeSeg?.styleOverride?.positionX !== undefined
          ? activeSeg.styleOverride.positionX
          : st.layout.x;
      const initY =
        activeSeg?.styleOverride?.positionY !== undefined
          ? activeSeg.styleOverride.positionY
          : st.layout.y;

      start = {
        cx: e.clientX,
        cy: e.clientY,
        bx: initX,
        by: initY,
        moved: false,
        segId: isShiftOrAlt ? undefined : activeSeg?.id,
        isShiftOrAlt,
      };
      drag.current = {
        x: initX,
        y: initY,
        snapX: false,
        snapY: false,
        segId: isShiftOrAlt ? undefined : activeSeg?.id,
      };
      try {
        host.setPointerCapture(e.pointerId);
      } catch {
        /* pointer may already be gone */
      }
    };

    const onUp = (e?: PointerEvent) => {
      if (!start) return;
      const d = drag.current;
      const { style: st, onStyleChange: commit, onSegmentOverrideChange: commitSeg } = live.current;
      if (start.moved) suppressClick = true;
      if (d && start.moved) {
        const applyToAll =
          start.isShiftOrAlt || (e && (e.shiftKey || e.altKey)) || !commitSeg || !start.segId;
        if (applyToAll && commit) {
          commit({ ...st, layout: { ...st.layout, x: d.x, y: d.y } });
        } else if (commitSeg && start.segId) {
          commitSeg(start.segId, { positionX: d.x, positionY: d.y });
        }
      }
      drag.current = null;
      start = null;
    };

    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) {
        suppressClick = false;
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const onLeave = () => {
      hover.current = false;
      if (video) video.style.cursor = '';
    };

    host.style.touchAction = 'none';
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerdown', onDown, true);
    host.addEventListener('pointerup', onUp);
    host.addEventListener('pointercancel', onUp);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('click', onClickCapture, true);
    return () => {
      host.style.touchAction = '';
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerdown', onDown, true);
      host.removeEventListener('pointerup', onUp);
      host.removeEventListener('pointercancel', onUp);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('click', onClickCapture, true);
      if (video) video.style.cursor = '';
    };
  }, [hostRef, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute z-30"
      style={{ left: 0, top: 0, width: '100%', height: '100%' }}
    />
  );
}
