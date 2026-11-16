// ─── Lower Third Element Renderer — Epic Hertz Studio Engine ─────────────────
// Data-driven template renderer for Lower Thirds.
// Evaluates elements at time t across intro, hold, and outro phases.
// Shared across Preview and MP4 Export paths.

import type { LowerThirdSpec } from './spec';
import {
  easeOutExpo,
  easeOutCubic,
  easeInOutCubic,
  getCachedTextWidth,
  clearTextWidthCache,
} from './lowerThirds';
import {
  type LowerThirdTemplate,
  type LowerThirdElement,
  CLASSIC_TEMPLATES,
  TEMPLATE_TO_VARIANT_MAP,
} from './lowerThirdSchema';
import {
  evalMaskSlideUp,
  evalScalePop,
  evalFade,
  evalFadeUp,
  evalBlurIn,
  evalGlitchCut,
  evalHoldDrift,
  evalIdleAccentPulse,
  evalSlideOut,
  evalFadeDown,
  evalCounterTypewriter,
  getLineHeightMultiplier,
  clamp01,
} from './lowerThirdPrimitives';

import { ALL_PACK_TEMPLATES } from './lowerThirdPacks';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Template Registry & Lookup
// ─────────────────────────────────────────────────────────────────────────────

const templateRegistry = new Map<string, LowerThirdTemplate>();

// Register baseline classic templates and all 48 catalog pack templates
for (const tmpl of CLASSIC_TEMPLATES) {
  templateRegistry.set(tmpl.id, tmpl);
}
for (const tmpl of ALL_PACK_TEMPLATES) {
  templateRegistry.set(tmpl.id, tmpl);
}

export function registerLowerThirdTemplate(template: LowerThirdTemplate): void {
  templateRegistry.set(template.id, template);
}

export function registerLowerThirdTemplates(templates: LowerThirdTemplate[]): void {
  for (const tmpl of templates) {
    templateRegistry.set(tmpl.id, tmpl);
  }
}

