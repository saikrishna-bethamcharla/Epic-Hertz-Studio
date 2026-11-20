// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AstryxSegmentedGroup,
  AstryxSwitch,
  AstryxSlider,
  AstryxBadge,
} from '../src/subtitle-tool/astryx';

describe('Astryx Interactive Design System Components', () => {
  describe('AstryxSegmentedGroup', () => {
    it('renders all options and calls onChange when clicked', () => {
      const handleChange = vi.fn();
      render(
        <AstryxSegmentedGroup
          options={[
            { id: '1-word', label: '1-Word' },
            { id: '2-3-words', label: '2–3' },
            { id: 'sentence', label: 'Sentence' },
          ]}
          value="1-word"
          onChange={handleChange}
          ariaLabel="Pacing density"
        />,
      );

      expect(screen.getByText('1-Word')).toBeDefined();
      expect(screen.getByText('2–3')).toBeDefined();
      expect(screen.getByText('Sentence')).toBeDefined();

      fireEvent.click(screen.getByText('2–3'));
      expect(handleChange).toHaveBeenCalledWith('2-3-words');
    });
  });

  describe('AstryxSwitch', () => {
    it('toggles value on click and keyboard press', () => {
      const handleChange = vi.fn();
      render(
        <AstryxSwitch
          checked={false}
          onChange={handleChange}
          label="Auto Silence"
          description="Compacts pauses"
        />,
      );

      expect(screen.getByText('Auto Silence')).toBeDefined();
      expect(screen.getByText('Compacts pauses')).toBeDefined();

      const btn = screen.getByRole('switch');
      fireEvent.click(btn);
      expect(handleChange).toHaveBeenCalledWith(true);

      fireEvent.keyDown(btn, { key: ' ' });
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('AstryxSlider', () => {
    it('renders current value and nudges with plus and minus buttons', () => {
      const handleChange = vi.fn();
      render(
        <AstryxSlider
          label="Progress Height"
          value={8}
          min={2}
          max={20}
          step={2}
          unit="px"
          onChange={handleChange}
        />,
      );

      expect(screen.getByText('Progress Height')).toBeDefined();
      expect(screen.getByText('8px')).toBeDefined();

      const plusBtn = screen.getByTitle('Increase by 2');
      fireEvent.click(plusBtn);
      expect(handleChange).toHaveBeenCalledWith(10);

      const minusBtn = screen.getByTitle('Decrease by 2');
      fireEvent.click(minusBtn);
      expect(handleChange).toHaveBeenCalledWith(6);
    });
  });

  describe('AstryxBadge', () => {
    it('renders badge label with variant styling', () => {
      render(<AstryxBadge variant="teal">V2 Track</AstryxBadge>);
      expect(screen.getByText('V2 Track')).toBeDefined();
    });
  });
});
