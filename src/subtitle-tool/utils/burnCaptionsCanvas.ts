// ─── Browser-Native Canvas Subtitle Burning ─────────────────────────────────
// Why Canvas + MediaRecorder?
// 1. Browsers already have full complex text shaping (HarfBuzz, Uniscribe, CoreText)
//    built-in. Indic scripts (Telugu, Hindi, Tamil) and all Unicode scripts render
//    100% faithfully with complete ligatures and matras.
// 2. ffmpeg.wasm lacks HarfBuzz in standard builds, which causes broken/overlapping Indic glyphs.
// 3. We record the video canvas + audio track directly to MP4 / WebM with zero server latency.

import type { Segment, SubtitleStyle } from '../types';

/**
 * Burns subtitles directly into video frames using HTML5 Canvas & MediaRecorder.
 * The browser renders the font natively, so Telugu and all complex scripts look perfect!
 */
export async function burnCaptionsCanvas(
  videoFile: File,
  segments: Segment[],
  style?: SubtitleStyle,
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
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioContextClass();
        const source = audioContext.createMediaElementSource(video);
        audioDestination = audioContext.createMediaStreamDestination();
        source.connect(audioDestination);
        // Connect to destination only, don't blast speaker during burn
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

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);

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

      video.onended = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      };

      const renderLoop = () => {
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

        // 2. Find matching subtitle with syncOffset lead time
        const curTime = video.currentTime;
        const syncOffset = style?.syncOffset ?? -0.35;
        const effectiveTime = Math.max(0, curTime - syncOffset);
        const activeSub = segments.find((s) => effectiveTime >= s.start && effectiveTime <= s.end + 0.15);

        if (activeSub && activeSub.text) {
          ctx.save();
          const rawText = style?.uppercase ? activeSub.text.toUpperCase() : activeSub.text;
          const fontFamily = style?.fontFamily || 'Montserrat, Inter, "Nirmala UI", sans-serif';
          ctx.font = `900 ${fontSize}px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const x = width / 2;
          let y = height - Math.round(height * 0.12); // bottom default
          if (style?.position === 'top') {
            y = Math.round(height * 0.14);
          } else if (style?.position === 'middle') {
            y = Math.round(height * 0.5);
          }

          const metrics = ctx.measureText(rawText);
          const textWidth = metrics.width;
          const textHeight = fontSize * 1.25;

          // Background box (only if configured and not transparent)
          if (style?.backgroundColor && style.backgroundColor !== 'transparent') {
            const padX = fontSize * 0.5;
            const padY = fontSize * 0.25;
            const rx = x - textWidth / 2 - padX;
            const ry = y - textHeight / 2 - padY;
            const rw = textWidth + padX * 2;
            const rh = textHeight + padY * 2;
            const radius = fontSize * 0.25;

            ctx.fillStyle = style.backgroundColor;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(rx, ry, rw, rh, radius);
            } else {
              ctx.rect(rx, ry, rw, rh);
            }
            ctx.fill();
          }

          // Drop shadow for crisp readability
          if (style?.shadowEffect !== false) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = Math.round(fontSize * 0.3);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = Math.round(fontSize * 0.1);
          }

          // Stroke / outline
          const strokeWidth = Math.max(3, Math.round(fontSize * ((style?.outlineWidth ?? 3) * 0.04)));
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = style?.outlineColor || '#000000';
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(rawText, x, y);

          // Fill text
          ctx.fillStyle = style?.textColor || '#FFFFFF';
          ctx.fillText(rawText, x, y);

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
