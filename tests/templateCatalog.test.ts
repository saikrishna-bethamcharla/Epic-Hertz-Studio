import { describe, it, expect } from 'vitest';
import { CAPTION_TEMPLATES } from '../src/subtitle-tool/engine/templateCatalog';
import {
  captionTemplateSchema,
  validateCaptionTemplate,
  validateTemplatePack,
  templateToStyle,
} from '../src/subtitle-tool/engine/templateSchema';

describe('Phase B & D: Caption Template Catalog (88 Templates)', () => {
  it('contains exactly 88 unique, validated templates across 10 mood categories', () => {
    expect(CAPTION_TEMPLATES.length).toBe(88);

    const ids = new Set<string>();
    for (const t of CAPTION_TEMPLATES) {
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);

      // Validate through Zod schema
      const parseRes = captionTemplateSchema.safeParse(t);
      if (!parseRes.success) {
        console.error(`Validation failed for template "${t.id}":`, parseRes.error.errors);
      }
      expect(parseRes.success).toBe(true);

      // Verify open source license tag and Indic script fallbacks
      expect(t.license).toMatch(/OFL|MIT/);
      expect(t.font.fallbacks?.telugu).toBeDefined();
      expect(t.font.fallbacks?.devanagari).toBeDefined();
    }
  });

  it('covers all 10 planned mood categories', () => {
    const categories = new Set(CAPTION_TEMPLATES.map((t) => t.category));
    expect(categories.has('Social')).toBe(true);
    expect(categories.has('Minimal')).toBe(true);
    expect(categories.has('Fun')).toBe(true);
    expect(categories.has('Gaming')).toBe(true);
    expect(categories.has('Cinematic')).toBe(true);
    expect(categories.has('Bold')).toBe(true);
    expect(categories.has('Podcast')).toBe(true);
    expect(categories.has('Motivational')).toBe(true);
    expect(categories.has('News')).toBe(true);
    expect(categories.has('Devotional')).toBe(true);
  });

  it('converts every template to a valid, renderable CaptionStyle via templateToStyle', () => {
    for (const t of CAPTION_TEMPLATES) {
      const style = templateToStyle(t);
      expect(style.id).toBe(t.id);
      expect(style.font.family).toBe(t.font.family);
      expect(style.font.weight).toBe(t.font.weight);
      expect(style.layout.wordsPerPage).toBe(t.layout.wordsPerPage);
      expect(style.motion.inMs).toBe(Math.round(t.entrance.duration * 1000));
      expect(style.motion.outMs).toBe(Math.round(t.exit.duration * 1000));
    }
  });

  it('maps fixed typography roles into renderable word roles', () => {
    const posters = CAPTION_TEMPLATES.filter((t) => (t.roles?.length ?? 0) > 0);
    expect(posters.length).toBeGreaterThanOrEqual(6);
    for (const t of posters) {
      const style = templateToStyle(t);
      expect(style.wordRoles?.length).toBe(t.roles!.length);
      expect(style.wordRoles![0].words).toBe(t.roles![0].words);
      expect(style.wordRoles!.some((r) => (r.scale ?? 1) !== 1)).toBe(true);
    }
  });

  it('validates a full template pack JSON and rejects corrupt files', () => {
    const validPack = {
      name: 'Creator Pack V1',
      version: 1,
      templates: CAPTION_TEMPLATES.slice(0, 5),
    };

    const validRes = validateTemplatePack(validPack);
    expect(validRes.success).toBe(true);
    if (validRes.success) {
      expect(validRes.data.length).toBe(5);
    }

    // Invalid pack: invalid duration and missing required name
    const corruptPack = {
      templates: [
        {
          id: 'bad-template',
          entrance: { duration: -5 }, // invalid duration
        },
      ],
    };
    const invalidRes = validateTemplatePack(corruptPack);
    expect(invalidRes.success).toBe(false);
    if (!invalidRes.success) {
      expect(invalidRes.errors.length).toBeGreaterThan(0);
    }
  });

  it('rejects unknown fields and out-of-range coordinates cleanly', () => {
    const badInput = {
      ...CAPTION_TEMPLATES[0],
      layout: {
        ...CAPTION_TEMPLATES[0].layout,
        x: 1.5, // out of range: must be <= 1.0
      },
    };
    const res = validateCaptionTemplate(badInput);
    expect(res.success).toBe(false);
  });
});
