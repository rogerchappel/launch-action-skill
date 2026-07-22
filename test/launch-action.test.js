import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLaunchPlan, readLaunchEvidence, renderMarkdown } from '../src/index.js';

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
  const result = spawnSync(process.execPath, ['bin/launch-action-skill.js', '--help'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: launch-action-skill/);
});
