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
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  
  const imgVasudha = fs.readFileSync('public/assets/projects/vasudha-pharma-site.jpg').toString('base64');
  const imgZaiLabs = fs.readFileSync('public/assets/projects/zailabs-site.png').toString('base64');
  const imgPranic = fs.readFileSync('public/assets/projects/pranic-healing-site.jpg').toString('base64');
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1600px;
        height: 1000px;
        background: radial-gradient(circle at 50% 30%, #0d1e2e 0%, #05090f 70%, #020407 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .container {
        position: relative;
        width: 1540px;
        height: 920px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card {
        position: absolute;
        width: 740px;
        height: 470px;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 35px 90px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.12);
        background: #0d1117;
      }
      .card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top;
      }
      .card-tag {
        position: absolute;
        bottom: 16px;
        left: 20px;
        background: rgba(5, 9, 15, 0.88);
        backdrop-filter: blur(10px);
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.22);
        color: #f4f1ec;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .card-tag .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4cc9ff;
      }
      /* Left Card */
      .card-1 {
        left: 30px;
        top: 220px;
        transform: perspective(1200px) rotateY(14deg) rotateX(2deg) scale(0.9);
        z-index: 1;
        filter: brightness(0.85) contrast(1.05);
      }
      /* Right Card */
      .card-3 {
        right: 30px;
        top: 220px;
        transform: perspective(1200px) rotateY(-14deg) rotateX(2deg) scale(0.9);
        z-index: 1;
        filter: brightness(0.85) contrast(1.05);
      }
      /* Center Card */
      .card-2 {
        top: 130px;
        z-index: 3;
        transform: perspective(1200px) scale(1.06);
        box-shadow: 0 45px 120px rgba(0,0,0,0.95), 0 0 0 2px rgba(76,201,255,0.45);
      }
      .badge {
        position: absolute;
        top: 36px;
        background: rgba(76,201,255,0.12);
        border: 1px solid rgba(76,201,255,0.4);
        padding: 9px 26px;
        border-radius: 40px;
        color: #4cc9ff;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
        z-index: 10;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="badge">Production Web Platforms · 3 Live Deployments</div>
      <div class="card card-1">
        <img src="data:image/jpeg;base64,${imgPranic}" />
        <div class="card-tag">
          <span class="dot" style="background: #e2a046;"></span>
          Pranic Healing · AP & Telangana Chapter
        </div>
      </div>
      <div class="card card-2">
        <img src="data:image/jpeg;base64,${imgVasudha}" />
        <div class="card-tag">
          <span class="dot" style="background: #4cc9ff;"></span>
          Vasudha Pharma · Global Enterprise Portal
        </div>
      </div>
      <div class="card card-3">
        <img src="data:image/png;base64,${imgZaiLabs}" />
        <div class="card-tag">
          <span class="dot" style="background: #a855f7;"></span>
          Zai Labs · AI & Creative Agency Portal
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  
  await page.setContent(html);
  await page.screenshot({
    path: 'public/assets/projects/website-development-suite.jpg',
    quality: 92,
    type: 'jpeg'
  });
  console.log('Saved public/assets/projects/website-development-suite.jpg');
  await browser.close();
})();
