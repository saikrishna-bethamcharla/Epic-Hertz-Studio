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
import LibraryLowerThirdsTab from '../src/subtitle-tool/v2/library/LibraryLowerThirdsTab';
import SpeakerListModal from '../src/subtitle-tool/v2/library/SpeakerListModal';
import PackImportExportModal from '../src/subtitle-tool/v2/library/PackImportExportModal';
import LowerThirdInspector from '../src/subtitle-tool/v2/inspector/LowerThirdInspector';
import { ALL_PACK_TEMPLATES, LOWER_THIRD_PACKS } from '../src/subtitle-tool/engine/lowerThirdPacks';
import type { LowerThirdSpec } from '../src/subtitle-tool/engine/spec';
import { DEFAULT_LOWER_THIRD } from '../src/subtitle-tool/engine/spec';

describe('Phase E: Lower Thirds Library UI & Interaction Suite', () => {
  it('renders all pack chips and allows filtering by category and search', () => {
    render(<LibraryLowerThirdsTab currentTime={5.0} onAddLowerThird={vi.fn()} />);

    // Verify pack chips are rendered
    expect(screen.getByRole('button', { name: /All \(48\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Clean Corporate' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Gaming and Tech' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Indic Pack' })).toBeDefined();

    // Verify search input
    const searchInput = screen.getByLabelText('Search lower third templates') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'glitch' } });

    // Should filter down to glitch-cut templates
    expect(screen.getByText('Glitch Cut')).toBeDefined();
  });

  it('clicking a template adds it at the current playhead with 4s duration', () => {
    const onAdd = vi.fn();
    render(<LibraryLowerThirdsTab currentTime={12.5} onAddLowerThird={onAdd} />);

    const templateCard = screen.getByLabelText(/Select template Bar Slide/i);
    fireEvent.click(templateCard);

    expect(onAdd).toHaveBeenCalledTimes(1);
    const addedSpec: LowerThirdSpec = onAdd.mock.calls[0][0];
    expect(addedSpec.start).toBe(12.5);
    expect(addedSpec.end).toBe(16.5);
    expect(addedSpec.templateId).toBe('corp-bar-slide');
  });

  it('applying template to an existing lower third swaps style while preserving user text', () => {
    const onUpdate = vi.fn();
    const existingSpec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      id: 'custom-lt-1',
      templateId: 'corp-bar-slide',
      name: 'DR. VENKAT RAO',
      role: 'NEUROLOGIST',
      extra: 'Apollo Hospitals',
      start: 2.0,
      end: 6.0,
    };

    render(
      <LibraryLowerThirdsTab
        currentTime={3.0}
        selectedLowerThirdId="custom-lt-1"
        selectedLowerThirdSpec={existingSpec}
        onAddLowerThird={vi.fn()}
        onUpdateLowerThird={onUpdate}
      />,
    );

    // Click another template to swap style
    const templateCard = screen.getByLabelText(/Select template Underline Draw/i);
    fireEvent.click(templateCard);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updatedSpec: LowerThirdSpec = onUpdate.mock.calls[0][0];
    expect(updatedSpec.id).toBe('custom-lt-1');
    expect(updatedSpec.name).toBe('DR. VENKAT RAO');
    expect(updatedSpec.role).toBe('NEUROLOGIST');
    expect(updatedSpec.extra).toBe('Apollo Hospitals');
    expect(updatedSpec.templateId).toBe('corp-underline-draw');
    expect(updatedSpec.start).toBe(2.0);
    expect(updatedSpec.end).toBe(6.0);
  });

  describe('Speaker List Multi-Import Modal', () => {
    it('parses speaker roster into sequential lower third overlays', () => {
      const onAddMultiple = vi.fn();
      render(
        <SpeakerListModal
          isOpen={true}
          onClose={vi.fn()}
          onAddLowerThirds={onAddMultiple}
          currentTime={10.0}
        />,
      );

      const textarea = screen.getByLabelText(/Speaker list input/i);
      fireEvent.change(textarea, {
        target: {
          value: 'Ravi Teja - Creative Director\nDr. Ananya Sharma | AI Researcher\nKiran Kumar',
        },
      });

      const generateBtn = screen.getByRole('button', { name: /generate lower thirds/i });
      fireEvent.click(generateBtn);

      expect(onAddMultiple).toHaveBeenCalledTimes(1);
      const generated: LowerThirdSpec[] = onAddMultiple.mock.calls[0][0];
      expect(generated.length).toBe(3);

      expect(generated[0].name).toBe('Ravi Teja');
      expect(generated[0].role).toBe('Creative Director');
      expect(generated[0].start).toBe(10.0);
      expect(generated[0].end).toBe(14.0);

      expect(generated[1].name).toBe('Dr. Ananya Sharma');
      expect(generated[1].role).toBe('AI Researcher');
      expect(generated[1].start).toBe(16.0);
      expect(generated[1].end).toBe(20.0);

      expect(generated[2].name).toBe('Kiran Kumar');
      expect(generated[2].role).toBe('');
      expect(generated[2].start).toBe(22.0);
      expect(generated[2].end).toBe(26.0);
    });
  });

  describe('Pack Import & Export Security', () => {
    it('rejects JSON imports exceeding 2MB size limit', () => {
      render(<PackImportExportModal isOpen={true} onClose={vi.fn()} onImportPack={vi.fn()} />);

      const largeContent = 'a'.repeat(2 * 1024 * 1024 + 10);
      const file = new File([largeContent], 'large-pack.json', { type: 'application/json' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      // File size error should be displayed
      expect(screen.getByText(/exceeds maximum allowed size of 2 mb/i)).toBeDefined();
    });

    it('rejects JSON imports with prototype pollution keys', async () => {
      render(<PackImportExportModal isOpen={true} onClose={vi.fn()} onImportPack={vi.fn()} />);

      const maliciousJson = '{"name":"Exploit Pack","__proto__":{"polluted":true},"templates":[]}';
      const file = new File([maliciousJson], 'exploit.json', { type: 'application/json' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      const errorMsg = await screen.findByText(/prototype pollution attempt detected/i);
      expect(errorMsg).toBeDefined();
    });

    it('successfully validates and imports a legitimate template pack', async () => {
      const onImport = vi.fn();
      render(<PackImportExportModal isOpen={true} onClose={vi.fn()} onImportPack={onImport} />);

      const legitimatePack = LOWER_THIRD_PACKS[0];
      const validJson = JSON.stringify(legitimatePack);
      const file = new File([validJson], 'clean-corporate.json', { type: 'application/json' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      const successMsg = await screen.findByText(/successfully imported/i);
      expect(successMsg).toBeDefined();
      expect(onImport).toHaveBeenCalledTimes(1);
    });
  });

  describe('LowerThirdInspector Enhancements', () => {
    it('displays template badge and warns on low contrast ratio', () => {
      const lowContrastSpec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: 'lt-test',
        templateId: 'classic-box-highlight',
        start: 0,
        end: 4.0,
        colors: {
          primary: '#333333',
          secondary: '#18181b',
          textPrimary: '#444444', // Dark gray on dark gray -> very low contrast
          textSecondary: '#666666',
        },
      };

      render(<LowerThirdInspector spec={lowContrastSpec} onChange={vi.fn()} onDelete={vi.fn()} />);

      // Contrast warning should be rendered
      expect(screen.getByText(/low contrast/i)).toBeDefined();

      // Template badge and reset button should be visible
      expect(screen.getAllByText('Box Highlight').length).toBeGreaterThan(0);
      expect(screen.getByText('Reset to template defaults')).toBeDefined();
    });

    it('reset button restores template default colors and typography', () => {
      const onChange = vi.fn();
      const modifiedSpec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: 'lt-test-2',
        templateId: 'classic-box-highlight',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          textPrimary: '#0000ff',
          textSecondary: '#ffffff',
        },
        scale: 1.8,
      };

      render(<LowerThirdInspector spec={modifiedSpec} onChange={onChange} onDelete={vi.fn()} />);

      const resetBtn = screen.getByRole('button', { name: /reset to template defaults/i });
      fireEvent.click(resetBtn);

      expect(onChange).toHaveBeenCalledTimes(1);
      const resetSpec: LowerThirdSpec = onChange.mock.calls[0][0];
      expect(resetSpec.colors.primary).toBe('#f59e0b');
      expect(resetSpec.scale).toBe(1);
    });
  });
});
