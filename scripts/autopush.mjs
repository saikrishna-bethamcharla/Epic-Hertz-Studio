// ─── Auto-Push Automation Script for Epic Hertz Studio ─────────────────
import { execSync } from 'node:child_process';

const customMsg = process.argv.slice(2).join(' ').trim();
const commitMsg = customMsg || `feat(studio): update codebase ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

function run(cmd, desc) {
  console.log(`\x1b[36m▶ ${desc || cmd}\x1b[0m`);
  try {
    return execSync(cmd, { stdio: 'inherit', env: process.env });
  } catch (err) {
    console.error(`\x1b[31m✖ Error during: ${cmd}\x1b[0m`, err.message);
    process.exit(1);
  }
}

try {
  // 1. Build & sync docs for GitHub Pages & root
  run('npm run build', 'Building production assets and syncing docs/');

  // 2. Stage all modifications
  run('git add -A', 'Staging modified and generated files');

  // 3. Check if there are changes to commit
  const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
  if (!status) {
    console.log('\x1b[32m✔ Working tree is clean. Nothing new to commit.\x1b[0m');
  } else {
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, `Committing changes: "${commitMsg}"`);
  }

  // 4. Push to remote origin main
  run('git push origin main', 'Pushing commits to GitHub (origin/main)');
  console.log('\x1b[32m✔ Autopush successful! Deployed to GitHub & Vercel.\x1b[0m');
} catch (e) {
  console.error('\x1b[31m✖ Autopush failed:\x1b[0m', e);
  process.exit(1);
}
