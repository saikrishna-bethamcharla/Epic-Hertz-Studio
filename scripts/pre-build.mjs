import fs from 'fs';
import path from 'path';

const devHtml = path.resolve('index.html.dev');
const rootHtml = path.resolve('index.html');

if (fs.existsSync(devHtml)) {
  fs.copyFileSync(devHtml, rootHtml);
  console.log('Restored index.html from index.html.dev for build/dev');
}
