import { describe, it, expect } from 'vitest';
import {
  splitWavForUpload,
  shiftSegments,
  mergeSegments,
} from '../src/subtitle-tool/utils/splitAudio';
import type { Segment } from '../src/subtitle-tool/types';

describe('Task 3: Multi-chunk clip (> 3 minutes) boundary drift verification', () => {
  const sampleRate = 16000;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = (bitsPerSample / 8) * channels; // 2 bytes per sample

  /**
   * Helper to construct a valid 16-bit PCM WAV ArrayBuffer of given length.
   */
  function createPcmWav(
    totalDurationSec: number,
    silentWindows: Array<{ startSec: number; endSec: number }> = [],
  ): ArrayBuffer {
    const totalFrames = Math.floor(totalDurationSec * sampleRate);
    const dataSize = totalFrames * bytesPerSample;
    const buf = new ArrayBuffer(44 + dataSize);
    const v = new DataView(buf);

    // RIFF header
    v.setUint8(0, 0x52); // R
    v.setUint8(1, 0x49); // I
    v.setUint8(2, 0x46); // F
    v.setUint8(3, 0x46); // F
    v.setUint32(4, 36 + dataSize, true);
    v.setUint8(8, 0x57); // W
    v.setUint8(9, 0x41); // A
    v.setUint8(10, 0x56); // V
    v.setUint8(11, 0x45); // E

    // fmt subchunk
    v.setUint8(12, 0x66); // f
    v.setUint8(13, 0x6d); // m
    v.setUint8(14, 0x74); // t
    v.setUint8(15, 0x20); // ' '
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); // PCM
    v.setUint16(22, channels, true);
    v.setUint32(24, sampleRate, true);
    v.setUint32(28, sampleRate * bytesPerSample, true);
    v.setUint16(32, bytesPerSample, true);
    v.setUint16(34, bitsPerSample, true);

    // data subchunk
    v.setUint8(36, 0x64); // d
    v.setUint8(37, 0x61); // a
    v.setUint8(38, 0x74); // t
    v.setUint8(39, 0x61); // a
    v.setUint32(40, dataSize, true);

    const samples = new Int16Array(buf, 44, totalFrames);
    // Fill with background noise/audio, but zero out silence regions where quietestFrame should cut
    for (let i = 0; i < totalFrames; i++) {
      const t = i / sampleRate;
      const isSilent = silentWindows.some((w) => t >= w.startSec && t <= w.endSec);
      if (isSilent) {
        samples[i] = 0;
      } else {
        // Speech audio simulation
        samples[i] = Math.floor(Math.sin(2 * Math.PI * 220 * t) * 8000);
      }
    }

    return buf;
  }

  it('splits a 210-second (3.5 min) audio file into chunks and verifies zero drift across chunk boundaries', async () => {
    // 210 seconds total audio > 3 minutes
    const totalDurationSec = 210;

    // Place an intentional natural silence around 98s - 104s where the split boundary should land
    const wavBuf = createPcmWav(totalDurationSec, [{ startSec: 98, endSec: 104 }]);
    const wavBlob = new Blob([wavBuf], { type: 'audio/wav' });

    // Default maxChunkBytes = 3_800_000 (~118 seconds of 16kHz 16-bit mono)
    const chunks = await splitWavForUpload(wavBlob, {
      maxChunkBytes: 3_800_000,
      searchWindowSec: 6,
      minTailSec: 10,
    });

    // A 210-second file must be split into multiple chunks (at least 2 chunks)
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].offsetSec).toBe(0);

    const chunk1End = chunks[0].offsetSec + chunks[0].durationSec;
    const chunk2Start = chunks[1].offsetSec;

    // The boundary between chunk 1 and chunk 2 must be contiguous
    expect(chunk1End).toBeCloseTo(chunk2Start, 3);
    console.log(
      `\n  Chunk 1 Duration: ${chunks[0].durationSec.toFixed(2)}s, Chunk 2 Offset: ${chunks[1].offsetSec.toFixed(2)}s`,
    );

    // Define ground-truth global speech events spanning before, across, and after the boundary
    const globalEvents = [
      {
        id: 'ev-1',
        start: 15.0,
        end: 18.0,
        text: 'Opening phrase in chunk 1',
        words: [
          { word: 'Opening', start: 15.0, end: 15.6 },
          { word: 'phrase', start: 15.7, end: 16.5 },
        ],
      },
      {
        id: 'ev-2',
        start: 95.0,
        end: 97.5,
        text: 'Right before boundary silence',
        words: [
          { word: 'Right', start: 95.0, end: 95.5 },
          { word: 'before', start: 95.6, end: 96.4 },
        ],
      },
      // ev-3 is positioned just after the cut point inside chunk 2
      {
        id: 'ev-3',
        start: chunk2Start + 2.5,
        end: chunk2Start + 5.0,
        text: 'Right after chunk boundary cut',
        words: [
          { word: 'Right', start: chunk2Start + 2.5, end: chunk2Start + 3.0 },
          { word: 'after', start: chunk2Start + 3.1, end: chunk2Start + 3.8 },
        ],
      },
      {
        id: 'ev-4',
        start: 180.0,
        end: 184.0,
        text: 'Concluding sentence in chunk 2',
        words: [
          { word: 'Concluding', start: 180.0, end: 181.0 },
          { word: 'sentence', start: 181.2, end: 182.5 },
        ],
      },
    ];

    // Simulate model transcription returning timestamps relative to each chunk
    const chunk1Segments: Segment[] = [
      {
        id: 'chunk1-seg1',
        index: 1,
        start: globalEvents[0].start - chunks[0].offsetSec,
        end: globalEvents[0].end - chunks[0].offsetSec,
        text: globalEvents[0].text,
        words: globalEvents[0].words.map((w) => ({
          word: w.word,
          start: w.start - chunks[0].offsetSec,
          end: w.end - chunks[0].offsetSec,
        })),
      },
      {
        id: 'chunk1-seg2',
        index: 2,
        start: globalEvents[1].start - chunks[0].offsetSec,
        end: globalEvents[1].end - chunks[0].offsetSec,
        text: globalEvents[1].text,
        words: globalEvents[1].words.map((w) => ({
          word: w.word,
          start: w.start - chunks[0].offsetSec,
          end: w.end - chunks[0].offsetSec,
        })),
      },
    ];

    const chunk2Segments: Segment[] = [
      {
        id: 'chunk2-seg1',
        index: 1,
        start: globalEvents[2].start - chunks[1].offsetSec,
        end: globalEvents[2].end - chunks[1].offsetSec,
        text: globalEvents[2].text,
        words: globalEvents[2].words.map((w) => ({
          word: w.word,
          start: w.start - chunks[1].offsetSec,
          end: w.end - chunks[1].offsetSec,
        })),
      },
      {
        id: 'chunk2-seg2',
        index: 2,
        start: globalEvents[3].start - chunks[1].offsetSec,
        end: globalEvents[3].end - chunks[1].offsetSec,
        text: globalEvents[3].text,
        words: globalEvents[3].words.map((w) => ({
          word: w.word,
          start: w.start - chunks[1].offsetSec,
          end: w.end - chunks[1].offsetSec,
        })),
      },
    ];

    // Shift chunk 2 segments back onto the global timeline using shiftSegments
    const shiftedChunk1 = shiftSegments(chunk1Segments, chunks[0].offsetSec);
    const shiftedChunk2 = shiftSegments(chunk2Segments, chunks[1].offsetSec);

    // Merge multi-chunk results
    const merged = mergeSegments([shiftedChunk1, shiftedChunk2]);

    expect(merged.length).toBe(4);

    // Verify 0.000s drift on every single event and word across chunk boundaries
    for (let i = 0; i < merged.length; i++) {
      const seg = merged[i];
      const truth = globalEvents[i];
      const startDrift = Math.abs(seg.start - truth.start);
      const endDrift = Math.abs(seg.end - truth.end);

      expect(startDrift).toBeLessThan(0.0001);
      expect(endDrift).toBeLessThan(0.0001);

      // Verify words inside segment
      for (let wIdx = 0; wIdx < seg.words!.length; wIdx++) {
        const word = seg.words![wIdx];
        const truthWord = truth.words[wIdx];
        const wordStartDrift = Math.abs(word.start - truthWord.start);
        expect(wordStartDrift).toBeLessThan(0.0001);
      }
    }

    // Verify boundary continuity: seg[2] (first in chunk 2) starts strictly after seg[1] (last in chunk 1)
    expect(merged[2].start).toBeGreaterThan(merged[1].end);
    // Verify sequential re-indexing
    merged.forEach((s, idx) => {
      expect(s.index).toBe(idx + 1);
    });
  });
});
