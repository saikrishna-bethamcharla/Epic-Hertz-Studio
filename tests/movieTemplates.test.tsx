// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () =>
      ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        rect: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        drawImage: vi.fn(),
        clip: vi.fn(),
      }) as any,
  );
});

import { CAPTION_TEMPLATES } from '../src/subtitle-tool/engine/templateCatalog';
import { captionTemplateSchema, templateToStyle } from '../src/subtitle-tool/engine/templateSchema';
import LibraryMovieStylesTab from '../src/subtitle-tool/v2/library/LibraryMovieStylesTab';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment } from '../src/subtitle-tool/types';

const sampleSegment: Segment = {
  id: 'test-seg',
  index: 1,
  start: 0,
  end: 2.5,
  text: 'Sample Movie Title',
  words: [
    { word: 'Sample', start: 0, end: 0.8 },
    { word: 'Movie', start: 0.8, end: 1.6 },
    { word: 'Title', start: 1.6, end: 2.5 },
  ],
};

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

  it('renders dedicated LibraryMovieStylesTab with 20 cards and applies preset on click', () => {
    const handleApply = vi.fn();
    render(
      <LibraryMovieStylesTab
        style={DEFAULT_STYLE}
        sampleSegment={sampleSegment}
        favorites={[]}
        onFavoritesChange={vi.fn()}
        onApplyPreset={handleApply}
      />,
    );

    // Verify header and 20 styles count badge
    expect(screen.getByText(/Movie Style Text Templates/i)).toBeDefined();
    expect(screen.getByText(/20 styles/i)).toBeDefined();

    // Verify filter buttons exist
    expect(screen.getByRole('button', { name: /All \(20\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Action & Trailer/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Noir & Drama/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Sci-Fi & Cyber/i })).toBeDefined();

    // Verify specific movie templates are rendered
    expect(screen.getByText('Blockbuster Trailer')).toBeDefined();
    expect(screen.getByText('Film Noir Classic')).toBeDefined();
    expect(screen.getByText('Sci-Fi Odyssey')).toBeDefined();

    // Click on Blockbuster Trailer card
    fireEvent.click(screen.getByText('Blockbuster Trailer'));
    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(handleApply.mock.calls[0][1]).toBe('Blockbuster Trailer');
  });
});
