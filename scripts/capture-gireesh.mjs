import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Scene 1 Hero (?t=end jumps to settled state)
  console.log('Capturing Scene 1 Hero...');
  await page.goto('http://127.0.0.1:5173/?t=end', { waitUntil: 'networkidle0', timeout: 25000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gireesh_hero.png') });
  console.log('Saved gireesh_hero.png');

  // 2. Scene 2 (Scroll down to Universe)
  console.log('Capturing Scene 2 Universe...');
  await page.evaluate(() => {
    window.scrollTo(0, 1100);
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gireesh_universe.png') });
  console.log('Saved gireesh_universe.png');

  // 3. Scene 3 (Scroll down to Chrono / Time Machine)
  console.log('Capturing Scene 3 Chrono...');
  await page.evaluate(() => {
    window.scrollTo(0, 2400);
  });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gireesh_chrono.png') });
  console.log('Saved gireesh_chrono.png');

  // 4. Scene 4 (Scroll down to Gallery)
  console.log('Capturing Scene 4 Gallery...');
  await page.evaluate(() => {
    window.scrollTo(0, 3800);
  });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gireesh_gallery.png') });
  console.log('Saved gireesh_gallery.png');

  // 5. Scene 6 (Scroll down to Finale)
  console.log('Capturing Scene 6 Finale...');
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gireesh_finale.png') });
  console.log('Saved gireesh_finale.png');

  await browser.close();
  console.log('All Gireesh screenshots captured successfully!');
}

run();
