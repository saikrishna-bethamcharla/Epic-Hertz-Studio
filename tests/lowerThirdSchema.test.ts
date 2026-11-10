// ─── Lower Third Template Schema & Validation Suite — Phase B ─────────────────
import { describe, it, expect } from 'vitest';
import {
  CLASSIC_TEMPLATES,
  CLASSIC_VARIANT_MAP,
  variantToTemplateId,
  templateIdToVariant,
  validateLowerThirdTemplate,
  validateLowerThirdPack,
  normalizeLowerThirdSpec,
  type LowerThirdTemplate,
} from '../src/subtitle-tool/engine/lowerThirdSchema';
import type { LowerThirdVariant } from '../src/subtitle-tool/engine/spec';

describe('Phase B: Lower Third Template Schema & Validation', () => {
  it('validates all 8 Classic Pack templates against Zod schema', () => {
    expect(CLASSIC_TEMPLATES).toHaveLength(8);

    for (const template of CLASSIC_TEMPLATES) {
      const validated = validateLowerThirdTemplate(template);
      expect(validated.id).toBe(template.id);
      expect(validated.packId).toBe('classic');
      expect(validated.elements.length).toBeGreaterThan(0);
      expect(validated.slots.length).toBeGreaterThan(0);
      expect(validated.autoFit.minScale).toBeGreaterThan(0);
    }
  });

  it('rejects invalid template definitions with clear Zod errors', () => {
    // Missing required id
    expect(() =>
      validateLowerThirdTemplate({
        packId: 'test',
        name: 'Invalid Template',
      }),
    ).toThrow();

    // Invalid characters in template ID
    expect(() =>
      validateLowerThirdTemplate({
        ...CLASSIC_TEMPLATES[0],
        id: 'bad id with spaces!',
      }),
    ).toThrow();

    // Invalid easing name
    expect(() =>
      validateLowerThirdTemplate({
        ...CLASSIC_TEMPLATES[0],
        elements: [
          {
            ...CLASSIC_TEMPLATES[0].elements[0],
            animation: {
              ...CLASSIC_TEMPLATES[0].elements[0].animation,
              in: {
                ...CLASSIC_TEMPLATES[0].elements[0].animation.in,
                easing: 'invalidEaseCurve' as any,
              },
            },
          },
        ],
      }),
    ).toThrow();
  });

  it('defends against prototype pollution attempts in pack imports', () => {
    const maliciousPayload = JSON.parse(
      '{"packId":"hacked","name":"Exploit","templates":[],"__proto__":{"polluted":true}}',
    );
    expect(() => validateLowerThirdPack(maliciousPayload)).toThrow(/prototype pollution/i);
  });

  it('enforces 2 MB size limit and 100 templates cap on packs', () => {
    // 1. Template cap > 100
    const oversizedList: LowerThirdTemplate[] = [];
    for (let i = 0; i < 105; i++) {
      oversizedList.push({
        ...CLASSIC_TEMPLATES[0],
        id: `template-overflow-${i}`,
      });
    }

    expect(() =>
      validateLowerThirdPack({
        packId: 'large-pack',
        name: 'Large Pack',
        templates: oversizedList,
      }),
    ).toThrow(/limit of 100 templates/i);

    // 2. Payload size > 2MB
    const bigString = 'x'.repeat(2.2 * 1024 * 1024);
    expect(() =>
      validateLowerThirdPack({
        packId: 'huge-pack',
        name: 'Huge Pack',
        description: bigString,
        templates: [],
      }),
    ).toThrow(/exceeds maximum allowed size of 2 MB/i);
  });

  it('bidirectionally maps all 8 classic variants to template IDs', () => {
    const variants: LowerThirdVariant[] = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const v of variants) {
      const templateId = variantToTemplateId(v);
      expect(templateId).toBe(CLASSIC_VARIANT_MAP[v]);
      expect(templateIdToVariant(templateId)).toBe(v);
    }

    // Fallbacks
    expect(variantToTemplateId(99 as any)).toBe('classic-box-highlight');
    expect(templateIdToVariant('unknown-id')).toBe(1);
  });

  it('normalizeLowerThirdSpec populates templateId from legacy variant', () => {
    const legacy = {
      variant: 4,
      name: 'Anand Kumar',
      role: 'Educator',
    };

    const normalized = normalizeLowerThirdSpec(legacy);
    expect(normalized.templateId).toBe('classic-vertical-divider');
    expect(normalized.variant).toBe(4);
    expect(normalized.name).toBe('Anand Kumar');
    expect(normalized.font.family).toBe('unbounded');
    expect(normalized.scale).toBe(1.0);
  });

  it('normalizeLowerThirdSpec populates variant from templateId', () => {
    const modern = {
      templateId: 'classic-dual-tone-pill',
      name: 'Sunita Rao',
      role: 'Astronomer',
    };

    const normalized = normalizeLowerThirdSpec(modern);
    expect(normalized.templateId).toBe('classic-dual-tone-pill');
    expect(normalized.variant).toBe(7);
    expect(normalized.name).toBe('Sunita Rao');
  });
});
