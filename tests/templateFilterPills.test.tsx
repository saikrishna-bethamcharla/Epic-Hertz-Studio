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

import LibraryStylesTab from '../src/subtitle-tool/v2/library/LibraryStylesTab';
import LibraryPanel from '../src/subtitle-tool/v2/LibraryPanel';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment, LowerThirdSpec } from '../src/subtitle-tool/types';
import type { UserPreset } from '../src/subtitle-tool/v2/userPresets';

const mockSegment: Segment = {
  id: 'seg-1',
  index: 1,
  start: 0,
  end: 3.0,
  text: 'Sample test subtitle',
};

const mockUserPresets: UserPreset[] = [
  {
    id: 'user-p1',
    name: 'My Custom Brand Style',
    category: 'Custom',
    style: { ...DEFAULT_STYLE, id: 'user-p1', name: 'My Custom Brand Style' },
    createdAt: Date.now(),
  },
  {
    id: 'user-p2',
    name: 'My Cinematic Glow',
    category: 'Cinematic',
    style: { ...DEFAULT_STYLE, id: 'user-p2', name: 'My Cinematic Glow' },
    createdAt: Date.now(),
  },
];

describe('Template Category Filter Pills (All, Cinematic, Premium, Yours, Favourites)', () => {
  it('renders all 5 category pills in LibraryStylesTab', () => {
    render(
      <LibraryStylesTab
        style={DEFAULT_STYLE}
        sampleSegment={mockSegment}
        userPresetsList={mockUserPresets}
        favorites={['pulse', 'block']}
        onFavoritesChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /^all$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^cinematic$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^premium$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^yours$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^favourites$/i })).toBeDefined();
  });

  it('filters to user presets when "Yours" pill is clicked', () => {
    render(
      <LibraryStylesTab
        style={DEFAULT_STYLE}
        sampleSegment={mockSegment}
        userPresetsList={mockUserPresets}
        favorites={[]}
        onFavoritesChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    const yoursBtn = screen.getByRole('button', { name: /^yours$/i });
    fireEvent.click(yoursBtn);

    // Should display the user presets
    expect(screen.getByText('My Custom Brand Style')).toBeDefined();
    expect(screen.getByText('My Cinematic Glow')).toBeDefined();
  });

  it('filters to favorited items when "Favourites" pill is clicked', () => {
    render(
      <LibraryStylesTab
        style={DEFAULT_STYLE}
        sampleSegment={mockSegment}
        userPresetsList={mockUserPresets}
        favorites={['user-p1']}
        onFavoritesChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    const favsBtn = screen.getByRole('button', { name: /^favourites$/i });
    fireEvent.click(favsBtn);

    expect(screen.getByText('My Custom Brand Style')).toBeDefined();
    expect(screen.queryByText('My Cinematic Glow')).toBeNull();
  });

  it('filters to Cinematic category when "Cinematic" pill is clicked', () => {
    render(
      <LibraryStylesTab
        style={DEFAULT_STYLE}
        sampleSegment={mockSegment}
        userPresetsList={mockUserPresets}
        favorites={[]}
        onFavoritesChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    const cinBtn = screen.getByRole('button', { name: /^cinematic$/i });
    fireEvent.click(cinBtn);

    // Active pill should have highlight classes
    expect(cinBtn.className).toContain('bg-[#FFB800]');
  });
});

describe('Single Text Overlays Feature in LibraryPanel', () => {
  it('adds Person / Speaker overlay at current playhead on the overlay track', () => {
    const handleAddLowerThird = vi.fn();
    render(
      <LibraryPanel
        leftTab="addText"
        onTabChange={vi.fn()}
        segments={[mockSegment]}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
        currentTime={4.2}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    const personBtn = screen.getByRole('button', { name: /person \/ speaker/i });
    expect(personBtn).toBeDefined();
    fireEvent.click(personBtn);

    expect(handleAddLowerThird).toHaveBeenCalledTimes(1);
    const addedSpec: LowerThirdSpec = handleAddLowerThird.mock.calls[0][0];
    expect(addedSpec.start).toBe(4.2);
    expect(addedSpec.name).toBe('Speaker Name');
    expect(addedSpec.position.y).toBe(0.82);
  });

  it('adds Topic / Header overlay at top position', () => {
    const handleAddLowerThird = vi.fn();
    render(
      <LibraryPanel
        leftTab="addText"
        onTabChange={vi.fn()}
        segments={[mockSegment]}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
        currentTime={1.5}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    const topicBtn = screen.getByRole('button', { name: /topic \/ header/i });
    fireEvent.click(topicBtn);

    expect(handleAddLowerThird).toHaveBeenCalledTimes(1);
    const addedSpec: LowerThirdSpec = handleAddLowerThird.mock.calls[0][0];
    expect(addedSpec.name).toBe('TOPIC NAME');
    expect(addedSpec.position.y).toBe(0.12);
  });

  it('adds Callout / Quote overlay at center position', () => {
    const handleAddLowerThird = vi.fn();
    render(
      <LibraryPanel
        leftTab="addText"
        onTabChange={vi.fn()}
        segments={[mockSegment]}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
        currentTime={3.0}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    const calloutBtn = screen.getByRole('button', { name: /callout \/ quote/i });
    fireEvent.click(calloutBtn);

    expect(handleAddLowerThird).toHaveBeenCalledTimes(1);
    const addedSpec: LowerThirdSpec = handleAddLowerThird.mock.calls[0][0];
    expect(addedSpec.name).toBe('KEY TAKEAWAY');
    expect(addedSpec.position.y).toBe(0.5);
  });
});
