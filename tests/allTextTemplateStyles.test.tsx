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
        setLineDash: vi.fn(),
      }) as any,
  );
});

import LibraryPanel from '../src/subtitle-tool/v2/LibraryPanel';
import { renderTemplateLowerThird } from '../src/subtitle-tool/engine/lowerThirdRenderer';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import { DEFAULT_LOWER_THIRD } from '../src/subtitle-tool/types';
import type { Segment, LowerThirdSpec } from '../src/subtitle-tool/types';

const mockSegments: Segment[] = [
  { id: 'seg-1', index: 1, start: 1.0, end: 3.0, text: 'Sample text' },
];

describe('All Graphic Templates & Models Variety (Callouts, YouTube Pack, Social Handles, MOGRTs)', () => {
  it('renders and adds all 8 distinct Call-Out styles', () => {
    const handleAddLowerThird = vi.fn();

    render(
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
        currentTime={2.0}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    const calloutTemplates = [
      { name: /right box callout/i, expectedId: 'mogrt-callout-right-box' },
      { name: /left box callout/i, expectedId: 'mogrt-callout-left-box' },
      { name: /top pointer callout/i, expectedId: 'mogrt-callout-top-pointer' },
      { name: /bottom pointer callout/i, expectedId: 'mogrt-callout-bottom-pointer' },
      { name: /hud tech reticle/i, expectedId: 'mogrt-callout-reticle-hud' },
      { name: /corner brackets/i, expectedId: 'mogrt-callout-bracket-card' },
      { name: /minimal target ring/i, expectedId: 'mogrt-callout-minimal-target' },
      { name: /solid badge capsule/i, expectedId: 'mogrt-callout-solid-badge' },
    ];

    expect(calloutTemplates).toHaveLength(8);

    calloutTemplates.forEach((item, index) => {
      const btn = screen.getByRole('button', { name: item.name });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleAddLowerThird).toHaveBeenCalledTimes(index + 1);
      const call = handleAddLowerThird.mock.calls[index][0] as LowerThirdSpec;
      expect(call.templateId).toBe(item.expectedId);
    });
  });

  it('renders and adds all 8 distinct YouTube button & creator models', () => {
    const handleAddLowerThird = vi.fn();

    render(
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
        currentTime={1.5}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    const ytModels = [
      { name: /add creator pill/i, expectedId: 'mogrt-youtube-subscribe' },
      { name: /minimal red button/i, expectedId: 'mogrt-youtube-minimal' },
      { name: /like & bell bar/i, expectedId: 'mogrt-youtube-like-bell' },
      { name: /channel profile card/i, expectedId: 'mogrt-youtube-channel-card' },
      { name: /gold metallic subscribe/i, expectedId: 'mogrt-youtube-gold' },
      { name: /cyber neon red/i, expectedId: 'mogrt-youtube-neon' },
      { name: /end screen round cta/i, expectedId: 'mogrt-youtube-end-screen' },
      { name: /bell notification ring/i, expectedId: 'mogrt-youtube-bell-ring' },
    ];

    expect(ytModels).toHaveLength(8);

    ytModels.forEach((item, index) => {
      const btn = screen.getByRole('button', { name: item.name });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleAddLowerThird).toHaveBeenCalledTimes(index + 1);
      const call = handleAddLowerThird.mock.calls[index][0] as LowerThirdSpec;
      expect(call.templateId).toBe(item.expectedId);
    });
  });

  it('renders all 18 platform handles in Social Media Lower Thirds 2.0', () => {
    const handleAddLowerThird = vi.fn();

    render(
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
        currentTime={3.0}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    const platforms = [
      { name: /instagram handle/i, extra: 'instagram' },
      { name: /youtube handle/i, extra: 'youtube' },
      { name: /x \/ twitter/i, extra: 'twitter' },
      { name: /tiktok handle/i, extra: 'tiktok' },
      { name: /whatsapp/i, extra: 'whatsapp' },
      { name: /telegram/i, extra: 'telegram' },
      { name: /discord/i, extra: 'discord' },
      { name: /facebook/i, extra: 'facebook' },
      { name: /linkedin/i, extra: 'linkedin' },
      { name: /spotify/i, extra: 'spotify' },
      { name: /twitch/i, extra: 'twitch' },
      { name: /snapchat/i, extra: 'snapchat' },
      { name: /pinterest/i, extra: 'pinterest' },
      { name: /behance/i, extra: 'behance' },
      { name: /dribbble/i, extra: 'dribbble' },
      { name: /vimeo/i, extra: 'vimeo' },
      { name: /github/i, extra: 'github' },
      { name: /website url/i, extra: 'website' },
    ];

    expect(platforms).toHaveLength(18);

    platforms.forEach((item, index) => {
      const btn = screen.getByRole('button', { name: item.name });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleAddLowerThird).toHaveBeenCalledTimes(index + 1);
      const call = handleAddLowerThird.mock.calls[index][0] as LowerThirdSpec;
      expect(call.templateId).toBe('mogrt-social-handle');
      expect(call.extra).toBe(item.extra);
    });
  });

  it('renders all 5 authentic MOGRT Motion Titles', () => {
    const handleAddLowerThird = vi.fn();

    render(
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
        currentTime={4.0}
        onAddLowerThird={handleAddLowerThird}
      />,
    );

    const mogrts = [
      { name: /spin & twist/i, expectedId: 'mogrt-spin-twist' },
      { name: /mirror splash/i, expectedId: 'mogrt-mirror-splash' },
      { name: /rgb glitch 01/i, expectedId: 'mogrt-rgb-glitch' },
      { name: /cyber strobe 02/i, expectedId: 'mogrt-rgb-cyber-02' },
      { name: /minimal kinetic wipe 03/i, expectedId: 'mogrt-trendy-minimal-03' },
    ];

    expect(mogrts).toHaveLength(5);

    mogrts.forEach((item, index) => {
      const btn = screen.getByRole('button', { name: item.name });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleAddLowerThird).toHaveBeenCalledTimes(index + 1);
      const call = handleAddLowerThird.mock.calls[index][0] as LowerThirdSpec;
      expect(call.templateId).toBe(item.expectedId);
    });
  });

  it('renders all template models cleanly on HTML5 canvas with zero crashes', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    const allTemplateIds = [
      // Callouts (8)
      'mogrt-callout-right-box',
      'mogrt-callout-left-box',
      'mogrt-callout-top-pointer',
      'mogrt-callout-bottom-pointer',
      'mogrt-callout-reticle-hud',
      'mogrt-callout-bracket-card',
      'mogrt-callout-minimal-target',
      'mogrt-callout-solid-badge',
      // YouTube Pack (8)
      'mogrt-youtube-subscribe',
      'mogrt-youtube-minimal',
      'mogrt-youtube-like-bell',
      'mogrt-youtube-channel-card',
      'mogrt-youtube-gold',
      'mogrt-youtube-neon',
      'mogrt-youtube-end-screen',
      'mogrt-youtube-bell-ring',
      // Social Handles
      'mogrt-social-handle',
      // MOGRT Titles (5)
      'mogrt-spin-twist',
      'mogrt-mirror-splash',
      'mogrt-rgb-glitch',
      'mogrt-rgb-cyber-02',
      'mogrt-trendy-minimal-03',
    ];

    for (const templateId of allTemplateIds) {
      const spec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: `test-${templateId}`,
        templateId,
        name: 'FEATURE TITLE',
        role: 'Subtitle Description',
        start: 0,
        end: 5,
      };

      // Test across intro, hold, and outro phases
      for (const phase of ['intro', 'hold', 'outro'] as const) {
        expect(() => {
          renderTemplateLowerThird(ctx, spec, {
            time: 2.0,
            width: 1080,
            height: 1920,
            phaseOverride: phase,
            phaseProgressOverride: 0.5,
          });
        }).not.toThrow();
      }
    }
  });
});
