import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// 1. Static file server for Portfolio_series dist folder
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
  console.log('Starting static server for Portfolio_series...');
  const server = await createStaticServer(path.resolve('dist'), 5188);
  console.log('Server running on http://localhost:5188');

  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // --- REPO 1: Netflix_portfolio (live deployed) ---
  console.log('Capturing Netflix_portfolio (earlier version)...');
  try {
    await page.goto('https://netflix-portfolio-kohl-beta.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Screenshot 1: Preloader
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo1_netflix_preloader.png') });
    console.log('Saved repo1_netflix_preloader.png');

    // Wait for preloader to finish (GSAP is ~2.5s)
    await new Promise((r) => setTimeout(r, 3500));

    // Screenshot 2: Hero section
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo1_netflix_hero.png') });
    console.log('Saved repo1_netflix_hero.png');

    // Scroll to projects
    await page.evaluate(() => {
      const el = document.querySelector('#projects') || document.querySelector('section:nth-of-type(4)');
      if (el) el.scrollIntoView();
      else window.scrollTo(0, 1600);
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo1_netflix_projects.png') });
    console.log('Saved repo1_netflix_projects.png');

    // Full page
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo1_netflix_full.png'), fullPage: true });
    console.log('Saved repo1_netflix_full.png');
  } catch (e) {
    console.error('Error on Netflix_portfolio:', e.message);
  }

  // --- REPO 2: Portfolio_series (latest series version) ---
  console.log('Capturing Portfolio_series (latest version)...');
  try {
    // Stage 1: Opening Sequence
    await page.goto('http://localhost:5188', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo2_series_opening.png') });
    console.log('Saved repo2_series_opening.png');

    // Click PLAY button to go to Profile Selector
    try {
      const playBtn = await page.waitForSelector('button', { timeout: 3000 });
      if (playBtn) await playBtn.click();
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo2_series_profiles.png') });
    console.log('Saved repo2_series_profiles.png');

    // Stage 2: Main Home Page
    // Directly inject profile into sessionStorage to load clean home
    await page.evaluate(() => {
      sessionStorage.setItem('sushmita-series-profile', 'sushmita');
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));

    // Hero screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo2_series_hero.png') });
    console.log('Saved repo2_series_hero.png');

    // Scroll to Originals / Projects
    await page.evaluate(() => {
      const el = document.querySelector('#originals') || document.querySelector('[data-section="originals"]');
      if (el) el.scrollIntoView();
      else window.scrollTo(0, 1400);
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo2_series_projects.png') });
    console.log('Saved repo2_series_projects.png');

    // Scroll to Journey / Timeline
    await page.evaluate(() => {
      const el = document.querySelector('#journey') || document.querySelector('[data-section="journey"]');
      if (el) el.scrollIntoView();
      else window.scrollTo(0, 2400);
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo2_series_journey.png') });
    console.log('Saved repo2_series_journey.png');

    // Full page overview
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'repo2_series_full.png'), fullPage: true });
    console.log('Saved repo2_series_full.png');
  } catch (e) {
    console.error('Error on Portfolio_series:', e.message);
  }

  await browser.close();
  server.close();
  console.log('All screenshots completed successfully!');
}

run();
