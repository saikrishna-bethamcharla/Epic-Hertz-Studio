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

  // Option 1: Soft radial vignette feathering
  // Option 2: Clean background extraction
  // Let's create both and save them!
  const dataUrls = await page.evaluate(async (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = 'data:image/jpeg;base64,' + base64;
      img.onload = () => {
        // Test Option 1: Radial feathered image where background smoothly fades to black
        const c1 = document.createElement('canvas');
        c1.width = img.width;
        c1.height = img.height;
        const ctx1 = c1.getContext('2d');
        ctx1.drawImage(img, 0, 0);

        // Apply radial alpha mask
        const idata1 = ctx1.getImageData(0, 0, c1.width, c1.height);
        const d1 = idata1.data;
        const cx = c1.width / 2;
        const cy = c1.height * 0.44; // center around the 3D 'a' glyph and text
        const maxR = c1.width * 0.46;
        const minR = c1.width * 0.28;

        for (let y = 0; y < c1.height; y++) {
          for (let x = 0; x < c1.width; x++) {
            const i = (y * c1.width + x) * 4;
            // distance from center
            const dist = Math.hypot(x - cx, (y - cy) * 1.15);
            let alpha = 1;
            if (dist > minR) {
              alpha = Math.max(0, 1 - (dist - minR) / (maxR - minR));
            }
            // cubic ease for super smooth feather
            alpha = alpha * alpha * (3 - 2 * alpha);
            d1[i+3] = Math.round(d1[i+3] * alpha);
          }
        }
        ctx1.putImageData(idata1, 0, 0);

        resolve({
          feathered: c1.toDataURL('image/png')
        });
      };
    });
  }, b64);

  const fData = dataUrls.feathered.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('public/assets/zailabs-feathered.png', Buffer.from(fData, 'base64'));
  console.log('Created zailabs-feathered.png');

  await browser.close();
})();
