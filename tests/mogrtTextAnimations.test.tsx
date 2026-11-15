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

import LibraryPanel from '../src/subtitle-tool/v2/LibraryPanel';
import LowerThirdInspector from '../src/subtitle-tool/v2/inspector/LowerThirdInspector';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import { DEFAULT_LOWER_THIRD } from '../src/subtitle-tool/types';
import type { Segment, LowerThirdSpec } from '../src/subtitle-tool/types';

const mockSegments: Segment[] = [
  { id: 'seg-1', index: 1, start: 1.0, end: 3.0, text: 'Sample text' },
];

describe('Authentic MOGRT Text Animations in Text Section', () => {
  it('renders Spin & Twist and Mirror Splash under MOGRT Animations in Text section', () => {
    const handleAddLowerThird = vi.fn();

    render(
      <LibraryPanel
        leftTab="addText"
        onTabChange={vi.fn()}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="captions"
        scope="all"
        currentTime={2.5}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    // Verify section heading and badge
    expect(screen.getByText('MOGRT Animations')).toBeDefined();
    expect(screen.getByText('NON-CUSTOMIZABLE')).toBeDefined();

    // Verify buttons
    const spinTwistBtn = screen.getByRole('button', { name: /spin & twist/i });
    expect(spinTwistBtn).toBeDefined();

    const mirrorSplashBtn = screen.getByRole('button', { name: /mirror splash/i });
    expect(mirrorSplashBtn).toBeDefined();

    // Click Spin & Twist
    fireEvent.click(spinTwistBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(1);
    const spinCall = handleAddLowerThird.mock.calls[0][0] as LowerThirdSpec;
    expect(spinCall.templateId).toBe('mogrt-spin-twist');
    expect(spinCall.name).toBe('MOTION');
    expect(spinCall.role).toBe('DESIGN');
    expect((spinCall as any).isLockedMogrt).toBe(true);

    // Click Mirror Splash
    fireEvent.click(mirrorSplashBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(2);
    const splashCall = handleAddLowerThird.mock.calls[1][0] as LowerThirdSpec;
    expect(splashCall.templateId).toBe('mogrt-mirror-splash');
    expect(splashCall.name).toBe('TYPE YOUR');
    expect(splashCall.role).toBe('TEXT HERE');
    expect((splashCall as any).isLockedMogrt).toBe(true);
  });

  it('renders a locked, non-customizable inspector when a MOGRT animation is selected', () => {
    const mogrtSpec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      id: 'mogrt-test-1',
      templateId: 'mogrt-spin-twist',
      name: 'MOTION',
      role: 'DESIGN',
      start: 2.0,
      end: 7.0,
    };
    (mogrtSpec as any).isLockedMogrt = true;

    const handleChange = vi.fn();
    const handleDelete = vi.fn();

    render(
      <LowerThirdInspector spec={mogrtSpec} onChange={handleChange} onDelete={handleDelete} />,
    );

    // Should show MOGRT LOCKED badge
    expect(screen.getByText('MOGRT LOCKED')).toBeDefined();
    expect(screen.getByText('Spin & Twist')).toBeDefined();
    expect(screen.getByText(/Authentic MOGRT Animation:/i)).toBeDefined();

    // Text inputs for Title and Subtitle should be present
    const titleInput = screen.getByPlaceholderText('MOTION') as HTMLInputElement;
    expect(titleInput).toBeDefined();
    expect(titleInput.value).toBe('MOTION');

    const subtitleInput = screen.getByPlaceholderText('DESIGN') as HTMLInputElement;
    expect(subtitleInput).toBeDefined();
    expect(subtitleInput.value).toBe('DESIGN');

    // Editing title should trigger onChange
    fireEvent.change(titleInput, { target: { value: 'EPIC TITLE' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'EPIC TITLE' }));

    // Generic customizers like photo upload or variant picker should be omitted
    expect(screen.queryByText('Image / Photo Avatar')).toBeNull();
    expect(screen.queryByText('Advanced Overrides (Colors, Fonts, Layout)')).toBeNull();
  });
});
