// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
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
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment } from '../src/subtitle-tool/types';

const mockSegments: Segment[] = [
  {
    id: 'seg-1',
    index: 1,
    start: 1.0,
    end: 3.0,
    text: 'First caption sentence',
  },
  {
    id: 'seg-2',
    index: 2,
    start: 4.0,
    end: 6.0,
    text: 'Second caption sentence',
  },
];

describe('Text Section Sub-Sections Navigation & Quick Text Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 8 sub-sections in the vertical sub-nav rail with proper labels and badges', () => {
    const handleTabChange = vi.fn();
    render(
      <LibraryPanel
        leftTab="templates"
        onTabChange={handleTabChange}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
      />,
    );

    // Verify all 8 sub-section navigation buttons exist
    expect(screen.getByRole('tab', { name: /add text/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /templates/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /movie styles/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /lower thirds/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /text effects/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /animations/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /yours/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /captions/i })).toBeDefined();

    // Verify Movie Styles badge shows '20'
    const movieStylesTab = screen.getByRole('tab', { name: /movie styles/i });
    expect(movieStylesTab.textContent).toContain('20');

    // Verify Lower Thirds badge shows '60'
    const lowerThirdTab = screen.getByRole('tab', { name: /lower thirds/i });
    expect(lowerThirdTab.textContent).toContain('60');

    // Verify Templates badge shows '66' (48 base templates + 18 premium)
    const templatesTab = screen.getByRole('tab', { name: /templates/i });
    expect(templatesTab.textContent).toContain('66');
  });

  it('switches sub-sections when tab buttons are clicked', () => {
    const handleTabChange = vi.fn();
    render(
      <LibraryPanel
        leftTab="templates"
        onTabChange={handleTabChange}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
      />,
    );

    // Click on 'Add text'
    fireEvent.click(screen.getByRole('tab', { name: /add text/i }));
    expect(handleTabChange).toHaveBeenCalledWith('addText');

    // Click on 'Movie styles'
    fireEvent.click(screen.getByRole('tab', { name: /movie styles/i }));
    expect(handleTabChange).toHaveBeenCalledWith('movieStyles');

    // Click on 'Lower thirds'
    fireEvent.click(screen.getByRole('tab', { name: /lower thirds/i }));
    expect(handleTabChange).toHaveBeenCalledWith('lowerThirds');

    // Click on 'Text effects'
    fireEvent.click(screen.getByRole('tab', { name: /text effects/i }));
    expect(handleTabChange).toHaveBeenCalledWith('effects');

    // Click on 'Animations'
    fireEvent.click(screen.getByRole('tab', { name: /animations/i }));
    expect(handleTabChange).toHaveBeenCalledWith('animations');

    // Click on 'Yours'
    fireEvent.click(screen.getByRole('tab', { name: /yours/i }));
    expect(handleTabChange).toHaveBeenCalledWith('brand');

    // Click on 'Captions'
    fireEvent.click(screen.getByRole('tab', { name: /captions/i }));
    expect(handleTabChange).toHaveBeenCalledWith('captions');
  });

  it('normalizes legacy "styles" tab to "templates" for full backwards compatibility', () => {
    render(
      <LibraryPanel
        leftTab="styles" // legacy prop
        onTabChange={vi.fn()}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
      />,
    );

    // The templates tab should be marked as active/selected
    const templatesTab = screen.getByRole('tab', { name: /templates/i });
    expect(templatesTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').getAttribute('id')).toBe('panel-templates');
  });

  it('inserts "Default text" at current playhead when clicked in Add text sub-section', () => {
    const handleSegmentsChange = vi.fn();
    const handleSelectSegment = vi.fn();
    const handleSeek = vi.fn();
    const handleNotification = vi.fn();

    render(
      <LibraryPanel
        leftTab="addText"
        onTabChange={vi.fn()}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={handleSelectSegment}
        onSegmentsChange={handleSegmentsChange}
        onSeek={handleSeek}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
        currentTime={2.5}
        onNotification={handleNotification}
      />,
    );

    // Find and click the 'Default text' card
    const defaultTextBtn = screen.getByText('Default text').closest('button');
    expect(defaultTextBtn).toBeDefined();
    fireEvent.click(defaultTextBtn!);

    // Verifies new segment was created at currentTime = 2.5s
    expect(handleSegmentsChange).toHaveBeenCalledTimes(1);
    const updatedSegments: Segment[] = handleSegmentsChange.mock.calls[0][0];
    expect(updatedSegments).toHaveLength(3);

    // Sorted by time: seg-1 (1.0-3.0), new (2.5-4.5), seg-2 (4.0-6.0)
    const inserted = updatedSegments.find((s) => s.text === 'Default text');
    expect(inserted).toBeDefined();
    expect(inserted?.start).toBe(2.5);
    expect(inserted?.end).toBe(4.5);

    // Check selection and seek to start time
    expect(handleSelectSegment).toHaveBeenCalledWith(inserted?.id);
    expect(handleSeek).toHaveBeenCalledWith(2.5);
    expect(handleNotification).toHaveBeenCalledWith(expect.stringContaining('Default text'));
  });

  it('inserts "Headline" with uppercase and large weight when clicked in Add text sub-section', () => {
    const handleSegmentsChange = vi.fn();

    render(
      <LibraryPanel
        leftTab="addText"
        onTabChange={vi.fn()}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={handleSegmentsChange}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
        currentTime={5.0}
      />,
    );

    const headlineBtn = screen.getByText('Headline').closest('button');
    expect(headlineBtn).toBeDefined();
    fireEvent.click(headlineBtn!);

    expect(handleSegmentsChange).toHaveBeenCalledTimes(1);
    const updatedSegments: Segment[] = handleSegmentsChange.mock.calls[0][0];
    const headline = updatedSegments.find((s) => s.text === 'HEADLINE TITLE');
    expect(headline).toBeDefined();
    expect(headline?.styleOverride?.fontWeight).toBe(900);
    expect(headline?.styleOverride?.textCase).toBe('upper');
  });

  it('navigates to Lower Thirds tab when clicking Browse button in Add text sub-section', () => {
    const handleTabChange = vi.fn();

    render(
      <LibraryPanel
        leftTab="addText"
        onTabChange={handleTabChange}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
      />,
    );

    const browseBtn = screen.getByRole('button', { name: /^browse$/i });
    fireEvent.click(browseBtn);

    expect(handleTabChange).toHaveBeenCalledWith('lowerThirds');
  });

  it('renders collapse button when onToggleCollapse prop is provided', () => {
    const handleCollapse = vi.fn();

    render(
      <LibraryPanel
        leftTab="templates"
        onTabChange={vi.fn()}
        segments={mockSegments}
        activeId="seg-1"
        onSelectSegment={vi.fn()}
        onSegmentsChange={vi.fn()}
        onSeek={vi.fn()}
        style={DEFAULT_STYLE}
        onStyleChange={vi.fn()}
        spokenLanguage="en"
        scriptOutput="native"
        scope="all"
        onToggleCollapse={handleCollapse}
      />,
    );

    const collapseBtn = screen.getByRole('button', { name: /collapse library panel/i });
    fireEvent.click(collapseBtn);
    expect(handleCollapse).toHaveBeenCalledTimes(1);
  });
});
