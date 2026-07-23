#!/usr/bin/env node
import { accessSync, constants, statSync } from 'node:fs';
import { createLaunchPlan, renderMarkdown } from '../src/index.js';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: launch-action-skill <repo-snapshot-dir> [--format markdown|json]');
  process.exit(0);
}

const root = args[0];
if (!root || root.startsWith('--')) fail('Snapshot directory is required.');

const formatValue = valueAfter('--format');
if (args.includes('--format') && !formatValue) fail('--format requires markdown or json.');
const format = formatValue || 'markdown';
if (!['markdown', 'json'].includes(format)) {
  fail(`Unsupported format "${format}". Use markdown or json.`);
}

validateSnapshotDirectory(root);

const plan = createLaunchPlan(root);
if (format === 'json') console.log(JSON.stringify(plan, null, 2));
else console.log(renderMarkdown(plan));

function valueAfter(flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }

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
