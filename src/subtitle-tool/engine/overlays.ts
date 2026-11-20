// ─── High-Retention Video Overlays Renderer ──────────────────────────────────
// Dedicated Canvas 2D engine for social media video retention elements:
// - Animated Video Progress Bar (top or bottom with rounded caps & glowing head)
// - Sticky Headline / Topic Banner (pinned top card for context retention)
// - Dynamic Speech Audio Waveform Visualizer (spectrum bars reactive to speech intervals)

export interface ProgressBarOverlay {
  enabled: boolean;
  position: 'top' | 'bottom';
  height: number; // in pixels at 1080p scale
  color: string;
  trackColor?: string;
  glow?: boolean;
}

export interface HeadlineBannerOverlay {
  enabled: boolean;
  text: string;
  positionY: number; // 0..1 fraction of frame height (default 0.08)
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export interface AudioVisualizerOverlay {
  enabled: boolean;
  positionY: number; // 0..1 fraction of frame height (default 0.88)
  color?: string;
  barCount?: number;
}

export interface VideoOverlaysConfig {
  progressBar?: ProgressBarOverlay;
  headlineBanner?: HeadlineBannerOverlay;
  audioVisualizer?: AudioVisualizerOverlay;
}

export const DEFAULT_OVERLAYS_CONFIG: VideoOverlaysConfig = {
  progressBar: {
    enabled: false,
    position: 'bottom',
    height: 8,
    color: '#fbbf24',
    trackColor: 'rgba(0, 0, 0, 0.4)',
    glow: true,
  },
  headlineBanner: {
    enabled: false,
    text: 'HOW TO MASTER VIDEO CAPTIONS',
    positionY: 0.08,
    backgroundColor: 'rgba(18, 18, 17, 0.88)',
    textColor: '#ffffff',
  },
  audioVisualizer: {
    enabled: false,
    positionY: 0.88,
    color: '#fbbf24',
    barCount: 28,
  },
};

/**
 * Renders active video overlays directly onto the 2D canvas frame.
 */
export function renderOverlays(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  time: number,
  duration: number,
  config?: VideoOverlaysConfig,
  speechIntervals?: { start: number; end: number }[],
) {
  if (!config) return;

  const minDim = Math.min(W, H);
  const scale = minDim / 1080;

  // 1. Render Video Progress Bar
  if (config.progressBar?.enabled && duration > 0) {
    const pb = config.progressBar;
    const progress = Math.min(1, Math.max(0, time / duration));
    const barH = Math.max(4, Math.round(pb.height * scale));
    const y = pb.position === 'top' ? 0 : H - barH;

    ctx.save();
    // Background track
    ctx.fillStyle = pb.trackColor || 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, y, W, barH);

    // Active progress fill
    const fillWidth = Math.max(0, W * progress);
    if (fillWidth > 0) {
      ctx.fillStyle = pb.color || '#fbbf24';
      ctx.fillRect(0, y, fillWidth, barH);

      // Optional glowing leading edge / dot
      if (pb.glow) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pb.color || '#fbbf24';
        ctx.shadowBlur = 8 * scale;
        const headW = Math.max(4, Math.round(barH * 1.5));
        ctx.fillRect(Math.max(0, fillWidth - headW / 2), y, headW, barH);
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  // 2. Render Sticky Headline / Topic Banner
  if (config.headlineBanner?.enabled && config.headlineBanner.text.trim()) {
    const hb = config.headlineBanner;
    ctx.save();

    const fontSize = Math.max(16, Math.round(minDim * 0.04));
    ctx.font = `800 ${fontSize}px Inter, -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = hb.text.trim().toUpperCase();
    const metrics = ctx.measureText(text);
    const padX = Math.round(24 * scale);
    const padY = Math.round(10 * scale);
    const pillW = metrics.width + padX * 2;
    const pillH = fontSize + padY * 2;
    const pillX = W / 2 - pillW / 2;
    const pillY = H * (hb.positionY || 0.08) - pillH / 2;
    const radius = Math.round(12 * scale);

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Background container
    ctx.fillStyle = hb.backgroundColor || 'rgba(18, 18, 17, 0.9)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, radius);
    ctx.fill();

    // Subtle outline border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();

    // Text label
    ctx.fillStyle = hb.textColor || '#ffffff';
    ctx.fillText(text, W / 2, pillY + pillH / 2);

    ctx.restore();
  }

  // 3. Render Speech Audio Waveform Visualizer
  if (config.audioVisualizer?.enabled) {
    const av = config.audioVisualizer;
    ctx.save();

    const isSpeechActive =
      speechIntervals && speechIntervals.length > 0
        ? speechIntervals.some((s) => time >= s.start && time <= s.end)
        : true;

    const count = av.barCount || 28;
    const totalVisW = Math.min(W * 0.7, 480 * scale);
    const gap = Math.max(2, Math.round(3 * scale));
    const barW = Math.max(3, (totalVisW - (count - 1) * gap) / count);
    const maxBarH = Math.max(16, Math.round(54 * scale));
    const startX = W / 2 - totalVisW / 2;
    const centerY = H * (av.positionY || 0.88);

    ctx.fillStyle = av.color || '#fbbf24';

    for (let i = 0; i < count; i++) {
      const bx = startX + i * (barW + gap);
      // Simulated frequency animation modulated by speech activity
      const freq = (i + 1) * 0.35;
      const wave = Math.sin(time * 8 + freq) * Math.cos(time * 5 + i * 0.2);
      const amp = isSpeechActive ? 0.3 + Math.abs(wave) * 0.7 : 0.08 + Math.abs(Math.sin(time * 2 + i * 0.1)) * 0.08;
      const bh = Math.max(4 * scale, amp * maxBarH);

      const by = centerY - bh / 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, bh, Math.max(1, barW / 2));
      ctx.fill();
    }

    ctx.restore();
  }
}
