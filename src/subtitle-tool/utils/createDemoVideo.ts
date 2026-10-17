// ─── Synthetic Demo Video Generator ──────────────────────────────────────────
// Generates a lightweight, valid 9:16 Reel MP4/WebM video with visual motion
// and an audio track in ~150ms so visitors can test styles and effects immediately.

export async function createDemoVideo(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Setup Web Audio synth tone for demo audio track
  let audioStreamTracks: MediaStreamTrack[] = [];
  let audioCtx: AudioContext | null = null;
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime); // very soft
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    audioStreamTracks = dest.stream.getAudioTracks();
  } catch (err) {
    console.warn('AudioContext creation skipped for demo:', err);
  }

  const canvasStream = canvas.captureStream(30);
  const stream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStreamTracks,
  ]);

  const mimeTypes = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
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
      audioCtx?.close().catch(() => {});
      const blob = new Blob(chunks, { type: selectedMime || 'video/mp4' });
      const file = new File([blob], 'epic-hertz-demo-reel.mp4', {
        type: selectedMime || 'video/mp4',
        lastModified: Date.now(),
      });
      resolve(file);
    };

    recorder.start();

    // Render 4.0 seconds of animated video frames (120 frames @ 30fps)
    let frame = 0;
    const totalFrames = 120;

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

      // Animated waveform bars
      const bars = 18;
      const barWidth = 14;
      const spacing = 10;
      const startX = 360 - ((bars * (barWidth + spacing)) / 2);
      ctx.fillStyle = '#FFE600';
      for (let i = 0; i < bars; i++) {
        const height = Math.abs(Math.sin((frame * 0.1) + (i * 0.35))) * 110 + 20;
        const x = startX + (i * (barWidth + spacing));
        const y = 640 - (height / 2) + shift;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, height, 6);
        } else {
          ctx.rect(x, y, barWidth, height);
        }
        ctx.fill();
      }

      // Title & watermark
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EPIC HERTZ STUDIO', 360, 500);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '22px Inter, sans-serif';
      ctx.fillText('Interactive Demo Reel', 360, 545);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(render);
      } else {
        recorder.stop();
      }
    };

    render();
  });
}
