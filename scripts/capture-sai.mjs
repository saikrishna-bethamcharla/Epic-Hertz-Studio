import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots';

function createStaticServer(distPath, port) {
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
    '.pdf': 'application/pdf',
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';
    let filePath = path.join(distPath, reqUrl);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(distPath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading ' + reqUrl);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const server = await createStaticServer(path.resolve('dist'), 5199);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5199', { waitUntil: 'networkidle0', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Hero
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sai_hero.png') });
  console.log('Saved sai_hero.png');

  // 2. Originals / Projects
  await page.evaluate(() => {
    const el = document.querySelector('#originals') || document.querySelector('[data-section="originals"]');
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 1300);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sai_originals.png') });
  console.log('Saved sai_originals.png');

  // 3. Journey / Seasons (Chrono Dial)
  await page.evaluate(() => {
    const el = document.querySelector('#journey') || document.querySelector('[data-section="journey"]');
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 2400);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sai_journey.png') });
  console.log('Saved sai_journey.png');

  // 4. Skills (3D Creative Universe)
  await page.evaluate(() => {
    const el = document.querySelector('#skills') || document.querySelector('[data-section="skills"]');
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 3800);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sai_skills.png') });
  console.log('Saved sai_skills.png');

  // 5. Resume Section
  await page.evaluate(() => {
    const el = document.querySelector('#story') || document.querySelector('[data-section="story"]');
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 5200);
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'sai_resume.png') });
  console.log('Saved sai_resume.png');

  await browser.close();
  server.close();
  console.log('All Sai Krishna portfolio screenshots saved!');
}

run();
