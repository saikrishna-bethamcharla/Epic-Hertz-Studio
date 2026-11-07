#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const workflowsDir = join(process.cwd(), '.github', 'workflows');
const files = readdirSync(workflowsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

let totalFound = 0;
let errors = 0;

console.log('🔍 Auditing pinned GitHub Action commit SHAs across workflows...');

for (const file of files) {
  const filePath = join(workflowsDir, file);
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/uses:\s+([a-zA-Z0-9_\-\.\/]+)@([a-f0-9]{40})/);
    if (!match) continue;

    totalFound++;
    const [, actionRef, commitSha] = match;
    const repo = actionRef.split('/').slice(0, 2).join('/');
    const repoUrl = `https://github.com/${repo}.git`;

    process.stdout.write(`  [${file}:${i + 1}] ${repo}@${commitSha.slice(0, 7)}... `);

    try {
      // Check if commit SHA exists on remote
      const output = execSync(`git ls-remote "${repoUrl}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      // Look for the SHA in refs or tags
      const hasSha = output.includes(commitSha);

      if (hasSha) {
        console.log('✅ valid (found in refs)');
      } else {
        // If not a ref head/tag directly (e.g. intermediate commit), test commit endpoint via curl
        try {
          const curlOutput = execSync(`curl.exe -sI "https://github.com/${repo}/commit/${commitSha}"`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          });
          if (curlOutput.includes('HTTP/1.1 200') || curlOutput.includes('HTTP/2 200')) {
            console.log('✅ valid (verified commit on GitHub)');
          } else {
            console.log('❌ NOT FOUND (commit does not exist on remote)');
            errors++;
          }
        } catch {
          console.log('❌ FAILED to resolve commit');
          errors++;
        }
      }
    } catch (err) {
      console.log(`❌ ERROR checking ${repoUrl}: ${err.message}`);
      errors++;
    }
  }
}

console.log(`\nChecked ${totalFound} action references. Failures: ${errors}`);
if (errors > 0) {
  process.exit(1);
}
