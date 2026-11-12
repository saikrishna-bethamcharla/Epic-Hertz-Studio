// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () =>
      ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
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

import { LibraryTitleCardsTab } from '../src/subtitle-tool/v2/library/LibraryTitleCardsTab';
import { TITLE_CARD_STYLES } from '../src/subtitle-tool/engine/titleCardCatalog';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment } from '../src/subtitle-tool/types';

const mockSampleSegment: Segment = {
  id: 'seg-1',
  index: 1,
  start: 0,
  end: 2.5,
  text: 'EPIC TITLE PREVIEW',
  words: [
    { word: 'EPIC', start: 0, end: 0.8 },
    { word: 'TITLE', start: 0.8, end: 1.6 },
    { word: 'PREVIEW', start: 1.6, end: 2.5 },
  ],
};

describe('LibraryTitleCardsTab — Text Caption Style Integration', () => {
  it('renders all 14 title cards as caption style presets', () => {
    render(
      <LibraryTitleCardsTab
        style={DEFAULT_STYLE}
        sampleSegment={mockSampleSegment}
        favorites={[]}
        onFavoritesChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    expect(TITLE_CARD_STYLES.length).toBe(14);

    // Verify key MOGRT and cinematic title card names are present
    expect(screen.getByText('Spin & Twist')).toBeDefined();
    expect(screen.getByText('Mirror Splash')).toBeDefined();
    expect(screen.getByText('Cinema Serif')).toBeDefined();
    expect(screen.getByText('Epic Display')).toBeDefined();
    expect(screen.getByText('Gold Chapter')).toBeDefined();
    expect(screen.getByText('Film Noir')).toBeDefined();
    expect(screen.getByText('Cyberpunk HUD')).toBeDefined();
    expect(screen.getByText('Classic Credits')).toBeDefined();
  });

  it('applies title card preset directly to caption styles on click without adding lower thirds', () => {
    const handleApplyPreset = vi.fn();
    const handleNotification = vi.fn();

    render(
      <LibraryTitleCardsTab
        style={DEFAULT_STYLE}
        sampleSegment={mockSampleSegment}
        favorites={[]}
        onFavoritesChange={vi.fn()}
        onApplyPreset={handleApplyPreset}
        onNotification={handleNotification}
      />,
    );

    // Click on "Spin & Twist"
    const spinTwistCard = screen.getByText('Spin & Twist');
    fireEvent.click(spinTwistCard);

    expect(handleApplyPreset).toHaveBeenCalledTimes(1);
    const [appliedStyle, appliedName] = handleApplyPreset.mock.calls[0];
    expect(appliedName).toBe('Spin & Twist');
    expect(appliedStyle.id).toBe('spin-and-twist');
    expect(handleNotification).toHaveBeenCalledWith(
      'Applied "Spin & Twist" title style to captions',
    );
  });

  it('filters title card presets by search term', () => {
    render(
      <LibraryTitleCardsTab
        style={DEFAULT_STYLE}
        sampleSegment={mockSampleSegment}
        favorites={[]}
        onFavoritesChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search title cards/i);
    fireEvent.change(searchInput, { target: { value: 'splash' } });

    expect(screen.getByText('Mirror Splash')).toBeDefined();
    expect(screen.queryByText('Cinema Serif')).toBeNull();
  });
});
