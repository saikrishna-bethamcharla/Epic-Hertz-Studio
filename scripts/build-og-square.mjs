import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const reelImgBase64 = fs.readFileSync('public/assets/landing-hero-reel.jpg').toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Inter:wght@600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 600px;
      height: 600px;
      overflow: hidden;
      background: #0c0c0b;
      color: #f4f1ec;
      font-family: 'Inter', sans-serif;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 35px 20px 0 20px;
      position: relative;
    }
    .bg-glow {
      position: absolute;
      width: 450px;
      height: 450px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -40%);
      background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.05) 55%, transparent 75%);
      pointer-events: none;
    }
    .header-block {
      text-align: center;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .pill-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 999px;
      color: #fbbf24;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fbbf24;
      box-shadow: 0 0 8px #fbbf24;
    }
    .title {
      font-family: 'Montserrat', sans-serif;
      font-size: 34px;
      font-weight: 900;
      line-height: 1.05;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .title span {
      color: #fbbf24;
    }
    .phone-mockup {
      width: 250px;
      height: 410px;
      background: #18181b;
      border-radius: 36px 36px 0 0;
      border: 4px solid #2e2e32;
      border-bottom: none;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.25);
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
      background-position: center 20%;
    }
    .phone-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.85) 85%);
    }
    .caption-box {
      position: relative;
      z-index: 3;
      padding: 16px 12px 28px 12px;
      text-align: center;
    }
    .caption-text {
      font-family: 'Montserrat', sans-serif;
      font-size: 16px;
      font-weight: 900;
      line-height: 1.35;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0,0,0,0.95);
    }
    .highlight-word {
      display: inline-block;
      background: #ffe600;
      color: #000000;
      padding: 1px 7px;
      border-radius: 5px;
      transform: scale(1.08);
      box-shadow: 0 3px 12px rgba(255, 230, 0, 0.5);
      margin: 0 3px;
      text-shadow: none;
    }
    .phone-notch {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 75px;
      height: 18px;
      background: #000000;
      border-radius: 12px;
      z-index: 4;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>

  <div class="header-block">
    <div class="pill-tag">
      <div class="pill-dot"></div>
      AI Auto-Caption Studio
    </div>
    <div class="title">
      EPIC HERTZ <span>STUDIO</span>
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

const tempHtmlPath = path.resolve('temp-og-square.html');
fs.writeFileSync(tempHtmlPath, html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.resolve('public/assets/og-epic-hertz-square.png');

console.log('Rendering Square OG banner via headless Chrome...');
const res = spawnSync(chromePath, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=600,600',
  `--screenshot=${outputPath}`,
  `file:///${tempHtmlPath.replace(/\\/g, '/')}`,
]);

if (fs.existsSync(outputPath)) {
  const stat = fs.statSync(outputPath);
  console.log(`Successfully generated ${outputPath} (${stat.size} bytes)`);
} else {
  console.error('Screenshot failed:', res.stderr?.toString());
}

if (fs.existsSync(tempHtmlPath)) {
  fs.unlinkSync(tempHtmlPath);
}
