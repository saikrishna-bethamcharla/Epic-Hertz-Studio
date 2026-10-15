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

server.listen(4831, async () => {
  console.log('Static server on port 4831');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    console.log('1. Navigating to Portfolio...');
    await page.goto('http://localhost:4831/Portfolio/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    
    let scrollY = await page.evaluate(() => window.scrollY);
    console.log(`Initial scrollY: ${scrollY}`);
    
    console.log('2. Scrolling down deep into page (2500px)...');
    await page.evaluate(() => window.scrollTo(0, 2500));
    await new Promise((r) => setTimeout(r, 1000));
    
    scrollY = await page.evaluate(() => window.scrollY);
    console.log(`Scrolled down to scrollY: ${scrollY}`);
    if (scrollY < 1000) {
      console.warn('Warning: scrollY did not reach target, trying Lenis scroll or larger jump');
      await page.evaluate(() => {
        window.scrollBy(0, 2000);
      });
      await new Promise((r) => setTimeout(r, 500));
      scrollY = await page.evaluate(() => window.scrollY);
      console.log(`Updated scrollY: ${scrollY}`);
    }
    
    console.log('3. Reloading page...');
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Wait for any animations, smooth scroll init, or potential delayed browser scrollRestoration
    await new Promise((r) => setTimeout(r, 1500));
    
    const postReloadScrollY = await page.evaluate(() => window.scrollY);
    console.log(`Post-reload scrollY: ${postReloadScrollY}`);
    
    const artifactDir = 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots';
    if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
    
    const screenshotPath = path.join(artifactDir, 'test_scroll_after_reload.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);
    
    if (postReloadScrollY === 0) {
      console.log('SUCCESS: Page reloaded directly at top hero section (scrollY = 0)!');
    } else {
      console.error(`FAILURE: Page reloaded at scrollY = ${postReloadScrollY}`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
