import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/' || reqUrl === '/Portfolio/' || reqUrl === '/Portfolio') reqUrl = '/index.html';
  if (reqUrl.startsWith('/Portfolio/')) reqUrl = reqUrl.replace('/Portfolio/', '/');
  
  const filePath = path.join(path.resolve('.'), reqUrl);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(4832, async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4832/Portfolio/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Find where Originals starts
    const scrollHeights = [2000, 2400, 2800, 3200, 3800];
    for (let i = 0; i < scrollHeights.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollHeights[i]);
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: `C:/Users/saikr/.gemini/antigravity/brain/350321f0-4bd7-4d55-a1eb-c8453df40187/screenshots/orig_card_pos_${i}.png` });
    }
    console.log('Inspection screenshots taken!');
  } finally {
    await browser.close();
    server.close();
  }
});
