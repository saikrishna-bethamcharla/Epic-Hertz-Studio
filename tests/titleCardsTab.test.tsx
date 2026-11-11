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

import LibraryTitleCardsTab from '../src/subtitle-tool/v2/library/LibraryTitleCardsTab';
import { TITLE_END_TEMPLATES } from '../src/subtitle-tool/engine/title-end-cards';
import type { LowerThirdSpec } from '../src/subtitle-tool/engine/spec';

describe('Title Cards & End Cards Dedicated Section Suite', () => {
  it('renders all 12 templates and filters by Title Cards vs End Cards', () => {
    render(<LibraryTitleCardsTab currentTime={3.0} onAddLowerThird={vi.fn()} />);

    // Verify filter chips
    expect(screen.getByRole('button', { name: /All \(12\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Title Cards \(6\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /End Cards \(6\)/i })).toBeDefined();

    // Verify key titles are present
    expect(screen.getByLabelText(/Select template Cinema Serif/i)).toBeDefined();
    expect(screen.getByLabelText(/Select template Epic Display/i)).toBeDefined();
    expect(screen.getByLabelText(/Select template Trailer Impact/i)).toBeDefined();
    expect(screen.getByLabelText(/Select template The End Classic/i)).toBeDefined();
    expect(screen.getByLabelText(/Select template Thanks & Subscribe/i)).toBeDefined();

    // Filter to End Cards
    fireEvent.click(screen.getByRole('button', { name: /End Cards \(6\)/i }));
    expect(screen.getByLabelText(/Select template The End Classic/i)).toBeDefined();
    expect(screen.queryByLabelText(/Select template Cinema Serif/i)).toBeNull();

    // Filter to Title Cards
    fireEvent.click(screen.getByRole('button', { name: /Title Cards \(6\)/i }));
    expect(screen.getByLabelText(/Select template Cinema Serif/i)).toBeDefined();
    expect(screen.queryByLabelText(/Select template The End Classic/i)).toBeNull();
  });

  it('filters templates by search query', () => {
    render(<LibraryTitleCardsTab currentTime={2.0} onAddLowerThird={vi.fn()} />);

    const searchInput = screen.getByLabelText('Search title cards') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'trailer' } });

    expect(screen.getByLabelText(/Select template Trailer Impact/i)).toBeDefined();
    expect(screen.queryByLabelText(/Select template Cinema Serif/i)).toBeNull();
  });

  it('adds a title card at playhead with default duration', () => {
    const handleAdd = vi.fn();
    render(<LibraryTitleCardsTab currentTime={10.0} onAddLowerThird={handleAdd} />);

    const card = screen.getByLabelText(/Select template Cinema Serif/i);
    fireEvent.click(card);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    const addedSpec: LowerThirdSpec = handleAdd.mock.calls[0][0];
    expect(addedSpec.start).toBe(10.0);
    expect(addedSpec.end).toBe(14.0);
    expect(addedSpec.templateId).toBe('title-cinema-serif');
  });

  it('swaps template on existing selected lower third/title card', () => {
    const handleUpdate = vi.fn();
    const existingSpec: LowerThirdSpec = {
      id: 'spec-active-1',
      templateId: 'title-cinema-serif',
      name: 'MY CUSTOM MOVIE',
      role: 'DIRECTED BY ME',
      start: 5.0,
      end: 9.0,
      colors: {},
      font: {},
      position: { x: 0.5, y: 0.5, align: 'center' },
    };

    render(
      <LibraryTitleCardsTab
        currentTime={5.0}
        selectedLowerThirdId="spec-active-1"
        selectedLowerThirdSpec={existingSpec}
        onAddLowerThird={vi.fn()}
        onUpdateLowerThird={handleUpdate}
      />,
    );

    const epicCard = screen.getByLabelText(/Select template Epic Display/i);
    fireEvent.click(epicCard);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updatedSpec: LowerThirdSpec = handleUpdate.mock.calls[0][0];
    expect(updatedSpec.templateId).toBe('title-epic-display');
    expect(updatedSpec.name).toBe('MY CUSTOM MOVIE');
    expect(updatedSpec.role).toBe('DIRECTED BY ME');
  });
});
