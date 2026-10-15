import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  const kuB64 = fs.readFileSync('public/assets/kingston-official-logo.png').toString('base64');
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c"></canvas>
      <canvas id="c2"></canvas>
    </body>
    </html>
  `);

  const dataUrl = await page.evaluate(async (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + base64;
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
            const lum = (d[i] + d[i+1] + d[i+2]) / 3;
            if (lum < 25) {
              d[i+3] = 0;
            } else {
              d[i] = 255;
              d[i+1] = 255;
              d[i+2] = 255;
              d[i+3] = 255;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        ctx.putImageData(idata, 0, 0);

        // Crop to bounding box
        const pad = 20;
        const cropW = (maxX - minX + 1) + pad * 2;
        const cropH = (maxY - minY + 1) + pad * 2;
        const c2 = document.getElementById('c2');
        c2.width = cropW;
        c2.height = cropH;
        const ctx2 = c2.getContext('2d');
        ctx2.drawImage(c, minX, minY, maxX - minX + 1, maxY - minY + 1, pad, pad, maxX - minX + 1, maxY - minY + 1);

        resolve(c2.toDataURL('image/png'));
      };
    });
  }, kuB64);

  const b64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('public/assets/kingston-official-logo-transparent.png', Buffer.from(b64Data, 'base64'));
  fs.writeFileSync('assets/kingston-official-logo-transparent.png', Buffer.from(b64Data, 'base64'));
  console.log('Successfully cropped and created kingston-official-logo-transparent.png!');
  await browser.close();
})();
