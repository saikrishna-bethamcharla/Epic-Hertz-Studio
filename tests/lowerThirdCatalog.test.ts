// ─── Lower Third 48-Template Catalog & Pack Suite — Phase D ──────────────────
import { describe, it, expect } from 'vitest';
import {
  ALL_PACK_TEMPLATES,
  LOWER_THIRD_PACKS,
  CLEAN_CORPORATE_TEMPLATES,
  CREATOR_REELS_TEMPLATES,
  NEWS_BROADCAST_TEMPLATES,
  CINEMATIC_DOC_TEMPLATES,
  GAMING_TECH_TEMPLATES,
  INDIC_PACK_TEMPLATES,
} from '../src/subtitle-tool/engine/lowerThirdPacks';
import {
  validateLowerThirdTemplate,
  validateLowerThirdPack,
} from '../src/subtitle-tool/engine/lowerThirdSchema';
import { renderTemplateLowerThird } from '../src/subtitle-tool/engine/lowerThirdRenderer';
import { DEFAULT_LOWER_THIRD, type LowerThirdSpec } from '../src/subtitle-tool/engine/spec';
import { createRecorderCanvasContext } from './goldenLowerThirds.test';

describe('Phase D: Lower Third 60-Template Catalog & Distinctness Suite', () => {
  it('contains exactly 8 packs with 74 templates total', () => {
    expect(LOWER_THIRD_PACKS).toHaveLength(8);
    expect(ALL_PACK_TEMPLATES).toHaveLength(74);

    expect(CLEAN_CORPORATE_TEMPLATES).toHaveLength(8);
    expect(CREATOR_REELS_TEMPLATES).toHaveLength(8);
    expect(NEWS_BROADCAST_TEMPLATES).toHaveLength(8);
    expect(CINEMATIC_DOC_TEMPLATES).toHaveLength(8);
    expect(GAMING_TECH_TEMPLATES).toHaveLength(8);
    expect(INDIC_PACK_TEMPLATES).toHaveLength(8);
  });

  it('validates every single template in the 60-catalog against Zod schema', () => {
    const ids = new Set<string>();

    for (const template of ALL_PACK_TEMPLATES) {
      expect(ids.has(template.id)).toBe(false); // ID uniqueness
      ids.add(template.id);

      const validated = validateLowerThirdTemplate(template);
      expect(validated.id).toBe(template.id);
      expect(validated.elements.length).toBeGreaterThan(0);
      expect(validated.autoFit.minScale).toBeGreaterThanOrEqual(0.2);
    }

    expect(ids.size).toBe(74);
  });

  it('validates all 8 packs through validateLowerThirdPack', () => {
    for (const pack of LOWER_THIRD_PACKS) {
      const validated = validateLowerThirdPack(pack);
      expect(validated.id).toBe(pack.id);
      if (pack.id === 'modern') {
        expect(validated.templates).toHaveLength(12);
      } else if (pack.id === 'title-end') {
        expect(validated.templates).toHaveLength(14);
      } else {
        expect(validated.templates).toHaveLength(8);
      }
    }
  });

  it('enforces design constraints: only generic Lucide icons, no emojis', () => {
    const allowedIcons = new Set(['user', 'mic', 'map-pin', 'at-sign', 'calendar', 'tag']);
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

    for (const template of ALL_PACK_TEMPLATES) {
      expect(emojiRegex.test(template.name)).toBe(false);
      for (const elem of template.elements) {
        if (elem.type === 'icon') {
          expect(elem.content).toBeDefined();
          expect(allowedIcons.has(elem.content!)).toBe(true);
        }
      }
    }
  });

  it('proves distinctness: no two templates produce identical draw operations at mid-intro', () => {
    const signatures = new Map<string, string>();
    const W = 1080;
    const H = 1920;
    const midIntroTime = 1.35; // t = 1.0 + 0.35s

    for (const template of ALL_PACK_TEMPLATES) {
      const spec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: `spec-${template.id}`,
        templateId: template.id,
        name: 'DR. SARABHAI',
        role: 'CHIEF ARCHITECT',
        start: 1.0,
        end: 5.0,
      };

      const ctx = createRecorderCanvasContext();
      renderTemplateLowerThird(
        ctx as unknown as CanvasRenderingContext2D,
        spec,
        midIntroTime,
        W,
        H,
      );

      const serialized = ctx.log
        .map(
          (op) =>
            `${op.op}:${op.args.join(',')}|${op.fillStyle || ''}|${op.strokeStyle || ''}|${op.globalAlpha !== undefined ? Math.round(op.globalAlpha * 100) / 100 : ''}`,
        )
        .join(';');

      expect(signatures.has(serialized)).toBe(false);
      signatures.set(serialized, template.id);
    }

    expect(signatures.size).toBe(74);
  });
});
