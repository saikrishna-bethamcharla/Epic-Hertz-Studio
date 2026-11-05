// ─── Browser-Native Canvas Subtitle Burning ─────────────────────────────────
// Why Canvas + MediaRecorder?
// 1. Browsers already have full complex text shaping (HarfBuzz, Uniscribe, CoreText)
//    built-in. Indic scripts (Telugu, Hindi, Tamil) and all Unicode scripts render
//    100% faithfully with complete ligatures and matras.
// 2. We record the video canvas + audio track directly to MP4 / WebM with zero server latency.
// 3. Fully cancellable via AbortSignal.

import type { Segment, CaptionStyle } from '../types';
import { renderCaptions } from '../engine/render';
import { ensureFonts } from '../engine/fonts';

/**
 * Burns subtitles directly into video frames using HTML5 Canvas & MediaRecorder.
 * Browser-native fallback for environments without WebCodecs encoder support.
 */
export async function burnCaptionsCanvas(
  videoFile: File,
  segments: Segment[],
  style: CaptionStyle,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  if (signal?.aborted) {
    throw new DOMException('Export cancelled', 'AbortError');
  }

  // Fonts must be loaded before the first frame is drawn
  await ensureFonts(style, segments.map((s) => s.text).join(' '));

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = 'anonymous';
    video.muted = false; // Need audio for stream capture
    video.playsInline = true;

    // Use off-screen canvas with true video dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      reject(new Error('Canvas 2D context not available.'));
      return;
    }

    let audioContext: AudioContext | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let animId: number | null = null;
    let isCleanedUp = false;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      if (animId) cancelAnimationFrame(animId);
      try {
        video.pause();
      } catch {}
      URL.revokeObjectURL(video.src);
      audioContext?.close().catch(() => {});
    };

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          cleanup();
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            try {
              mediaRecorder.stop();
            } catch {}
          }
          reject(new DOMException('Export cancelled', 'AbortError'));
        },
        { once: true },
      );
    }

    video.onloadedmetadata = () => {
      if (signal?.aborted) return;
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      canvas.width = width;
      canvas.height = height;

      // Setup audio capture via Web Audio API so recorded video keeps sound
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioContextClass();
        const source = audioContext.createMediaElementSource(video);
        audioDestination = audioContext.createMediaStreamDestination();
        source.connect(audioDestination);
      } catch (e) {
        console.warn('Audio capture setup warning:', e);
      }

      // Capture canvas video stream at 30 fps
      const canvasStream = canvas.captureStream(30);

      // Merge audio track from Web Audio destination or fallback video captureStream
      let audioTracks: MediaStreamTrack[] = [];
      if (audioDestination) {
        audioTracks = audioDestination.stream.getAudioTracks();
      }
      if (audioTracks.length === 0 && 'captureStream' in video) {
        try {
          // @ts-expect-error captureStream can have audio on some browsers
          audioTracks = video.captureStream().getAudioTracks();
        } catch {
          // ignore
        }
      }

      const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

      // Determine best supported MIME type (prefer MP4, fallback to WebM)
      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const chunks: Blob[] = [];
      try {
        mediaRecorder = selectedMime
          ? new MediaRecorder(combinedStream, { mimeType: selectedMime })
          : new MediaRecorder(combinedStream);
      } catch (err) {
        cleanup();
        reject(err);
        return;
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        cleanup();
        if (signal?.aborted) return;
        const finalBlob = new Blob(chunks, { type: selectedMime || 'video/mp4' });
        resolve(finalBlob);
      };

      // Drawing loop: paints video frame + active subtitle text
      const duration = video.duration || 1;

      video.onended = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      };

      const renderLoop = () => {
        if (signal?.aborted) return;
        if (video.ended) {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          return;
        }

        // Progress update
        const progress = Math.min(100, Math.round((video.currentTime / duration) * 100));
        onProgress?.(progress);

        // 1. Draw video frame
        ctx.drawImage(video, 0, 0, width, height);

        // 2. Captions: the exact renderer the live preview uses
        renderCaptions(ctx, width, height, video.currentTime, segments, style);

        animId = requestAnimationFrame(renderLoop);
      };

      // Start recording
      mediaRecorder.start(250);
      video
        .play()
        .then(() => {
          renderLoop();
        })
        .catch((err) => {
          cleanup();
          reject(err);
        });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video file into browser media player.'));
    };
  });
}
