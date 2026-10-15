import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const srcImagePath = 'C:/Users/saikr/.gemini/antigravity/brain/350321f0-4bd7-4d55-a1eb-c8453df40187/.user_uploaded/media_1792059420940_0891e4ab.jpg';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const fileData = fs.readFileSync(srcImagePath).toString('base64');

  const crop = {
    sx: 28,
    sy: 39,
    sWidth: 726,
    sHeight: 907.5
  };

  for (const targetWidth of [420, 720, 1100]) {
    const targetHeight = Math.round(targetWidth * 1.25);
    await page.setViewport({ width: targetWidth, height: targetHeight, deviceScaleFactor: 1 });

    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#05070c;overflow:hidden;"></body></html>`);

    await page.evaluate(async (b64, c, w, h) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.style.display = 'block';
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = 'data:image/jpeg;base64,' + b64;
      await img.decode();
      ctx.drawImage(img, c.sx, c.sy, c.sWidth, c.sHeight, 0, 0, w, h);
      document.body.appendChild(canvas);
    }, fileData, crop, targetWidth, targetHeight);

    await page.screenshot({
      path: `public/assets/portrait-${targetWidth}.webp`,
      type: 'webp',
      quality: 94
    });
    fs.copyFileSync(`public/assets/portrait-${targetWidth}.webp`, `public/assets/portrait-v2-${targetWidth}.webp`);
    console.log(`Generated public/assets/portrait-v2-${targetWidth}.webp and portrait-${targetWidth}.webp (${targetWidth}x${targetHeight})`);
  }

  // 2. Generate og-image.jpg
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  const ogHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 1200px;
        height: 630px;
        background: #06080e;
        overflow: hidden;
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
      }
      .bg-glow {
        position: absolute;
        width: 750px;
        height: 630px;
        right: 0;
        top: 0;
        background: radial-gradient(circle at 65% 45%, rgba(229, 19, 43, 0.4) 0%, rgba(140, 12, 24, 0.18) 45%, transparent 75%);
        pointer-events: none;
      }
      .bg-grid {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 40px 40px;
        opacity: 0.6;
      }
      .content {
        position: relative;
        z-index: 10;
        padding-left: 80px;
        max-width: 660px;
      }
      .kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #ff3d5a;
        margin-bottom: 16px;
      }
      .kicker .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff3d5a;
        box-shadow: 0 0 10px #ff3d5a;
      }
      .title {
        font-size: 88px;
        font-weight: 900;
        letter-spacing: -0.02em;
        line-height: 0.95;
        color: #f4f1ec;
        text-transform: uppercase;
        margin-bottom: 20px;
        text-shadow: 0 10px 40px rgba(0,0,0,0.8);
      }
      .subtitle {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: #e50914;
        text-transform: uppercase;
        margin-bottom: 16px;
      }
      .desc {
        font-size: 16px;
        line-height: 1.5;
        color: #a7a6ad;
        letter-spacing: 0.02em;
      }
      .portrait-box {
        position: absolute;
        right: 40px;
        bottom: 20px;
        height: 590px;
        width: 472px;
        z-index: 5;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(229,19,43,0.2);
        border: 1px solid rgba(255,255,255,0.15);
      }
      .portrait-box canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
      .badge-series {
        position: absolute;
        top: 40px;
        right: 50px;
        z-index: 20;
        padding: 6px 16px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(10,12,18,0.7);
        color: #f4f1ec;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        backdrop-filter: blur(10px);
      }
    </style>
  </head>
  <body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>
    <div class="badge-series">S01–S05 • ORIGINALS</div>
    <div class="content">
      <div class="kicker"><span class="dot"></span> Creative & Technical Lead</div>
      <h1 class="title">Sai Krishna</h1>
      <div class="subtitle">Zai Labs • Kingston University PGD</div>
      <p class="desc">AI Filmmaking (Seedance 2.0, Kling 3.0), Production Web Architecture (Vasudha Pharma, Zai Labs, Pranic Healing), and Cinematic Editorial.</p>
    </div>
    <div class="portrait-box">
      <canvas id="og-c" width="472" height="590"></canvas>
    </div>
  </body>
  </html>
  `;

  await page.setContent(ogHtml);
  await page.evaluate(async (b64, c) => {
    const ogCanvas = document.getElementById('og-c');
    const ogCtx = ogCanvas.getContext('2d');
    const ogImg = new Image();
    ogImg.src = 'data:image/jpeg;base64,' + b64;
    await ogImg.decode();
    ogCtx.drawImage(ogImg, c.sx, c.sy, c.sWidth, c.sHeight, 0, 0, 472, 590);
  }, fileData, crop);

  await page.screenshot({
    path: 'public/assets/og-image.jpg',
    type: 'jpeg',
    quality: 92
  });
  console.log('Generated public/assets/og-image.jpg');

  await browser.close();
})();
