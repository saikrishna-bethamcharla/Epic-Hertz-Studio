// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  generateFcp7Xml,
  generateFcpxml,
  generateEdl,
  escapeXml,
  parseColorToRgb,
  framesToTimecode,
  secondsToFrames,
} from '../src/subtitle-tool/utils/exportNle';
import ExportModal from '../src/subtitle-tool/ExportModal';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment, CaptionStyle } from '../src/subtitle-tool/types';

// Mock DOM APIs missing in jsdom
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  window.URL.revokeObjectURL = vi.fn();
}

describe('Professional NLE Timeline Export (Premiere Pro, DaVinci Resolve, Final Cut Pro)', () => {
  const mockSegments: Segment[] = [
    {
      id: 'seg-1',
      index: 1,
      start: 0.0,
      end: 2.5,
      text: 'Welcome to Epic Hertz & DaVinci Resolve <Studio> "Testing"',
    },
    {
      id: 'seg-2',
      index: 2,
      start: 2.5,
      end: 5.25,
      text: 'Export with transparent alpha channel & XML',
    },
  ];

  const customStyle: CaptionStyle = {
    ...DEFAULT_STYLE,
    font: {
      ...DEFAULT_STYLE.font,
      family: 'Montserrat',
      size: 0.07,
    },
    fill: '#F59E0B',
    layout: {
      ...DEFAULT_STYLE.layout,
      align: 'center',
      x: 0.5,
      y: 0.85,
    },
  };

  describe('XML escaping & Timecode calculation', () => {
    it('properly escapes XML special entities to prevent syntax breakage', () => {
      const escaped = escapeXml('Bill & Ted\'s "Excellent" <Adventure>');
      expect(escaped).toBe('Bill &amp; Ted&apos;s &quot;Excellent&quot; &lt;Adventure&gt;');
    });

    it('correctly maps seconds to frame indices at 30fps and 60fps', () => {
      expect(secondsToFrames(1.0, 30)).toBe(30);
      expect(secondsToFrames(2.5, 30)).toBe(75);
      expect(secondsToFrames(1.0, 60)).toBe(60);
      expect(secondsToFrames(0.5, 60)).toBe(30);
    });

    it('formats SMPTE timecodes HH:MM:SS:FF accurately', () => {
      expect(framesToTimecode(0, 30)).toBe('00:00:00:00');
      expect(framesToTimecode(45, 30)).toBe('00:00:01:15');
      expect(framesToTimecode(1800, 30)).toBe('00:01:00:00');
      expect(framesToTimecode(108000, 30)).toBe('01:00:00:00');
    });

    it('parses hex colors (#F59E0B, #FFF) and rgba to numeric RGB channels', () => {
      expect(parseColorToRgb('#F59E0B')).toEqual({ r: 245, g: 158, b: 11 });
      expect(parseColorToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseColorToRgb('rgba(0, 184, 169, 1)')).toEqual({ r: 0, g: 184, b: 169 });
    });
  });

  describe('1. Final Cut Pro 7 XML (<xmeml version="5">) for Premiere Pro & DaVinci Resolve', () => {
    it('generates valid FCP 7 XML containing sequence, timebase, and generatoritem text clips', () => {
      const xml = generateFcp7Xml(mockSegments, {
        projectName: 'Commercial Ad',
        sequenceName: 'Main Subtitles',
        fps: 30,
        width: 1080,
        height: 1920,
        style: customStyle,
      });

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<xmeml version="5">');
      expect(xml).toContain('<name>Commercial Ad</name>');
      expect(xml).toContain('<name>Main Subtitles</name>');
      expect(xml).toContain('<timebase>30</timebase>');
      expect(xml).toContain('<width>1080</width>');
      expect(xml).toContain('<height>1920</height>');

      // Verify generatoritem structure for DaVinci & Premiere
      expect(xml).toContain('<generatoritem id="generatoritem-1">');
      expect(xml).toContain('<effectid>Text</effectid>');
      expect(xml).toContain('<parameterid>str</parameterid>');
      expect(xml).toContain('Welcome to Epic Hertz &amp; DaVinci Resolve &lt;Studio&gt; &quot;Testing&quot;');
      expect(xml).toContain('<parameterid>font</parameterid>');
      expect(xml).toContain('<value>Montserrat</value>');

      // Check color channels
      expect(xml).toContain('<red>245</red>');
      expect(xml).toContain('<green>158</green>');
      expect(xml).toContain('<blue>11</blue>');

      // Check frame boundaries
      // seg-1: 0.0 to 2.5s @ 30fps -> start 0, end 75, dur 75
      expect(xml).toContain('<start>0</start>');
      expect(xml).toContain('<end>75</end>');
      expect(xml).toContain('<duration>75</duration>');

      // seg-2: 2.5 to 5.25s @ 30fps -> start 75, end 158
      expect(xml).toContain('<generatoritem id="generatoritem-2">');
      expect(xml).toContain('<start>75</start>');
      expect(xml).toContain('<end>158</end>');
    });
  });

  describe('2. Apple Final Cut Pro X FCPXML (<fcpxml version="1.8">)', () => {
    it('generates valid FCPXML with resources, format, spine, and title elements', () => {
      const fcpxml = generateFcpxml(mockSegments, {
        projectName: 'Viral Reel',
        fps: 60,
        width: 1080,
        height: 1920,
        style: customStyle,
      });

      expect(fcpxml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(fcpxml).toContain('<fcpxml version="1.8">');
      expect(fcpxml).toContain('<resources>');
      expect(fcpxml).toContain('frameDuration="1/60s"');
      expect(fcpxml).toContain('width="1080" height="1920"');
      expect(fcpxml).toContain('<title name="Welcome to Epic Hertz &amp; DaVinci Resolve &lt;Studio&gt; &quot;Testing&quot;"');
      expect(fcpxml).toContain('offset="0/60s"');
      expect(fcpxml).toContain('duration="150/60s"');
      expect(fcpxml).toContain('<text-style font="Montserrat"');
    });
  });

  describe('3. CMX 3600 Edit Decision List (EDL)', () => {
    it('generates standardized CMX 3600 cut events with SMPTE timecodes', () => {
      const edl = generateEdl(mockSegments, {
        projectName: 'Documentary Short',
        fps: 30,
      });

      expect(edl).toContain('TITLE: DOCUMENTARY_SHORT');
      expect(edl).toContain('FCM: NON-DROP FRAME');

      // First cut event
      expect(edl).toContain('001  AX       V     C        00:00:00:00 00:00:02:15 00:00:00:00 00:00:02:15');
      expect(edl).toContain('* FROM CLIP NAME: SUBTITLE_001');
      expect(edl).toContain('* COMMENT: Welcome to Epic Hertz & DaVinci Resolve <Studio> "Testing"');

      // Second cut event (2.5s to 5.25s -> dur 2.75s = 83 frames -> 00:00:02:23, end 158 frames -> 00:00:05:08)
      expect(edl).toContain('002  AX       V     C        00:00:00:00 00:00:02:23 00:00:02:15 00:00:05:08');
      expect(edl).toContain('* FROM CLIP NAME: SUBTITLE_002');
      expect(edl).toContain('* COMMENT: Export with transparent alpha channel & XML');
    });
  });

  describe('4. ExportModal NLE Timelines & Transparent Alpha Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders NLE Timelines (.XML, .FCPXML, .EDL) buttons and handles Transparent Alpha Mode', () => {
      const mockFile = new File(['fake-video'], 'test_video.mp4', { type: 'video/mp4' });
      const handleClose = vi.fn();
      const handleStatus = vi.fn();

      render(
        <ExportModal
          isOpen={true}
          onClose={handleClose}
          videoFile={mockFile}
          segments={mockSegments}
          style={customStyle}
          onBurnStart={vi.fn()}
          onBurnProgress={vi.fn()}
          onBurnStatus={handleStatus}
          onBurnDone={vi.fn()}
          onBurnError={vi.fn()}
        />,
      );

      // Verify NLE section header
      expect(screen.getByText(/NLE Timelines, Subtitles & Transcripts/i)).toBeDefined();
      expect(screen.getByText(/Premiere · DaVinci · Final Cut/i)).toBeDefined();

      // Verify all 6 download format buttons are present
      expect(screen.getByText('.XML')).toBeDefined();
      expect(screen.getByText(/Premiere & DaVinci/i)).toBeDefined();
      expect(screen.getByText('.FCPXML')).toBeDefined();
      expect(screen.getByText(/Final Cut Pro/i)).toBeDefined();
      expect(screen.getByText('.EDL')).toBeDefined();
      expect(screen.getByText(/CMX 3600 Timeline/i)).toBeDefined();
      expect(screen.getByText('.SRT')).toBeDefined();
      expect(screen.getByText('.VTT')).toBeDefined();
      expect(screen.getByText('.TXT')).toBeDefined();

      // Click on .XML download
      const xmlBtn = screen.getByText('.XML').closest('button');
      expect(xmlBtn).toBeTruthy();
      fireEvent.click(xmlBtn!);
      expect(handleStatus).toHaveBeenCalledWith(
        'Downloaded FCP 7 XML for Premiere Pro & DaVinci Resolve.',
      );

      // Verify mode selector defaults to Composite Video
      expect(screen.getByText('Composite Video')).toBeDefined();
      const transparentBtn = screen.getByRole('button', { name: /Transparent Alpha/i });
      expect(transparentBtn).toBeDefined();

      // Click "Transparent Alpha" mode
      fireEvent.click(transparentBtn);

      // Verify transparent helper badge appears
      expect(
        screen.getByText(/Exports 100% transparent video with alpha channel/i),
      ).toBeDefined();

      // Verify main action button changes to "Export Transparent Video (Alpha)"
      expect(
        screen.getByRole('button', { name: /Export Transparent Video \(Alpha\)/i }),
      ).toBeDefined();
    });
  });
});
