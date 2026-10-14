import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const urls = [
    'https://saikrishna-bethamcharla.github.io/Portfolio/',
    'https://saikrishna-bethamcharla.github.io/Portfolio/docs/'
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
    } catch (e) {
      console.error('Error on ' + url + ':', e.message);
    }
  }
  
  await browser.close();
})();
