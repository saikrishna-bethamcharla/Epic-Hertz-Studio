// ─── Professional NLE Timeline Export (Premiere Pro, DaVinci Resolve, Final Cut Pro) ───
// Generates industry-standard Final Cut Pro 7 XML (<xmeml version="5">), Apple FCPXML
// (<fcpxml version="1.8">), and CMX 3600 EDL for seamless native import into:
// - Adobe Premiere Pro (File -> Import -> XML)
// - DaVinci Resolve (File -> Import Timeline -> Import AAF, EDL, XML)
// - Final Cut Pro X (File -> Import -> XML)

import type { Segment, CaptionStyle } from '../types';
import { downloadText } from './srt';

export interface NleExportOptions {
  projectName?: string;
  sequenceName?: string;
  fps?: number;
  width?: number;
  height?: number;
  style?: CaptionStyle;
}

/** Escapes XML special characters */
export function escapeXml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/** Converts hex or rgb color string to numeric { r, g, b } 0-255 */
export function parseColorToRgb(colorStr?: string): { r: number; g: number; b: number } {
  if (!colorStr) return { r: 255, g: 255, b: 255 };
  const str = colorStr.trim();
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const num = parseInt(hex.slice(0, 6), 16);
    if (!Number.isNaN(num)) {
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
      };
    }
  }
  const rgbaMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
    };
  }
  return { r: 255, g: 255, b: 255 };
}

/** Converts a frame count into standard SMPTE timecode (HH:MM:SS:FF) */
export function framesToTimecode(frames: number, fps: number): string {
  const safeFps = Math.max(1, Math.round(fps));
  const safeFrames = Math.max(0, Math.round(frames));
  const totalSeconds = Math.floor(safeFrames / safeFps);
  const f = safeFrames % safeFps;
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  return (
    [h, m, s, f]
      .map((val) => String(val).padStart(2, '0'))
      .join(':')
  );
}

/** Converts seconds to frame index */
export function secondsToFrames(sec: number, fps: number): number {
  return Math.max(0, Math.round(sec * fps));
}

// ─── 1. Final Cut Pro 7 XML (<xmeml version="5">) ───────────────────────────
// Universal NLE interchange standard supported natively by Premiere Pro and DaVinci Resolve.

