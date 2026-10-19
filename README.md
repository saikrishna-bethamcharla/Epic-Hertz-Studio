# EPIC HERTZ STUDIO ⚡

A high-performance, AI-powered auto-captioning and kinetic subtitle studio designed for Creators, Reels, TikTok, and YouTube Shorts.

![Epic Hertz Studio](pic.png)

> **Live Application:** [saikrishna-bethamcharla.github.io/Epic-Hertz-Studio](https://saikrishna-bethamcharla.github.io/Epic-Hertz-Studio/)  
> **Cloud Studio:** [epic-hertz-studio.vercel.app](https://epic-hertz-studio.vercel.app/)

---

## ✨ Features

### 🎬 3D Scroll-Craft Landing Experience
- **Dimensional 3D Hero:** Multi-plane parallax responding dynamically to cursor position.
- **"Raw vs. Viral" Split-Scrub Curtain:** Interactive before-and-after slider comparing raw footage with kinetic captioned video in real time.
- **Horizontal Reel Runway:** 9:16 vertical smartphone previews showcasing trending creator typography and karaoke sync.
- **HTML5 Canvas Soundwave Sculptor:** Real-time multi-harmonic audio waveform canvas with reactive frequency spectrum bars.
- **1-Click Demo Launcher:** Instant test drive with browser-generated demo reels without requiring an immediate file upload.

### 🌐 Multilingual & Transliteration Engine
- **Languages:** Telugu, Hindi, English, Tamil, Kannada, Malayalam, Marathi, Bengali, Spanish, French, and Auto-Detect.
- **Dual Script Modes:**
  - **Romanized (Tanglish / Hinglish / Manglish):** Conversational regional speech transcribed in Latin letters for high retention.
  - **Native Indic Scripts:** Pure rendering for regional typography (తెలుగు లిపి, हिन्दी, தமிழ், etc.).

### 🔥 Viral Preset Library
- **CapCut Viral Bounce:** Signature bouncy pop, tilt, and electric yellow word highlight.
- **Alex Hormozi Impact:** High-contrast green jumping word badges for hook retention.
- **Cyber Glow:** Electric cyan/neon glow with ambient shadows for tech and gaming shorts.
- **MrBeast Comic:** Heavy black outline stroke with bold 3D pop.
- **Flame Hype:** Warm gradient accents with automated emoji emphasis.
- **Cinema Gold & Clean Minimalist:** Broadcast-compliant safe-zone subtitles.

### 🎛️ Pro 3-Column Studio Editor
- **Caption Editor:** Word-level timestamp precision, split/merge segments, inline search, and hotkeys.
- **Center Reel Player:** 60fps `requestAnimationFrame` sync loop, `-0.35s` timing lead offset to eliminate vocal lag, and safe-zone overlays for Instagram Reels, TikTok, and YouTube Shorts.
- **Multi-Track Timeline:** Waveform visualizer, zoom, split, trim, and scrub playhead.
- **Style Toolbar & Template Drawer:** Real-time typography adjustments (font family, size, colors, stroke, padding, casing).

### 🚀 Zero-Config Export
- **Lossless Subtitles:** Download industry-standard `.srt`, `.vtt`, or clean `.txt` transcripts.
- **Hardsubbed Video Burn:** Fast client-side WebCodecs / Canvas and FFmpeg rendering directly to MP4.

---

## 🛠️ Tech Stack

- **Framework:** React 18, TypeScript, Vite 6
- **Styling:** Tailwind CSS 4
- **Motion & Interactions:** Framer Motion 11
- **Media Processing:** Web Audio API, Canvas 2D, FFmpeg WebAssembly (`@ffmpeg/ffmpeg`)
- **AI Speech-to-Text:** Google Gemini API via Vercel Serverless proxy (`/api/transcribe`)

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+ (Node.js 22+ recommended)
- npm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/saikrishna-bethamcharla/Epic-Hertz-Studio.git
cd Epic-Hertz-Studio

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173/?view=studio](http://localhost:5173/?view=studio) in your browser.

> **Tip:** You can append `?view=studio` to the local URL to force-load the Epic Hertz Studio interface in local environments.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📂 Project Architecture

```
Epic-Hertz-Studio/
├── api/
│   └── transcribe.js             # Vercel serverless proxy for Gemini Speech-to-Text
├── public/                       # Static assets & FFmpeg WASM binaries
├── src/
│   ├── App.tsx                   # Route & environment isolation logic
│   ├── main.tsx                  # Application mount
│   ├── index.css                 # Tailwind 4 design system
│   └── subtitle-tool/
│       ├── SubtitleTool.tsx      # Main Studio lifecycle controller
│       ├── LandingScrollCraft.tsx# 3D Scroll-Craft interactive landing showcase
│       ├── VideoPreview.tsx      # 60fps reel player with safe-zone overlays
│       ├── CaptionEditor.tsx     # Left-side transcript & segment editor
│       ├── TemplateDrawer.tsx    # Right-side viral preset & style palette
│       ├── Timeline.tsx          # Multi-track audio waveform timeline
│       ├── PrepareMediaModal.tsx # Pre-processing language & script selector
│       ├── ExportModal.tsx       # Export options (SRT, VTT, TXT, Hardsub MP4)
│       ├── api/
│       │   └── transcribe.ts     # Client audio upload & proxy dispatcher
│       └── utils/
│           ├── burnCaptions.ts   # Canvas / FFmpeg video burn pipeline
│           ├── extractAudio.ts   # Client-side audio track extractor
│           └── srt.ts            # Subtitle format serializes
```

---

## 📄 License

MIT © [Sai Krishna Bethamcharla](https://github.com/saikrishna-bethamcharla)
