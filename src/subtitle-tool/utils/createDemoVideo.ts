// ─── Synthetic Demo Video Generator ──────────────────────────────────────────
// Provides a valid 9:16 Reel MP4 video with visual motion and an audio track.
// Prefers loading the prebuilt demo asset for instant loading across all browsers
// (including WebKit/Safari and mobile), with an in-browser canvas stream fallback.

import { getAssetUrl } from './assetUrl';

export async function createDemoVideo(): Promise<File> {
  // 1. Preferred Path: Fetch prebuilt lightweight high-compatibility MP4 demo asset.
  // Instant (~5ms), works on all browsers without requiring canvas.captureStream.
  try {
    const assetUrl = getAssetUrl('assets/demo-reel.mp4');
    const res = await fetch(assetUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 1000) {
        return new File([blob], 'epic-hertz-demo-reel.mp4', {
          type: 'video/mp4',
          lastModified: Date.now(),
        });
      }
    }
  } catch (err) {
    console.warn('Prebuilt demo video fetch failed, attempting canvas generator:', err);
  }

  // 2. Fallback Path: In-browser canvas + Web Audio stream recording
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  if (
    typeof (canvas as unknown as { captureStream?: (fps?: number) => MediaStream })
      .captureStream !== 'function' ||
    typeof MediaRecorder === 'undefined'
  ) {
    throw new Error(
      'Your browser does not support in-browser video generation (HTMLCanvasElement.captureStream). Please upload an MP4 or WebM video file to test Epic Hertz Studio.',
    );
  }

  // Setup Web Audio synth tone for demo audio track
  let audioStreamTracks: MediaStreamTrack[] = [];
  let audioCtx: AudioContext | null = null;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime); // soft tone
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    audioStreamTracks = dest.stream.getAudioTracks();
  } catch (err) {
    console.warn('AudioContext creation skipped for demo:', err);
  }

  const canvasStream = (
    canvas as unknown as { captureStream: (fps: number) => MediaStream }
  ).captureStream(30);
  const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioStreamTracks]);

  const mimeTypes = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  let selectedMime = '';
  for (const mime of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMime = mime;
      break;
    }
  }

  const recorder = selectedMime
    ? new MediaRecorder(stream, { mimeType: selectedMime })
    : new MediaRecorder(stream);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      canvasStream.getTracks().forEach((track) => track.stop());
      audioCtx?.close().catch(() => {});
      const blob = new Blob(chunks, { type: selectedMime || 'video/mp4' });
      const file = new File([blob], 'epic-hertz-demo-reel.mp4', {
        type: selectedMime || 'video/mp4',
        lastModified: Date.now(),
      });
      resolve(file);
    };

    recorder.start();

    // Render 1.5 seconds of animated video frames (45 frames @ 30fps)
    let frame = 0;
    const totalFrames = 45;

    const render = () => {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 720, 1280);
      const shift = Math.sin(frame * 0.05) * 20;
      grad.addColorStop(0, '#1c1a16');
      grad.addColorStop(0.5, '#2b2318');
      grad.addColorStop(1, '#0e0d0b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // Radial center glow
      const radial = ctx.createRadialGradient(360, 640, 20, 360, 640, 320);
      radial.addColorStop(0, 'rgba(255, 230, 0, 0.18)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 720, 1280);

      // Waveform bars
      const bars = 18;
      const barWidth = 14;
      const spacing = 10;
      const startX = 360 - (bars * (barWidth + spacing)) / 2;
      ctx.fillStyle = '#FFE600';
      for (let i = 0; i < bars; i++) {
        const height = Math.abs(Math.sin(frame * 0.1 + i * 0.35)) * 110 + 20;
        const x = startX + i * (barWidth + spacing);
        const y = 640 - height / 2 + shift;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, height, 6);
        } else {
          ctx.rect(x, y, barWidth, height);
        }
        ctx.fill();
      }

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(render);
      } else {
        recorder.stop();
      }
    };

    requestAnimationFrame(render);
  });
}