export function getLowerThirdTemplate(id?: string): LowerThirdTemplate | undefined {
  if (!id) return undefined;
  return templateRegistry.get(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. High-Performance Text Measurement Cache (< 2ms per frame target)
// ─────────────────────────────────────────────────────────────────────────────

export { getCachedTextWidth, clearTextWidthCache };

// ─────────────────────────────────────────────────────────────────────────────
// 3. Lucide Vector Icon Renderers (Canvas native, zero DOM/SVG allocations)
// ─────────────────────────────────────────────────────────────────────────────

export type GenericIconName = 'user' | 'mic' | 'map-pin' | 'at-sign' | 'calendar' | 'tag';

export function drawVectorIcon(
  ctx: CanvasRenderingContext2D,
  icon: GenericIconName,
  cx: number,
  cy: number,
  size: number,
  color: string,
  strokeWidth = 2,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size / 2;

  switch (icon) {
    case 'user': {
      // Head circle
      ctx.beginPath();
      ctx.arc(0, -r * 0.35, r * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      // Shoulders arc
      ctx.beginPath();
      ctx.arc(0, r * 0.85, r * 0.72, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      break;
    }
    case 'mic': {
      // Mic capsule
      const capW = r * 0.44;
      const capH = r * 0.85;
      ctx.beginPath();
      ctx.roundRect(-capW / 2, -capH / 2 - r * 0.1, capW, capH, capW / 2);
      ctx.stroke();
      // Stand cradle arc
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.58, 0, Math.PI);
      ctx.stroke();
      // Vertical stem & base
      ctx.beginPath();
      ctx.moveTo(0, r * 0.48);
      ctx.lineTo(0, r * 0.82);
      ctx.moveTo(-r * 0.35, r * 0.82);
      ctx.lineTo(r * 0.35, r * 0.82);
      ctx.stroke();
      break;
    }
    case 'map-pin': {
      // Pin head
      ctx.beginPath();
      ctx.arc(0, -r * 0.25, r * 0.52, Math.PI * 0.75, Math.PI * 2.25);
      ctx.lineTo(0, r * 0.85);
      ctx.closePath();
      ctx.stroke();
      // Inner circle
      ctx.beginPath();
      ctx.arc(0, -r * 0.25, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'at-sign': {
      // Center circle
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      // Loop
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, Math.PI * 0.1, Math.PI * 1.85);
      ctx.stroke();
      break;
    }
    case 'calendar': {
      const boxW = r * 1.4;
      const boxH = r * 1.3;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2 + r * 0.1, boxW, boxH, 3);
      ctx.stroke();
      // Header line
      ctx.beginPath();
      ctx.moveTo(-boxW / 2, -boxH / 2 + r * 0.45);
      ctx.lineTo(boxW / 2, -boxH / 2 + r * 0.45);
      ctx.stroke();
      // Hanging rings
      ctx.beginPath();
      ctx.moveTo(-boxW * 0.28, -boxH / 2 - r * 0.05);
      ctx.lineTo(-boxW * 0.28, -boxH / 2 + r * 0.2);
      ctx.moveTo(boxW * 0.28, -boxH / 2 - r * 0.05);
      ctx.lineTo(boxW * 0.28, -boxH / 2 + r * 0.2);
      ctx.stroke();
      break;
    }
    case 'tag': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.2);
      ctx.lineTo(0, -r * 0.8);
      ctx.lineTo(r * 0.7, -r * 0.1);
      ctx.lineTo(r * 0.1, r * 0.7);
      ctx.lineTo(-r * 0.6, 0);
      ctx.closePath();
      ctx.stroke();
      // Hole
      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.2, r * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AutoFit Text Calculation
// ─────────────────────────────────────────────────────────────────────────────

export interface AutoFitResult {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  totalWidth: number;
  totalHeight: number;
}

export function computeAutoFitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  nominalFontSize: number,
  fontFamily: string,
  fontWeight: number | string,
  maxWidth: number,
  minScale = 0.55,
  maxLines = 2,
): AutoFitResult {
  const lineMultiplier = getLineHeightMultiplier(text);
  let fontSize = nominalFontSize;
  const minFontSize = nominalFontSize * minScale;

  let fontString = `${fontWeight} ${fontSize.toFixed(1)}px "${fontFamily}", sans-serif`;
  const measured = getCachedTextWidth(ctx, text, fontString);

  // 1. Try single-line scaling down to minScale
  if (measured <= maxWidth) {
    const lineHeight = fontSize * 1.25 * lineMultiplier;
    return {
      lines: [text],
      fontSize,
      lineHeight,
      totalWidth: measured,
      totalHeight: lineHeight,
    };
  }

  // Calculate required scale
  const targetScale = maxWidth / measured;
  if (targetScale >= minScale) {
    fontSize = nominalFontSize * targetScale;
    fontString = `${fontWeight} ${fontSize.toFixed(1)}px "${fontFamily}", sans-serif`;
    const finalWidth = getCachedTextWidth(ctx, text, fontString);
    const lineHeight = fontSize * 1.25 * lineMultiplier;
    return {
      lines: [text],
      fontSize,
      lineHeight,
      totalWidth: finalWidth,
      totalHeight: lineHeight,
    };
  }

  // 2. Wrap into multiple lines (up to maxLines)
  fontSize = Math.max(minFontSize, nominalFontSize * 0.85);
  fontString = `${fontWeight} ${fontSize.toFixed(1)}px "${fontFamily}", sans-serif`;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = getCachedTextWidth(ctx, testLine, fontString);

    if (testWidth <= maxWidth || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // 3. Truncate last line with ellipsis if remaining text overflows
  if (lines.length === maxLines) {
    let last = lines[lines.length - 1];
    while (last.length > 0 && getCachedTextWidth(ctx, `${last}…`, fontString) > maxWidth) {
      last = last.slice(0, -1).trim();
    }
    lines[lines.length - 1] = `${last}…`;
  }

  const lineHeight = fontSize * 1.25 * lineMultiplier;
  let maxLineWidth = 0;
  for (const line of lines) {
    const lw = getCachedTextWidth(ctx, line, fontString);
    if (lw > maxLineWidth) maxLineWidth = lw;
  }

  return {
    lines,
    fontSize,
    lineHeight,
    totalWidth: maxLineWidth,
    totalHeight: lineHeight * lines.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Template Lower Third Renderer
// ─────────────────────────────────────────────────────────────────────────────

export interface RenderTemplateOptions {
  photoImage?: CanvasImageSource | null;
}

/**
 * Renders a LowerThirdSpec via its declared LowerThirdTemplate at time t.
 */
export function renderTemplateLowerThird(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  t: number,
  w: number,
  h: number,
  options?: RenderTemplateOptions,
): void {
  // 1. Resolve template
  let template = getLowerThirdTemplate(spec.templateId);
  if (!template) {
    // If not found directly, map from legacy variant or fallback to Classic 1
    const mappedVariant = spec.variant || 1;
    const variantId = Object.entries(TEMPLATE_TO_VARIANT_MAP).find(
      ([, v]) => v === mappedVariant,
    )?.[0];
    template = getLowerThirdTemplate(variantId) || CLASSIC_TEMPLATES[0];
  }

  // 2. Timing phases
  const start = spec.start;
  const end = spec.end;
  if (t < start || t > end) return;

  const duration = end - start;
  const elapsed = t - start;
  const remaining = end - t;

  const introDuration = Math.min(duration * 0.45, spec.introDuration || 0.7);
  const outroDuration = Math.min(duration * 0.45, spec.outroDuration || 0.6);
  const holdDuration = Math.max(0, duration - introDuration - outroDuration);

  let phase: 'intro' | 'hold' | 'outro';
  let phaseProgress: number;

  if (elapsed < introDuration) {
    phase = 'intro';
    phaseProgress = clamp01(elapsed / introDuration);
  } else if (remaining < outroDuration) {
    phase = 'outro';
    phaseProgress = clamp01((outroDuration - remaining) / outroDuration);
  } else {
    phase = 'hold';
    phaseProgress = holdDuration > 0 ? clamp01((elapsed - introDuration) / holdDuration) : 0;
  }

  // 3. Canvas sizing and scaling
  const baseDim = Math.min(w, h);
  const scale = (spec.scale || 1.0) * (baseDim / 1080);
  const safeZone = template.canvas.safeZone;
  const safeLeft = w * safeZone.left;
  const safeBottom = h * (1 - safeZone.bottom);

  // Position coordinates: use spec.position normalized {x, y} or fallback to safe zone
  let posX = spec.position?.x !== undefined ? spec.position.x * w : safeLeft;
  let posY = spec.position?.y !== undefined ? spec.position.y * h : safeBottom - 180 * scale;

  ctx.save();

  // Hold drift animation (if active)
  if (phase === 'hold') {
    const drift = evalHoldDrift(elapsed, 0.015, 3.0);
    posY += drift.translateY * scale;
  }

  // Glitch cut (intro frame offset)
  if (phase === 'intro') {
    const glitch = evalGlitchCut(elapsed, 30);
    if (glitch.active) {
      posX += glitch.offsetX * scale;
      posY += glitch.offsetY * scale;
    }
  }

  // 4. Resolve slots & typography
  const nameFontFamily = spec.font.family || 'Inter';
  const nameFontWeight = spec.font.weight || 700;
  const nameFontSize = (spec.font.size || 0.038) * baseDim * (spec.scale || 1.0);
  const roleFontSize = nameFontSize * 0.62;

  const primaryColor = spec.colors.primary || '#3b82f6';
  const secondaryColor = spec.colors.secondary || '#18181b';
  const textPrimaryColor = spec.colors.textPrimary || '#ffffff';
  const textSecondaryColor = spec.colors.textSecondary || '#cbd5e1';

  // Measure text with AutoFit
  const maxSafeWidth = w * (1 - safeZone.left - safeZone.right) * 0.85;
  const nameFit = computeAutoFitText(
    ctx,
    spec.name,
    nameFontSize,
    nameFontFamily,
    nameFontWeight,
    maxSafeWidth,
    template.autoFit.minScale,
    template.autoFit.maxLines,
  );

  const roleFit = spec.role
    ? computeAutoFitText(
        ctx,
        spec.role,
        roleFontSize,
        nameFontFamily,
        500,
        maxSafeWidth,
        template.autoFit.minScale,
        template.autoFit.maxLines,
      )
    : null;

  // Geometry computations
  const padX = 24 * scale;
  const padY = 12 * scale;
  const nameBoxW = nameFit.totalWidth + padX * 2;
  const nameBoxH = nameFit.totalHeight + padY * 2;
  const roleBoxW = roleFit ? roleFit.totalWidth + padX * 2 : 0;
  const roleBoxH = roleFit ? roleFit.totalHeight + padY * 1.6 : 0;

  if (spec.position?.align === 'center') {
    posX -= nameBoxW / 2;
  } else if (spec.position?.align === 'right') {
    posX -= nameBoxW;
  }

  // 4b. Dedicated High-Fidelity MOGRT Template Renderers
  const isSpinTwist =
    template.id === 'title-spin-twist' ||
    spec.templateId === 'title-spin-twist' ||
    spec.templateId === 'mixkit-222' ||
    spec.templateId === 'mogrt-mixkit-222' ||
    spec.templateId === 'mogrt-spin-twist';

  if (isSpinTwist) {
    const cx = spec.position?.x !== undefined ? spec.position.x * w : w / 2;
    const cy = spec.position?.y !== undefined ? spec.position.y * h : h / 2;
    drawSpinTwistTitle(
      ctx,
      spec,
      phase,
      phaseProgress,
      cx,
      cy,
      nameFit,
      roleFit,
      textPrimaryColor,
      textSecondaryColor,
      primaryColor,
      scale,
    );
    ctx.restore();
    return;
  }

  const isMirrorSplash =
    template.id === 'title-mirror-splash' ||
    spec.templateId === 'title-mirror-splash' ||
    spec.templateId === 'mixkit-28' ||
    spec.templateId === 'mogrt-mixkit-28' ||
    spec.templateId === 'mogrt-mirror-splash';

  if (isMirrorSplash) {
    const cx = spec.position?.x !== undefined ? spec.position.x * w : w / 2;
    const cy = spec.position?.y !== undefined ? spec.position.y * h : h / 2;
    drawMirrorSplashTitle(ctx, spec, phase, phaseProgress, cx, cy, scale);
    ctx.restore();
    return;
  }

  const isYouTubeSubscribe =
    spec.templateId?.startsWith('mogrt-youtube') ||
    spec.templateId === 'youtube-subscribe' ||
    template.id === 'youtube-subscribe';

  if (isYouTubeSubscribe) {
    const cx = spec.position?.x !== undefined ? spec.position.x * w : w / 2;
    const cy = spec.position?.y !== undefined ? spec.position.y * h : h * 0.82;
    drawYouTubeSubscribe(ctx, spec, options?.photoImage, phase, phaseProgress, cx, cy, scale);
    ctx.restore();
    return;
  }

  const isSocialHandle =
    spec.templateId?.startsWith('mogrt-social') ||
    spec.templateId === 'social-handle' ||
    template.id === 'social-handle';

  if (isSocialHandle) {
    const cx = spec.position?.x !== undefined ? spec.position.x * w : w / 2;
    const cy = spec.position?.y !== undefined ? spec.position.y * h : h * 0.84;
    drawSocialMediaHandle(ctx, spec, phase, phaseProgress, cx, cy, scale);
    ctx.restore();
    return;
  }

  const isBoldCallout =
    spec.templateId?.startsWith('mogrt-callout') ||
    spec.templateId === 'mogrt-bold-callout' ||
    spec.templateId === 'bold-callout' ||
    template.id === 'bold-callout';

  if (isBoldCallout) {
    const cx = spec.position?.x !== undefined ? spec.position.x * w : w * 0.55;
    const cy = spec.position?.y !== undefined ? spec.position.y * h : h * 0.45;
    drawBoldCallout(ctx, spec, phase, phaseProgress, cx, cy, scale);
    ctx.restore();
    return;
  }

  const isRgbGlitch =
    spec.templateId?.startsWith('mogrt-rgb') ||
    spec.templateId?.startsWith('mogrt-trendy') ||
    spec.templateId === 'rgb-glitch' ||
    template.id === 'rgb-glitch';

  if (isRgbGlitch) {
    const cx = spec.position?.x !== undefined ? spec.position.x * w : w / 2;
    const cy = spec.position?.y !== undefined ? spec.position.y * h : h / 2;
    drawRgbGlitchTitle(ctx, spec, phase, phaseProgress, cx, cy, scale);
    ctx.restore();
    return;
  }

  // 5. Render elements in declaration order
  for (const element of template.elements) {
    renderElement(
      ctx,
      element,
      phase,
      phaseProgress,
      posX,
      posY,
      nameBoxW,
      nameBoxH,
      roleBoxW,
      roleBoxH,
      padX,
      padY,
      spec,
      nameFit,
      roleFit,
      primaryColor,
      secondaryColor,
      textPrimaryColor,
      textSecondaryColor,
      scale,
      options?.photoImage,
    );
  }

  ctx.restore();
}

function renderElement(
  ctx: CanvasRenderingContext2D,
  elem: LowerThirdElement,
  phase: 'intro' | 'hold' | 'outro',
  phaseProgress: number,
  baseX: number,
  baseY: number,
  nameBoxW: number,
  nameBoxH: number,
  roleBoxW: number,
  roleBoxH: number,
  padX: number,
  padY: number,
  spec: LowerThirdSpec,
  nameFit: AutoFitResult,
  roleFit: AutoFitResult | null,
  primaryColor: string,
  secondaryColor: string,
  textPrimaryColor: string,
  textSecondaryColor: string,
  scale: number,
  photoImage?: CanvasImageSource | null,
): void {
  ctx.save();

  // Evaluate element animation progress
  let elemProgress = 1.0;
  let elemAlpha = 1.0;
  let elemScale = 1.0;
  let elemTranslateX = 0;
  let elemTranslateY = 0;

  if (phase === 'intro') {
    const delay = elem.animation.in.delay || 0;
    const duration = elem.animation.in.duration || 0.7;
    const animP = clamp01((phaseProgress - delay * 0.4) / Math.max(0.1, duration));
    elemProgress = animP;

    switch (elem.animation.in.type) {
      case 'wipe': {
        // Will apply clip rect in element render
        elemAlpha = clamp01(animP * 1.5);
        break;
      }
      case 'lineDraw': {
        elemAlpha = clamp01(animP * 1.5);
        break;
      }
      case 'maskSlideUp': {
        const slide = evalMaskSlideUp(animP, 24 * scale);
        elemTranslateY = slide.translateY;
        elemAlpha = slide.opacity;
        break;
      }
      case 'scalePop': {
        const pop = evalScalePop(animP, elem.animation.in.overshoot || 0.06);
        elemScale = pop.scale;
        elemAlpha = pop.opacity;
        break;
      }
      case 'fade': {
        elemAlpha = evalFade(animP);
        break;
      }
      case 'fadeUp': {
        const fu = evalFadeUp(animP, 20 * scale);
        elemAlpha = fu.opacity;
        elemTranslateY = fu.translateY;
        break;
      }
      case 'blurIn': {
        const bi = evalBlurIn(animP);
        elemAlpha = bi.opacity;
        elemScale = bi.scale;
        break;
      }
      default:
        elemAlpha = clamp01(animP * 1.5);
        break;
    }
  } else if (phase === 'outro') {
    const delay = elem.animation.out.delay || 0;
    const duration = elem.animation.out.duration || 0.6;
    const animP = clamp01((phaseProgress - delay * 0.3) / Math.max(0.1, duration));

    switch (elem.animation.out.type) {
      case 'reverse':
      case 'fade': {
        elemAlpha = clamp01(1 - animP);
        break;
      }
      case 'slideOut': {
        const so = evalSlideOut(animP, 80 * scale, 'left');
        elemTranslateX = so.translateX;
        elemAlpha = so.opacity;
        break;
      }
      case 'fadeDown': {
        const fd = evalFadeDown(animP, 20 * scale);
        elemAlpha = fd.opacity;
        elemTranslateY = fd.translateY;
        break;
      }
      case 'collapseToLine': {
        elemAlpha = clamp01(1 - animP * 1.5);
        break;
      }
      default:
        elemAlpha = clamp01(1 - animP);
        break;
    }
  }

  // Idle accent pulse during hold
  if (phase === 'hold' && elem.animation.hold?.type === 'accentPulse') {
    elemAlpha *= evalIdleAccentPulse(phaseProgress * 3.0, 2.5);
  }

  if (elemAlpha <= 0.001) {
    ctx.restore();
    return;
  }

  ctx.globalAlpha *= elemAlpha;

  // Resolve position
  const elX = baseX;
  let elY = baseY;
  let elW = nameBoxW;
  let elH = nameBoxH;

  if (elem.role === 'role') {
    elY = baseY + nameBoxH + 4 * scale;
    elW = roleBoxW;
    elH = roleBoxH;
  } else if (elem.role === 'extra') {
    elY = baseY + nameBoxH + roleBoxH + 8 * scale;
  }

  // Apply transforms
  ctx.translate(elX + elemTranslateX, elY + elemTranslateY);

  if (elemScale !== 1.0) {
    ctx.translate(elW / 2, elH / 2);
    ctx.scale(elemScale, elemScale);
    ctx.translate(-elW / 2, -elH / 2);
  }

  // Render by element type
  if (elem.type === 'shape') {
    const fill =
      elem.role === 'role'
        ? elem.style.fill === '#18181b'
          ? secondaryColor
          : elem.style.fill
        : elem.style.fill === '#3b82f6'
          ? primaryColor
          : elem.style.fill;
    ctx.fillStyle = fill || '#ffffff';

    const rad = elem.style.radius ?? 4;
    ctx.beginPath();
    if (typeof rad === 'number') {
      ctx.roundRect(0, 0, elW, elH, Math.max(0, rad * scale));
    } else {
      ctx.roundRect(
        0,
        0,
        elW,
        elH,
        rad.map((r) => Math.max(0, r * scale)),
      );
    }
    ctx.fill();

    if (elem.style.stroke && (elem.style.strokeWidth || 0) > 0) {
      ctx.strokeStyle = elem.style.stroke;
      ctx.lineWidth = (elem.style.strokeWidth || 1) * scale;
      ctx.stroke();
    }
  } else if (elem.type === 'line') {
    ctx.strokeStyle = elem.style.stroke || elem.style.fill || primaryColor;
    ctx.lineWidth = (elem.style.strokeWidth || 3) * scale;
    ctx.beginPath();
    ctx.moveTo(0, elH / 2);
    const lineLen =
      elem.animation.in.type === 'lineDraw'
        ? elW * elemProgress
        : elem.animation.in.type === 'shineSweep'
          ? Math.max(4, elW * 0.15)
          : elW;
    ctx.lineTo(lineLen, elH / 2);
    ctx.stroke();
  } else if (elem.type === 'text') {
    if (elem.role === 'name') {
      ctx.fillStyle = textPrimaryColor;
      ctx.font = `${spec.font.weight || 700} ${nameFit.fontSize.toFixed(1)}px "${spec.font.family || 'Inter'}", sans-serif`;
      ctx.textBaseline = 'middle';

      let lineY = padY + nameFit.lineHeight / 2;
      for (const line of nameFit.lines) {
        if (elem.animation.in.type === 'counterTypewriter') {
          const tw = evalCounterTypewriter(line, elemProgress);
          const cursor = tw.showCursor ? ' █' : '';
          ctx.fillText(`${tw.visibleText}${cursor}`, padX, lineY);
        } else {
          ctx.fillText(line, padX, lineY);
        }
        lineY += nameFit.lineHeight;
      }
    } else if (elem.role === 'role' && roleFit && spec.role) {
      ctx.fillStyle = textSecondaryColor;
      ctx.font = `500 ${roleFit.fontSize.toFixed(1)}px "${spec.font.family || 'Inter'}", sans-serif`;
      ctx.textBaseline = 'middle';

      let lineY = padY * 0.8 + roleFit.lineHeight / 2;
      for (const line of roleFit.lines) {
        ctx.fillText(line, padX, lineY);
        lineY += roleFit.lineHeight;
      }
    }
  } else if (elem.type === 'icon' && elem.content) {
    const iconColor = elem.style.fill || primaryColor;
    const iconSize =
      (elem.geometry.width && typeof elem.geometry.width === 'number' ? elem.geometry.width : 24) *
      scale;
    drawVectorIcon(
      ctx,
      elem.content as GenericIconName,
      iconSize / 2,
      iconSize / 2,
      iconSize,
      iconColor,
      2 * scale,
    );
  } else if (elem.type === 'image' || elem.role === 'photo') {
    const photoSize = 64 * scale;
    drawPhotoElement(ctx, 0, 0, photoSize, photoImage, spec.name);
  }

  ctx.restore();
}

function drawPhotoElement(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  photoImage?: CanvasImageSource | null,
  name = 'EH',
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.clip();

  if (photoImage) {
    try {
      ctx.drawImage(photoImage, x, y, size, size);
    } catch {
      drawPhotoFallback(ctx, x, y, size, name);
    }
  } else {
    drawPhotoFallback(ctx, x, y, size, name);
  }

  ctx.restore();
}

function drawPhotoFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  name: string,
): void {
  ctx.fillStyle = '#27272a';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#f4f4f5';
  ctx.font = `700 ${(size * 0.4).toFixed(1)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const initials = (name.trim().slice(0, 2) || 'EH').toUpperCase();
  ctx.fillText(initials, x + size / 2, y + size / 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Dedicated MOGRT Replication Renderers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exact replication of Mixkit 222: Spin and Twist Title Block MOGRT.
 * - Center line appears and spins 180° into a central framing square
 * - Square splits and brackets expand horizontally: [ TITLE ]
 * - Subtitle slides into the bottom bracket gap
 * - Outro reverses brackets, twists back into vertical line, and fades
 */
function drawSpinTwistTitle(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  phase: 'intro' | 'hold' | 'outro',
  phaseProgress: number,
  baseX: number,
  baseY: number,
  nameFit: AutoFitResult,
  _roleFit: AutoFitResult | null,
  textPrimaryColor: string,
  textSecondaryColor: string,
  bracketColor: string,
  scale: number,
): void {
  const cx = baseX;
  const cy = baseY;

  const titleText = (spec.name || 'MOTION').toUpperCase();
  const subtitleText = spec.role ? spec.role.toUpperCase() : 'DESIGN';

  ctx.save();

  let spinProgress = 1;
  let expandProgress = 1;
  let textProgress = 1;
  let subtitleProgress = 1;
  let globalAlpha = 1;

  if (phase === 'intro') {
    spinProgress = clamp01(phaseProgress / 0.35);
    expandProgress = clamp01((phaseProgress - 0.28) / 0.45);
    textProgress = clamp01((phaseProgress - 0.35) / 0.4);
    subtitleProgress = clamp01((phaseProgress - 0.55) / 0.45);
    globalAlpha = clamp01(phaseProgress / 0.15);
  } else if (phase === 'outro') {
    subtitleProgress = 1 - clamp01(phaseProgress / 0.3);
    textProgress = 1 - clamp01((phaseProgress - 0.15) / 0.4);
    expandProgress = 1 - clamp01((phaseProgress - 0.2) / 0.45);
    spinProgress = 1 - clamp01((phaseProgress - 0.55) / 0.45);
    globalAlpha = 1 - clamp01((phaseProgress - 0.75) / 0.25);
  }

  if (globalAlpha <= 0.001) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha *= globalAlpha;

  const titleFontSize = Math.max(28 * scale, nameFit.fontSize || 54 * scale);
  const subtitleFontSize = Math.max(12 * scale, titleFontSize * 0.32);
  const fontFamily = spec.font.family && spec.font.family !== 'Inter' ? spec.font.family : 'Asap';

  const titleFont = `800 ${titleFontSize.toFixed(1)}px "${fontFamily}", "Asap", system-ui, sans-serif`;
  const titleWidth = getCachedTextWidth(ctx, titleText, titleFont);

  const subtitleFont = `600 ${subtitleFontSize.toFixed(1)}px "${fontFamily}", "Asap", system-ui, sans-serif`;
  const spacedSubtitle = subtitleText.split('').join(' ');
  const subtitleWidth = getCachedTextWidth(ctx, spacedSubtitle, subtitleFont);

  const targetBoxWidth = Math.max(
    titleWidth + 90 * scale,
    subtitleWidth + 110 * scale,
    260 * scale,
  );
  const boxHeight = titleFontSize * 1.55;
  const bracketArm = targetBoxWidth * 0.34;
  const lineWidth = Math.max(2.5, 3.8 * scale);

  const easedExpand = easeOutExpo(expandProgress);
  const currentBoxWidth = 50 * scale + (targetBoxWidth - 50 * scale) * easedExpand;
  const halfW = currentBoxWidth / 2;
  const halfH = boxHeight / 2;

  // 1. Initial spin phase: line rotating and forming square
  if (expandProgress < 0.999 && spinProgress < 0.999) {
    const easedSpin = easeInOutCubic(spinProgress);
    const rotationRad = easedSpin * Math.PI;
    const lineH = Math.min(boxHeight, boxHeight * Math.sin(easedSpin * Math.PI * 0.5));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.strokeStyle = bracketColor || '#FFFFFF';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, -lineH / 2);
    ctx.lineTo(0, lineH / 2);
    ctx.stroke();

    if (spinProgress > 0.4) {
      const sqP = clamp01((spinProgress - 0.4) / 0.6);
      const sqSize = 38 * scale * sqP;
      ctx.strokeRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);
    }
    ctx.restore();
  }

  // 2. Expanding framing brackets [ and ]
  if (expandProgress > 0.05) {
    ctx.strokeStyle = bracketColor || '#FFFFFF';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    const topArm = Math.min(bracketArm, halfW * 0.7);
    const bottomArmGap = subtitleText ? subtitleWidth / 2 + 12 * scale : topArm;

    // Left Bracket [
    ctx.beginPath();
    ctx.moveTo(cx - halfW + topArm, cy - halfH);
    ctx.lineTo(cx - halfW, cy - halfH);
    ctx.lineTo(cx - halfW, cy + halfH);
    ctx.lineTo(Math.max(cx - halfW, cx - bottomArmGap), cy + halfH);
    ctx.stroke();

    // Right Bracket ]
    ctx.beginPath();
    ctx.moveTo(cx + halfW - topArm, cy - halfH);
    ctx.lineTo(cx + halfW, cy - halfH);
    ctx.lineTo(cx + halfW, cy + halfH);
    ctx.lineTo(Math.min(cx + halfW, cx + bottomArmGap), cy + halfH);
    ctx.stroke();
  }

  // 3. Main Title Text
  if (textProgress > 0.05) {
    const textAlpha = clamp01(textProgress / 0.7);
    const textScale = 0.85 + 0.15 * easeOutCubic(textProgress);

    ctx.save();
    ctx.globalAlpha *= textAlpha;
    ctx.translate(cx, cy);
    ctx.scale(textScale, textScale);

    ctx.fillStyle = textPrimaryColor || '#FFFFFF';
    ctx.font = `800 ${titleFontSize.toFixed(1)}px "${fontFamily}", "Asap", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, 0, -2 * scale);
    ctx.restore();
  }

  // 4. Subtitle Text (sliding up into bottom opening)
  if (subtitleProgress > 0.05 && subtitleText) {
    const subAlpha = clamp01(subtitleProgress / 0.7);
    const subSlideY = (1 - easeOutCubic(subtitleProgress)) * 14 * scale;

    ctx.save();
    ctx.globalAlpha *= subAlpha;
    ctx.translate(cx, cy + halfH + subSlideY);

    ctx.fillStyle = textSecondaryColor || '#FFFFFF';
    ctx.font = `600 ${subtitleFontSize.toFixed(1)}px "${fontFamily}", "Asap", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(spacedSubtitle, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Exact replication of Mixkit 28: Mirror Splash Title MOGRT.
 * - Cyan liquid streams shoot from left & right, collide in center
 * - Explodes into radial splash droplets (#A7F7FF, #FFFA6F, #FFFFFF)
 * - Dual-color cartoon bubble typography pops in with elastic bounce
 * - Outro squeezes liquid blobs inward and bursts text away
 */
function drawMirrorSplashTitle(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  phase: 'intro' | 'hold' | 'outro',
  phaseProgress: number,
  baseX: number,
  baseY: number,
  scale: number,
): void {
  const cx = baseX;
  const cy = baseY;

  let line1 = 'TYPE YOUR';
  let line2 = 'TEXT HERE';

  if (spec.name) {
    if (spec.role) {
      line1 = spec.name.toUpperCase();
      line2 = spec.role.toUpperCase();
    } else {
      const words = spec.name.trim().split(/\s+/);
      if (words.length === 1) {
        line1 = words[0].toUpperCase();
        line2 = '';
      } else {
        const mid = Math.ceil(words.length / 2);
        line1 = words.slice(0, mid).join(' ').toUpperCase();
        line2 = words.slice(mid).join(' ').toUpperCase();
      }
    }
  } else if (spec.role) {
    line2 = spec.role.toUpperCase();
  }

  ctx.save();

  let streamProgress = 1;
  let splashProgress = 1;
  let textScale = 1;
  let globalAlpha = 1;

  if (phase === 'intro') {
    streamProgress = clamp01(phaseProgress / 0.35);
    splashProgress = clamp01((phaseProgress - 0.25) / 0.6);
    const textP = clamp01((phaseProgress - 0.28) / 0.6);
    textScale = textP < 0.6 ? (textP / 0.6) * 1.18 : 1.18 - ((textP - 0.6) / 0.4) * 0.18;
    globalAlpha = clamp01(phaseProgress / 0.1);
  } else if (phase === 'outro') {
    const outroP = phaseProgress;
    streamProgress = 1 - clamp01(outroP / 0.4);
    splashProgress = clamp01((outroP - 0.2) / 0.7);
    textScale = Math.max(0, 1 - outroP * 1.2);
    globalAlpha = 1 - clamp01((outroP - 0.7) / 0.3);
  }

  if (globalAlpha <= 0.001) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha *= globalAlpha;

  // 1. Converging liquid streams
  if (phase === 'intro' && streamProgress < 0.95) {
    const streamP = easeOutCubic(streamProgress);
    const streamDist = (1 - streamP) * 350 * scale;

    ctx.save();
    ctx.fillStyle = '#A7F7FF';
    ctx.beginPath();
    ctx.arc(cx - streamDist, cy - 10 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.arc(cx - streamDist - 25 * scale, cy - 15 * scale, 9 * scale, 0, Math.PI * 2);
    ctx.arc(cx - streamDist - 45 * scale, cy - 8 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + streamDist, cy + 10 * scale, 14 * scale, 0, Math.PI * 2);
    ctx.arc(cx + streamDist + 25 * scale, cy + 15 * scale, 9 * scale, 0, Math.PI * 2);
    ctx.arc(cx + streamDist + 45 * scale, cy + 8 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Radial splash droplets explosion
  if (splashProgress > 0.05 && splashProgress < 0.98) {
    const sP = easeOutCubic(splashProgress);
    const dropAlpha = (1 - sP) * 0.95;

    ctx.save();
    ctx.globalAlpha *= dropAlpha;

    const droplets = [
      { angle: 0.1, dist: 140, r: 6, col: '#A7F7FF' },
      { angle: 0.45, dist: 180, r: 8, col: '#FFFA6F' },
      { angle: 0.85, dist: 130, r: 5, col: '#FFFFFF' },
      { angle: 1.25, dist: 160, r: 7, col: '#A7F7FF' },
      { angle: 1.7, dist: 190, r: 9, col: '#FFFA6F' },
      { angle: 2.1, dist: 140, r: 5, col: '#FFFFFF' },
      { angle: 2.5, dist: 175, r: 8, col: '#A7F7FF' },
      { angle: 2.95, dist: 150, r: 6, col: '#FFFA6F' },
      { angle: 3.4, dist: 185, r: 7, col: '#FFFFFF' },
      { angle: 3.85, dist: 135, r: 6, col: '#A7F7FF' },
      { angle: 4.3, dist: 195, r: 8, col: '#FFFA6F' },
      { angle: 4.75, dist: 145, r: 5, col: '#FFFFFF' },
      { angle: 5.15, dist: 170, r: 7, col: '#A7F7FF' },
      { angle: 5.6, dist: 160, r: 6, col: '#FFFA6F' },
      { angle: 5.95, dist: 180, r: 8, col: '#FFFFFF' },
      { angle: 6.25, dist: 130, r: 5, col: '#A7F7FF' },
    ];

    for (const d of droplets) {
      const curDist = d.dist * scale * sP;
      const dx = cx + Math.cos(d.angle) * curDist;
      const dy = cy + Math.sin(d.angle) * curDist * 0.65;
      const curR = Math.max(1, d.r * scale * (1 - sP * 0.5));

      ctx.fillStyle = d.col;
      ctx.beginPath();
      ctx.arc(dx, dy, curR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Bubbly Comic Lettering
  if (textScale > 0.05) {
    const fontSize = Math.max(26 * scale, 58 * scale);
    const strokeWidth = Math.max(4, 9 * scale);
    const shadowOffset = 5 * scale;
    const fontFamily =
      spec.font.family && spec.font.family !== 'Inter' ? spec.font.family : 'Sniglet';

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(textScale, textScale);

    ctx.font = `900 ${fontSize.toFixed(1)}px "${fontFamily}", "Sniglet", "Modak", "Bangers", "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const lineGap = fontSize * 0.95;
    const y1 = line2 ? -lineGap * 0.55 : 0;
    const y2 = lineGap * 0.55;

    const drawComicLine = (text: string, yPos: number, fillColor: string) => {
      if (!text) return;
      ctx.fillStyle = '#000000';
      ctx.fillText(text, shadowOffset, yPos + shadowOffset);

      ctx.strokeStyle = '#050505';
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, 0, yPos);

      ctx.fillStyle = fillColor;
      ctx.fillText(text, 0, yPos);
    };

    drawComicLine(line1, y1, '#A7F7FF');
    if (line2) {
      drawComicLine(line2, y2, '#FFFA6F');
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * YouTube Pack Elements Renderer (8 Authentic Button & Element Models).
 * Extracted & recreated from YouTube Pack (82 button variations).
 * - mogrt-youtube-subscribe: Creator Pill (Avatar + Name + Subs + Click + Bell)
 * - mogrt-youtube-minimal: Rounded red button with spring pop
 * - mogrt-youtube-like-bell: 3-in-1 Engagement Bar (Like 👍 + Subscribe + Bell 🔔)
 * - mogrt-youtube-channel-card: Channel Profile Card with banner & verified badge
 * - mogrt-youtube-gold: Luxury Metallic Gold Subscribe with chime
 * - mogrt-youtube-neon: Cyberpunk Glowing Red Neon Subscribe
 * - mogrt-youtube-end-screen: Circular Avatar End Screen CTA with radar pulse
 * - mogrt-youtube-bell-ring: Swinging Golden Bell with ripple audio waves
 */
function drawYouTubeSubscribe(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  photoImage: CanvasImageSource | null | undefined,
  phase: 'intro' | 'hold' | 'outro',
  phaseProgress: number,
  baseX: number,
  baseY: number,
  scale: number,
): void {
  const cx = baseX;
  const cy = baseY;
  const styleId = spec.templateId || 'mogrt-youtube-subscribe';

  ctx.save();

  let globalAlpha = 1;
  let slideY = 0;

  if (phase === 'intro') {
    globalAlpha = clamp01(phaseProgress / 0.2);
    slideY = (1 - easeOutCubic(phaseProgress)) * 50 * scale;
  } else if (phase === 'outro') {
    globalAlpha = 1 - clamp01(phaseProgress / 0.3);
    slideY = easeOutCubic(phaseProgress) * 50 * scale;
  }

  if (globalAlpha <= 0.001) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha *= globalAlpha;

  const channelName = spec.name || 'Epic Hertz';
  const subCount = spec.role || '1.2M subscribers';
  const isSubscribed = phase === 'hold' ? phaseProgress > 0.28 : phase === 'outro';
  const isClicking = phase === 'hold' && phaseProgress >= 0.24 && phaseProgress <= 0.32;
  const clickScale = isClicking ? 0.93 : 1.0;

  // ───────────────────────────────────────────────────────────────────────────
  // Model 1: Minimal Red Button (mogrt-youtube-minimal)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-youtube-minimal') {
    const btnW = (isSubscribed ? 168 : 156) * scale;
    const btnH = 46 * scale;
    const btnX = cx - btnW / 2;
    const btnY = cy - btnH / 2 + slideY;

    ctx.save();
    ctx.translate(cx, cy + slideY);
    ctx.scale(clickScale, clickScale);
    ctx.translate(-cx, -(cy + slideY));

    // Pre-rendered offset drop shadow layer (0 software blur penalty)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY + 4 * scale, btnW, btnH, btnH / 2);
    ctx.fill();

    ctx.fillStyle = isSubscribed ? '#272727' : '#FF0000';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, btnH / 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();

    ctx.fillStyle = isSubscribed ? '#F1F1F1' : '#FFFFFF';
    ctx.font = `800 ${(13 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSubscribed ? '✓ SUBSCRIBED' : '▶  SUBSCRIBE', cx, cy + slideY);

    ctx.restore();
    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Model 2: 3-in-1 Engagement Bar (Like 👍 + Subscribe + Bell 🔔)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-youtube-like-bell') {
    const barW = 340 * scale;
    const barH = 56 * scale;
    const barX = cx - barW / 2;
    const barY = cy - barH / 2 + slideY;

    const isLiked = phase === 'hold' ? phaseProgress > 0.2 : phase === 'outro';
    const isBellRinging =
      isSubscribed && phase === 'hold' && phaseProgress >= 0.45 && phaseProgress <= 0.8;
    const bellAngle = isBellRinging ? Math.sin((phaseProgress - 0.45) * 45) * 0.35 : 0;

    // Outer capsule background with offset drop shadow (0 software blur penalty)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(barX, barY + 5 * scale, barW, barH, barH / 2);
    ctx.fill();

    ctx.fillStyle = '#0f0f0f';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, barH / 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();

    // Section 1: Like Button (Left)
    const likeX = barX + 50 * scale;
    ctx.fillStyle = isLiked ? '#3EA6FF' : '#FFFFFF';
    ctx.font = `800 ${(15 * scale).toFixed(1)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👍', likeX - 16 * scale, barY + barH / 2);

    ctx.font = `700 ${(12 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(isLiked ? 'LIKED' : 'LIKE', likeX + 14 * scale, barY + barH / 2);

    // Divider line 1
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(barX + 105 * scale, barY + 12 * scale);
    ctx.lineTo(barX + 105 * scale, barY + barH - 12 * scale);
    ctx.stroke();

    // Section 2: Subscribe Button (Center)
    const subBtnW = (isSubscribed ? 116 : 108) * scale;
    const subBtnH = 36 * scale;
    const subBtnX = barX + 115 * scale;
    const subBtnY = barY + (barH - subBtnH) / 2;

    ctx.save();
    ctx.translate(subBtnX + subBtnW / 2, subBtnY + subBtnH / 2);
    ctx.scale(clickScale, clickScale);
    ctx.translate(-(subBtnX + subBtnW / 2), -(subBtnY + subBtnH / 2));

    ctx.fillStyle = isSubscribed ? '#272727' : '#FF0000';
    ctx.beginPath();
    ctx.roundRect(subBtnX, subBtnY, subBtnW, subBtnH, subBtnH / 2);
    ctx.fill();

    ctx.fillStyle = isSubscribed ? '#F1F1F1' : '#FFFFFF';
    ctx.font = `800 ${(11.5 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isSubscribed ? '✓ SUBSCRIBED' : 'SUBSCRIBE',
      subBtnX + subBtnW / 2,
      subBtnY + subBtnH / 2,
    );
    ctx.restore();

    // Divider line 2
    ctx.beginPath();
    ctx.moveTo(barX + 235 * scale, barY + 12 * scale);
    ctx.lineTo(barX + 235 * scale, barY + barH - 12 * scale);
    ctx.stroke();

    // Section 3: Bell (Right)
    const bellCx = barX + 285 * scale;
    const bellCy = barY + barH / 2;

    ctx.save();
    ctx.translate(bellCx, bellCy);
    ctx.rotate(bellAngle);

    ctx.fillStyle = isBellRinging ? '#FFD700' : '#CCCCCC';
    ctx.beginPath();
    ctx.arc(0, -4 * scale, 7 * scale, Math.PI, 0);
    ctx.lineTo(8 * scale, 5 * scale);
    ctx.lineTo(-8 * scale, 5 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 6.5 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    if (isBellRinging) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 14 * scale, -0.6, 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 14 * scale, Math.PI - 0.6, Math.PI + 0.6);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Model 3: Channel Profile Card (mogrt-youtube-channel-card)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-youtube-channel-card') {
    const cardW = 360 * scale;
    const cardH = 112 * scale;
    const cardX = cx - cardW / 2;
    const cardY = cy - cardH / 2 + slideY;
    const radius = 16 * scale;

    // Offset drop shadow (0 software blur penalty)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY + 6 * scale, cardW, cardH, radius);
    ctx.fill();

    ctx.fillStyle = '#121212';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // Top banner stripe
    const bannerH = 34 * scale;
    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    grad.addColorStop(0, '#E11D48');
    grad.addColorStop(1, '#FF0000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, bannerH, [radius, radius, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();

    // Avatar overlapping banner
    const avatarR = 26 * scale;
    const avatarX = cardX + 20 * scale + avatarR;
    const avatarY = cardY + bannerH + 4 * scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    if (photoImage) {
      ctx.drawImage(photoImage, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    } else {
      ctx.fillStyle = '#CC0000';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${(20 * scale).toFixed(1)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(channelName.charAt(0).toUpperCase() || 'Y', avatarX, avatarY);
    }
    ctx.restore();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.stroke();

    // Channel name & verified checkmark
    const textLeft = avatarX + avatarR + 14 * scale;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${(15 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(channelName, textLeft, cardY + bannerH + 16 * scale);

    // Verified badge
    const channelFont = `700 ${(15 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    const nameW = getCachedTextWidth(ctx, channelName, channelFont);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = `700 ${(11 * scale).toFixed(1)}px system-ui, sans-serif`;
    ctx.fillText(' ✓', textLeft + nameW, cardY + bannerH + 16 * scale);

    // Subscribers
    ctx.fillStyle = '#A1A1AA';
    ctx.font = `500 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(subCount, textLeft, cardY + bannerH + 34 * scale);

    // Subscribe button inside card bottom-right
    const btnW = (isSubscribed ? 104 : 96) * scale;
    const btnH = 30 * scale;
    const btnX = cardX + cardW - btnW - 16 * scale;
    const btnY = cardY + cardH - btnH - 14 * scale;

    ctx.save();
    ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
    ctx.scale(clickScale, clickScale);
    ctx.translate(-(btnX + btnW / 2), -(btnY + btnH / 2));

    ctx.fillStyle = isSubscribed ? '#272727' : '#FF0000';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, btnH / 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${(10.5 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSubscribed ? '✓ SUBSCRIBED' : 'SUBSCRIBE', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Model 4: Luxury Golden Metallic Subscribe (mogrt-youtube-gold)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-youtube-gold') {
    const cardW = 370 * scale;
    const cardH = 74 * scale;
    const cardX = cx - cardW / 2;
    const cardY = cy - cardH / 2 + slideY;
    const radius = cardH / 2;

    // Offset drop shadow (0 software blur penalty)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY + 5 * scale, cardW, cardH, radius);
    ctx.fill();

    ctx.fillStyle = '#0b0b0a';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // Golden gradient border
    const goldGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    goldGrad.addColorStop(0, '#FFE885');
    goldGrad.addColorStop(0.5, '#F59E0B');
    goldGrad.addColorStop(1, '#92400E');

    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.stroke();

    // Gold Star Emblem
    const avatarR = 22 * scale;
    const avatarX = cardX + 16 * scale + avatarR;
    const avatarY = cardY + cardH / 2;

    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = `900 ${(18 * scale).toFixed(1)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', avatarX, avatarY);

    // Text
    const textLeft = avatarX + avatarR + 14 * scale;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFE885';
    ctx.font = `800 ${(15 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(channelName, textLeft, cardY + 32 * scale);

    ctx.fillStyle = '#D4AF37';
    ctx.font = `600 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(subCount, textLeft, cardY + 52 * scale);

    // Gold Subscribe Button
    const btnW = 108 * scale;
    const btnH = 34 * scale;
    const btnX = cardX + cardW - btnW - 18 * scale;
    const btnY = cardY + (cardH - btnH) / 2;

    ctx.save();
    ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
    ctx.scale(clickScale, clickScale);
    ctx.translate(-(btnX + btnW / 2), -(btnY + btnH / 2));

    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, btnH / 2);
    ctx.fill();

    ctx.fillStyle = '#1A1408';
    ctx.font = `800 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSubscribed ? '★ SUBSCRIBED' : 'SUBSCRIBE', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Model 5: Cyber Neon Red Subscribe (mogrt-youtube-neon)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-youtube-neon') {
    const cardW = 360 * scale;
    const cardH = 70 * scale;
    const cardX = cx - cardW / 2;
    const cardY = cy - cardH / 2 + slideY;

    // Glowing cyberpunk neon plate with multi-stroke outline (0 software blur penalty)
    ctx.fillStyle = 'rgba(10, 10, 14, 0.94)';
    ctx.beginPath();
    ctx.rect(cardX, cardY, cardW, cardH);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.25)';
    ctx.lineWidth = Math.max(3, 5 * scale);
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#FF0055';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.strokeRect(cardX, cardY, cardW, cardH);
    ctx.restore();

    // Cyber corner cuts
    const corner = 10 * scale;
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(cardX - 2 * scale, cardY - 2 * scale, corner, 2 * scale);
    ctx.fillRect(cardX - 2 * scale, cardY - 2 * scale, 2 * scale, corner);
    ctx.fillRect(cardX + cardW - corner + 2 * scale, cardY + cardH, corner, 2 * scale);
    ctx.fillRect(cardX + cardW, cardY + cardH - corner + 2 * scale, 2 * scale, corner);

    // Channel name & sub
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${(15 * scale).toFixed(1)}px "JetBrains Mono", monospace, sans-serif`;
    ctx.fillText(channelName.toUpperCase(), cardX + 20 * scale, cardY + 30 * scale);

    ctx.fillStyle = '#00F0FF';
    ctx.font = `600 ${(11 * scale).toFixed(1)}px monospace, sans-serif`;
    ctx.fillText(`// ${subCount.toUpperCase()}`, cardX + 20 * scale, cardY + 50 * scale);

    // Neon Button
    const btnW = 110 * scale;
    const btnH = 34 * scale;
    const btnX = cardX + cardW - btnW - 18 * scale;
    const btnY = cardY + (cardH - btnH) / 2;

    ctx.save();
    ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
    ctx.scale(clickScale, clickScale);
    ctx.translate(-(btnX + btnW / 2), -(btnY + btnH / 2));

    ctx.fillStyle = isSubscribed ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 0, 85, 0.2)';
    ctx.fillRect(btnX, btnY, btnW, btnH);

    ctx.strokeStyle = isSubscribed ? '#00F0FF' : '#FF0055';
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = isSubscribed ? '#00F0FF' : '#FFFFFF';
    ctx.font = `800 ${(11 * scale).toFixed(1)}px monospace, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSubscribed ? '[SUBSCRIBED]' : '[SUBSCRIBE]', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Model 6: End Screen Round CTA (mogrt-youtube-end-screen)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-youtube-end-screen') {
    const avatarR = 42 * scale;
    const radarP = phase === 'hold' ? (phaseProgress * 4) % 1 : 0;
    const radarR = avatarR + radarP * 30 * scale;
    const radarAlpha = (1 - radarP) * 0.7;

    // Radar pulse wave
    if (radarAlpha > 0.05) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 0, 0, ${radarAlpha.toFixed(2)})`;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy - 14 * scale, radarR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Avatar Circle with offset drop shadow (0 software blur penalty)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy - 14 * scale + 4 * scale, avatarR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy - 14 * scale, avatarR, 0, Math.PI * 2);
    ctx.clip();
    if (photoImage) {
      ctx.drawImage(photoImage, cx - avatarR, cy - 14 * scale - avatarR, avatarR * 2, avatarR * 2);
    } else {
      ctx.fillStyle = '#CC0000';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${(28 * scale).toFixed(1)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(channelName.charAt(0).toUpperCase() || 'Y', cx, cy - 14 * scale);
    }
    ctx.restore();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy - 14 * scale, avatarR, 0, Math.PI * 2);
    ctx.stroke();

    // Floating Subscribe Pill Below
    const btnW = 130 * scale;
    const btnH = 32 * scale;
    const btnX = cx - btnW / 2;
    const btnY = cy + 42 * scale;

    ctx.fillStyle = isSubscribed ? '#272727' : '#FF0000';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, btnH / 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSubscribed ? '✓ SUBSCRIBED' : 'SUBSCRIBE', cx, btnY + btnH / 2);

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Model 7: Ringing Golden Bell Notification (mogrt-youtube-bell-ring)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-youtube-bell-ring') {
    const cardW = 340 * scale;
    const cardH = 68 * scale;
    const cardX = cx - cardW / 2;
    const cardY = cy - cardH / 2 + slideY;
    const radius = 16 * scale;

    // Offset drop shadow (0 software blur penalty)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY + 5 * scale, cardW, cardH, radius);
    ctx.fill();

    ctx.fillStyle = '#141413';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();

    // Large Swinging Bell on left
    const bellCx = cardX + 36 * scale;
    const bellCy = cardY + cardH / 2;
    const bellAngle = Math.sin(phaseProgress * Math.PI * 10) * 0.28;

    ctx.save();
    ctx.translate(bellCx, bellCy);
    ctx.rotate(bellAngle);

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, -6 * scale, 10 * scale, Math.PI, 0);
    ctx.lineTo(12 * scale, 8 * scale);
    ctx.lineTo(-12 * scale, 8 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 10 * scale, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Soundwaves
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 19 * scale, -0.6, 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 19 * scale, Math.PI - 0.6, Math.PI + 0.6);
    ctx.stroke();
    ctx.restore();

    // Text: Turn On All Notifications
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${(13.5 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('NOTIFICATIONS ON', cardX + 70 * scale, cardY + 30 * scale);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = `500 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText('Never miss any new videos', cardX + 70 * scale, cardY + 48 * scale);

    // Bell active tag on right
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.beginPath();
    ctx.roundRect(
      cardX + cardW - 74 * scale,
      cardY + (cardH - 26 * scale) / 2,
      60 * scale,
      26 * scale,
      13 * scale,
    );
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.font = `800 ${(10 * scale).toFixed(1)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ACTIVE', cardX + cardW - 44 * scale, cardY + cardH / 2);

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Model 0: Default Creator Pill (mogrt-youtube-subscribe)
  // ───────────────────────────────────────────────────────────────────────────
  const cardW = 380 * scale;
  const cardH = 74 * scale;
  const cardX = cx - cardW / 2;
  const cardY = cy - cardH / 2 + slideY;
  const radius = cardH / 2;

  // Outer shadow & background (offset drop shadow, 0 software blur penalty)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY + 6 * scale, cardW, cardH, radius);
  ctx.fill();

  ctx.fillStyle = '#0f0f0f';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.stroke();

  // Channel Avatar Circle
  const avatarR = 24 * scale;
  const avatarX = cardX + 16 * scale + avatarR;
  const avatarY = cardY + cardH / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.clip();

  if (photoImage) {
    ctx.drawImage(photoImage, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
  } else {
    const grad = ctx.createLinearGradient(
      avatarX - avatarR,
      avatarY - avatarR,
      avatarX + avatarR,
      avatarY + avatarR,
    );
    grad.addColorStop(0, '#FF0000');
    grad.addColorStop(1, '#CC0000');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    const triS = 10 * scale;
    ctx.moveTo(avatarX - triS * 0.5, avatarY - triS * 0.8);
    ctx.lineTo(avatarX + triS * 0.8, avatarY);
    ctx.lineTo(avatarX - triS * 0.5, avatarY + triS * 0.8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.stroke();

  // Channel Name and Handle / Sub count
  const textLeft = avatarX + avatarR + 14 * scale;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${(15 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(channelName, textLeft, cardY + 32 * scale);

  ctx.fillStyle = '#AAAAAA';
  ctx.font = `500 ${(11.5 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(subCount, textLeft, cardY + 52 * scale);

  // Subscribe Button
  const btnW = (isSubscribed ? 104 : 96) * scale;
  const btnH = 34 * scale;
  const btnX = cardX + cardW - 14 * scale - 36 * scale - btnW;
  const btnY = cardY + (cardH - btnH) / 2;
  const btnR = btnH / 2;

  ctx.save();
  ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
  ctx.scale(clickScale, clickScale);
  ctx.translate(-(btnX + btnW / 2), -(btnY + btnH / 2));

  ctx.fillStyle = isSubscribed ? '#272727' : '#FF0000';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, btnR);
  ctx.fill();

  ctx.fillStyle = isSubscribed ? '#F1F1F1' : '#FFFFFF';
  ctx.font = `700 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isSubscribed ? '✓ SUBSCRIBED' : 'SUBSCRIBE', btnX + btnW / 2, btnY + btnH / 2);
  ctx.restore();

  // Notification Bell
  const bellX = cardX + cardW - 14 * scale - 16 * scale;
  const bellY = cardY + cardH / 2;
  const isRinging =
    isSubscribed && phase === 'hold' && phaseProgress >= 0.35 && phaseProgress <= 0.65;
  const bellAngle = isRinging ? Math.sin((phaseProgress - 0.35) * 45) * 0.3 : 0;

  ctx.save();
  ctx.translate(bellX, bellY);
  ctx.rotate(bellAngle);

  ctx.fillStyle = isSubscribed ? '#FFD700' : '#CCCCCC';
  ctx.beginPath();
  ctx.arc(0, -4 * scale, 7 * scale, Math.PI, 0);
  ctx.lineTo(8 * scale, 5 * scale);
  ctx.lineTo(-8 * scale, 5 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 6.5 * scale, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  if (isRinging) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * scale, -0.6, 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 14 * scale, Math.PI - 0.6, Math.PI + 0.6);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Social Media Lower Thirds 2.0 MOGRT Renderer.
 * Supports all 18 top platforms:
 * Instagram, YouTube, Twitter/X, TikTok, WhatsApp, Telegram, Discord, Facebook,
 * LinkedIn, Spotify, Twitch, Snapchat, Pinterest, Behance, Dribbble, Vimeo, GitHub, Website
 * Supports Left / Right orientation & animated mask reveal.
 */
function drawSocialMediaHandle(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  phase: 'intro' | 'hold' | 'outro',
  phaseProgress: number,
  baseX: number,
  baseY: number,
  scale: number,
): void {
  const cx = baseX;
  const cy = baseY;
  const isRightAlign = spec.position?.align === 'right';

  ctx.save();

  let globalAlpha = 1;
  let slideX = 0;

  if (phase === 'intro') {
    globalAlpha = clamp01(phaseProgress / 0.2);
    slideX = (1 - easeOutCubic(phaseProgress)) * (isRightAlign ? 60 : -60) * scale;
  } else if (phase === 'outro') {
    globalAlpha = 1 - clamp01(phaseProgress / 0.3);
    slideX = easeOutCubic(phaseProgress) * (isRightAlign ? 60 : -60) * scale;
  }

  if (globalAlpha <= 0.001) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha *= globalAlpha;

  const handleText = spec.name || '@username';
  const actionText = spec.role || 'Follow us';
  const platform = (spec.extra || 'instagram').toLowerCase();

  const handleFont = `700 ${(17 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
  const nameW = getCachedTextWidth(ctx, handleText, handleFont);

  const cardW = Math.max(260 * scale, nameW + 110 * scale);
  const cardH = 58 * scale;
  const cardX = cx - cardW / 2 + slideX;
  const cardY = cy - cardH / 2;
  const radius = 16 * scale;

  // Background plate with offset drop shadow (0 software blur penalty)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY + 4 * scale, cardW, cardH, radius);
  ctx.fill();

  ctx.fillStyle = '#141413';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.stroke();

  // Platform styling lookup (18 Platforms)
  const badgeSize = cardH - 12 * scale;
  const badgeX = isRightAlign ? cardX + cardW - badgeSize - 6 * scale : cardX + 6 * scale;
  const badgeY = cardY + 6 * scale;
  const badgeR = 12 * scale;

  let gradColors = ['#833AB4', '#FD1D1D', '#FCB045'];
  let iconGlyph = '📷';
  let textColor = '#FFFFFF';

  if (platform.includes('youtube')) {
    gradColors = ['#FF0000', '#B30000'];
    iconGlyph = '▶';
  } else if (platform.includes('twitter') || platform.includes('x')) {
    gradColors = ['#1DA1F2', '#0C7ABF'];
    iconGlyph = '𝕏';
  } else if (platform.includes('tiktok')) {
    gradColors = ['#00F2FE', '#FE0979'];
    iconGlyph = '♪';
  } else if (platform.includes('whatsapp')) {
    gradColors = ['#25D366', '#128C7E'];
    iconGlyph = '💬';
  } else if (platform.includes('telegram')) {
    gradColors = ['#229ED9', '#0088CC'];
    iconGlyph = '✈';
  } else if (platform.includes('discord')) {
    gradColors = ['#5865F2', '#404EED'];
    iconGlyph = '🎮';
  } else if (platform.includes('facebook')) {
    gradColors = ['#1877F2', '#0A53BE'];
    iconGlyph = 'f';
  } else if (platform.includes('linkedin')) {
    gradColors = ['#0A66C2', '#004182'];
    iconGlyph = 'in';
  } else if (platform.includes('spotify')) {
    gradColors = ['#1DB954', '#15883e'];
    iconGlyph = '♫';
  } else if (platform.includes('twitch')) {
    gradColors = ['#9146FF', '#6441A5'];
    iconGlyph = '👾';
  } else if (platform.includes('snapchat')) {
    gradColors = ['#FFFC00', '#FCD200'];
    iconGlyph = '👻';
    textColor = '#000000';
  } else if (platform.includes('pinterest')) {
    gradColors = ['#BD081C', '#8C0615'];
    iconGlyph = 'P';
  } else if (platform.includes('behance')) {
    gradColors = ['#1769FF', '#0047CC'];
    iconGlyph = 'Bē';
  } else if (platform.includes('dribbble')) {
    gradColors = ['#EA4C89', '#C32361'];
    iconGlyph = '🏀';
  } else if (platform.includes('vimeo')) {
    gradColors = ['#1AB7EA', '#0088CC'];
    iconGlyph = 'v';
  } else if (platform.includes('github')) {
    gradColors = ['#24292E', '#161B22'];
    iconGlyph = '🐙';
  } else if (platform.includes('website') || platform.includes('url')) {
    gradColors = ['#0D9488', '#0F766E'];
    iconGlyph = '🌐';
  }

  const badgeGrad = ctx.createLinearGradient(
    badgeX,
    badgeY,
    badgeX + badgeSize,
    badgeY + badgeSize,
  );
  if (gradColors.length === 3) {
    badgeGrad.addColorStop(0, gradColors[0]);
    badgeGrad.addColorStop(0.5, gradColors[1]);
    badgeGrad.addColorStop(1, gradColors[2]);
  } else {
    badgeGrad.addColorStop(0, gradColors[0]);
    badgeGrad.addColorStop(1, gradColors[1]);
  }

  ctx.fillStyle = badgeGrad;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeR);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${(17 * scale).toFixed(1)}px system-ui, sans-serif`;
  ctx.fillText(iconGlyph, badgeX + badgeSize / 2, badgeY + badgeSize / 2);

  // Text: Handle & Subtitle
  const textX = isRightAlign ? cardX + 16 * scale : badgeX + badgeSize + 14 * scale;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${(16 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(handleText, textX, cardY + 26 * scale);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = `500 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(actionText, textX, cardY + 44 * scale);

  ctx.restore();
}

/**
 * Bold Call-Outs MOGRT Renderer (8 Directional & Aesthetic Styles).
 * Extracted from bold-call-outs-mogrts-2023-11-27-05-14-57-utc.zip.
 * - mogrt-callout-right-box: Target bottom-left, pointer to top-right card with amber bar
 * - mogrt-callout-left-box: Target bottom-right, pointer to top-left card with cyan bar
 * - mogrt-callout-top-pointer: Target bottom, pointer down to horizontal top banner
 * - mogrt-callout-bottom-pointer: Target top, pointer up to horizontal bottom banner
 * - mogrt-callout-reticle-hud: Rotating HUD crosshair reticle with telemetry angle line
 * - mogrt-callout-bracket-card: Target ring with line into framing corner brackets
 * - mogrt-callout-minimal-target: Concentric rings, thin line, floating high-contrast text
 * - mogrt-callout-solid-badge: Solid gradient capsule badge with pointer needle
 */
function drawBoldCallout(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  phase: 'intro' | 'hold' | 'outro',
  phaseProgress: number,
  baseX: number,
  baseY: number,
  scale: number,
): void {
  const cx = baseX;
  const cy = baseY;
  const styleId = spec.templateId || 'mogrt-callout-right-box';

  ctx.save();

  let lineProgress = 1;
  let textAlpha = 1;
  let globalAlpha = 1;

  if (phase === 'intro') {
    globalAlpha = clamp01(phaseProgress / 0.15);
    lineProgress = clamp01(phaseProgress / 0.6);
    textAlpha = clamp01((phaseProgress - 0.4) / 0.6);
  } else if (phase === 'outro') {
    globalAlpha = 1 - clamp01(phaseProgress / 0.3);
    textAlpha = 1 - clamp01(phaseProgress / 0.4);
    lineProgress = 1 - clamp01((phaseProgress - 0.2) / 0.6);
  }

  if (globalAlpha <= 0.001) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha *= globalAlpha;

  const titleText = (spec.name || 'PRODUCT FEATURE').toUpperCase();
  const descText = spec.role || 'Cinematic precision callout';

  // ───────────────────────────────────────────────────────────────────────────
  // Style 5: Rotating HUD Reticle (mogrt-callout-reticle-hud)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-callout-reticle-hud') {
    const targetX = cx - 110 * scale;
    const targetY = cy + 70 * scale;
    const kneeX = cx - 20 * scale;
    const kneeY = cy;
    const cardX = cx + 20 * scale;
    const cardY = cy;

    // HUD Rotating Target Reticle
    const rot = phaseProgress * Math.PI * 4;
    const r = 16 * scale;

    ctx.save();
    ctx.translate(targetX, targetY);
    ctx.rotate(rot);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([4 * scale, 4 * scale]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Crosshairs + center dot
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Angled Telemetry Line
    if (lineProgress > 0.05) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      if (lineProgress <= 0.5) {
        const p = lineProgress / 0.5;
        ctx.lineTo(targetX + (kneeX - targetX) * p, targetY + (kneeY - targetY) * p);
      } else {
        ctx.lineTo(kneeX, kneeY);
        const p = (lineProgress - 0.5) / 0.5;
        ctx.lineTo(kneeX + (cardX - kneeX) * p, kneeY);
      }
      ctx.stroke();
    }

    // HUD Card
    if (textAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha *= textAlpha;

      const boxW = 240 * scale;
      const boxH = 64 * scale;

      ctx.fillStyle = 'rgba(12, 12, 16, 0.94)';
      ctx.fillRect(cardX, cardY - boxH / 2, boxW, boxH);

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(cardX, cardY - boxH / 2, boxW, boxH);

      // HUD corner tick marks
      const cLen = 6 * scale;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(cardX, cardY - boxH / 2 + cLen);
      ctx.lineTo(cardX, cardY - boxH / 2);
      ctx.lineTo(cardX + cLen, cardY - boxH / 2);

      ctx.moveTo(cardX + boxW - cLen, cardY - boxH / 2);
      ctx.lineTo(cardX + boxW, cardY - boxH / 2);
      ctx.lineTo(cardX + boxW, cardY - boxH / 2 + cLen);
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.font = `800 ${(9 * scale).toFixed(1)}px monospace, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('[ TARGET LOCKED ]', cardX + 14 * scale, cardY - boxH / 2 + 16 * scale);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${(14 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(titleText, cardX + 14 * scale, cardY + 5 * scale);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = `500 ${(10.5 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(descText, cardX + 14 * scale, cardY + 22 * scale);
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Style 6: Corner Brackets Callout (mogrt-callout-bracket-card)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-callout-bracket-card') {
    const targetX = cx - 110 * scale;
    const targetY = cy + 70 * scale;
    const cardX = cx + 10 * scale;
    const cardY = cy;

    // Target circle
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 10 * scale, 0, Math.PI * 2);
    ctx.stroke();

    if (lineProgress > 0.05) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(
        targetX + (cardX - targetX) * lineProgress,
        targetY + (cardY - targetY) * lineProgress,
      );
      ctx.stroke();
    }

    if (textAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha *= textAlpha;

      const titleFont = `800 ${(16 * scale).toFixed(1)}px system-ui, sans-serif`;
      const titleW = getCachedTextWidth(ctx, titleText, titleFont);
      const bW = Math.max(200 * scale, titleW + 36 * scale);
      const bH = 54 * scale;
      const bx = cardX;
      const by = cardY - bH / 2;

      // Brackets
      const bArm = 12 * scale;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5 * scale;

      // Top-left [
      ctx.beginPath();
      ctx.moveTo(bx + bArm, by);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx, by + bH);
      ctx.lineTo(bx + bArm, by + bH);
      ctx.stroke();

      // Top-right ]
      ctx.beginPath();
      ctx.moveTo(bx + bW - bArm, by);
      ctx.lineTo(bx + bW, by);
      ctx.lineTo(bx + bW, by + bH);
      ctx.lineTo(bx + bW - bArm, by + bH);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${(15 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(titleText, bx + 16 * scale, cardY - 2 * scale);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = `500 ${(10.5 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(descText, bx + 16 * scale, cardY + 16 * scale);
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Style 7: Minimal Target Ring (mogrt-callout-minimal-target)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-callout-minimal-target') {
    const targetX = cx - 120 * scale;
    const targetY = cy + 50 * scale;
    const lineEndX = cx + 80 * scale;
    const lineY = cy - 20 * scale;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 6 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(targetX, targetY, 14 * scale, 0, Math.PI * 2);
    ctx.stroke();

    if (lineProgress > 0.05) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(targetX + 40 * scale, lineY);
      ctx.lineTo(lineEndX * lineProgress + (targetX + 40 * scale) * (1 - lineProgress), lineY);
      ctx.stroke();
    }

    if (textAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha *= textAlpha;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${(16 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(titleText, targetX + 46 * scale, lineY - 8 * scale);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = `500 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(descText, targetX + 46 * scale, lineY + 18 * scale);
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Style 8: Solid Badge Capsule (mogrt-callout-solid-badge)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-callout-solid-badge') {
    const targetX = cx - 70 * scale;
    const targetY = cy + 50 * scale;
    const badgeW = 200 * scale;
    const badgeH = 46 * scale;
    const badgeX = cx - badgeW / 2;
    const badgeY = cy - badgeH / 2;

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Pointer needle
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(badgeX + 30 * scale, badgeY + badgeH);
    ctx.lineTo(badgeX + 50 * scale, badgeY + badgeH);
    ctx.closePath();
    ctx.fill();

    // Badge
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = `800 ${(13 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, cx, badgeY + badgeH / 2);

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Style 2, 3, 4, 1: Directional Callouts (Left Box, Top Pointer, Bottom, Right)
  // ───────────────────────────────────────────────────────────────────────────
  const isLeftBox = styleId === 'mogrt-callout-left-box';
  const isTopPointer = styleId === 'mogrt-callout-top-pointer';
  const isBottomPointer = styleId === 'mogrt-callout-bottom-pointer';

  let targetX = cx - 120 * scale;
  let targetY = cy + 90 * scale;
  let kneeX = cx - 40 * scale;
  let kneeY = cy;
  let cardX = cx;
  let cardY = cy;
  let accentColor = '#F59E0B';

  if (isLeftBox) {
    targetX = cx + 120 * scale;
    targetY = cy + 90 * scale;
    kneeX = cx + 40 * scale;
    kneeY = cy;
    cardX = cx - 220 * scale;
    accentColor = '#06B6D4';
  } else if (isTopPointer) {
    targetX = cx;
    targetY = cy + 80 * scale;
    kneeX = cx;
    kneeY = cy + 30 * scale;
    cardX = cx - 110 * scale;
    cardY = cy - 20 * scale;
    accentColor = '#84CC16';
  } else if (isBottomPointer) {
    targetX = cx;
    targetY = cy - 80 * scale;
    kneeX = cx;
    kneeY = cy - 30 * scale;
    cardX = cx - 110 * scale;
    cardY = cy + 20 * scale;
    accentColor = '#FB923C';
  }

  // Pulsing Target Dot
  const pulseR =
    6 * scale + (phase === 'hold' ? Math.sin(phaseProgress * Math.PI * 6) * 2 * scale : 0);
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(targetX, targetY, pulseR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.arc(targetX, targetY, pulseR + 6 * scale, 0, Math.PI * 2);
  ctx.stroke();

  // Angled Leader Line
  if (lineProgress > 0.05) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);

    if (lineProgress <= 0.5) {
      const p = lineProgress / 0.5;
      ctx.lineTo(targetX + (kneeX - targetX) * p, targetY + (kneeY - targetY) * p);
    } else {
      ctx.lineTo(kneeX, kneeY);
      const p = (lineProgress - 0.5) / 0.5;
      ctx.lineTo(kneeX + (cardX - kneeX) * p, kneeY);
    }
    ctx.stroke();
  }

  // Call-out Card
  if (textAlpha > 0.05) {
    ctx.save();
    ctx.globalAlpha *= textAlpha;

    const titleFont = `800 ${(17 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    const titleW = getCachedTextWidth(ctx, titleText, titleFont);
    const boxW = Math.max(220 * scale, titleW + 36 * scale);
    const boxH = 64 * scale;

    ctx.fillStyle = 'rgba(18, 18, 17, 0.94)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY - boxH / 2, boxW, boxH, 8 * scale);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Accent left/top border
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY - boxH / 2, 4 * scale, boxH, [8 * scale, 0, 0, 8 * scale]);
    ctx.fill();

    // Text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${(15 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(titleText, cardX + 16 * scale, cardY - 4 * scale);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = `500 ${(11 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(descText, cardX + 16 * scale, cardY + 16 * scale);

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Exact replication of RGB Trendy Titles & Kinetic Motion Titles.
 * Extracted from 1.zip (Trendy Titles 01, 02, 03).
 * - mogrt-rgb-glitch-01: Chromatic split (Red/Cyan channel offset) with digital jitter
 * - mogrt-rgb-cyber-02: Cyber Strobe with neon yellow / magenta flash and strobe scanline box
 * - mogrt-trendy-minimal-03: Modern kinetic tracking typography wipe
 */
function drawRgbGlitchTitle(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  phase: 'intro' | 'hold' | 'outro',
  phaseProgress: number,
  baseX: number,
  baseY: number,
  scale: number,
): void {
  const cx = baseX;
  const cy = baseY;
  const styleId = spec.templateId || 'mogrt-rgb-glitch';

  const titleText = (spec.name || 'TRENDY TITLE').toUpperCase();
  const subtitleText = spec.role ? spec.role.toUpperCase() : 'MOTION GRAPHICS';

  ctx.save();

  let globalAlpha = 1;

  if (phase === 'intro') {
    globalAlpha = clamp01(phaseProgress / 0.15);
  } else if (phase === 'outro') {
    globalAlpha = 1 - clamp01(phaseProgress / 0.3);
  }

  if (globalAlpha <= 0.001) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha *= globalAlpha;

  // ───────────────────────────────────────────────────────────────────────────
  // Style 2: Cyber Neon Strobe 02 (mogrt-rgb-cyber-02)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-rgb-cyber-02') {
    const isStrobe =
      phase === 'intro' && phaseProgress < 0.4 && Math.floor(phaseProgress * 30) % 2 === 0;
    const strokeColor = isStrobe ? '#FFE600' : '#FF007F';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2 * scale;
    const boxW = 420 * scale;
    const boxH = 90 * scale;
    ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);

    ctx.fillStyle = isStrobe ? '#FFE600' : '#FFFFFF';
    ctx.font = `900 ${(42 * scale).toFixed(1)}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, cx, cy - 10 * scale);

    ctx.fillStyle = '#00F0FF';
    ctx.font = `700 ${(13 * scale).toFixed(1)}px monospace, sans-serif`;
    ctx.fillText(`// ${subtitleText}`, cx, cy + 26 * scale);

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Style 3: Minimal Kinetic Wipe 03 (mogrt-trendy-minimal-03)
  // ───────────────────────────────────────────────────────────────────────────
  if (styleId === 'mogrt-trendy-minimal-03') {
    const lineW = 320 * scale * (phase === 'intro' ? easeOutCubic(phaseProgress) : 1);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(cx - lineW / 2, cy);
    ctx.lineTo(cx + lineW / 2, cy);
    ctx.stroke();

    const slideUp = phase === 'intro' ? (1 - easeOutCubic(phaseProgress)) * 24 * scale : 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${(34 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(titleText, cx, cy - 8 * scale + slideUp);

    const slideDown = phase === 'intro' ? (1 - easeOutCubic(phaseProgress)) * -24 * scale : 0;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = `600 ${(12 * scale).toFixed(1)}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'top';
    const spaced = subtitleText.split('').join(' ');
    ctx.fillText(spaced, cx, cy + 12 * scale + slideDown);

    ctx.restore();
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Style 1: Chromatic RGB Glitch 01 (mogrt-rgb-glitch-01 / mogrt-rgb-glitch)
  // ───────────────────────────────────────────────────────────────────────────
  let glitchOffset = 0;
  if (phase === 'intro') {
    glitchOffset = (1 - easeOutCubic(phaseProgress)) * 18 * scale * (Math.random() > 0.5 ? 1 : -1);
  } else if (phase === 'outro') {
    glitchOffset = easeOutCubic(phaseProgress) * 18 * scale * (Math.random() > 0.5 ? 1 : -1);
  }

  const fontSize = Math.max(32 * scale, 56 * scale);
  const subFontSize = fontSize * 0.32;
  const fontFam = spec.font.family && spec.font.family !== 'Inter' ? spec.font.family : 'Unbounded';

  const drawTextLayers = (text: string, yPos: number, isSub: boolean) => {
    const fSize = isSub ? subFontSize : fontSize;
    const fWeight = isSub ? '700' : '900';
    ctx.font = `${fWeight} ${fSize.toFixed(1)}px "${fontFam}", "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (Math.abs(glitchOffset) > 0.5) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 85, 0.85)';
      ctx.fillText(text, cx + glitchOffset, yPos);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.fillText(text, cx - glitchOffset, yPos);
      ctx.restore();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, cx, yPos);
  };

  drawTextLayers(titleText, cy - subFontSize * 0.6, false);
  if (subtitleText) {
    const spaced = subtitleText.split('').join(' ');
    drawTextLayers(spaced, cy + fontSize * 0.7, true);
  }

  ctx.restore();
}
