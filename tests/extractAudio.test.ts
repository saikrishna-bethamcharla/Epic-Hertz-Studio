import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractAudio,
  __setTestAudioMockEnabled,
  __isTestAudioMockEnabled,
} from '../src/subtitle-tool/utils/extractAudio';

// Ensure window is defined for node test runner
if (typeof globalThis.window === 'undefined') {
  // @ts-expect-error Mocking window in Node test runner
  globalThis.window = globalThis;
}

describe('extractAudio utility & regression suite', () => {
  let originalAudioContext: unknown;
  let originalOfflineAudioContext: unknown;

  beforeEach(() => {
    __setTestAudioMockEnabled(false);
    originalAudioContext = window.AudioContext;
    originalOfflineAudioContext = window.OfflineAudioContext;
  });

  afterEach(() => {
    __setTestAudioMockEnabled(false);
    // @ts-expect-error Restoring AudioContext
    window.AudioContext = originalAudioContext;
    // @ts-expect-error Restoring OfflineAudioContext
    window.OfflineAudioContext = originalOfflineAudioContext;
    vi.restoreAllMocks();
  });

  function createMockAudioBuffer(
    sampleRate = 16000,
    durationSec = 1,
    frequency = 440,
  ): AudioBuffer {
    const length = Math.round(sampleRate * durationSec);
    const channelData = new Float32Array(length);
    // Fill with non-zero audible sine wave samples so it is distinctly non-silent
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.75;
    }

    return {
      sampleRate,
      numberOfChannels: 1,
      duration: durationSec,
      length,
      getChannelData: vi.fn(() => channelData),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;
  }

  it('proves a real audio decode produces valid WAV with non-zero PCM audio and never synthetic/silent audio', async () => {
    const mockBuffer = createMockAudioBuffer(16000, 1.0, 440);

    class MockAudioContext {
      async decodeAudioData(_ab: ArrayBuffer): Promise<AudioBuffer> {
        return mockBuffer;
      }
      async close(): Promise<void> {}
    }

    // @ts-expect-error Mocking AudioContext
    window.AudioContext = MockAudioContext;

    const fakeFile = new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], 'real-clip.mp4', {
      type: 'video/mp4',
    });

    const wavBlob = await extractAudio(fakeFile);
    expect(wavBlob).toBeInstanceOf(Blob);
    expect(wavBlob.type).toBe('audio/wav');
    expect(wavBlob.size).toBeGreaterThan(44); // 44 byte header + audio data

    // Inspect byte content: verify valid RIFF header
    const ab = await wavBlob.arrayBuffer();
    const view = new DataView(ab);
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
    );
    expect(riff).toBe('RIFF');

    // Verify PCM audio bytes are non-zero (non-silent)
    const pcmSamples = new Int16Array(ab.slice(44));
    let hasAudibleSamples = false;
    for (let i = 0; i < pcmSamples.length; i++) {
      if (Math.abs(pcmSamples[i]) > 1000) {
        hasAudibleSamples = true;
        break;
      }
    }
    expect(hasAudibleSamples).toBe(true);
  });

  it('regression: a decode that takes >2s succeeds and never times out prematurely', async () => {
    const mockBuffer = createMockAudioBuffer(16000, 1.5, 300);

    class MockDelayedAudioContext {
      async decodeAudioData(_ab: ArrayBuffer): Promise<AudioBuffer> {
        // Simulate a decode taking 2.2 seconds (exceeding the old 1200ms bug threshold)
        await new Promise((resolve) => setTimeout(resolve, 2200));
        return mockBuffer;
      }
      async close(): Promise<void> {}
    }

    // @ts-expect-error Mocking AudioContext
    window.AudioContext = MockDelayedAudioContext;

    const fakeFile = new File([new Uint8Array([1, 2, 3, 4])], 'heavy-2s-clip.mp4', {
      type: 'video/mp4',
    });

    const startTime = Date.now();
    const wavBlob = await extractAudio(fakeFile);
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeGreaterThanOrEqual(2000);
    expect(wavBlob).toBeInstanceOf(Blob);
    expect(wavBlob.size).toBeGreaterThan(44);
  }, 10000);

  it('regression: decode failure surfaces the user error and never returns silent or synthetic audio', async () => {
    class MockFailingAudioContext {
      async decodeAudioData(_ab: ArrayBuffer): Promise<AudioBuffer> {
        throw new DOMException('The buffer is corrupted or invalid', 'EncodingError');
      }
      async close(): Promise<void> {}
    }

    // @ts-expect-error Mocking AudioContext
    window.AudioContext = MockFailingAudioContext;

    const fakeCorruptFile = new File([new Uint8Array([0, 0, 0, 0])], 'corrupt.mp4', {
      type: 'video/mp4',
    });

    await expect(extractAudio(fakeCorruptFile)).rejects.toThrow(
      'Could not decode audio from this video file. Ensure the video contains an uncorrupted audio track.',
    );
  });

  it('throws when file size exceeds direct browser memory boundaries (>250MB)', async () => {
    class MockAudioContext {
      async decodeAudioData(): Promise<AudioBuffer> {
        return createMockAudioBuffer();
      }
      async close(): Promise<void> {}
    }
    // @ts-expect-error Mocking AudioContext
    window.AudioContext = MockAudioContext;

    const hugeFile = {
      name: 'large.mp4',
      size: 300 * 1024 * 1024,
      arrayBuffer: vi.fn(),
    } as unknown as File;

    await expect(extractAudio(hugeFile)).rejects.toThrow(/exceeds direct browser decoding limits/);
  });

  it('gates synthetic mock audio strictly behind explicit test flag and throws when disabled', async () => {
    // @ts-expect-error Removing AudioContext
    window.AudioContext = undefined;
    // @ts-expect-error Removing webkitAudioContext
    window.webkitAudioContext = undefined;

    const fakeFile = new File([new Uint8Array([1, 2])], 'no-audio-api.mp4', { type: 'video/mp4' });

    // When flag is false (default): must throw
    expect(__isTestAudioMockEnabled()).toBe(false);
    await expect(extractAudio(fakeFile)).rejects.toThrow(/Web Audio API.*not supported/);

    // When explicitly enabled in test mode: stand-in is permitted
    __setTestAudioMockEnabled(true);
    expect(__isTestAudioMockEnabled()).toBe(true);
    const mockBlob = await extractAudio(fakeFile);
    expect(mockBlob).toBeInstanceOf(Blob);
  });
});
