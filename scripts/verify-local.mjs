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

server.listen(4829, async () => {
  console.log('Static server on port 4829');
  
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
  
  await page.goto('http://localhost:4829/Portfolio/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_hero_clean.png' });
  console.log('Saved test_hero_clean.png');
  
  // scroll to about
  await page.evaluate(() => {
    const el = document.getElementById('about');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_about_portrait.png' });
  console.log('Saved test_about_portrait.png');

  // scroll to skills
  await page.evaluate(() => {
    const el = document.getElementById('skills');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_skills_clean.png' });
  console.log('Saved test_skills_clean.png');

  // scroll to journey (chrono dial)
  await page.evaluate(() => {
    const el = document.getElementById('journey');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_chrono_animated.png' });
  console.log('Saved test_chrono_animated.png');

  // Test clicking 2023 node
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn2023 = btns.find(b => b.textContent && b.textContent.includes('2023'));
    if (btn2023) btn2023.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_chrono_2023_needle.png' });
  console.log('Saved test_chrono_2023_needle.png');

  // scroll to originals
  await page.evaluate(() => {
    const el = document.getElementById('originals');
    if (el) el.scrollIntoView();
  });
  // scroll to top picks
  await page.evaluate(() => {
    const el = document.getElementById('picks');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_picks_cinematic.png' });
  console.log('Saved test_picks_cinematic.png');

  // scroll rail right
  await page.evaluate(() => {
    const rail = document.querySelector('#picks .rail');
    if (rail) rail.scrollLeft = 9999;
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_picks_right_scrolled.png' });
  console.log('Saved test_picks_right_scrolled.png');

  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_originals_consolidated.png' });
  console.log('Saved test_originals_consolidated.png');
  
  // Click on the Website Development card to open modal
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Open Website Development"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_modal_websites.png' });
  console.log('Saved test_modal_websites.png');
  
  // Scroll down within the modal scroller to capture the websites section
  await page.evaluate(() => {
    const modalScroller = document.querySelector('[data-lenis-prevent]');
    if (modalScroller) modalScroller.scrollTop = 750;
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\test_modal_websites_scrolled.png' });
  console.log('Saved test_modal_websites_scrolled.png');

  console.log('Errors:', errors);
  await browser.close();
  server.close();
  process.exit(0);
});
