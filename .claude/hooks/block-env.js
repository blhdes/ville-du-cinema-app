#!/usr/bin/env node
// PreToolUse hook: blocks Read/Edit on .env files
const input = JSON.parse(process.argv[2] || '{}');
const filePath = input.file_path || input.path || '';

if (filePath.includes('.env')) {
  console.error('Blocked: access to .env files is not allowed.');
  process.exit(2);
}
