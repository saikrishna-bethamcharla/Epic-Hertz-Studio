import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const reelImgBase64 = fs.readFileSync('public/assets/landing-hero-reel.jpg').toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background: #0c0c0b;
      color: #f4f1ec;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 75px 0 85px;
      position: relative;
    }
    .bg-glow {
      position: absolute;
      width: 650px;
      height: 650px;
      right: 30px;
      top: -10px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 72%);
      pointer-events: none;
    }
    .bg-glow-left {
      position: absolute;
      width: 500px;
      height: 500px;
      left: -120px;
      bottom: -120px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.10) 0%, transparent 70%);
      pointer-events: none;
    }
    .left-content {
      max-width: 620px;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .pill-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px;
      background: rgba(245, 158, 11, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.38);
      border-radius: 999px;
      color: #fbbf24;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      width: fit-content;
    }
    .pill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fbbf24;
      box-shadow: 0 0 10px #fbbf24;
    }
    .title {
      font-family: 'Montserrat', sans-serif;
      font-size: 64px;
      font-weight: 900;
      line-height: 1.04;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .title span {
      color: #fbbf24;
    }
    .desc {
      font-size: 21px;
      line-height: 1.45;
      color: #c7c6cf;
      font-weight: 500;
    }
    .desc strong {
      color: #ffffff;
      font-weight: 700;
    }
    .lang-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 4px;
    }
    .lang-pill {
      padding: 7px 15px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 13px;
      font-weight: 600;
      color: #e4e4e7;
    }
    .lang-pill.active {
      background: rgba(245, 158, 11, 0.22);
      border-color: rgba(245, 158, 11, 0.55);
      color: #fef08a;
    }
    .footer-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: #9ca3af;
      margin-top: 6px;
      font-family: 'Inter', monospace;
    }
    .phone-mockup {
      width: 320px;
      height: 540px;
      background: #18181b;
      border-radius: 42px;
      border: 5px solid #2e2e32;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(245, 158, 11, 0.25);
      position: relative;
      overflow: hidden;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .phone-bg {
      position: absolute;
      inset: 0;
      background-image: url('data:image/jpeg;base64,${reelImgBase64}');
      background-size: cover;
      background-position: center 22%;
    }
    .phone-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.85) 88%);
    }
    .caption-box {
      position: relative;
      z-index: 3;
      padding: 24px 16px 36px 16px;
      text-align: center;
    }
    .caption-text {
      font-family: 'Montserrat', sans-serif;
      font-size: 22px;
      font-weight: 900;
      line-height: 1.35;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 3px 12px rgba(0,0,0,0.95);
      letter-spacing: 0.02em;
    }
    .highlight-word {
      display: inline-block;
      background: #ffe600;
      color: #000000;
      padding: 2px 9px;
      border-radius: 6px;
      transform: scale(1.08);
      box-shadow: 0 4px 16px rgba(255, 230, 0, 0.45);
      margin: 0 4px;
      text-shadow: none;
    }
    .phone-notch {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 95px;
      height: 22px;
      background: #000000;
      border-radius: 14px;
      z-index: 4;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-glow-left"></div>

  <div class="left-content">
    <div class="pill-tag">
      <div class="pill-dot"></div>
      AI Auto-Caption Studio
    </div>
    <div class="title">
      EPIC HERTZ<br>
      <span>STUDIO</span>
    </div>
    <div class="desc">
      <strong>Viral auto-captions for Reels, Shorts &amp; TikTok.</strong><br>
      Word-level sync in Tanglish, Hinglish &amp; Native Indic scripts.
    </div>
    <div class="lang-row">
      <div class="lang-pill active">Telugu (తెలుగు)</div>
      <div class="lang-pill active">Hindi (हिंदी)</div>
      <div class="lang-pill">Tamil</div>
      <div class="lang-pill">Kannada</div>
      <div class="lang-pill">Malayalam</div>
      <div class="lang-pill">English</div>
    </div>
    <div class="footer-bar">
      <span>Zero-Lag Word Sync</span>
      <span>·</span>
      <span>Animated Burn Export</span>
      <span>·</span>
      <span>SRT / VTT</span>
    </div>
  </div>

  <div class="phone-mockup">
    <div class="phone-notch"></div>
    <div class="phone-bg"></div>
    <div class="phone-overlay"></div>
    <div class="caption-box">
      <div class="caption-text">
        PRATHI <span class="highlight-word">FRAME</span> LO OKA KATHA
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.resolve('temp-og.html');
fs.writeFileSync(tempHtmlPath, html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.resolve('public/assets/og-epic-hertz.png');

console.log('Rendering OG banner via headless Chrome...');
const res = spawnSync(chromePath, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1200,630',
  `--screenshot=${outputPath}`,
  `file:///${tempHtmlPath.replace(/\\/g, '/')}`,
]);

if (fs.existsSync(outputPath)) {
  const stat = fs.statSync(outputPath);
  console.log(`Successfully generated ${outputPath} (${stat.size} bytes)`);
  // Also copy to og-epic-hertz.jpg for universal compatibility
  fs.copyFileSync(outputPath, path.resolve('public/assets/og-epic-hertz.jpg'));
  console.log('Copied to og-epic-hertz.jpg');
} else {
  console.error('Screenshot failed:', res.stderr?.toString());
}

if (fs.existsSync(tempHtmlPath)) {
  fs.unlinkSync(tempHtmlPath);
}
