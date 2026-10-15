import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const zaiOfficialB64 = fs.readFileSync('public/assets/zailabs-official-logo.jpg').toString('base64');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 650 });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .card {
          position: relative;
          width: 360px;
          height: 500px;
          border-radius: 16px;
          overflow: hidden;
          background: #04070e;
          border: 1px solid rgba(0, 229, 255, 0.18);
          box-shadow: 0 20px 50px rgba(0,0,0,0.9), inset 0 0 40px rgba(0, 229, 255, 0.05);
        }
        .glow {
          position: absolute;
          width: 280px;
          height: 280px;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 229, 255, 0.28) 0%, rgba(0, 255, 136, 0.12) 40%, transparent 70%);
          filter: blur(45px);
          pointer-events: none;
          z-index: 1;
        }
        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 385px;
          overflow: hidden;
          z-index: 2;
        }
        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 26%;
          filter: contrast(1.08) brightness(1.02);
        }
        /* Cinematic Vignette & Bottom Gradient */
        .scrim-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%);
          z-index: 3;
          pointer-events: none;
        }
        .scrim-bottom {
          position: absolute;
          inset-x: 0;
          bottom: 0;
          height: 220px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(4, 7, 14, 0.3) 25%,
            rgba(4, 7, 14, 0.85) 55%,
            #04070e 85%,
            #04070e 100%
          );
          z-index: 3;
          pointer-events: none;
        }
        /* Subtle scanlines for theme consistency */
        .scanlines {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px);
          pointer-events: none;
          z-index: 4;
          opacity: 0.8;
        }

        /* HTML Overlay mock (from TopPicks.tsx) */
        .html-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 22px 20px;
          z-index: 10;
          pointer-events: none;
        }
        .label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.28em;
          color: rgba(244, 241, 236, 0.85);
          text-transform: uppercase;
          text-shadow: 0 2px 8px rgba(0,0,0,0.9);
        }
        .title {
          font-family: Impact, sans-serif;
          font-size: 38px;
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: #f4f1ec;
          text-shadow: 0 4px 18px rgba(0,0,0,0.95);
        }
        .detail {
          font-size: 13px;
          line-height: 1.35;
          color: rgba(244, 241, 236, 0.65);
          margin-top: 6px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.9);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="glow"></div>
        <div class="hero-bg">
          <img src="data:image/jpeg;base64,${zaiOfficialB64}" class="hero-img" />
        </div>
        <div class="scrim-top"></div>
        <div class="scrim-bottom"></div>
        <div class="scanlines"></div>
        
        <div class="html-overlay">
          <div class="label">PRIMARY ROLE</div>
          <div>
            <div class="title">Creative &<br>Tech Lead</div>
            <div class="detail">Zai Labs Private Limited • August 2026 – Present</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_zai_card_refined.png' });
  console.log('Saved test_zai_card_refined.png');
  await browser.close();
})();
