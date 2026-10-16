// ─── Browser-Native Canvas Subtitle Burning ─────────────────────────────────
// Why Canvas + MediaRecorder?
// 1. Browsers already have full complex text shaping (HarfBuzz, Uniscribe, CoreText)
//    built-in. Indic scripts (Telugu, Hindi, Tamil) and all Unicode scripts render
//    100% faithfully with complete ligatures and matras.
// 2. ffmpeg.wasm lacks HarfBuzz in standard builds, which causes broken/overlapping Indic glyphs.
// 3. We record the video canvas + audio track directly to MP4 / WebM with zero server latency.

import type { Segment } from '../types';

/**
 * Burns subtitles directly into video frames using HTML5 Canvas & MediaRecorder.
 * The browser renders the font natively, so Telugu and all complex scripts look perfect!
 */
export async function burnCaptionsCanvas(
  videoFile: File,
  segments: Segment[],
  onProgress?: (pct: number) => void,
): Promise<Blob> {
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

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      canvas.width = width;
      canvas.height = height;

      // Setup audio capture via Web Audio API so recorded video keeps sound
      try {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        // Connect to destination only, don't blast speaker during burn
      } catch (e) {
        console.warn('Audio capture setup warning:', e);
      }

      // Capture canvas video stream at 30 fps
      const canvasStream = canvas.captureStream(30);

      // Merge audio track if available
      let combinedStream = canvasStream;
      // @ts-expect-error captureStream can have audio or from video
      const videoAudioTracks = video.captureStream ? video.captureStream().getAudioTracks() : [];
      if (videoAudioTracks.length > 0) {
        combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...videoAudioTracks,
        ]);
      }

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
        reject(err);
        return;
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (animId) cancelAnimationFrame(animId);
        URL.revokeObjectURL(video.src);
        audioContext?.close().catch(() => {});
        const finalBlob = new Blob(chunks, { type: selectedMime || 'video/mp4' });
        resolve(finalBlob);
      };

      // Drawing loop: paints video frame + active subtitle text
      const duration = video.duration || 1;
      const fontSize = Math.max(24, Math.round(height * 0.042)); // scales with resolution

      const renderLoop = () => {
        if (video.ended || video.paused) {
          if (video.ended && mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          return;
        }

        // Progress update
        const progress = Math.min(100, Math.round((video.currentTime / duration) * 100));
        onProgress?.(progress);

        // 1. Draw video frame
        ctx.drawImage(video, 0, 0, width, height);

        // 2. Find matching subtitle
        const curTime = video.currentTime;
        const activeSub = segments.find((s) => curTime >= s.start && curTime <= s.end);

        if (activeSub && activeSub.text) {
          ctx.save();
          // Font stack: Gautami, Nirmala UI, sans-serif
          ctx.font = `bold ${fontSize}px Gautami, "Nirmala UI", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';

          const x = width / 2;
          const y = height - Math.round(height * 0.08); // 8% from bottom

          // Background pill for contrast
          const metrics = ctx.measureText(activeSub.text);
          const padX = fontSize * 0.6;
          const padY = fontSize * 0.35;
          const textWidth = metrics.width;
          const textHeight = fontSize * 1.2;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          const rx = x - textWidth / 2 - padX;
          const ry = y - textHeight - padY / 2;
          const rw = textWidth + padX * 2;
          const rh = textHeight + padY;
          const radius = fontSize * 0.25;

          // Draw rounded rectangle pill
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(rx, ry, rw, rh, radius) : ctx.rect(rx, ry, rw, rh);
          ctx.fill();

          // Stroke / outline
          ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.08));
          ctx.strokeStyle = '#000000';
          ctx.strokeText(activeSub.text, x, y);

          // White text
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(activeSub.text, x, y);

          ctx.restore();
        }

        animId = requestAnimationFrame(renderLoop);
      };

      // Start recording
      mediaRecorder.start(250);
      video.play().then(() => {
        renderLoop();
      }).catch((err) => {
        reject(err);
      });
    };

    video.onerror = () => {
      reject(new Error('Failed to load video file into browser media player.'));
    };
  });
}
