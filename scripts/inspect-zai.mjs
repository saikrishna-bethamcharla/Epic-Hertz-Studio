import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  const b64 = fs.readFileSync('public/assets/zailabs-official-logo.jpg').toString('base64');
  
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);
  const bbox = await page.evaluate(async (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = 'data:image/jpeg;base64,' + base64;
      img.onload = () => {
        const c = document.getElementById('c');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const idata = ctx.getImageData(0, 0, c.width, c.height);
        const d = idata.data;
        let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            const i = (y * c.width + x) * 4;
            const r = d[i], g = d[i+1], b = d[i+2];
            // Logo elements: either colorful (|r-g| > 20 or |g-b| > 20) or bright white (lum > 140)
            const lum = (r + g + b) / 3;
            const isColor = Math.abs(r - g) > 18 || Math.abs(g - b) > 18 || Math.abs(r - b) > 18;
            if (lum > 120 || (isColor && lum > 50)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        resolve({ minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY });
      };
    });
  }, b64);
  console.log('Logo bbox:', bbox);
  await browser.close();
})();
