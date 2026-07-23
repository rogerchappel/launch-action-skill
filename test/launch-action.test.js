import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLaunchPlan, readLaunchEvidence, renderMarkdown } from '../src/index.js';

function runCli(...args) {
  return spawnSync(process.execPath, ['bin/launch-action-skill.js', ...args], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });
}

test('reads local launch evidence', () => {
  const evidence = readLaunchEvidence('fixtures/sample-repo');
  assert.equal(evidence.packageJson.name, 'sample-agent-tool');
  assert.ok(evidence.readme.includes('local-first'));
});

test('creates ready launch plan from complete evidence', () => {
  const plan = createLaunchPlan('fixtures/sample-repo');
  assert.equal(plan.readiness, 'ready');
  assert.equal(plan.blockers.length, 0);
  assert.ok(plan.approvalGates.some(gate => gate.includes('package')));
});

test('does not mark explicitly failed verification as ready', t => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'launch-action-failed-verification-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  cpSync('fixtures/sample-repo', fixture, { recursive: true });
  writeFileSync(path.join(fixture, 'docs', 'VERIFICATION.md'), 'Tests failed. Smoke check did not pass.\n');

  const plan = createLaunchPlan(fixture);

  assert.equal(plan.readiness, 'needs-review');
  assert.ok(plan.blockers.includes('Verification evidence reports failed checks.'));
  assert.ok(!plan.dryRunActions.some(action => action.includes('Queue publish/post actions')));
});

test('renders markdown launch plan', () => {
  const markdown = renderMarkdown(createLaunchPlan('fixtures/sample-repo'));
  assert.match(markdown, /# Launch Action Plan/);
  assert.match(markdown, /Approval Gates/);
});

test('CLI help exits cleanly with usage text', () => {
  const result = runCli('--help');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: launch-action-skill/);
});

test('CLI renders each documented format', () => {
  const markdown = runCli('fixtures/sample-repo', '--format', 'markdown');
  assert.equal(markdown.status, 0);
  assert.match(markdown.stdout, /# Launch Action Plan/);

  const json = runCli('fixtures/sample-repo', '--format', 'json');
  assert.equal(json.status, 0);
  assert.equal(JSON.parse(json.stdout).readiness, 'ready');
});

test('CLI rejects a missing snapshot path', () => {
  const result = runCli();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot directory is required/i);
});

test('CLI rejects a nonexistent snapshot path', () => {
  const result = runCli(path.join(tmpdir(), 'missing-launch-action-snapshot'));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not exist/i);
});

test('CLI rejects a snapshot path that is not a directory', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'launch-action-file-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'snapshot.txt');
  writeFileSync(file, 'not a directory');

  const result = runCli(file);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not a directory/i);
});

test('CLI rejects an unreadable snapshot directory', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'launch-action-unreadable-'));
  t.after(() => {
    chmodSync(directory, 0o700);
    rmSync(directory, { recursive: true, force: true });
  });
  chmodSync(directory, 0o000);

  const result = runCli(directory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not readable/i);
});

test('CLI rejects --format without a value', () => {
  const result = runCli('fixtures/sample-repo', '--format');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--format requires/i);
});

test('CLI rejects unsupported formats', () => {
  const result = runCli('fixtures/sample-repo', '--format', 'yaml');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsupported format/i);
});
