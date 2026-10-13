import fs from 'fs';
import path from 'path';

const src = path.resolve('dist');
const dest = path.resolve('docs');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

fs.cpSync(src, dest, { recursive: true });
fs.writeFileSync(path.join(dest, '.nojekyll'), '');
console.log('Synced dist -> docs (with .nojekyll)');
