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
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('http://localhost:4831/Portfolio/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // scroll to originals
  await page.evaluate(() => {
    const el = document.getElementById('originals');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 800));

  // Screenshot originals with the new video badges
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_originals_video_badges.png' });
  console.log('Saved test_originals_video_badges.png');

  // Open "Multi-Shot AI Film Direction" modal
  await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    const aiArticle = articles.find(a => a.textContent && a.textContent.includes('Multi-Shot AI Film Direction'));
    if (aiArticle) {
      const btn = aiArticle.querySelector('div[role="button"]');
      if (btn) btn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  // Scroll modal to video
  await page.evaluate(() => {
    const scroller = document.querySelector('[role="dialog"] [data-lenis-prevent]');
    if (scroller) scroller.scrollTop = 350;
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_video_modal_trailer.png' });
  console.log('Saved test_video_modal_trailer.png');

  // Close modal
  await page.evaluate(() => {
    const close = document.querySelector('button[aria-label="Close project"]');
    if (close) close.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Open "Cinematic Post & Motion Graphics" modal
  await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    const postArticle = articles.find(a => a.textContent && a.textContent.includes('Cinematic Post & Motion Graphics'));
    if (postArticle) {
      const btn = postArticle.querySelector('div[role="button"]');
      if (btn) btn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const scroller = document.querySelector('[role="dialog"] [data-lenis-prevent]');
    if (scroller) scroller.scrollTop = 350;
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_video_modal_documentary.png' });
  console.log('Saved test_video_modal_documentary.png');

  console.log('Errors:', errors);
  await browser.close();
  server.close();
  process.exit(0);
});
