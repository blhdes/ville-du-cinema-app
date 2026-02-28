#!/usr/bin/env node
// PostToolUse hook: runs `npx tsc --noEmit` after Edit/Write on .ts/.tsx files
const { execSync } = require('child_process');

const input = JSON.parse(process.argv[2] || '{}');
const filePath = (input.tool_input && (input.tool_input.file_path || input.tool_input.path)) || '';

if (!/\.(tsx?)$/.test(filePath)) {
  process.exit(0);
}

try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('tsc: OK');
  process.exit(0);
} catch (err) {
  const stderr = (err.stderr || '').trim();
  const stdout = (err.stdout || '').trim();
  const combined = [stdout, stderr].filter(Boolean).join('\n');
  console.log('TypeScript errors:\n' + combined);
  process.exit(1);
}
