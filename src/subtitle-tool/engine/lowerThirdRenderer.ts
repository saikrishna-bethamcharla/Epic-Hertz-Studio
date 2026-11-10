// ─── Lower Third Element Renderer — Epic Hertz Studio Engine ─────────────────
// Data-driven template renderer for Lower Thirds.
// Evaluates elements at time t across intro, hold, and outro phases.
// Shared across Preview and MP4 Export paths.

import type { LowerThirdSpec } from './spec';
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
  getLineHeightMultiplier,
  clamp01,
} from './lowerThirdPrimitives';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Template Registry & Lookup
// ─────────────────────────────────────────────────────────────────────────────

const templateRegistry = new Map<string, LowerThirdTemplate>();

// Register baseline classic templates
for (const tmpl of CLASSIC_TEMPLATES) {
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

const MAX_CACHE_ENTRIES = 500;
const textWidthCache = new Map<string, number>();

export function getCachedTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
): number {
  const cacheKey = `${font}__${text}`;
  const cached = textWidthCache.get(cacheKey);
  if (cached !== undefined) return cached;

  ctx.font = font;
  const measured = ctx.measureText(text).width;
  if (textWidthCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = textWidthCache.keys().next().value;
    if (firstKey) textWidthCache.delete(firstKey);
  }
  textWidthCache.set(cacheKey, measured);
  return measured;
}

export function clearTextWidthCache(): void {
  textWidthCache.clear();
}

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
    ctx.fillStyle = fill;

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
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = (elem.style.strokeWidth || 3) * scale;
    ctx.beginPath();
    ctx.moveTo(0, elH / 2);
    const lineLen = elem.animation.in.type === 'lineDraw' ? elW * elemProgress : elW;
    ctx.lineTo(lineLen, elH / 2);
    ctx.stroke();
  } else if (elem.type === 'text') {
    if (elem.role === 'name') {
      ctx.fillStyle = textPrimaryColor;
      ctx.font = `${spec.font.weight || 700} ${nameFit.fontSize.toFixed(1)}px "${spec.font.family || 'Inter'}", sans-serif`;
      ctx.textBaseline = 'middle';

      let lineY = padY + nameFit.lineHeight / 2;
      for (const line of nameFit.lines) {
        ctx.fillText(line, padX, lineY);
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
