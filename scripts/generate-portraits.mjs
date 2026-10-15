import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const srcImage = fs.readFileSync('C:/Users/saikr/.gemini/antigravity/brain/350321f0-4bd7-4d55-a1eb-c8453df40187/portrait_cinematic_1792000299522.jpg').toString('base64');

  // 1. Process responsive portraits (420, 720, 1100)
  for (const targetWidth of [420, 720, 1100]) {
    const scale = targetWidth / 768;
    const targetHeight = Math.round(1376 * scale);

    await page.setViewport({ width: targetWidth, height: targetHeight, deviceScaleFactor: 1 });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: ${targetWidth}px;
          height: ${targetHeight}px;
          background: #05070c;
          overflow: hidden;
          position: relative;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 50% 40%, transparent 60%, rgba(5,7,12,0.4) 85%, #05070c 100%),
                      linear-gradient(to bottom, transparent 80%, rgba(5,7,12,0.8) 95%, #05070c 100%);
        }
      </style>
    </head>
    <body>
      <img src="data:image/jpeg;base64,${srcImage}" />
      <div class="vignette"></div>
    </body>
    </html>
    `;

    await page.setContent(html);
    await page.screenshot({
      path: `public/assets/portrait-${targetWidth}.webp`,
      type: 'webp',
      quality: 92
    });
    console.log(`Generated public/assets/portrait-${targetWidth}.webp`);
  }

  // 2. Generate og-image.jpg (1200 x 630)
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
        width: 700px;
        height: 630px;
        right: 0;
        top: 0;
        background: radial-gradient(circle at 65% 45%, rgba(229, 19, 43, 0.35) 0%, rgba(140, 12, 24, 0.15) 45%, transparent 75%);
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
        max-width: 680px;
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
        bottom: 0;
        height: 630px;
        width: 480px;
        z-index: 5;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .portrait-box img {
        height: 100%;
        width: 100%;
        object-fit: cover;
        object-position: top center;
        mask-image: linear-gradient(to right, transparent 0%, black 20%, black 100%),
                    linear-gradient(to bottom, black 85%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 100%),
                            linear-gradient(to bottom, black 85%, transparent 100%);
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
      <img src="data:image/jpeg;base64,${srcImage}" />
    </div>
  </body>
  </html>
  `;

  await page.setContent(ogHtml);
  await page.screenshot({
    path: 'public/assets/og-image.jpg',
    type: 'jpeg',
    quality: 90
  });
  console.log('Generated public/assets/og-image.jpg');

  await browser.close();
})();
