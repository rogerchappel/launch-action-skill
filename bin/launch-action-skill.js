#!/usr/bin/env node
import { createLaunchPlan, renderMarkdown } from '../src/index.js';
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log('Usage: launch-action-skill <repo-snapshot-dir> [--format markdown|json]');
  process.exit(args.length === 0 ? 1 : 0);
}
const root = args[0];
const format = valueAfter('--format') || 'markdown';
const plan = createLaunchPlan(root);
if (format === 'json') console.log(JSON.stringify(plan, null, 2));
else console.log(renderMarkdown(plan));
function valueAfter(flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }
