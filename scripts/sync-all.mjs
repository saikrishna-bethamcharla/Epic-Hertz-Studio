import fs from 'fs';
import path from 'path';

const dist = path.resolve('dist');
const docs = path.resolve('docs');
const root = path.resolve('.');

// Ensure docs exists and is clean
if (fs.existsSync(docs)) {
  fs.rmSync(docs, { recursive: true, force: true });
}
fs.mkdirSync(docs, { recursive: true });

// 1. Sync dist -> docs
fs.cpSync(dist, docs, { recursive: true });
fs.writeFileSync(path.join(docs, '.nojekyll'), '');

// 2. Sync compiled assets and entry files to root so root-serving GitHub Pages works directly
const distAssets = path.join(dist, 'assets');
const rootAssets = path.join(root, 'assets');
if (fs.existsSync(distAssets)) {
  if (fs.existsSync(rootAssets)) {
    // remove stale JS/CSS chunks in root assets
    const files = fs.readdirSync(rootAssets);
    for (const f of files) {
      if ((f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.map')) && !fs.existsSync(path.join(distAssets, f))) {
        fs.rmSync(path.join(rootAssets, f), { force: true });
      }
    }
  } else {
    fs.mkdirSync(rootAssets, { recursive: true });
  }
  fs.cpSync(distAssets, rootAssets, { recursive: true });
}

// Copy compiled index.html, 404.html, favicon.svg to root
if (fs.existsSync(path.join(dist, 'index.html'))) {
  fs.copyFileSync(path.join(dist, 'index.html'), path.join(root, 'index.html'));
}
if (fs.existsSync(path.join(dist, 'favicon.svg'))) {
  fs.copyFileSync(path.join(dist, 'favicon.svg'), path.join(root, 'favicon.svg'));
}
if (fs.existsSync(path.join(dist, '404.html'))) {
  fs.copyFileSync(path.join(dist, '404.html'), path.join(root, '404.html'));
}
fs.writeFileSync(path.join(root, '.nojekyll'), '');

console.log('Successfully synced dist to both docs/ and root/ (with .nojekyll)');
