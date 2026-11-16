// ─── CaptionCanvas ──────────────────────────────────────────────────────────
// Draws captions and graphic overlays (callouts, YouTube pack, social handles,
// kinetic MOGRTs, lower thirds) over the preview video with the same engine used for export.
// Supports interactive on-screen click-to-select and drag-to-move with real-time feedback,
// corner handles, coordinate badges, and center-snap guidelines.

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import type { CaptionStyle, Segment, SegmentStyleOverride, LowerThirdSpec, VideoFrameRequestCallback } from './types';
import { renderLowerThirds } from './engine/lowerThirds';
import { renderCaptions, findSegment } from './engine/render';
import { ensureFonts, ensureLowerThirdFonts, fontsVersion, onFontsChange } from './engine/fonts';
import {
  getLowerThirdBounds,
  getDefaultLowerThirdPosition,
  isPointInBounds,
} from './engine/lowerThirdBounds';
import { timeStore } from './store/timeStore';

interface CaptionCanvasProps {
  segments: Segment[];
  style: CaptionStyle;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Element that receives pointer events for dragging (the video frame). */
  hostRef: RefObject<HTMLElement | null>;
  onStyleChange?: (style: CaptionStyle) => void;
  onSegmentOverrideChange?: (
    segmentId: string,
    override: Partial<SegmentStyleOverride> | null,
  ) => void;
  lowerThirds?: LowerThirdSpec[];
  selectedLowerThirdId?: string | null;
  onSelectLowerThird?: (id: string | null) => void;
  onUpdateLowerThird?: (updated: LowerThirdSpec) => void;
  selectedSegmentId?: string | null;
  onSelectSegment?: (id: string | null) => void;
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

interface DragState {
  kind: 'lowerThird' | 'caption';
  id: string;
  ltSpec?: LowerThirdSpec;
  startX: number;
  startY: number;
  initX: number;
  initY: number;
  currX: number;
  currY: number;
  snapX: boolean;
  snapY: boolean;
  moved: boolean;
  isShiftOrAlt?: boolean;
  title: string;
}

const SNAP = 0.02;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Draws a sleek, high-visibility editing bounding box with 4 corner bracket handles,
 * center crosshairs when snapping, and a translucent coordinate badge.
 */
function drawInteractiveBox(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
  label: string,
  isDragging: boolean,
  snapX: boolean,
  snapY: boolean,
  canvasW: number,
  canvasH: number,
  accentColor = '#fbbf24',
) {
  const pad = Math.max(6, canvasW * 0.01);
  const bx = b.x - pad;
  const by = b.y - pad;
  const bw = b.w + pad * 2;
  const bh = b.h + pad * 2;

  ctx.save();

  // 1. Subtle dashed boundary
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = Math.max(1.5, canvasW * 0.002);
  ctx.strokeStyle = accentColor;
  ctx.strokeRect(bx, by, bw, bh);

  // 2. Corner Bracket Handles
  ctx.setLineDash([]);
  ctx.lineWidth = Math.max(2.5, canvasW * 0.0035);
  ctx.strokeStyle = accentColor;
  const bl = Math.min(18, bw * 0.2, bh * 0.2);

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(bx, by + bl);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + bl, by);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(bx + bw - bl, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw, by + bl);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(bx, by + bh - bl);
  ctx.lineTo(bx, by + bh);
  ctx.lineTo(bx + bl, by + bh);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(bx + bw - bl, by + bh);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by + bh - bl);
  ctx.stroke();

  // 3. Coordinate & Label Badge
  ctx.font = `600 ${Math.max(11, canvasW * 0.016)}px system-ui, -apple-system, sans-serif`;
  const tw = ctx.measureText(label).width;
  const th = Math.max(16, canvasW * 0.024);
  const lx = Math.max(pad + 4, Math.min(bx, canvasW - tw - pad * 2 - 16));
  const ly = Math.max(th + 6, by - 8);

  ctx.fillStyle = 'rgba(20, 20, 19, 0.92)';
  ctx.beginPath();
  ctx.roundRect(lx - 6, ly - th + 3, tw + 14, th + 2, 4);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.fillText(label, lx + 1, ly);

  // 4. Center snap guidelines while dragging
  if (isDragging) {
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = Math.max(1, canvasW * 0.003);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    if (snapX) {
      ctx.beginPath();
      ctx.moveTo(canvasW / 2, 0);
      ctx.lineTo(canvasW / 2, canvasH);
      ctx.stroke();
    }
    if (snapY) {
      ctx.beginPath();
      ctx.moveTo(0, canvasH / 2);
      ctx.lineTo(canvasW, canvasH / 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export default function CaptionCanvas({
  segments,
  style,
  videoRef,
  hostRef,
  onStyleChange,
  onSegmentOverrideChange,
  lowerThirds,
  selectedLowerThirdId,
  onSelectLowerThird,
  onUpdateLowerThird,
  selectedSegmentId,
  onSelectSegment,
  photoCache,
  visible = true,
}: CaptionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Latest props, readable from the animation loop without re-subscribing
  const live = useRef({
    segments,
    style,
    lowerThirds,
    selectedLowerThirdId,
    onSelectLowerThird,
    onUpdateLowerThird,
    selectedSegmentId,
    onSelectSegment,
    photoCache,
    onStyleChange,
    onSegmentOverrideChange,
    visible,
  });
  live.current = {
    segments,
    style,
    lowerThirds,
    selectedLowerThirdId,
    onSelectLowerThird,
    onUpdateLowerThird,
    selectedSegmentId,
    onSelectSegment,
    photoCache,
    onStyleChange,
    onSegmentOverrideChange,
    visible,
  };

  const geom = useRef<Geometry>({ cssW: 0, cssH: 0, left: 0, top: 0, dpr: 1 });
  const geomVersion = useRef(0);
  const captionBounds = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const hover = useRef(false);
  const hoveredTarget = useRef<{ kind: 'lowerThird' | 'caption'; id: string } | null>(null);
  const drag = useRef<DragState | null>(null);

  // ── Fonts: make sure the chosen family is loaded
  const allText = useMemo(() => segments.map((s) => s.text).join(' '), [segments]);
  useEffect(() => {
    if (style?.font) {
      void ensureFonts(style, allText);
    }
    void ensureLowerThirdFonts(lowerThirds);
  }, [style?.font?.family, style?.font?.weight, style?.font?.italic, allText, style, lowerThirds]);

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
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(host);
    video?.addEventListener?.('loadedmetadata', measure);
    return () => {
      ro?.disconnect();
      video?.removeEventListener?.('loadedmetadata', measure);
    };
  }, [hostRef, videoRef]);

  const latestMediaTimeRef = useRef<number | null>(null);

  // Hook into HTMLVideoElement.requestVideoFrameCallback (rvfc) when available:
  // fires at the exact microsecond a new video frame is rendered to the screen,
  // providing metadata.mediaTime with sub-millisecond presentation accuracy.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof video.requestVideoFrameCallback !== 'function') return;

    let rvfcId: number | null = null;
    let isActive = true;

    const onFrame: VideoFrameRequestCallback = (_now, metadata) => {
      if (!isActive) return;
      latestMediaTimeRef.current = metadata.mediaTime;

      const v = videoRef.current;
      if (v && !v.paused && typeof v.requestVideoFrameCallback === 'function') {
        rvfcId = v.requestVideoFrameCallback(onFrame);
      }
    };

    const handlePlay = () => {
      if (typeof video.requestVideoFrameCallback === 'function') {
        rvfcId = video.requestVideoFrameCallback(onFrame);
      }
    };

    video.addEventListener('play', handlePlay);
    if (!video.paused) {
      rvfcId = video.requestVideoFrameCallback(onFrame);
    }

    return () => {
      isActive = false;
      video.removeEventListener('play', handlePlay);
      if (rvfcId !== null && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(rvfcId);
      }
    };
  }, [videoRef]);

  // ── Render loop: draws preview, active overlays, selection bounding box & snap guides
  useEffect(() => {
    let raf = 0;
    let last = {
      t: -1,
      style: null as CaptionStyle | null,
      segs: null as Segment[] | null,
      lowerThirds: null as LowerThirdSpec[] | null | undefined,
      selectedLtId: null as string | null | undefined,
      selectedSegId: null as string | null | undefined,
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

      const {
        segments: segs,
        style: st,
        lowerThirds: lts,
        selectedLowerThirdId: selLtId,
        selectedSegmentId: selSegId,
        visible,
        photoCache: cache,
      } = live.current;

      const dragging = drag.current;
      const isPaused = videoRef.current ? videoRef.current.paused : true;
      const t = isPaused
        ? timeStore.getTime()
        : (latestMediaTimeRef.current ?? timeStore.getTime());

      let effSegs = segs;
      let effStyle = st;
      let effLowerThirds = lts;

      if (dragging) {
        if (dragging.kind === 'caption') {
          if (dragging.id && live.current.onSegmentOverrideChange && !dragging.isShiftOrAlt) {
            effSegs = segs.map((s) =>
              s.id === dragging.id
                ? {
                    ...s,
                    styleOverride: {
                      ...(s.styleOverride || {}),
                      positionX: dragging.currX,
                      positionY: dragging.currY,
                    },
                  }
                : s,
            );
          } else {
            effStyle = {
              ...st,
              layout: {
                ...st.layout,
                x: dragging.currX,
                y: dragging.currY,
              },
            };
          }
        } else if (dragging.kind === 'lowerThird') {
          effLowerThirds = lts?.map((lt) =>
            lt.id === dragging.id
              ? {
                  ...lt,
                  position: {
                    ...lt.position,
                    x: dragging.currX,
                    y: dragging.currY,
                    align: 'center',
                  },
                }
              : lt,
          );
        }
      }

      if (!visible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        captionBounds.current = null;
        last.t = t;
        return;
      }

      const changed =
        t !== last.t ||
        effStyle !== last.style ||
        effSegs !== last.segs ||
        effLowerThirds !== last.lowerThirds ||
        selLtId !== last.selectedLtId ||
        selSegId !== last.selectedSegId ||
        geomVersion.current !== last.g ||
        fontsVersion() !== last.f ||
        !!dragging !== last.drag ||
        hover.current !== last.hover;

      if (!changed && !dragging) return;
      last = {
        t,
        style: effStyle,
        segs: effSegs,
        lowerThirds: effLowerThirds,
        selectedLtId: selLtId,
        selectedSegId: selSegId,
        g: geomVersion.current,
        f: fontsVersion(),
        drag: !!dragging,
        hover: hover.current,
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Render Subtitle Captions
      const res = renderCaptions(ctx, canvas.width, canvas.height, t, effSegs, effStyle);
      captionBounds.current = res.bounds;

      // 2. Render Lower Thirds / Callouts / YouTube / Social / MOGRT Graphics
      renderLowerThirds(ctx, canvas.width, canvas.height, t, effLowerThirds, cache);

      // 3. Selection & Drag Overlays for Lower Thirds
      if (effLowerThirds && effLowerThirds.length > 0) {
        for (const lt of effLowerThirds) {
          const isItemDragging = dragging?.kind === 'lowerThird' && dragging.id === lt.id;
          const isItemSelected = selLtId === lt.id;
          const isItemHovered =
            hoveredTarget.current?.kind === 'lowerThird' && hoveredTarget.current.id === lt.id;

          if (isItemDragging || isItemSelected || isItemHovered) {
            const b = getLowerThirdBounds(lt, canvas.width, canvas.height, t);
            if (b) {
              const labelText = isItemDragging
                ? `${lt.name || 'Call-Out'} (X: ${Math.round(dragging.currX * 100)}%, Y: ${Math.round(dragging.currY * 100)}%)`
                : isItemSelected
                  ? `✦ ${lt.name || 'Text Overlay'} (X: ${Math.round((lt.position?.x ?? 0.5) * 100)}%, Y: ${Math.round((lt.position?.y ?? 0.5) * 100)}%)`
                  : `${lt.name || 'Text Overlay'}`;

              drawInteractiveBox(
                ctx,
                b,
                labelText,
                isItemDragging,
                isItemDragging ? dragging.snapX : false,
                isItemDragging ? dragging.snapY : false,
                canvas.width,
                canvas.height,
                isItemDragging ? '#fbbf24' : isItemSelected ? '#38bdf8' : '#e2e8f0',
              );
            }
          }
        }
      }

      // 4. Selection & Drag Overlays for Captions
      if (res.bounds) {
        const isCaptDragging = dragging?.kind === 'caption';
        const activeSeg = findSegment(effSegs, t - effStyle.syncOffset);
        const isCaptSelected =
          selSegId && activeSeg?.id ? selSegId === activeSeg.id : !selLtId && hover.current;

        if (isCaptDragging || isCaptSelected) {
          const cX = isCaptDragging
            ? dragging.currX
            : (activeSeg?.styleOverride?.positionX ?? effStyle.layout.x);
          const cY = isCaptDragging
            ? dragging.currY
            : (activeSeg?.styleOverride?.positionY ?? effStyle.layout.y);

          const captLabel = isCaptDragging
            ? dragging.isShiftOrAlt
              ? `All Captions (X: ${Math.round(cX * 100)}%, Y: ${Math.round(cY * 100)}%)`
              : `This Caption (X: ${Math.round(cX * 100)}%, Y: ${Math.round(cY * 100)}%)`
            : `✦ Caption (X: ${Math.round(cX * 100)}%, Y: ${Math.round(cY * 100)}%)`;

          drawInteractiveBox(
            ctx,
            res.bounds,
            captLabel,
            isCaptDragging,
            isCaptDragging ? dragging.snapX : false,
            isCaptDragging ? dragging.snapY : false,
            canvas.width,
            canvas.height,
            isCaptDragging ? '#fbbf24' : '#f59e0b',
          );
        }
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

  // ── Direct manipulation: Click to Select, Drag to Move on Canvas
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

    const hitLowerThird = (e: PointerEvent): LowerThirdSpec | null => {
      const { lowerThirds: lts, visible } = live.current;
      if (!visible || !lts || lts.length === 0) return null;
      const isPaused = videoRef.current ? videoRef.current.paused : true;
      const t = isPaused ? timeStore.getTime() : (latestMediaTimeRef.current ?? timeStore.getTime());
      const pt = toCanvas(e);

      // Hit test in reverse order (top-most rendered item gets clicked first)
      for (let i = lts.length - 1; i >= 0; i--) {
        const lt = lts[i];
        const b = getLowerThirdBounds(lt, canvas.width, canvas.height, t);
        if (b && isPointInBounds(pt, b, canvas.width * 0.02)) {
          return lt;
        }
      }
      return null;
    };

    const hitCaption = (e: PointerEvent): Segment | null => {
      const { visible, segments: segs, style: st } = live.current;
      if (!visible || !captionBounds.current) return null;
      const pt = toCanvas(e);
      const pad = canvas.width * 0.03;
      if (isPointInBounds(pt, captionBounds.current, pad)) {
        const isPaused = videoRef.current ? videoRef.current.paused : true;
        const curTime = isPaused ? timeStore.getTime() : (latestMediaTimeRef.current ?? timeStore.getTime());
        const t = curTime - st.syncOffset;
        return findSegment(segs, t) || segs[0] || null;
      }
      return null;
    };

    let suppressClick = false;

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (d) {
        const r = canvas.getBoundingClientRect();
        const dx = (e.clientX - d.startX) / r.width;
        const dy = (e.clientY - d.startY) / r.height;
        if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 3) {
          d.moved = true;
        }
        let nx = clamp(d.initX + dx, 0.05, 0.95);
        let ny = clamp(d.initY + dy, 0.05, 0.95);
        const snapX = Math.abs(nx - 0.5) < SNAP;
        const snapY = Math.abs(ny - 0.5) < SNAP;
        if (snapX) nx = 0.5;
        if (snapY) ny = 0.5;
        d.currX = nx;
        d.currY = ny;
        d.snapX = snapX;
        d.snapY = snapY;
        if (video) video.style.cursor = 'grabbing';
        return;
      }

      // Hover check
      const hitLt = hitLowerThird(e);
      const hitSeg = !hitLt && hitCaption(e);
      const isOver = !!(hitLt || hitSeg);
      if (hover.current !== isOver) {
        hover.current = isOver;
      }
      hoveredTarget.current = hitLt
        ? { kind: 'lowerThird', id: hitLt.id }
        : hitSeg
          ? { kind: 'caption', id: hitSeg.id }
          : null;

      if (video) {
        video.style.cursor = isOver ? 'grab' : '';
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      // 1. Check Lower Third / Call-Out hit
      const hitLt = hitLowerThird(e);
      if (hitLt) {
        e.preventDefault();
        e.stopPropagation();

        if (video && !video.paused) {
          video.pause();
        }

        const defPos = getDefaultLowerThirdPosition(hitLt);
        const initX = hitLt.position?.x !== undefined ? hitLt.position.x : defPos.x;
        const initY = hitLt.position?.y !== undefined ? hitLt.position.y : defPos.y;

        drag.current = {
          kind: 'lowerThird',
          id: hitLt.id,
          ltSpec: hitLt,
          startX: e.clientX,
          startY: e.clientY,
          initX,
          initY,
          currX: initX,
          currY: initY,
          snapX: false,
          snapY: false,
          moved: false,
          title: hitLt.name || 'Call-Out / Text',
        };

        // Select the lower third in inspector
        live.current.onSelectLowerThird?.(hitLt.id);
        live.current.onSelectSegment?.(null);

        try {
          host.setPointerCapture(e.pointerId);
        } catch {}
        if (video) video.style.cursor = 'grabbing';
        return;
      }

      // 2. Check Caption hit
      const hitSeg = hitCaption(e);
      if (hitSeg) {
        e.preventDefault();
        e.stopPropagation();

        if (video && !video.paused) {
          video.pause();
        }

        const { style: st } = live.current;
        const isShiftOrAlt = e.shiftKey || e.altKey;
        const initX =
          hitSeg.styleOverride?.positionX !== undefined
            ? hitSeg.styleOverride.positionX
            : st.layout.x;
        const initY =
          hitSeg.styleOverride?.positionY !== undefined
            ? hitSeg.styleOverride.positionY
            : st.layout.y;

        drag.current = {
          kind: 'caption',
          id: hitSeg.id,
          startX: e.clientX,
          startY: e.clientY,
          initX,
          initY,
          currX: initX,
          currY: initY,
          snapX: false,
          snapY: false,
          moved: false,
          isShiftOrAlt,
          title: isShiftOrAlt ? 'All Captions' : 'Caption',
        };

        // Select caption in inspector
        live.current.onSelectSegment?.(hitSeg.id);
        live.current.onSelectLowerThird?.(null);

        try {
          host.setPointerCapture(e.pointerId);
        } catch {}
        if (video) video.style.cursor = 'grabbing';
        return;
      }
    };

    const onUp = (e?: PointerEvent) => {
      const d = drag.current;
      if (e && host) {
        try {
          host.releasePointerCapture(e.pointerId);
        } catch {}
      }
      if (!d) return;

      if (d.moved) {
        suppressClick = true;
        if (d.kind === 'lowerThird') {
          const targetSpec = live.current.lowerThirds?.find((lt) => lt.id === d.id) || d.ltSpec;
          if (targetSpec && live.current.onUpdateLowerThird) {
            live.current.onUpdateLowerThird({
              ...targetSpec,
              position: {
                ...targetSpec.position,
                x: d.currX,
                y: d.currY,
                align: 'center',
              },
            });
          }
        } else if (d.kind === 'caption') {
          const {
            style: st,
            onStyleChange: commit,
            onSegmentOverrideChange: commitSeg,
          } = live.current;
          const applyToAll =
            d.isShiftOrAlt || (e && (e.shiftKey || e.altKey)) || !commitSeg || !d.id;
          if (applyToAll && commit) {
            commit({ ...st, layout: { ...st.layout, x: d.currX, y: d.currY } });
          } else if (commitSeg && d.id) {
            commitSeg(d.id, { positionX: d.currX, positionY: d.currY });
          }
        }
      } else {
        // Selection occurred without movement; suppress accidental play/pause
        suppressClick = true;
      }

      drag.current = null;
      if (video) {
        video.style.cursor = hover.current ? 'grab' : '';
      }
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
      hoveredTarget.current = null;
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
