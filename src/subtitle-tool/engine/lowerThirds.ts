// ─── Lower Thirds overlay engine — Epic Hertz Studio ─────────────────────────
// Native Canvas 2D lower-third animations designed for short-form Reels & broadcast.
// Supports 8 distinctive variants, smooth easing (easeOutExpo/easeOutCubic),
// configurable intro/hold/outro timing, photo avatars with auto-cropping,
// and full Unicode & Indic script shaping (Telugu, Hindi, etc.) with auto text fitting.

import type { LowerThirdSpec } from './spec';
import { fontById } from './spec';

// ─── Easing Functions ────────────────────────────────────────────────────────

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// ─── Timing State Model ─────────────────────────────────────────────────────

export interface LowerThirdAnimState {
  active: boolean;
  phase: 'inactive' | 'intro' | 'hold' | 'outro';
  progress: number; // 0..1 phase progress
  shapeProgress: number; // 0..1 eased shape wipe progress
  textProgress: number; // 0..1 eased text reveal progress
  opacity: number; // 0..1 overall opacity
}

export function getLowerThirdPhase(spec: LowerThirdSpec, t: number): LowerThirdAnimState {
  if (t < spec.start || t > spec.end) {
    return {
      active: false,
      phase: 'inactive',
      progress: 0,
      shapeProgress: 0,
      textProgress: 0,
      opacity: 0,
    };
  }

  const duration = Math.max(0.1, spec.end - spec.start);
  let introDur = spec.introDuration ?? 0.7;
  let outroDur = spec.outroDuration ?? 0.6;

  // Ensure intro and outro don't overlap if segment is short
  if (introDur + outroDur > duration) {
    introDur = duration * 0.45;
    outroDur = duration * 0.45;
  }

  const elapsed = t - spec.start;

  // 1. Intro phase
  if (elapsed < introDur) {
    const p = clamp01(elapsed / introDur);
    const shapeProgress = easeOutExpo(p);
    // Stagger text reveal: begins after shape wipe starts (around p >= 0.2)
    const textProgress = easeOutCubic(clamp01((p - 0.2) / 0.8));
    const opacity = clamp01(p / 0.25);
    return {
      active: true,
      phase: 'intro',
      progress: p,
      shapeProgress,
      textProgress,
      opacity,
    };
  }

  // 2. Outro phase
  if (elapsed > duration - outroDur) {
    const outroElapsed = elapsed - (duration - outroDur);
    const p = clamp01(outroElapsed / outroDur);
    // Outro reverse: text exits first (0..0.7 of outro), shape wipes away (0.2..1.0)
    const textProgress = 1 - easeOutCubic(clamp01(p / 0.7));
    const shapeProgress = 1 - easeOutExpo(clamp01((p - 0.2) / 0.8));
    const opacity = 1 - clamp01((p - 0.6) / 0.4);
    return {
      active: true,
      phase: 'outro',
      progress: p,
      shapeProgress,
      textProgress,
      opacity,
    };
  }

  // 3. Mid Hold phase
  return {
    active: true,
    phase: 'hold',
    progress: 1,
    shapeProgress: 1,
    textProgress: 1,
    opacity: 1,
  };
}

// ─── Font & Text Helpers ────────────────────────────────────────────────────

export function lowerThirdFont(familyId: string, weight: number, px: number): string {
  const fam = fontById(familyId);
  const famCss = fam ? fam.css : familyId || 'Unbounded';
  const indicFallbacks =
    '"Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Bengali"';
  return `${weight} ${px.toFixed(1)}px "${famCss}", ${indicFallbacks}, system-ui, sans-serif`;
}

/**
 * Calculates a scaled font size if text exceeds maxWidth, ensuring long Telugu/Hindi names never overflow.
 */
