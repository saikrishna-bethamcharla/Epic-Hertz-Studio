import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1440, height: 900 });
  
  const urls = [
    'https://epic-hertz-studio.vercel.app',
    'https://saikrishna-bethamcharla.github.io/Epic-Hertz-Studio/',
    'https://saikrishna-bethamcharla.github.io/Portfolio/'
  ];
  
  for (const url of urls) {
    console.log('\n--- Checking ' + url + ' ---');
    const logs = [];
    page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
    page.on('pageerror', err => logs.push('[PAGE ERROR] ' + err.message));
    
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
      console.log('HTTP Status:', resp ? resp.status() : 'null');
      console.log('Document Title:', await page.title());
      
      const appState = await page.evaluate(() => {
        const root = document.getElementById('root');
        const hasCustomCursor = document.documentElement.classList.contains('has-custom-cursor');
        return {
          hasRoot: !!root,
          hasCustomCursor,
          previewText: root ? root.innerText.slice(0, 100).replace(/\n+/g, ' ') : ''
        };
      });
      console.log('App state:', appState);
      console.log('Errors:', logs.filter(l => l.includes('ERROR') || l.includes('error')));

      if (url.endsWith('/Portfolio/')) {
        await page.evaluate(() => {
          const el = document.getElementById('originals');
          if (el) el.scrollIntoView();
        });
        await new Promise(r => setTimeout(r, 1200));
        await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\live_originals_verified.png' });
        console.log('Saved live_originals_verified.png');

        await page.evaluate(() => {
          const btn = document.querySelector('[aria-label="Open Website Development"]');
          if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.evaluate(() => {
          const modalScroller = document.querySelector('[data-lenis-prevent]');
          if (modalScroller) modalScroller.scrollTop = 700;
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\live_modal_websites_verified.png' });
        console.log('Saved live_modal_websites_verified.png');
      }
    } catch (e) {
      console.error('Error on ' + url + ':', e.message);
    }
  }
  
  await browser.close();
})();
