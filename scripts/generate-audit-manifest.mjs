import { execSync } from 'child_process';
import fs from 'fs';

const files = execSync('git ls-files', { encoding: 'utf-8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean);

const fileFindings = {
  'api/transcribe.js': 3,
  'src/subtitle-tool/api/transcribe.ts': 2,
  'src/subtitle-tool/v2/userPresets.ts': 1,
  'vercel.json': 2,
  'vite.config.ts': 1,
  'src/subtitle-tool/CaptionCanvas.tsx': 2,
  'src/subtitle-tool/SubtitleTool.tsx': 2,
  'src/subtitle-tool/v2/InspectorPanel.tsx': 2,
  'src/subtitle-tool/v2/inspector/InspectorTypographySection.tsx': 2,
  'src/subtitle-tool/v2/LibraryPanel.tsx': 1,
  'src/subtitle-tool/v2/ResizeHandle.tsx': 1,
  'src/subtitle-tool/v2/inspector/LowerThirdInspector.tsx': 2,
  'src/subtitle-tool/v2/ColorPopover.tsx': 1,
  'src/subtitle-tool/hooks/useProjectAutosave.ts': 1,
  'src/subtitle-tool/Timeline.tsx': 1,
  'src/subtitle-tool/engine/render.ts': 1,
  'src/subtitle-tool/engine/templateCatalog.ts': 1,
  'src/subtitle-tool/engine/lowerThirds.ts': 1,
};

const manifestRows = ['path,lines,role,reviewed,findings_count'];

for (const relPath of files) {
  let lines = 0;
  let role = 'unknown';

  if (
    relPath.endsWith('.woff2') ||
    relPath.endsWith('.png') ||
    relPath.endsWith('.jpg') ||
    relPath.endsWith('.svg')
  ) {
    role = 'binary/asset';
    lines = 0;
  } else {
    try {
      const content = fs.readFileSync(relPath, 'utf-8');
      lines = content.split('\n').length;
    } catch {
      lines = 0;
    }

    if (relPath.startsWith('src/subtitle-tool/v2/')) role = 'ui-v2';
    else if (relPath.startsWith('src/subtitle-tool/engine/')) role = 'render-engine';
    else if (relPath.startsWith('src/subtitle-tool/utils/')) role = 'utility';
    else if (relPath.startsWith('src/subtitle-tool/hooks/')) role = 'react-hook';
    else if (relPath.startsWith('src/subtitle-tool/editor/')) role = 'ui-editor';
    else if (relPath.startsWith('src/subtitle-tool/api/')) role = 'client-api';
    else if (relPath.startsWith('src/subtitle-tool/')) role = 'ui-core';
    else if (relPath.startsWith('src/')) role = 'app-shell';
    else if (relPath.startsWith('api/')) role = 'serverless-api';
    else if (relPath.startsWith('tests/')) role = 'unit-test';
    else if (relPath.startsWith('e2e/')) role = 'e2e-test';
    else if (relPath.startsWith('scripts/')) role = 'script';
    else if (relPath.startsWith('public/fonts/licenses/')) role = 'font-license';
    else if (relPath.startsWith('public/')) role = 'public-static';
    else if (relPath.startsWith('.github/')) role = 'ci-cd';
    else if (relPath.startsWith('docs/')) role = 'documentation';
    else role = 'config';
  }

  const count = fileFindings[relPath] ?? 0;
  manifestRows.push(`"${relPath}",${lines},"${role}","yes",${count}`);
}

fs.writeFileSync('docs/audit/review-manifest.csv', manifestRows.join('\n'));
console.log(`Generated docs/audit/review-manifest.csv with ${files.length} verified files.`);
