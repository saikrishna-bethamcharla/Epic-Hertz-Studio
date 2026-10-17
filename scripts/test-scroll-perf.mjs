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

server.listen(4855, async () => {
  console.log('Static test server running on port 4855');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-gpu']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('http://localhost:4855/Portfolio/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  console.log('Testing continuous smooth scroll & measuring frame deltas...');
  
  // Start measuring frames on client
  await page.evaluate(() => {
    window.__frameDeltas = [];
    let lastTime = performance.now();
    window.__tracking = true;
    function measureFrame(now) {
      const dt = now - lastTime;
      lastTime = now;
      if (window.__tracking) {
        window.__frameDeltas.push(dt);
        requestAnimationFrame(measureFrame);
      }
    }
    requestAnimationFrame(measureFrame);
  });

  // Emulate realistic user wheel scrolling down the page
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel({ deltaY: 100 });
    await new Promise(r => setTimeout(r, 35));
  }
  
  await new Promise(r => setTimeout(r, 600));

  const perfResult = await page.evaluate(() => {
    window.__tracking = false;
    const validDeltas = window.__frameDeltas.slice(2);
    const avgDelta = validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length;
    const avgFps = 1000 / avgDelta;
    const droppedFrames = validDeltas.filter(d => d > 33.3).length;
    return {
      totalFramesMeasured: validDeltas.length,
      avgFps: Math.round(avgFps),
      avgFrameMs: Math.round(avgDelta * 10) / 10,
      droppedFrames,
      scrollY: Math.round(window.scrollY),
      hasLenisClass: document.documentElement.classList.contains('lenis')
    };
  });
  
  console.log('Scroll Benchmark Results:', JSON.stringify(perfResult, null, 2));

  const screenshotPath = 'C:\\Users\\saikr\\.gemini\\antigravity\\brain\\350321f0-4bd7-4d55-a1eb-c8453df40187\\screenshots\\scroll_perf_verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to', screenshotPath);
  
  await browser.close();
  server.close();
  process.exit(0);
});
