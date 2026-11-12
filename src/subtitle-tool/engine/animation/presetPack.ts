// ─── Motion Preset Packs — Epic Hertz Studio ────────────────────────────────
// Installable JSON packs so animation recipes can be authored, shared and
// dropped into the app without shipping code. Packs only describe values the
// engine already understands, so imported files cannot inject code.

import { z } from 'zod';

export const MOTION_PACK_FORMAT = 'epic-hertz-motion-pack';
export const MOTION_PACK_VERSION = 1;

const ENTRANCE_TYPES = [
  'fade',
  'slide-up',
  'slide-left',
  'slide-right',
  'scale-pop',
  'rotate-in',
  'blur-in',
  'typewriter',
  'bounce-in',
  'wave',
  'flip-in',
  'drop-in',
  'clip-reveal',
  'elastic-pop',
  'rack-focus',
  'tracking-in',
] as const;

const EXIT_TYPES = [
  'fade',
  'slide-down',
  'slide-up',
  'slide-left',
  'slide-right',
  'scale-out',
  'blur-out',
  'clip-hide',
  'typewriter-erase',
  'drop-out',
  'glitch-out',
] as const;

const EMPHASIS_TYPES = [
  'pop',
  'shake',
  'glow-pulse',
  'underline-draw',
  'highlight-box-sweep',
  'color-flip',
  'scale-slam',
  'wobble',
  'hop',
] as const;

const EASINGS = [
  'linear',
  'easeOutQuad',
  'easeOutCubic',
  'easeInOutCubic',
  'easeOutExpo',
  'easeOutBack',
  'easeOutElastic',
  'easeOutBounce',
  'spring',
] as const;

const paramsSchema = z.record(z.string(), z.union([z.number(), z.string(), z.boolean()]));

const motionSchema = z
  .object({
    in: z.string().min(1).max(32).optional(),
    out: z.string().min(1).max(32).optional(),
    entranceType: z.enum(ENTRANCE_TYPES).optional(),
    exitType: z.enum(EXIT_TYPES).optional(),
    inMs: z.number().min(1).max(2000).optional(),
    outMs: z.number().min(0).max(2000).optional(),
    stagger: z.number().min(0).max(500).optional(),
    unit: z.enum(['line', 'word', 'char']).optional(),
    bounce: z.number().min(0).max(1).optional(),
    easing: z.enum(EASINGS).optional(),
    entranceParams: paramsSchema.optional(),
    exitParams: paramsSchema.optional(),
  })
  .strict();

const highlightSchema = z
  .object({
    mode: z.enum(['none', 'color', 'box', 'underline', 'sweep']).optional(),
    color: z.string().min(1).max(60).optional(),
    textColor: z.string().min(1).max(60).optional(),
    keep: z.boolean().optional(),
    scale: z.number().min(0.5).max(3).optional(),
    boxPadX: z.number().min(0).max(1).optional(),
    boxPadY: z.number().min(0).max(1).optional(),
    boxRadius: z.number().min(0).max(1).optional(),
    emphasisType: z.enum(EMPHASIS_TYPES).optional(),
    emphasisParams: paramsSchema.optional(),
  })
  .strict();

export const motionPackPresetSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9][a-z0-9-]*$/, 'Preset ids use lowercase letters, numbers and dashes.'),
    name: z.string().min(1).max(40),
    hint: z.string().min(1).max(120),
    group: z.enum(['entrance', 'exit', 'highlight']),
    motion: motionSchema.optional(),
    highlight: highlightSchema.optional(),
  })
  .strict()
  .superRefine((preset, ctx) => {
    if (preset.group === 'entrance' && !preset.motion?.in) {
      ctx.addIssue({ code: 'custom', message: `Entrance preset "${preset.id}" needs motion.in` });
    }
    if (preset.group === 'exit' && !preset.motion?.out) {
      ctx.addIssue({ code: 'custom', message: `Exit preset "${preset.id}" needs motion.out` });
    }
    if (preset.group === 'highlight' && !preset.highlight) {
      ctx.addIssue({
        code: 'custom',
        message: `Highlight preset "${preset.id}" needs a highlight block`,
      });
    }
  });

