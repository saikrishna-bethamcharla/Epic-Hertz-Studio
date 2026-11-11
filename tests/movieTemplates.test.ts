import { describe, it, expect } from 'vitest';
import { CAPTION_TEMPLATES } from '../src/subtitle-tool/engine/templateCatalog';
import { captionTemplateSchema, templateToStyle } from '../src/subtitle-tool/engine/templateSchema';

describe('Movie Style Text Templates Suite (20 Cinematic Presets)', () => {
  const cinematicTemplates = CAPTION_TEMPLATES.filter((t) => t.category === 'Cinematic');

  it('contains exactly 20 rich cinematic movie text templates', () => {
    expect(cinematicTemplates.length).toBe(20);
  });

  it('validates every cinematic template through captionTemplateSchema with zero errors', () => {
    for (const t of cinematicTemplates) {
      const res = captionTemplateSchema.safeParse(t);
      if (!res.success) {
        console.error(`Validation failed for cinematic template ${t.id}:`, res.error.errors);
      }
      expect(res.success).toBe(true);
      expect(t.category).toBe('Cinematic');
      expect(t.font.fallbacks?.telugu).toBeDefined();
      expect(t.font.fallbacks?.devanagari).toBeDefined();
      expect(t.font.fallbacks?.tamil).toBeDefined();
    }
  });

  it('includes key movie styles requested by creators', () => {
    const ids = cinematicTemplates.map((t) => t.id);
    expect(ids).toContain('blockbuster-trailer');
    expect(ids).toContain('film-noir-classic');
    expect(ids).toContain('scifi-odyssey');
    expect(ids).toContain('vintage-35mm');
    expect(ids).toContain('hollywood-gold-title');
    expect(ids).toContain('neo-tokyo-cyber');
    expect(ids).toContain('arthouse-minimal');
    expect(ids).toContain('fincher-thriller');
    expect(ids).toContain('cinema-letterbox');
    expect(ids).toContain('epic-chronicle');
    expect(ids).toContain('retro-vhs-80s');
    expect(ids).toContain('documentary-pro');
    expect(ids).toContain('silent-era');
    expect(ids).toContain('blockbuster-yellow');
    expect(ids).toContain('gold-cinema');
    expect(ids).toContain('silver-cinema');
  });

  it('converts all cinematic templates into executable CaptionStyles', () => {
    for (const t of cinematicTemplates) {
      const style = templateToStyle(t);
      expect(style.id).toBe(t.id);
      expect(style.font.family).toBe(t.font.family);
      expect(style.motion.inMs).toBeGreaterThan(0);
      expect(style.motion.outMs).toBeGreaterThan(0);
    }
  });
});
