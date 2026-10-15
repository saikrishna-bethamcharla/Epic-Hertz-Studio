import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'public/assets/picks';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Read assets
const zaiIconB64 = fs.existsSync('public/assets/zailabs-icon-clean.png')
  ? fs.readFileSync('public/assets/zailabs-icon-clean.png').toString('base64') : '';
const kingstonShieldB64 = fs.existsSync('public/assets/kingston-shield.svg')
  ? fs.readFileSync('public/assets/kingston-shield.svg').toString('base64') : '';
const kingstonLogoB64 = fs.existsSync('public/assets/kingston-logo.svg')
  ? fs.readFileSync('public/assets/kingston-logo.svg').toString('base64') : '';
const webSuiteB64 = fs.existsSync('public/assets/projects/website-development-suite.jpg')
  ? fs.readFileSync('public/assets/projects/website-development-suite.jpg').toString('base64') : '';
const aeB64 = fs.existsSync('public/assets/tools/aftereffects.png')
  ? fs.readFileSync('public/assets/tools/aftereffects.png').toString('base64') : '';
const psB64 = fs.existsSync('public/assets/tools/photoshop.png')
  ? fs.readFileSync('public/assets/tools/photoshop.png').toString('base64') : '';

const cards = [
  // 1. Zai Labs - Primary Role
  {
    id: 'pick-1',
    renderHtml: () => `
      <div class="card bg-zai">
        <div class="glow zai-glow"></div>
        <div class="grid-mesh"></div>

        <div class="centerpiece flex-col">
          <div class="zai-symbol-wrap">
            <svg width="110" height="110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="zaiGrad" x1="0%" y1="20%" x2="100%" y2="80%">
                  <stop offset="0%" stop-color="#00aaff" />
                  <stop offset="45%" stop-color="#00e5ff" />
                  <stop offset="100%" stop-color="#00ff88" />
                </linearGradient>
                <filter id="zaiGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path d="M 52 14 C 31.5 14 15 30.5 15 51 C 15 71.5 31.5 88 52 88 C 63.8 88 74.2 82.5 81 74 L 81 83 C 81 85.5 83 87.5 85.5 87.5 L 87.5 87.5 C 90 87.5 92 85.5 92 83 L 92 38 C 92 24.7 81.3 14 68 14 L 52 14 Z M 52 28 C 64.7 28 75 38.3 75 51 C 75 63.7 64.7 74 52 74 C 39.3 74 29 63.7 29 51 C 29 38.3 39.3 28 52 28 Z" fill="url(#zaiGrad)" filter="url(#zaiGlow)" />
              <path d="M 43 38.5 C 43 36.8 44.8 35.8 46.2 36.7 L 66.8 49.2 C 68.2 50 68.2 52 66.8 52.8 L 46.2 65.3 C 44.8 66.2 43 65.2 43 63.5 Z" fill="#00d4ff" />
            </svg>
          </div>
          <div class="zai-wordmark">ZAI LABS</div>
          <div class="zai-tagline">AI • TECHNOLOGY • CREATIVITY</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 2. AI Video Engine (Seedance & Kling)
  {
    id: 'pick-2',
    renderHtml: () => `
      <div class="card bg-cinema">
        <div class="glow red-glow"></div>
        <div class="centerpiece flex-col">
          <div class="viewfinder">
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
            <div class="rec-dot"></div>
            <span class="rec-text">REC • 24.00 FPS • 4K HDR</span>
            <div class="crosshair">+</div>
            <div class="dual-engines">
              <span class="engine-badge">SEEDANCE 2.0</span>
              <span class="engine-sep">×</span>
              <span class="engine-badge">KLING 3.0</span>
            </div>
          </div>
          <div class="aperture-sub">MULTI-SHOT SHOT BIBLES</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 3. Kingston University London
  {
    id: 'pick-3',
    renderHtml: () => `
      <div class="card bg-kingston">
        <div class="glow kingston-glow"></div>
        <div class="centerpiece flex-col">
          <div class="ku-crest-wrap">
            <img src="data:image/svg+xml;base64,${kingstonShieldB64}" class="ku-crest" />
          </div>
          <div class="ku-city">LONDON • UNITED KINGDOM</div>
          <div class="ku-year">EST. 1899 • CLASS OF 2022</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 4. Bilingual (EN+ZH) Prompt Mastery
  {
    id: 'pick-4',
    renderHtml: () => `
      <div class="card bg-prompt">
        <div class="glow cyan-glow"></div>
        <div class="centerpiece flex-col">
          <div class="chinese-glyph">镜头一致性</div>
          <div class="token-bracket">[STRUCTURED_PROMPT // EN+ZH]</div>
          <div class="token-pills">
            <span class="tok">CINEMATIC</span>
            <span class="tok">LIGHTING</span>
            <span class="tok">人物设定</span>
          </div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 5. Website Development - Production Web Platforms
  {
    id: 'pick-5',
    renderHtml: () => `
      <div class="card bg-web">
        <div class="glow blue-glow"></div>
        <div class="centerpiece flex-col">
          <div class="browser-mockup">
            <div class="browser-header">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
              <span class="browser-url">vasudha • zailabs • pranic</span>
            </div>
            <img src="data:image/jpeg;base64,${webSuiteB64}" class="browser-preview" />
          </div>
          <div class="web-spec">80+ NATIONS • ZOHO CRM • 3 PLATFORMS</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 6. Pranic Healing State Chapter Portal
  {
    id: 'pick-6',
    renderHtml: () => `
      <div class="card bg-pranic">
        <div class="glow emerald-glow"></div>
        <div class="centerpiece flex-col">
          <div class="aura-container">
            <div class="halo-circle outer"></div>
            <div class="halo-circle inner"></div>
            <div class="aura-star">✦</div>
          </div>
          <div class="pranic-name">AP & TELANGANA CHAPTER</div>
          <div class="pranic-sub">8:40 PM TWIN HEARTS RSVP</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 7. DaVinci Resolve - Post-Production
  {
    id: 'pick-7',
    renderHtml: () => `
      <div class="card bg-davinci">
        <div class="glow red-glow"></div>
        <div class="centerpiece flex-col">
          <div class="wheels-cluster">
            <div class="wheel lift"><span class="w-name">LIFT</span></div>
            <div class="wheel gamma"><span class="w-name">GAMMA</span></div>
            <div class="wheel gain"><span class="w-name">GAIN</span></div>
          </div>
          <div class="tc-display">TC 01:00:24:18</div>
          <div class="davinci-sub">BEAT-SYNCED • 4K COLOR GRADE</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 8. After Effects - Motion Graphics
  {
    id: 'pick-8',
    renderHtml: () => `
      <div class="card bg-ae">
        <div class="glow purple-glow"></div>
        <div class="centerpiece flex-col">
          <div class="tool-emblem ae-emblem">
            <img src="data:image/png;base64,${aeB64}" class="tool-logo-img" />
          </div>
          <div class="kf-timeline">
            <span class="kf-node">◆</span>
            <span class="kf-line"></span>
            <span class="kf-node active">◆</span>
            <span class="kf-line"></span>
            <span class="kf-node">◆</span>
          </div>
          <div class="ae-sub">BEZIER CURVES • 3D COMPOSITING</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 9. Visual Design - Illustrator & Photoshop
  {
    id: 'pick-9',
    renderHtml: () => `
      <div class="card bg-design">
        <div class="glow amber-glow"></div>
        <div class="centerpiece flex-col">
          <div class="duo-emblems">
            <div class="ai-emblem">Ai</div>
            <div class="tool-emblem ps-emblem">
              <img src="data:image/png;base64,${psB64}" class="tool-logo-img" />
            </div>
          </div>
          <div class="pen-curve">
            <svg width="140" height="26" viewBox="0 0 140 26" fill="none">
              <path d="M5 21 C40 2, 100 2, 135 21" stroke="#ffb547" stroke-width="2.5" />
              <circle cx="5" cy="21" r="3.5" fill="#ffb547" />
              <circle cx="135" cy="21" r="3.5" fill="#ffb547" />
              <rect x="68" y="7" width="5" height="5" fill="#fff" />
            </svg>
          </div>
          <div class="design-sub">SWISS TYPOGRAPHY • VECTOR ART</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  },
  // 10. Production SOPs - Studio Leadership
  {
    id: 'pick-10',
    renderHtml: () => `
      <div class="card bg-sops">
        <div class="glow gold-glow"></div>
        <div class="centerpiece flex-col">
          <div class="slate-board">
            <div class="slate-stripes">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="slate-inner">
              <div class="slate-title">SCENE: PRODUCTION</div>
              <div class="slate-meta">TAKE: 01 • STUDIO SOPs</div>
            </div>
          </div>
          <div class="sops-sub">WORK ORDERS • QUOTES • INVOICES</div>
        </div>
        <div class="bottom-gradient"></div>
      </div>
    `
  }
];

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 360px;
    height: 500px;
    background: #000;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .card {
    position: relative;
    width: 360px;
    height: 500px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 20px 18px;
    color: #f4f1ec;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px);
    pointer-events: none;
    opacity: 0.6;
    z-index: 5;
  }
  .glow {
    position: absolute;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    filter: blur(55px);
    pointer-events: none;
    z-index: 1;
  }
  .top-accent {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
  }
  .pill-tag {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.22em;
    padding: 4px 10px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .zai-tag { background: rgba(0, 229, 255, 0.18); border: 1px solid rgba(0, 229, 255, 0.45); color: #00e5ff; }
  .red-tag { background: rgba(229, 19, 43, 0.2); border: 1px solid rgba(229, 19, 43, 0.5); color: #ff3d5a; }
  .gold-tag { background: rgba(212, 175, 55, 0.2); border: 1px solid rgba(212, 175, 55, 0.5); color: #fed053; }
  .cyan-tag { background: rgba(0, 229, 255, 0.2); border: 1px solid rgba(0, 229, 255, 0.5); color: #00e5ff; }
  .blue-tag { background: rgba(0, 112, 243, 0.2); border: 1px solid rgba(0, 112, 243, 0.5); color: #4cc9ff; }
  .emerald-tag { background: rgba(0, 230, 118, 0.2); border: 1px solid rgba(0, 230, 118, 0.5); color: #80ffd2; }
  .purple-tag { background: rgba(157, 78, 221, 0.2); border: 1px solid rgba(157, 78, 221, 0.5); color: #d084ff; }
  .amber-tag { background: rgba(255, 145, 0, 0.2); border: 1px solid rgba(255, 145, 0, 0.5); color: #ffb547; }

  .centerpiece {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    margin-top: 34px;
    margin-bottom: 125px;
  }
  .flex-col { flex-direction: column; }

  .bottom-gradient {
    position: absolute;
    inset-x: 0;
    bottom: 0;
    height: 180px;
    background: linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.4) 80%, transparent 100%);
    pointer-events: none;
    z-index: 8;
  }

  /* 1. Zai Labs */
  .bg-zai { background: radial-gradient(circle at 50% 30%, #0d1e30, #050811 85%); }
  .zai-glow { background: rgba(0, 229, 255, 0.35); top: 15%; left: 15%; }
  .grid-mesh {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.5;
  }
  .zai-symbol-wrap {
    width: 105px;
    height: 105px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
  .zai-icon {
    width: 90px;
    height: 90px;
    object-fit: contain;
    filter: drop-shadow(0 0 25px rgba(0, 229, 255, 0.6));
    mix-blend-mode: lighten;
  }
  .zai-wordmark {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 0.18em;
    color: #f4f1ec;
    margin-top: 8px;
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  }
  .zai-tagline {
    font-size: 8px;
    letter-spacing: 0.3em;
    font-weight: 700;
    color: rgba(0, 229, 255, 0.85);
    margin-top: 4px;
  }

  /* 2. Cinema Engine */
  .bg-cinema { background: radial-gradient(circle at 50% 30%, #2b060d, #080305 85%); }
  .red-glow { background: rgba(229, 9, 20, 0.35); top: 15%; left: 15%; }
  .viewfinder {
    position: relative;
    width: 250px;
    height: 130px;
    border: 1px dashed rgba(255, 61, 90, 0.3);
    background: rgba(0,0,0,0.45);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 25px rgba(229, 9, 20, 0.25);
  }
  .corner { position: absolute; width: 10px; height: 10px; border: 2px solid #ff3d5a; }
  .tl { top: -2px; left: -2px; border-right: none; border-bottom: none; }
  .tr { top: -2px; right: -2px; border-left: none; border-bottom: none; }
  .bl { bottom: -2px; left: -2px; border-right: none; border-top: none; }
  .br { bottom: -2px; right: -2px; border-left: none; border-top: none; }
  .rec-dot { position: absolute; top: 10px; left: 12px; width: 7px; height: 7px; border-radius: 50%; background: #ff3d5a; box-shadow: 0 0 8px #ff3d5a; }
  .rec-text { position: absolute; top: 8px; left: 24px; font-size: 8px; font-weight: 700; letter-spacing: 0.15em; color: rgba(255,255,255,0.7); }
  .crosshair { font-size: 26px; color: #ff3d5a; line-height: 1; margin-top: 10px; }
  .dual-engines { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
  .engine-badge { font-size: 9px; font-weight: 800; letter-spacing: 0.18em; color: #ff8597; background: rgba(229, 9, 20, 0.2); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255, 61, 90, 0.4); }
  .engine-sep { color: rgba(255,255,255,0.4); font-size: 11px; }
  .aperture-sub { font-size: 9px; letter-spacing: 0.24em; font-weight: 700; color: rgba(255,255,255,0.65); margin-top: 12px; }

  /* 3. Kingston */
  .bg-kingston { background: radial-gradient(circle at 50% 30%, #0d122e, #050611 85%); }
  .kingston-glow { background: rgba(80, 110, 240, 0.35); top: 12%; left: 15%; }
  .ku-crest-wrap {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 10px 25px rgba(0,0,0,0.85)) drop-shadow(0 0 25px rgba(212, 175, 55, 0.4));
  }
  .ku-crest { height: 115px; width: auto; }
  .ku-title {
    font-size: 21px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #f4f1ec;
    margin-top: 12px;
    text-shadow: 0 4px 15px rgba(0,0,0,0.8);
  }
  .ku-city { font-size: 10px; font-weight: 800; letter-spacing: 0.28em; color: #fed053; margin-top: 4px; }
  .ku-year { font-size: 9px; letter-spacing: 0.2em; color: rgba(244,241,236,0.6); margin-top: 4px; }

  /* 4. Prompt */
  .bg-prompt { background: radial-gradient(circle at 50% 30%, #062230, #04080e 85%); }
  .cyan-glow { background: rgba(0, 229, 255, 0.35); top: 15%; left: 15%; }
  .chinese-glyph {
    font-size: 38px;
    font-weight: 900;
    color: #f4f1ec;
    letter-spacing: 0.15em;
    text-shadow: 0 0 30px rgba(0, 229, 255, 0.6);
  }
  .token-bracket {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.18em;
    color: #00e5ff;
    margin-top: 8px;
    background: rgba(0, 229, 255, 0.1);
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid rgba(0, 229, 255, 0.3);
  }
  .token-pills { display: flex; gap: 6px; margin-top: 12px; }
  .tok { font-size: 9px; letter-spacing: 0.15em; color: rgba(244,241,236,0.7); background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 3px; }

  /* 5. Web */
  .bg-web { background: radial-gradient(circle at 50% 30%, #091a2e, #04080f 85%); }
  .blue-glow { background: rgba(0, 112, 243, 0.35); top: 15%; left: 15%; }
  .browser-mockup {
    width: 250px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.18);
    background: #0d1117;
    box-shadow: 0 15px 35px rgba(0,0,0,0.85);
  }
  .browser-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; }
  .red { background: #ff5f56; }
  .yellow { background: #ffbd2e; }
  .green { background: #27c93f; }
  .browser-url { font-family: ui-monospace, monospace; font-size: 8px; color: rgba(255,255,255,0.5); margin-left: 8px; letter-spacing: 0.1em; }
  .browser-preview { width: 100%; height: 110px; object-fit: cover; display: block; }
  .web-spec { font-size: 9px; font-weight: 700; letter-spacing: 0.22em; color: #4cc9ff; margin-top: 12px; }

  /* 6. Pranic */
  .bg-pranic { background: radial-gradient(circle at 50% 30%, #062b1e, #030b08 85%); }
  .emerald-glow { background: rgba(0, 230, 118, 0.35); top: 15%; left: 15%; }
  .aura-container {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .halo-circle {
    position: absolute;
    border-radius: 50%;
  }
  .outer { width: 110px; height: 110px; border: 1px solid rgba(0, 230, 118, 0.4); box-shadow: 0 0 30px rgba(0, 230, 118, 0.3); }
  .inner { width: 80px; height: 80px; border: 1px solid rgba(255, 215, 0, 0.45); }
  .aura-star { font-size: 38px; color: #ffd700; text-shadow: 0 0 25px #00e676; }
  .pranic-name { font-size: 11px; font-weight: 800; letter-spacing: 0.2em; color: #80ffd2; margin-top: 12px; }
  .pranic-sub { font-size: 9px; letter-spacing: 0.16em; color: rgba(244,241,236,0.6); margin-top: 4px; }

  /* 7. DaVinci */
  .bg-davinci { background: radial-gradient(circle at 50% 30%, #2b0811, #080305 85%); }
  .wheels-cluster { display: flex; gap: 10px; align-items: center; }
  .wheel {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 15px rgba(0,0,0,0.85);
  }
  .lift { background: radial-gradient(circle at 40% 40%, rgba(229,19,43,0.5), rgba(10,5,15,0.9)); border-color: #ff3d5a; }
  .gamma { background: radial-gradient(circle at 60% 40%, rgba(76,201,255,0.5), rgba(5,15,25,0.9)); border-color: #4cc9ff; }
  .gain { background: radial-gradient(circle at 50% 60%, rgba(255,181,71,0.5), rgba(25,15,5,0.9)); border-color: #ffb547; }
  .w-name { font-size: 8px; font-weight: 800; letter-spacing: 0.15em; color: rgba(255,255,255,0.8); }
  .tc-display { font-family: ui-monospace, monospace; font-size: 15px; font-weight: 800; letter-spacing: 0.25em; color: #ff3d5a; margin-top: 12px; text-shadow: 0 0 10px rgba(229,19,43,0.6); }
  .davinci-sub { font-size: 8px; letter-spacing: 0.2em; color: rgba(244,241,236,0.6); margin-top: 4px; }

  /* 8. After Effects */
  .bg-ae { background: radial-gradient(circle at 50% 30%, #210a30, #06020a 85%); }
  .purple-glow { background: rgba(157, 78, 221, 0.4); top: 15%; left: 15%; }
  .tool-emblem {
    width: 80px;
    height: 80px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 35px rgba(157, 78, 221, 0.45);
  }
  .ae-emblem { background: #00005b; border: 2px solid #9999ff; }
  .tool-logo-img { width: 55px; height: 55px; object-fit: contain; }
  .kf-timeline { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
  .kf-node { font-size: 13px; color: rgba(255,255,255,0.35); }
  .kf-node.active { color: #d084ff; text-shadow: 0 0 12px #d084ff; }
  .kf-line { width: 28px; height: 1px; background: rgba(255,255,255,0.25); }
  .ae-sub { font-size: 8px; letter-spacing: 0.2em; color: rgba(244,241,236,0.6); margin-top: 10px; }

  /* 9. Visual Design */
  .bg-design { background: radial-gradient(circle at 50% 30%, #2c1a06, #0a0602 85%); }
  .amber-glow { background: rgba(255, 145, 0, 0.35); top: 15%; left: 15%; }
  .duo-emblems { display: flex; gap: 14px; align-items: center; }
  .ai-emblem {
    width: 65px;
    height: 65px;
    border-radius: 15px;
    background: #330000;
    border: 2px solid #ff9a00;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 900;
    color: #ff9a00;
    box-shadow: 0 0 25px rgba(255, 154, 0, 0.4);
  }
  .ps-emblem {
    width: 65px;
    height: 65px;
    border-radius: 15px;
    box-shadow: 0 0 25px rgba(49, 168, 255, 0.4);
  }
  .pen-curve { margin-top: 12px; }
  .design-sub { font-size: 8px; letter-spacing: 0.22em; color: rgba(244,241,236,0.6); margin-top: 8px; }

  /* 10. SOPs */
  .bg-sops { background: radial-gradient(circle at 50% 30%, #1e1706, #070602 85%); }
  .gold-glow { background: rgba(212, 175, 55, 0.35); top: 15%; left: 15%; }
  .slate-board {
    width: 190px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.5);
    box-shadow: 0 10px 30px rgba(0,0,0,0.85);
  }
  .slate-stripes {
    height: 22px;
    background: #111;
    display: flex;
    gap: 8px;
    padding: 0 8px;
    border-bottom: 2px solid rgba(212, 175, 55, 0.5);
    align-items: center;
  }
  .slate-stripes span {
    width: 14px;
    height: 100%;
    background: #d4af37;
    transform: skewX(-25deg);
  }
  .slate-inner {
    padding: 12px;
    background: rgba(12,10,4,0.92);
    font-family: ui-monospace, monospace;
    text-align: center;
  }
  .slate-title { font-size: 10px; font-weight: 800; color: #fed053; letter-spacing: 0.15em; }
  .slate-meta { font-size: 8px; color: rgba(255,255,255,0.65); letter-spacing: 0.12em; margin-top: 4px; }
  .sops-sub { font-size: 8px; letter-spacing: 0.2em; color: rgba(244,241,236,0.6); margin-top: 12px; }
`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 500, deviceScaleFactor: 1 });

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${styles}</style>
      </head>
      <body>
        ${card.renderHtml()}
      </body>
      </html>
    `;

    await page.setContent(fullHtml);
    const dest = path.join(OUT_DIR, `${card.id}.webp`);
    await page.screenshot({ path: dest, type: 'webp', quality: 94 });
    console.log(`Generated ${dest}`);
  }

  await browser.close();
  console.log('All 10 refined cinematic pick posters created!');
})();