export const motionPackSchema = z.object({
  app: z.string().max(60).optional().default('Epic Hertz Studio'),
  format: z.literal(MOTION_PACK_FORMAT),
  version: z.number().int().min(1).max(MOTION_PACK_VERSION).default(MOTION_PACK_VERSION),
  name: z.string().min(1).max(60),
  author: z.string().max(60).optional(),
  exportedAt: z.string().max(40).optional(),
  presets: z.array(motionPackPresetSchema).min(1).max(200),
});

export type MotionPackPreset = z.infer<typeof motionPackPresetSchema>;
export type MotionPack = z.infer<typeof motionPackSchema>;

export type MotionPackParseResult =
  { ok: true; pack: MotionPack } | { ok: false; errors: string[] };

const MAX_PACK_BYTES = 512_000;

function stripUnsafeKeys(key: string, value: unknown) {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
  return value;
}

function zodErrors(error: z.ZodError): string[] {
  return error.issues.slice(0, 5).map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

/** Validate a pack file. Accepts the full envelope or a bare preset array. */
export function parseMotionPresetPack(input: string): MotionPackParseResult {
  if (typeof input !== 'string' || !input.trim()) {
    return { ok: false, errors: ['The pack file is empty.'] };
  }
  if (input.length > MAX_PACK_BYTES) {
    return { ok: false, errors: ['Pack files must stay under 500 KB.'] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(input, stripUnsafeKeys);
  } catch {
    return { ok: false, errors: ['That file is not valid JSON.'] };
  }

  const envelope =
    Array.isArray(raw) && raw.length > 0
      ? { format: MOTION_PACK_FORMAT, name: 'Imported pack', presets: raw }
      : raw;

  const parsed = motionPackSchema.safeParse(envelope);
  if (!parsed.success) {
    return { ok: false, errors: zodErrors(parsed.error) };
  }

  const ids = new Set<string>();
  for (const preset of parsed.data.presets) {
    if (ids.has(preset.id)) {
      return { ok: false, errors: [`Duplicate preset id "${preset.id}" in this pack.`] };
    }
    ids.add(preset.id);
  }

  return { ok: true, pack: parsed.data };
}

export function serializeMotionPresetPack(pack: {
  name: string;
  author?: string;
  presets: MotionPackPreset[];
}): string {
  return JSON.stringify(
    {
      app: 'Epic Hertz Studio',
      format: MOTION_PACK_FORMAT,
      version: MOTION_PACK_VERSION,
      name: pack.name,
      author: pack.author,
      exportedAt: new Date().toISOString(),
      presets: pack.presets,
    },
    null,
    2,
  );
}

/** Build a shareable pack from the built-in library. */
export function buildPackFromBuiltins(
  entrance: Array<{ id: string; name: string; hint: string; motion: unknown }>,
  exits: Array<{ id: string; name: string; hint: string; motion: unknown }>,
  highlights: Array<{ id: string; name: string; hint: string; highlight: unknown }>,
): MotionPackPreset[] {
  return [
    ...entrance.map((p) => ({
      id: p.id,
      name: p.name,
      hint: p.hint,
      group: 'entrance' as const,
      motion: p.motion as MotionPackPreset['motion'],
    })),
    ...exits.map((p) => ({
      id: p.id,
      name: p.name,
      hint: p.hint,
      group: 'exit' as const,
      motion: p.motion as MotionPackPreset['motion'],
    })),
    ...highlights.map((p) => ({
      id: p.id,
      name: p.name,
      hint: p.hint,
      group: 'highlight' as const,
      highlight: p.highlight as MotionPackPreset['highlight'],
    })),
  ];
}
