import { describe, it, expect } from 'vitest';
import { parseWav, shiftSegments, mergeSegments, splitWavForUpload } from '../src/subtitle-tool/utils/splitAudio';
import type { Segment } from '../src/subtitle-tool/types';

function createDummyWav(
  channels: number = 1,
  sampleRate: number = 16000,
  bitsPerSample: number = 16,
  format: number = 1,
  dataSizeOverride?: number,
  numFrames: number = 1000
): ArrayBuffer {
  const bytesPerFrame = channels * (bitsPerSample / 8);
  const pcmBytes = numFrames * bytesPerFrame;
  const dataSize = dataSizeOverride !== undefined ? dataSizeOverride : pcmBytes;
  const totalLength = 44 + pcmBytes;

  const buf = new ArrayBuffer(totalLength);
  const v = new DataView(buf);

  // RIFF header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  v.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');

  // fmt chunk
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true); // chunk size
  v.setUint16(20, format, true); // format (1 = PCM)
  v.setUint16(22, channels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * bytesPerFrame, true); // byte rate
  v.setUint16(32, bytesPerFrame, true); // block align
  v.setUint16(34, bitsPerSample, true);

  // data chunk
  writeStr(36, 'data');
  v.setUint32(40, dataSize, true);

  return buf;
}

describe('splitAudio: parseWav', () => {
  it('returns null for buffers shorter than 44 bytes', () => {
    expect(parseWav(new ArrayBuffer(40))).toBeNull();
  });

  it('returns null for non-RIFF/non-WAVE headers', () => {
    const buf = new ArrayBuffer(44);
    expect(parseWav(buf)).toBeNull();
  });

  it('parses valid 16-bit mono PCM WAV', () => {
    const buf = createDummyWav(1, 16000, 16, 1, undefined, 500);
    const info = parseWav(buf);
    expect(info).not.toBeNull();
    expect(info?.sampleRate).toBe(16000);
    expect(info?.channels).toBe(1);
    expect(info?.bitsPerSample).toBe(16);
    expect(info?.dataOffset).toBe(44);
    expect(info?.dataSize).toBe(500 * 2);
  });

  it('returns null for non-PCM formats (e.g. float or compressed audio)', () => {
    const buf = createDummyWav(1, 16000, 32, 3); // 3 = IEEE Float
    expect(parseWav(buf)).toBeNull();
  });

  it('returns null for non-16-bit PCM (e.g. 24-bit PCM)', () => {
    const buf = createDummyWav(1, 16000, 24, 1);
    expect(parseWav(buf)).toBeNull();
  });

  it('clamps dataSize when encoder specifies 0 or 0xFFFFFFFF for streaming', () => {
    const buf = createDummyWav(1, 16000, 16, 1, 0, 400); // 0 data size
    const info = parseWav(buf);
    expect(info).not.toBeNull();
    expect(info?.dataSize).toBe(400 * 2);

    const bufMax = createDummyWav(1, 16000, 16, 1, 0xffffffff, 300);
    const infoMax = parseWav(bufMax);
    expect(infoMax).not.toBeNull();
    expect(infoMax?.dataSize).toBe(300 * 2);
  });
});

describe('splitAudio: shiftSegments', () => {
  it('shifts segment start, end, and word timestamps by offset', () => {
    const segments: Segment[] = [
      {
        id: 's1',
        index: 1,
        start: 1.0,
        end: 2.5,
        text: 'Hello world',
        words: [
          { word: 'Hello', start: 1.0, end: 1.8 },
          { word: 'world', start: 1.8, end: 2.5 },
        ],
      },
    ];

    const shifted = shiftSegments(segments, 10.0);
    expect(shifted[0].start).toBe(11.0);
    expect(shifted[0].end).toBe(12.5);
    expect(shifted[0].words?.[0].start).toBe(11.0);
    expect(shifted[0].words?.[0].end).toBe(11.8);
    expect(shifted[0].words?.[1].start).toBe(11.8);
    expect(shifted[0].words?.[1].end).toBe(12.5);
  });

  it('returns unmodified segments if offset is 0', () => {
    const segments: Segment[] = [{ id: 's1', index: 1, start: 1.0, end: 2.0, text: 'Hi' }];
    expect(shiftSegments(segments, 0)).toBe(segments);
  });
});

describe('splitAudio: mergeSegments', () => {
  it('merges, sorts, and renumbers segments from multiple chunks', () => {
    const chunk1: Segment[] = [
      { id: 'c1-1', index: 1, start: 0, end: 2.0, text: 'First' },
      { id: 'c1-2', index: 2, start: 2.5, end: 4.0, text: 'Second' },
    ];
    const chunk2: Segment[] = [
      { id: 'c2-1', index: 1, start: 3.8, end: 6.0, text: 'Third (partially overlaps Second)' },
      { id: 'c2-2', index: 2, start: 6.2, end: 8.0, text: 'Fourth' },
    ];

    const merged = mergeSegments([chunk1, chunk2]);
    expect(merged.length).toBe(4);
    expect(merged[0].index).toBe(1);
    expect(merged[1].index).toBe(2);
    // Overlap should be clamped so chunk1 segment 2 ends when chunk2 segment 1 starts
    expect(merged[1].end).toBe(3.8);
    expect(merged[2].start).toBe(3.8);
    expect(merged[3].index).toBe(4);
  });
});

describe('splitAudio: splitWavForUpload', () => {
  it('returns single chunk if audio size is under maxChunkBytes', async () => {
    const buf = createDummyWav(1, 16000, 16, 1, undefined, 1000);
    const blob = new Blob([buf], { type: 'audio/wav' });
    const chunks = await splitWavForUpload(blob, { maxChunkBytes: 1_000_000 });
    expect(chunks.length).toBe(1);
    expect(chunks[0].offsetSec).toBe(0);
    expect(chunks[0].durationSec).toBeCloseTo(1000 / 16000, 2);
  });
});
