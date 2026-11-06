import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let viteProc;
let chromeProc;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/done') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end('{"status":"ok"}');

      try {
        const results = JSON.parse(body);
        printAndSaveResults(results);
      } catch (err) {
        console.error('Error processing benchmark results:', err);
      } finally {
        cleanup();
        process.exit(0);
      }
    });
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }
  res.writeHead(404);
  res.end();
});

function cleanup() {
  if (chromeProc) {
    try { chromeProc.kill(); } catch (e) {}
  }
  if (viteProc) {
    try { viteProc.kill(); } catch (e) {}
  }
  server.close();
}

function printAndSaveResults(results) {
  console.log('\n================================================================================');
  console.log('  REAL GOOGLE CHROME BROWSER BENCHMARK (1080x1920 CANVAS)');
  console.log('================================================================================\n');

  let md = '# Real Browser Canvas Performance Benchmark (1080x1920)\n\n';
  md += 'Measured inside real headless Google Chrome (`Chrome/130+`) with full hardware 2D canvas acceleration.\n';
  md += 'Each template was evaluated across 50 frame renders spanning entrance, hold, word highlights, and exit transitions.\n\n';
  md += '| # | Template ID | Template Name | Category | Effects | Avg (ms) | p95 (ms) | Min (ms) | Max (ms) |\n';
  md += '|---|-------------|---------------|----------|---------|----------|----------|----------|----------|\n';

  let totalAvg = 0;
  let totalP95 = 0;

  results.forEach((r, idx) => {
    totalAvg += r.avgMs;
    totalP95 += r.p95Ms;
    const effects = [r.hasBlur ? 'Blur' : '', r.hasGlow ? 'Glow' : ''].filter(Boolean).join(' + ') || 'Clean';
    md += `| ${idx + 1} | \`${r.id}\` | **${r.name}** | ${r.category} | ${effects} | ${r.avgMs.toFixed(2)} ms | ${r.p95Ms.toFixed(2)} ms | ${r.minMs.toFixed(2)} ms | ${r.maxMs.toFixed(2)} ms |\n`;
  });

  const overallAvg = (totalAvg / results.length).toFixed(2);
  const overallP95 = (totalP95 / results.length).toFixed(2);

  md += `\n**Overall Fleet Averages:**\n- **Average frame draw time:** ${overallAvg} ms (Budget: < 4.00 ms)\n- **95th percentile draw time:** ${overallP95} ms (Budget: < 8.00 ms)\n`;

  console.log(md);

  fs.writeFileSync('docs/BENCHMARK_RESULTS.md', md, 'utf8');
  console.log('Wrote results to docs/BENCHMARK_RESULTS.md\n');
}

server.listen(5175, () => {
  console.log('Collector listening on http://localhost:5175');

  // Spawn Vite on port 5174
  viteProc = spawn('npx', ['vite', '--port', '5174'], { shell: true, stdio: 'pipe' });

  viteProc.stdout.on('data', data => {
    const msg = data.toString();
    if (msg.includes('Local:') || msg.includes('5174')) {
      console.log('Vite server ready on port 5174. Launching Chrome...');
      launchChrome();
    }
  });
});

function launchChrome() {
  chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--window-size=1080,1920',
    'http://localhost:5174/benchmark.html'
  ], { stdio: 'inherit' });
}

setTimeout(() => {
  console.warn('Benchmark timed out after 30 seconds');
  cleanup();
  process.exit(1);
}, 30000);
