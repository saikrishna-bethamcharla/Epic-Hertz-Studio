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
  it('renders MOGRT Animations and YouTube & Social under their dedicated side-menu categories', () => {
    const handleAddLowerThird = vi.fn();

    const { rerender } = render(
      <LibraryPanel
        leftTab="mogrtAnimations"
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

    // Verify section heading and badge in MOGRT Animations tab
    expect(screen.getByText('MOGRT Text Animations')).toBeDefined();
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

    // Verify RGB Glitch Title & Cyber Strobe
    const rgbBtn = screen.getByRole('button', { name: /rgb glitch/i });
    expect(rgbBtn).toBeDefined();
    fireEvent.click(rgbBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(3);
    const rgbCall = handleAddLowerThird.mock.calls[2][0] as LowerThirdSpec;
    expect(rgbCall.templateId).toBe('mogrt-rgb-glitch');

    const cyberBtn = screen.getByRole('button', { name: /cyber strobe/i });
    expect(cyberBtn).toBeDefined();
    fireEvent.click(cyberBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(4);
    const cyberCall = handleAddLowerThird.mock.calls[3][0] as LowerThirdSpec;
    expect(cyberCall.templateId).toBe('mogrt-rgb-cyber-02');

    // Switch to YouTube Pack tab
    rerender(
      <LibraryPanel
        leftTab="youtubeGraphics"
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

    expect(screen.getByText('YouTube Creator Elements')).toBeDefined();
    expect(screen.getByText('8 MODELS')).toBeDefined();
    expect(screen.getByText('DEFAULT MODEL')).toBeDefined();

    const ytBtn = screen.getByRole('button', { name: /add creator pill/i });
    expect(ytBtn).toBeDefined();
    fireEvent.click(ytBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(5);
    const ytCall = handleAddLowerThird.mock.calls[4][0] as LowerThirdSpec;
    expect(ytCall.templateId).toBe('mogrt-youtube-subscribe');
    expect(ytCall.name).toBe('CHANNEL NAME');
    expect(ytCall.role).toBe('1.2M SUBSCRIBERS');

    // Test Minimal button
    const minimalBtn = screen.getByRole('button', { name: /minimal red button/i });
    expect(minimalBtn).toBeDefined();
    fireEvent.click(minimalBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(6);
    expect((handleAddLowerThird.mock.calls[5][0] as LowerThirdSpec).templateId).toBe(
      'mogrt-youtube-minimal',
    );

    // Switch to Social handles tab
    rerender(
      <LibraryPanel
        leftTab="socialGraphics"
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

    expect(screen.getByText('Social Media Lower Thirds 2.0')).toBeDefined();
    expect(screen.getByText('18 PLATFORMS')).toBeDefined();

    const socialBtn = screen.getByRole('button', { name: /instagram handle/i });
    expect(socialBtn).toBeDefined();
    fireEvent.click(socialBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(7);
    const socialCall = handleAddLowerThird.mock.calls[6][0] as LowerThirdSpec;
    expect(socialCall.templateId).toBe('mogrt-social-handle');
    expect(socialCall.name).toBe('@username');

    // Switch to Call-outs tab
    rerender(
      <LibraryPanel
        leftTab="callouts"
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

    expect(screen.getByText('Bold Call-Out Graphics')).toBeDefined();
    expect(screen.getByText('8 STYLES')).toBeDefined();

    const calloutBtn = screen.getByRole('button', { name: /right box callout/i });
    expect(calloutBtn).toBeDefined();
    fireEvent.click(calloutBtn);
    expect(handleAddLowerThird).toHaveBeenCalledTimes(8);
    const calloutCall = handleAddLowerThird.mock.calls[7][0] as LowerThirdSpec;
    expect(calloutCall.templateId).toBe('mogrt-callout-right-box');
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

  it('renders YouTube Subscribe and Social Media Handle inspectors with locked defaults', () => {
    const ytSpec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      id: 'yt-test',
      templateId: 'mogrt-youtube-subscribe',
      name: 'MY CHANNEL',
      role: '500K SUBSCRIBERS',
      start: 1.0,
      end: 5.0,
    };
    (ytSpec as any).isLockedMogrt = true;

    const { rerender } = render(
      <LowerThirdInspector spec={ytSpec} onChange={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText('YouTube Subscribe')).toBeDefined();
    expect(screen.getByText('DEFAULT MODEL')).toBeDefined();
    expect(screen.getByText(/Animated Subscribe Click & Bell/i)).toBeDefined();

    const ytNameInput = screen.getByPlaceholderText('CHANNEL NAME') as HTMLInputElement;
    expect(ytNameInput.value).toBe('MY CHANNEL');

    // Test Social Handle with platform picker
    const socialSpec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      id: 'social-test',
      templateId: 'mogrt-social-handle',
      name: '@epichertz',
      role: 'SUBSCRIBE NOW',
      extra: 'youtube',
      start: 1.0,
      end: 4.8,
    };
    (socialSpec as any).isLockedMogrt = true;

    rerender(<LowerThirdInspector spec={socialSpec} onChange={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Social Media Handle')).toBeDefined();
    expect(screen.getByText('Platform Badge & Username')).toBeDefined();
    expect(screen.getByText('Social Platform')).toBeDefined();
    expect(screen.getByText('X / Twitter')).toBeDefined();
  });
});