export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseSize: number,
  family: string,
  weight: number,
  minScale = 0.55,
): number {
  if (!text || maxWidth <= 10) return baseSize;
  ctx.save();
  ctx.font = lowerThirdFont(family, weight, baseSize);
  const measured = ctx.measureText(text).width;
  ctx.restore();

  if (measured <= maxWidth) return baseSize;
  const scale = Math.max(minScale, maxWidth / measured);
  return baseSize * scale;
}

// ─── Photo Rendering ────────────────────────────────────────────────────────

export function drawCroppedPhoto(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource | null | undefined,
  x: number,
  y: number,
  size: number,
  shape: 'circle' | 'square',
  borderColor: string,
  borderWidth = 2,
  placeholderInitials = 'EH',
): void {
  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  } else {
    const radius = Math.max(4, size * 0.16);
    ctx.roundRect(x, y, size, size, radius);
  }
  ctx.closePath();

  // Background fill
  ctx.fillStyle = '#18181b';
  ctx.fill();

  ctx.save();
  ctx.clip();

  if (img) {
    try {
      const sw =
        (img as HTMLImageElement).naturalWidth ||
        (img as any).videoWidth ||
        (img as HTMLImageElement).width ||
        size;
      const sh =
        (img as HTMLImageElement).naturalHeight ||
        (img as any).videoHeight ||
        (img as HTMLImageElement).height ||
        size;
      const aspect = sw / sh;

      let dw = size;
      let dh = size;
      let dx = x;
      let dy = y;

      if (aspect > 1) {
        dw = size * aspect;
        dx = x - (dw - size) / 2;
      } else {
        dh = size / aspect;
        dy = y - (dh - size) / 2;
      }

      ctx.drawImage(img, dx, dy, dw, dh);
    } catch {
      // Fallback to initials if drawImage fails
      drawPhotoPlaceholder(ctx, x, y, size, placeholderInitials);
    }
  } else {
    drawPhotoPlaceholder(ctx, x, y, size, placeholderInitials);
  }
  ctx.restore();

  // Border ring
  if (borderWidth > 0 && borderColor) {
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhotoPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  initials: string,
): void {
  ctx.fillStyle = '#27272a';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#f4f4f5';
  ctx.font = `700 ${(size * 0.42).toFixed(1)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials.slice(0, 2).toUpperCase(), x + size / 2, y + size / 2);
}

// ─── 8 Variants Implementation ──────────────────────────────────────────────

/**
 * Variant 1: Box-Highlight Name Tag
 * Bold accent box for Name; dark sleek plate for Role attached below.
 */
export function drawVariant1(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const nameSize = spec.font.size * baseDim * scale;
  const roleSize = nameSize * 0.62;

  const maxBlockW = w * 0.82;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxBlockW - 32,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const effRoleSize = fitFontSize(
    ctx,
    spec.role + (spec.handle ? ` · ${spec.handle}` : ''),
    maxBlockW - 28,
    roleSize,
    spec.font.family,
    600,
  );

  ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
  const nameWidth = ctx.measureText(spec.name).width;

  const roleText = spec.handle ? `${spec.role}  ·  ${spec.handle}` : spec.role;
  ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
  const roleWidth = roleText ? ctx.measureText(roleText).width : 0;

  const padX = effNameSize * 0.6;
  const box1W = nameWidth + padX * 2;
  const box1H = effNameSize * 1.5;
  const box2W = Math.max(box1W * 0.85, roleWidth + padX * 1.8);
  const box2H = roleText ? effRoleSize * 1.6 : 0;

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  // Horizontal shape wipe
  const currentBox1W = box1W * anim.shapeProgress;

  // Draw Line 1 Box (Primary)
  ctx.fillStyle = spec.colors.primary;
  ctx.beginPath();
  ctx.roundRect(startX, startY, currentBox1W, box1H, Math.max(3, box1H * 0.12));
  ctx.fill();

  // Draw Line 2 Box (Secondary)
  if (roleText && anim.shapeProgress > 0.1) {
    const p2 = clamp01((anim.shapeProgress - 0.1) / 0.9);
    ctx.fillStyle = spec.colors.secondary || '#18181b';
    ctx.beginPath();
    ctx.roundRect(startX, startY + box1H + 3, box2W * p2, box2H, Math.max(3, box2H * 0.14));
    ctx.fill();
  }

  // Draw Texts with clip reveal
  if (anim.textProgress > 0.05) {
    // Clip to current box bounds so text smoothly unmasks
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, startY, currentBox1W, box1H + box2H + 6);
    ctx.clip();

    const slideX = (1 - anim.textProgress) * -20;

    // Name Text
    ctx.fillStyle = spec.colors.textPrimary || '#ffffff';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.name, startX + padX + slideX, startY + box1H / 2);

    // Role Text
    if (roleText) {
      ctx.fillStyle = spec.colors.textSecondary || '#e4e4e7';
      ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
      ctx.fillText(roleText, startX + padX * 0.9 + slideX, startY + box1H + 3 + box2H / 2);
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Variant 2: Underline + Role (Modern Minimal)
 * Bold name on top; dynamic accent bar expands left-to-right; role reveals beneath.
 */
export function drawVariant2(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const nameSize = spec.font.size * baseDim * scale * 1.05;
  const roleSize = nameSize * 0.58;

  const maxW = w * 0.8;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxW,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const roleText = spec.handle ? `${spec.role}   ${spec.handle}` : spec.role;
  const effRoleSize = fitFontSize(ctx, roleText, maxW, roleSize, spec.font.family, 600);

  ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
  const nameWidth = ctx.measureText(spec.name).width;
  ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
  const roleWidth = roleText ? ctx.measureText(roleText).width : 0;

  const lineWidth = Math.max(nameWidth, roleWidth) + 20;
  const lineHeight = Math.max(3, baseDim * 0.005);

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  // Name slide up from the line
  if (anim.textProgress > 0) {
    const textSlideY = (1 - anim.textProgress) * 12;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = spec.colors.textPrimary || '#ffffff';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(spec.name, startX, startY - 8 + textSlideY);
    ctx.restore();
  }

  // Accent Underline Bar
  const curLineW = lineWidth * anim.shapeProgress;
  ctx.fillStyle = spec.colors.primary;
  ctx.beginPath();
  ctx.roundRect(startX, startY, curLineW, lineHeight, lineHeight / 2);
  ctx.fill();

  // Role slide down from the line
  if (roleText && anim.textProgress > 0.15) {
    const roleP = clamp01((anim.textProgress - 0.15) / 0.85);
    const roleSlideY = (1 - roleP) * -8;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = spec.colors.textSecondary || '#cbd5e1';
    ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(roleText, startX, startY + lineHeight + 6 + roleSlideY);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Variant 3: Photo + Two-Line Name (Creator Badge)
 * Circular photo avatar with accent ring; background container expands rightward.
 */
export function drawVariant3(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
  photoImage?: CanvasImageSource | null,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const photoSize = baseDim * 0.085 * scale;
  const nameSize = spec.font.size * baseDim * scale * 0.95;
  const roleSize = nameSize * 0.6;

  const maxTextW = w * 0.7 - photoSize;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxTextW,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const effRoleSize = fitFontSize(ctx, spec.role, maxTextW, roleSize, spec.font.family, 600);

  ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
  const nameW = ctx.measureText(spec.name).width;
  ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
  const roleW = ctx.measureText(spec.role).width;

  const cardW = photoSize + Math.max(nameW, roleW) + 40;
  const cardH = photoSize + 12;

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  // Background Pill/Card
  const curCardW = cardW * anim.shapeProgress;
  ctx.fillStyle = spec.colors.secondary || 'rgba(18,18,22,0.9)';
  ctx.beginPath();
  ctx.roundRect(startX, startY, curCardW, cardH, cardH / 2);
  ctx.fill();

  // Subtle card border
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();

  // Photo Avatar (Pops in with scale bounce)
  if (anim.shapeProgress > 0.05) {
    const popScale = anim.shapeProgress;
    ctx.save();
    ctx.translate(startX + 6 + photoSize / 2, startY + 6 + photoSize / 2);
    ctx.scale(popScale, popScale);
    ctx.translate(-(startX + 6 + photoSize / 2), -(startY + 6 + photoSize / 2));
    drawCroppedPhoto(
      ctx,
      photoImage,
      startX + 6,
      startY + 6,
      photoSize,
      'circle',
      spec.colors.primary,
      Math.max(2, photoSize * 0.05),
      spec.name || 'CR',
    );
    ctx.restore();
  }

  // Text unmasking
  if (anim.textProgress > 0.1 && curCardW > photoSize + 20) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX + photoSize + 16, startY, curCardW - photoSize - 16, cardH);
    ctx.clip();

    const slideX = (1 - anim.textProgress) * -15;
    const textLeft = startX + photoSize + 18 + slideX;

    // Name
    ctx.fillStyle = spec.colors.textPrimary || '#ffffff';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(spec.name, textLeft, startY + cardH * 0.54);

    // Role
    ctx.fillStyle = spec.colors.textSecondary || spec.colors.primary;
    ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
    ctx.textBaseline = 'top';
    ctx.fillText(spec.role, textLeft, startY + cardH * 0.56);

    ctx.restore();
  }
  ctx.restore();
}

/**
 * Variant 4: Vertical Divider (Editorial / Broadcast Split)
 * Sleek vertical accent bar wipes downward; Name & Role slide out from behind it.
 */
export function drawVariant4(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const nameSize = spec.font.size * baseDim * scale * 1.0;
  const roleSize = nameSize * 0.6;

  const maxW = w * 0.75;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxW,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const roleText = spec.handle ? `${spec.role}  |  ${spec.handle}` : spec.role;
  const effRoleSize = fitFontSize(ctx, roleText, maxW, roleSize, spec.font.family, 600);

  const dividerW = Math.max(4, baseDim * 0.007);
  const totalH = effNameSize + effRoleSize + 16;

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  // Vertical Accent Line grows down
  const curLineH = totalH * anim.shapeProgress;
  ctx.fillStyle = spec.colors.primary;
  ctx.beginPath();
  ctx.roundRect(startX, startY, dividerW, curLineH, dividerW / 2);
  ctx.fill();

  // Text reveals from behind divider
  if (anim.textProgress > 0) {
    const slideX = (1 - anim.textProgress) * -25;
    const textX = startX + dividerW + 14 + slideX;

    ctx.save();
    // Clip right of the divider so text doesn't show to the left
    ctx.beginPath();
    ctx.rect(startX + dividerW, startY - 10, w - startX, totalH + 20);
    ctx.clip();

    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;

    // Name
    ctx.fillStyle = spec.colors.textPrimary || '#ffffff';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(spec.name, textX, startY);

    // Role
    if (roleText) {
      ctx.fillStyle = spec.colors.textSecondary || '#cbd5e1';
      ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
      ctx.fillText(roleText, textX, startY + effNameSize + 6);
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Variant 5: Slanted / Angle Ribbon (Kinetic Diagonal Tag)
 * Dynamic skewed parallelograms with high-energy kinetic reveal.
 */
export function drawVariant5(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const nameSize = spec.font.size * baseDim * scale;
  const roleSize = nameSize * 0.62;

  const maxW = w * 0.78;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxW,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const effRoleSize = fitFontSize(ctx, spec.role, maxW, roleSize, spec.font.family, 700);

  ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
  const nameW = ctx.measureText(spec.name).width;
  ctx.font = lowerThirdFont(spec.font.family, 700, effRoleSize);
  const roleW = spec.role ? ctx.measureText(spec.role).width : 0;

  const skew = -14 * (Math.PI / 180); // Slanted angle in radians
  const padX = effNameSize * 0.9;
  const h1 = effNameSize * 1.5;
  const w1 = nameW + padX * 2;
  const h2 = spec.role ? effRoleSize * 1.5 : 0;
  const w2 = Math.max(w1 * 0.8, roleW + padX * 1.8);

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  const slideIn = (1 - anim.shapeProgress) * -120;

  // Ribbon 1 (Primary Angled Parallelogram)
  ctx.save();
  ctx.translate(startX + slideIn, startY);
  ctx.transform(1, 0, Math.tan(skew), 1, 0, 0);

  ctx.fillStyle = spec.colors.primary;
  ctx.beginPath();
  ctx.roundRect(0, 0, w1 * anim.shapeProgress, h1, 3);
  ctx.fill();

  if (anim.textProgress > 0.1) {
    ctx.restore();
    ctx.save();
    ctx.translate(startX + slideIn, startY);
    // Draw text un-skewed or with slight stylistic skew
    ctx.fillStyle = spec.colors.textPrimary || '#000000';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.name, padX * 0.8, h1 / 2);
  }
  ctx.restore();

  // Ribbon 2 (Secondary Angled Parallelogram)
  if (spec.role && anim.shapeProgress > 0.12) {
    const p2 = clamp01((anim.shapeProgress - 0.12) / 0.88);
    const slide2 = (1 - p2) * -100;
    ctx.save();
    ctx.translate(startX + 12 + slide2, startY + h1 + 4);
    ctx.transform(1, 0, Math.tan(skew), 1, 0, 0);

    ctx.fillStyle = spec.colors.secondary || '#18181b';
    ctx.beginPath();
    ctx.roundRect(0, 0, w2 * p2, h2, 3);
    ctx.fill();

    if (anim.textProgress > 0.2) {
      ctx.restore();
      ctx.save();
      ctx.translate(startX + 12 + slide2, startY + h1 + 4);
      ctx.fillStyle = spec.colors.textSecondary || '#ffffff';
      ctx.font = lowerThirdFont(spec.font.family, 700, effRoleSize);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(spec.role, padX * 0.7, h2 / 2);
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Variant 6: Framed Wireframe / Minimal Corner Brackets
 * Clean technical / documentary frame with accent L-brackets.
 */
export function drawVariant6(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const nameSize = spec.font.size * baseDim * scale * 0.95;
  const roleSize = nameSize * 0.6;

  const maxW = w * 0.78;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxW,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const roleText = spec.handle ? `${spec.role}  //  ${spec.handle}` : spec.role;
  const effRoleSize = fitFontSize(ctx, roleText, maxW, roleSize, spec.font.family, 600);

  ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
  const nameW = ctx.measureText(spec.name).width;
  ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
  const roleW = roleText ? ctx.measureText(roleText).width : 0;

  const padX = 18;
  const padY = 12;
  const frameW = Math.max(nameW, roleW) + padX * 2;
  const frameH = effNameSize + effRoleSize + padY * 2 + 4;

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  const curW = frameW * anim.shapeProgress;

  // Translucent dark backdrop
  ctx.fillStyle = 'rgba(12,12,14,0.85)';
  ctx.fillRect(startX, startY, curW, frameH);

  // Corner Brackets
  const bracketLen = Math.min(16, frameH * 0.35);
  ctx.strokeStyle = spec.colors.primary;
  ctx.lineWidth = 2.5;

  if (curW > bracketLen) {
    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(startX, startY + bracketLen);
    ctx.lineTo(startX, startY);
    ctx.lineTo(startX + bracketLen, startY);
    ctx.stroke();

    // Bottom-right bracket
    const rightX = startX + curW;
    const bottomY = startY + frameH;
    ctx.beginPath();
    ctx.moveTo(rightX - bracketLen, bottomY);
    ctx.lineTo(rightX, bottomY);
    ctx.lineTo(rightX, bottomY - bracketLen);
    ctx.stroke();
  }

  // Texts
  if (anim.textProgress > 0.1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX + 4, startY, curW - 8, frameH);
    ctx.clip();

    ctx.fillStyle = spec.colors.textPrimary || '#ffffff';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(spec.name, startX + padX, startY + padY);

    if (roleText) {
      ctx.fillStyle = spec.colors.textSecondary || spec.colors.primary;
      ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
      ctx.fillText(roleText, startX + padX, startY + padY + effNameSize + 4);
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Variant 7: Dual-Tone Rounded Pill
 * Capsule with accent badge dot/monogram on left and seamless name/role typography.
 */
export function drawVariant7(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const nameSize = spec.font.size * baseDim * scale * 0.9;
  const roleSize = nameSize * 0.65;

  const maxW = w * 0.78;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxW * 0.6,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const effRoleSize = fitFontSize(ctx, spec.role, maxW * 0.4, roleSize, spec.font.family, 600);

  ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
  const nameW = ctx.measureText(spec.name).width;
  ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
  const roleW = spec.role ? ctx.measureText(spec.role).width : 0;

  const badgeSize = effNameSize * 1.3;
  const pillH = badgeSize + 14;
  const pillW = badgeSize + nameW + (roleW > 0 ? roleW + 36 : 24) + 16;

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  const curPillW = pillW * anim.shapeProgress;

  // Background capsule
  ctx.fillStyle = spec.colors.secondary || 'rgba(20,20,24,0.92)';
  ctx.beginPath();
  ctx.roundRect(startX, startY, curPillW, pillH, pillH / 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left Accent Badge (circle)
  if (curPillW >= badgeSize + 8) {
    const badgeX = startX + 7;
    const badgeY = startY + 7;
    ctx.fillStyle = spec.colors.primary;
    ctx.beginPath();
    ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Badge monogram dot or initial
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${(badgeSize * 0.45).toFixed(1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      spec.name.trim().charAt(0).toUpperCase() || 'E',
      badgeX + badgeSize / 2,
      badgeY + badgeSize / 2,
    );
  }

  // Name & Role text inside pill
  if (anim.textProgress > 0.1 && curPillW > badgeSize + 30) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX + badgeSize + 16, startY, curPillW - badgeSize - 16, pillH);
    ctx.clip();

    const textX = startX + badgeSize + 18;
    const midY = startY + pillH / 2;

    // Name
    ctx.fillStyle = spec.colors.textPrimary || '#ffffff';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.name, textX, midY);

    // Subtle divider dot & Role
    if (spec.role) {
      const roleStartX = textX + nameW + 12;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(roleStartX - 4, midY, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = spec.colors.textSecondary || spec.colors.primary;
      ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
      ctx.fillText(spec.role, roleStartX + 6, midY);
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Variant 8: Cinematic Translucent Glass Card
 * Sleek frosted glass plate with fine border and top accent line sweep.
 */
export function drawVariant8(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  anim: LowerThirdAnimState,
  w: number,
  h: number,
): void {
  const baseDim = Math.min(w, h);
  const scale = spec.scale || 1.0;
  const nameSize = spec.font.size * baseDim * scale * 1.0;
  const roleSize = nameSize * 0.58;

  const maxW = w * 0.8;
  const effNameSize = fitFontSize(
    ctx,
    spec.name,
    maxW,
    nameSize,
    spec.font.family,
    spec.font.weight,
  );
  const roleText = spec.handle ? `${spec.role}  ·  ${spec.handle}` : spec.role;
  const effRoleSize = fitFontSize(ctx, roleText, maxW, roleSize, spec.font.family, 600);

  ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
  const nameW = ctx.measureText(spec.name).width;
  ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
  const roleW = roleText ? ctx.measureText(roleText).width : 0;

  const cardW = Math.max(nameW, roleW) + 36;
  const cardH = effNameSize + effRoleSize + 24;

  const startX = spec.position.x * w;
  const startY = spec.position.y * h;

  ctx.save();
  const curCardW = cardW * anim.shapeProgress;

  // Translucent dark frosted glass plate
  ctx.fillStyle = spec.colors.secondary || 'rgba(15,15,18,0.85)';
  ctx.beginPath();
  ctx.roundRect(startX, startY, curCardW, cardH, 8);
  ctx.fill();

  // 1px Subtle Glass Border
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top Accent Bar Sweep
  ctx.fillStyle = spec.colors.primary;
  ctx.beginPath();
  ctx.roundRect(startX, startY, curCardW, 3, [8, 8, 0, 0]);
  ctx.fill();

  // Texts
  if (anim.textProgress > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX + 2, startY + 2, curCardW - 4, cardH - 4);
    ctx.clip();

    const slideX = (1 - anim.textProgress) * -16;

    // Name
    ctx.fillStyle = spec.colors.textPrimary || '#ffffff';
    ctx.font = lowerThirdFont(spec.font.family, spec.font.weight, effNameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(spec.name, startX + 18 + slideX, startY + 12);

    // Role
    if (roleText) {
      ctx.fillStyle = spec.colors.textSecondary || '#cbd5e1';
      ctx.font = lowerThirdFont(spec.font.family, 600, effRoleSize);
      ctx.fillText(roleText, startX + 18 + slideX, startY + 12 + effNameSize + 4);
    }
    ctx.restore();
  }
  ctx.restore();
}

import { renderTemplateLowerThird } from './lowerThirdRenderer';

// ─── Main Dispatcher ────────────────────────────────────────────────────────

/**
 * Draws a single lower third at timestamp `t` with resolution-independent coordinates.
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  spec: LowerThirdSpec,
  t: number,
  w: number,
  h: number,
  photoImage?: CanvasImageSource | null,
): void {
  // If a data-driven non-classic templateId is specified, render via template renderer
  if (spec.templateId && !spec.templateId.startsWith('classic-')) {
    renderTemplateLowerThird(ctx, spec, t, w, h, { photoImage });
    return;
  }

  const anim = getLowerThirdPhase(spec, t);
  if (!anim.active || anim.opacity <= 0.001) return;

  ctx.save();
  ctx.globalAlpha = anim.opacity;

  switch (spec.variant) {
    case 1:
      drawVariant1(ctx, spec, anim, w, h);
      break;
    case 2:
      drawVariant2(ctx, spec, anim, w, h);
      break;
    case 3:
      drawVariant3(ctx, spec, anim, w, h, photoImage);
      break;
    case 4:
      drawVariant4(ctx, spec, anim, w, h);
      break;
    case 5:
      drawVariant5(ctx, spec, anim, w, h);
      break;
    case 6:
      drawVariant6(ctx, spec, anim, w, h);
      break;
    case 7:
      drawVariant7(ctx, spec, anim, w, h);
      break;
    case 8:
      drawVariant8(ctx, spec, anim, w, h);
      break;
    default:
      drawVariant1(ctx, spec, anim, w, h);
      break;
  }

  ctx.restore();
}

/**
 * Renders all active lower thirds onto the canvas at timestamp `t`.
 */
export function renderLowerThirds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  lowerThirds: LowerThirdSpec[] | undefined,
  photoCache?: Map<string, HTMLImageElement>,
): void {
  if (!lowerThirds || lowerThirds.length === 0) return;

  for (const lt of lowerThirds) {
    if (t >= lt.start && t <= lt.end) {
      let photoImg: HTMLImageElement | null = null;
      if (photoCache && lt.photoBlobId) {
        photoImg = photoCache.get(lt.photoBlobId) || null;
      }
      draw(ctx, lt, t, w, h, photoImg);
    }
  }
}
