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
          const fontFamily = style?.fontFamily || 'Montserrat, Inter, "Nirmala UI", sans-serif';
          ctx.font = `900 ${fontSize}px ${fontFamily}`;
          ctx.textBaseline = 'middle';

          let y = height - Math.round(height * 0.12); // bottom default
          if (style?.position === 'top') {
            y = Math.round(height * 0.14);
          } else if (style?.position === 'middle') {
            y = Math.round(height * 0.5);
          }

          const strokeWidth = Math.max(3, Math.round(fontSize * ((style?.outlineWidth ?? 3) * 0.04)));
          const baseText = style?.textColor || '#FFFFFF';
          const highlightColor = style?.highlightColor || '#FFE600';
          const effect = style?.animationEffect || 'slide-up';

          // Motion Entrance Physics (Premiere Pro style slide & scale transitions)
          const timeInSeg = Math.max(0, effectiveTime - activeSub.start);
          const entranceDuration = 0.24;
          const tNorm = Math.min(1, Math.max(0, timeInSeg / entranceDuration));
          // Cubic ease-out curve
          const easeOut = 1 - Math.pow(1 - tNorm, 3);

          if (effect === 'slide-up') {
            const slideOffsetY = (1 - easeOut) * (fontSize * 1.2);
            ctx.translate(0, slideOffsetY);
          } else if (effect === 'slide-left' || effect === 'premiere-whip-slide') {
            const slideOffsetX = (1 - easeOut) * -(width * 0.1);
            ctx.translate(slideOffsetX, 0);
          } else if (effect === 'slide-right') {
            const slideOffsetX = (1 - easeOut) * (width * 0.1);
            ctx.translate(slideOffsetX, 0);
          } else if (effect === 'punch-zoom' || effect === 'comic-pop') {
            const punchScale = 0.65 + 0.35 * easeOut;
            ctx.translate(width / 2, y);
            ctx.scale(punchScale, punchScale);
            ctx.translate(-width / 2, -y);
          } else if (effect === 'bounce-rise' || effect === 'capcut-bounce') {
            let bounceScale = 1;
            let bounceY = 0;
            if (tNorm < 0.6) {
              const p = tNorm / 0.6;
              bounceScale = 0.8 + 0.35 * Math.sin(p * Math.PI * 0.5);
              bounceY = (1 - p) * (fontSize * 0.6);
            } else {
              const p = (tNorm - 0.6) / 0.4;
              bounceScale = 1.15 - 0.15 * Math.sin(p * Math.PI * 0.5);
            }
            ctx.translate(width / 2, y + bounceY);
            ctx.scale(bounceScale, bounceScale);
            ctx.translate(-width / 2, -(y + bounceY));
          } else if (effect === 'flip-3d') {
            const scaleY = Math.max(0.05, easeOut);
            ctx.translate(width / 2, y);
            ctx.scale(1, scaleY);
            ctx.translate(-width / 2, -y);
          } else if (effect === 'glitch-whip' || effect === 'premiere-rgb-glitch') {
            const glitchOffset = (1 - easeOut) * 12 * Math.sin(timeInSeg * 40);
            ctx.translate(glitchOffset, 0);
          } else if (effect === 'float-drift' || effect === 'cinematic-clean') {
            const driftX = Math.sin(effectiveTime * 1.5) * (fontSize * 0.12);
            ctx.translate(driftX, 0);
          }

          // Word breakdown with timing sync
          const rawWords = activeSub.text.trim().split(/\s+/).filter(Boolean);
          let wordsWithTimings = activeSub.words;
          if (!wordsWithTimings || wordsWithTimings.length !== rawWords.length) {
            const segDur = Math.max(0.1, activeSub.end - activeSub.start);
            const wDur = segDur / Math.max(1, rawWords.length);
            wordsWithTimings = rawWords.map((word, i) => ({
              word,
              start: activeSub.start + i * wDur,
              end: activeSub.start + (i + 1) * wDur,
            }));
          }

          // Active word index
          let activeWIdx = wordsWithTimings.findIndex(
            (w) => effectiveTime >= w.start && effectiveTime < w.end
          );
          if (activeWIdx === -1) {
            for (let i = wordsWithTimings.length - 1; i >= 0; i--) {
              if (effectiveTime >= wordsWithTimings[i].start) {
                activeWIdx = i;
                break;
              }
            }
          }
          if (activeWIdx === -1) activeWIdx = 0;

          // Measure words to calculate positions
          const spaceWidth = ctx.measureText(' ').width;
          const wordMetrics = rawWords.map((w) => {
            const formatted = style?.uppercase ? w.toUpperCase() : w;
            return {
              text: formatted,
              width: ctx.measureText(formatted).width,
            };
          });

          const totalLineWidth =
            wordMetrics.reduce((acc, m) => acc + m.width, 0) +
            spaceWidth * Math.max(0, wordMetrics.length - 1);

          // Background box for whole subtitle line if configured
          if (style?.backgroundColor && style.backgroundColor !== 'transparent') {
            const padX = fontSize * 0.5;
            const padY = fontSize * 0.25;
            const rx = width / 2 - totalLineWidth / 2 - padX;
            const ry = y - (fontSize * 1.25) / 2 - padY;
            const rw = totalLineWidth + padX * 2;
            const rh = fontSize * 1.25 + padY * 2;
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

          let curX = width / 2 - totalLineWidth / 2;

          for (let i = 0; i < wordMetrics.length; i++) {
            const m = wordMetrics[i];
            const isSpoken = i === activeWIdx;
            const wordCenterX = curX + m.width / 2;

            ctx.save();

            // Word level transformations
            if (effect === 'word-cascade') {
              const wStart = wordsWithTimings[i]?.start ?? activeSub.start;
              const wElapsed = Math.max(0, effectiveTime - wStart);
              const wt = Math.min(1, wElapsed / 0.18);
              const wEase = 1 - Math.pow(1 - wt, 3);
              const wOffsetY = (1 - wEase) * (fontSize * 0.7);
              ctx.translate(0, wOffsetY);
            }

            // Word background pill (Highlighter Sweep / Marker Wipe)
            if (isSpoken && (effect === 'highlight-wipe' || effect === 'hormozi-box' || effect === 'premiere-highlight-wipe')) {
              const pillPadX = fontSize * 0.2;
              const pillPadY = fontSize * 0.1;
              const prx = curX - pillPadX;
              const pry = y - fontSize * 0.55 - pillPadY;
              const prw = m.width + pillPadX * 2;
              const prh = fontSize * 1.1 + pillPadY * 2;
              const pradius = fontSize * 0.15;

              ctx.fillStyle = highlightColor;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(prx, pry, prw, prh, pradius);
              } else {
                ctx.rect(prx, pry, prw, prh);
              }
              ctx.fill();
            }

            if (isSpoken) {
              if (
                effect === 'slide-up' ||
                effect === 'slide-left' ||
                effect === 'punch-zoom' ||
                effect === 'bounce-rise' ||
                effect === 'flip-3d' ||
                effect === 'glitch-whip' ||
                effect === 'capcut-bounce' ||
                effect === 'comic-pop' ||
                effect === 'premiere-impact-shake' ||
                effect === 'premiere-whip-slide'
              ) {
                ctx.translate(wordCenterX, y);
                ctx.scale(1.15, 1.15);
                ctx.translate(-wordCenterX, -y);
              }

              if (effect === 'premiere-glow') {
                ctx.shadowColor = highlightColor;
                ctx.shadowBlur = Math.round(fontSize * 0.6);
              } else if (style?.shadowEffect !== false) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowBlur = Math.round(fontSize * 0.3);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = Math.round(fontSize * 0.1);
              }
            } else if (style?.shadowEffect !== false) {
              ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
              ctx.shadowBlur = Math.round(fontSize * 0.3);
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = Math.round(fontSize * 0.1);
            }

            // Outline
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = style?.outlineColor || '#000000';
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(m.text, curX, y);

            // RGB chromatic split on active word for glitch effects
            if (isSpoken && (effect === 'glitch-whip' || effect === 'premiere-rgb-glitch')) {
              ctx.fillStyle = '#00ffff';
              ctx.fillText(m.text, curX - 2, y);
              ctx.fillStyle = '#ff0055';
              ctx.fillText(m.text, curX + 2, y);
            }

            // Fill text
            if (isSpoken && (effect === 'highlight-wipe' || effect === 'hormozi-box' || effect === 'premiere-highlight-wipe')) {
              ctx.fillStyle = '#000000'; // High contrast black on yellow highlighter
            } else if (isSpoken && (style?.highlightCurrentWord || effect !== 'none')) {
              ctx.fillStyle = highlightColor;
            } else {
              ctx.fillStyle = baseText;
            }
            ctx.fillText(m.text, curX, y);

            ctx.restore();

            curX += m.width + spaceWidth;
          }

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