export function generateFcp7Xml(segments: Segment[], options: NleExportOptions = {}): string {
  const fps = Math.max(1, Math.round(options.fps || 30));
  const width = options.width || 1080;
  const height = options.height || 1920;
  const projectName = escapeXml(options.projectName || 'Epic Hertz Subtitles');
  const sequenceName = escapeXml(options.sequenceName || 'Subtitles Timeline');
  const isNtsc = fps === 24 || fps === 30 || fps === 60 ? 'FALSE' : 'FALSE';

  // Calculate timeline bounds
  const lastEndSec = segments.length > 0 ? Math.max(...segments.map((s) => s.end)) : 10;
  const totalFrames = Math.max(1, secondsToFrames(lastEndSec, fps));

  // Font styling extraction
  const style = options.style;
  const fontFamily = style?.font?.family || 'Impact';
  const fontSize = Math.round(style?.font?.size ? style.font.size * Math.min(width, height) : 52);
  const rawColor =
    typeof style?.fill === 'string'
      ? style.fill
      : style?.fill && 'color' in style.fill
        ? String(style.fill.color)
        : '#FFFFFF';
  const color = parseColorToRgb(rawColor);
  const align = style?.layout?.align || 'center';
  const posX = (style?.layout?.x ?? 0.5) - 0.5; // FCP center coordinates (-0.5 .. 0.5)
  const posY = (style?.layout?.y ?? 0.8) - 0.5;

  const clipItemsXml = segments
    .map((seg, idx) => {
      const itemIdx = idx + 1;
      const startFrame = secondsToFrames(seg.start, fps);
      const endFrame = Math.max(startFrame + 1, secondsToFrames(seg.end, fps));
      const durFrames = endFrame - startFrame;
      const cleanText = escapeXml(seg.text);

      return `            <generatoritem id="generatoritem-${itemIdx}">
              <name>${cleanText}</name>
              <duration>${durFrames}</duration>
              <rate>
                <timebase>${fps}</timebase>
                <ntsc>${isNtsc}</ntsc>
              </rate>
              <in>0</in>
              <out>${durFrames}</out>
              <start>${startFrame}</start>
              <end>${endFrame}</end>
              <anamorphic>FALSE</anamorphic>
              <pixelaspectratio>square</pixelaspectratio>
              <effect>
                <name>Text</name>
                <effectid>Text</effectid>
                <effectcategory>Text</effectcategory>
                <effecttype>generator</effecttype>
                <mediatype>video</mediatype>
                <parameter authoringApp="Premiere">
                  <parameterid>str</parameterid>
                  <name>Text</name>
                  <value>${cleanText}</value>
                </parameter>
                <parameter authoringApp="Premiere">
                  <parameterid>font</parameterid>
                  <name>Font</name>
                  <value>${escapeXml(fontFamily)}</value>
                </parameter>
                <parameter authoringApp="Premiere">
                  <parameterid>fontsize</parameterid>
                  <name>Size</name>
                  <valuemin>0</valuemin>
                  <valuemax>1000</valuemax>
                  <value>${fontSize}</value>
                </parameter>
                <parameter authoringApp="Premiere">
                  <parameterid>fontcolor</parameterid>
                  <name>Color</name>
                  <value>
                    <alpha>255</alpha>
                    <red>${color.r}</red>
                    <green>${color.g}</green>
                    <blue>${color.b}</blue>
                  </value>
                </parameter>
                <parameter authoringApp="Premiere">
                  <parameterid>horizalign</parameterid>
                  <name>Alignment</name>
                  <value>${align}</value>
                </parameter>
                <parameter authoringApp="Premiere">
                  <parameterid>center</parameterid>
                  <name>Origin</name>
                  <value>
                    <horiz>${posX.toFixed(3)}</horiz>
                    <vert>${posY.toFixed(3)}</vert>
                  </value>
                </parameter>
              </effect>
            </generatoritem>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${projectName}</name>
    <children>
      <sequence id="sequence-1">
        <name>${sequenceName}</name>
        <duration>${totalFrames}</duration>
        <rate>
          <timebase>${fps}</timebase>
          <ntsc>${isNtsc}</ntsc>
        </rate>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>${isNtsc}</ntsc>
                </rate>
                <width>${width}</width>
                <height>${height}</height>
                <anamorphic>FALSE</anamorphic>
                <pixelaspectratio>square</pixelaspectratio>
                <fielddominance>none</fielddominance>
              </samplecharacteristics>
            </format>
            <track>
${clipItemsXml}
            </track>
          </video>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;
}

// ─── 2. Final Cut Pro X FCPXML (<fcpxml version="1.8">) ─────────────────────
// Native FCPXML format for Apple Final Cut Pro and DaVinci Resolve.

export function generateFcpxml(segments: Segment[], options: NleExportOptions = {}): string {
  const fps = Math.max(1, Math.round(options.fps || 30));
  const width = options.width || 1080;
  const height = options.height || 1920;
  const projectName = escapeXml(options.projectName || 'Epic Hertz Subtitles');

  const lastEndSec = segments.length > 0 ? Math.max(...segments.map((s) => s.end)) : 10;
  const totalFrames = Math.max(1, secondsToFrames(lastEndSec, fps));

  const titlesXml = segments
    .map((seg, idx) => {
      const startFrames = secondsToFrames(seg.start, fps);
      const durFrames = Math.max(1, secondsToFrames(seg.end - seg.start, fps));
      const cleanText = escapeXml(seg.text);

      return `          <title name="${cleanText}" offset="${startFrames}/${fps}s" ref="r2" duration="${durFrames}/${fps}s" start="0s">
            <text>
              <text-style ref="ts-${idx + 1}">${cleanText}</text-style>
            </text>
            <text-style-def id="ts-${idx + 1}">
              <text-style font="${escapeXml(options.style?.font?.family || 'Impact')}" fontSize="${Math.round(
                (options.style?.font?.size || 0.08) * Math.min(width, height),
              )}" fontColor="1 1 1 1" alignment="${options.style?.layout?.align || 'center'}"/>
            </text-style-def>
          </title>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
  <resources>
    <format id="r1" name="FFVideoFormatRateUndefined" frameDuration="1/${fps}s" width="${width}" height="${height}"/>
    <effect id="r2" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>
  <library>
    <event name="Epic Hertz Captions">
      <project name="${projectName}">
        <sequence format="r1" duration="${totalFrames}/${fps}s">
          <spine>
            <gap name="Base Track" offset="0s" duration="${totalFrames}/${fps}s" start="0s">
${titlesXml}
            </gap>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

// ─── 3. CMX 3600 EDL (Edit Decision List) ───────────────────────────────────
// Universal legacy EDL format supported across every NLE, Avid, and color grading suite.

export function generateEdl(segments: Segment[], options: NleExportOptions = {}): string {
  const fps = Math.max(1, Math.round(options.fps || 30));
  const title = (options.projectName || 'EPIC_HERTZ_SUBTITLES').replace(/\s+/g, '_').toUpperCase();

  const lines = [`TITLE: ${title}`, `FCM: NON-DROP FRAME`, ''];

  segments.forEach((seg, idx) => {
    const editNum = String(idx + 1).padStart(3, '0');
    const startFrames = secondsToFrames(seg.start, fps);
    const endFrames = Math.max(startFrames + 1, secondsToFrames(seg.end, fps));
    const durFrames = endFrames - startFrames;

    const srcIn = '00:00:00:00';
    const srcOut = framesToTimecode(durFrames, fps);
    const dstIn = framesToTimecode(startFrames, fps);
    const dstOut = framesToTimecode(endFrames, fps);

    // Standard CMX 3600 cut event line
    lines.push(`${editNum}  AX       V     C        ${srcIn} ${srcOut} ${dstIn} ${dstOut}`);
    lines.push(`* FROM CLIP NAME: SUBTITLE_${editNum}`);
    lines.push(`* COMMENT: ${seg.text.replace(/\r?\n/g, ' ')}`);
    lines.push('');
  });

  return lines.join('\r\n');
}

// ─── Download Helpers ───────────────────────────────────────────────────────

export function downloadFcp7Xml(
  segments: Segment[],
  options: NleExportOptions,
  filename: string = 'captions_premiere_davinci.xml',
): void {
  const content = generateFcp7Xml(segments, options);
  downloadText(content, filename, 'application/xml');
}

export function downloadFcpxml(
  segments: Segment[],
  options: NleExportOptions,
  filename: string = 'captions_finalcut.fcpxml',
): void {
  const content = generateFcpxml(segments, options);
  downloadText(content, filename, 'application/xml');
}

export function downloadEdl(
  segments: Segment[],
  options: NleExportOptions,
  filename: string = 'captions_timeline.edl',
): void {
  const content = generateEdl(segments, options);
  downloadText(content, filename, 'text/plain');
}
