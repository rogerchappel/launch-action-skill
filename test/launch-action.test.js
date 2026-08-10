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

const verificationCases = [
  {
    name: 'positive',
    text: 'Tests passed. Smoke checks completed successfully.',
    blocker: null
  },
  {
    name: 'fully passing mixed checks',
    text: 'Tests passed. Smoke checks succeeded. Release check completed successfully.',
    blocker: null
  },
  {
    name: 'passed tests with pending smoke checks',
    text: 'Tests passed. Smoke checks pending.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'passed tests with skipped smoke checks',
    text: 'Tests passed. Smoke checks were skipped.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'passed tests with smoke checks not run',
    text: 'Tests passed. Smoke checks were not run.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'passed tests with unknown smoke status',
    text: 'Tests passed. Smoke check status is unknown.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'tests have not passed',
    text: 'Tests have not passed.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'no checks passed',
    text: 'No checks passed.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'tests never succeeded',
    text: 'Tests never succeeded.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'not all checks passed',
    text: 'Not all checks passed.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'all tests passed except smoke checks',
    text: 'All tests passed except smoke checks.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'checks passed apart from smoke checks',
    text: 'Checks passed apart from smoke checks.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'most tests passed',
    text: 'Most tests passed.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'tests partially passed',
    text: 'Tests partially passed.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'passed tests with failed smoke checks',
    text: 'Tests passed. Smoke checks failed.',
    blocker: 'Verification evidence reports failed checks.'
  },
  {
    name: 'failed',
    text: 'Tests failed. Smoke check did not pass.',
    blocker: 'Verification evidence reports failed checks.'
  },
  {
    name: 'pending',
    text: 'Tests are pending and have not been run.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'skipped',
    text: 'Tests were skipped for this release candidate.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'not run',
    text: 'Smoke checks were not run.',
    blocker: 'Verification evidence does not report completed passing checks.'
  },
  {
    name: 'unknown',
    text: 'Test status is unknown.',
    blocker: 'Verification evidence does not report completed passing checks.'
  }
];

for (const verificationCase of verificationCases) {
  test(`classifies ${verificationCase.name} verification evidence`, t => {
    const fixture = mkdtempSync(path.join(tmpdir(), `launch-action-${verificationCase.name}-verification-`));
    t.after(() => rmSync(fixture, { recursive: true, force: true }));
    cpSync('fixtures/sample-repo', fixture, { recursive: true });
    writeFileSync(path.join(fixture, 'docs', 'VERIFICATION.md'), `${verificationCase.text}\n`);

    const plan = createLaunchPlan(fixture);

    assert.equal(plan.readiness, verificationCase.blocker ? 'needs-review' : 'ready');
    assert.equal(plan.blockers.includes(verificationCase.blocker), Boolean(verificationCase.blocker));
    assert.equal(
      plan.announcementAngles.includes('Fixture-backed verification story.'),
      !verificationCase.blocker
    );
    assert.equal(
      plan.dryRunActions.some(action => action.includes('Queue publish/post actions')),
      !verificationCase.blocker
    );
  });
}

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
  const defaultMarkdown = runCli('fixtures/sample-repo');
  assert.equal(defaultMarkdown.status, 0);
  assert.match(defaultMarkdown.stdout, /# Launch Action Plan/);

  const markdown = runCli('fixtures/sample-repo', '--format', 'markdown');
  assert.equal(markdown.status, 0);
  assert.match(markdown.stdout, /# Launch Action Plan/);

  const json = runCli('fixtures/sample-repo', '--format', 'json');
  assert.equal(json.status, 0);
  assert.equal(JSON.parse(json.stdout).readiness, 'ready');
});

test('CLI does not promote negated verification evidence', t => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'launch-action-cli-negated-verification-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  cpSync('fixtures/sample-repo', fixture, { recursive: true });
  writeFileSync(path.join(fixture, 'docs', 'VERIFICATION.md'), 'Tests have not passed.\n');

  const result = runCli(fixture, '--format', 'json');
  assert.equal(result.status, 0);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.readiness, 'needs-review');
  assert.deepEqual(plan.blockers, ['Verification evidence does not report completed passing checks.']);
  assert.equal(plan.announcementAngles.includes('Fixture-backed verification story.'), false);
  assert.equal(plan.dryRunActions.some(action => action.includes('Queue publish/post actions')), false);
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

test('CLI rejects extra positional arguments', () => {
  const result = runCli('fixtures/sample-repo', 'unexpected');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected argument/i);
});

test('CLI rejects duplicate --format flags', () => {
  const result = runCli('fixtures/sample-repo', '--format', 'json', '--format', 'markdown');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--format may only be specified once/i);
});

test('CLI rejects unknown flags', () => {
  const result = runCli('fixtures/sample-repo', '--pretty');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown option.*--pretty/i);
});

test('CLI requires the snapshot before options', () => {
  const result = runCli('--format', 'json', 'fixtures/sample-repo');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot directory must be the first argument/i);
});

test('CLI rejects --help when combined with other arguments', () => {
  const result = runCli('--help', 'fixtures/sample-repo');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--help must be used alone/i);
});
