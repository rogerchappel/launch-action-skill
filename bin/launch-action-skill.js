#!/usr/bin/env node
import { accessSync, constants, statSync } from 'node:fs';
import { createLaunchPlan, renderMarkdown } from '../src/index.js';

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log('Usage: launch-action-skill <repo-snapshot-dir> [--format markdown|json]');
  process.exit(0);
}
if (args.includes('--help')) fail('--help must be used alone.');

const root = args[0];
if (!root) fail('Snapshot directory is required.');
if (root.startsWith('--')) fail('Snapshot directory must be the first argument.');

let format = 'markdown';
let formatSeen = false;
for (let index = 1; index < args.length; index += 1) {
  const argument = args[index];
  if (argument !== '--format') {
    if (argument.startsWith('--')) fail(`Unknown option: ${argument}`);
    fail(`Unexpected argument: ${argument}`);
  }
  if (formatSeen) fail('--format may only be specified once.');
  formatSeen = true;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail('--format requires markdown or json.');
  format = value;
  index += 1;
}

if (!['markdown', 'json'].includes(format)) {
  fail(`Unsupported format "${format}". Use markdown or json.`);
}

validateSnapshotDirectory(root);

const plan = createLaunchPlan(root);
if (format === 'json') console.log(JSON.stringify(plan, null, 2));
else console.log(renderMarkdown(plan));

function validateSnapshotDirectory(directory) {
  let stats;
  try {
    stats = statSync(directory);
  } catch (error) {
    if (error.code === 'ENOENT') fail(`Snapshot directory does not exist: ${directory}`);
    fail(`Cannot inspect snapshot directory "${directory}": ${error.message}`);
  }

  if (!stats.isDirectory()) fail(`Snapshot path is not a directory: ${directory}`);

  try {
    accessSync(directory, constants.R_OK);
  } catch {
    fail(`Snapshot directory is not readable: ${directory}`);
  }
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}
