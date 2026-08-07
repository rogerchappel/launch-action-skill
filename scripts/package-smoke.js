import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const workspace = mkdtempSync(path.join(tmpdir(), 'launch-action-package-smoke-'));
process.on('exit', () => rmSync(workspace, { recursive: true, force: true }));

const result = spawnSync('npm', ['pack', '--pack-destination', workspace, '--json'], { encoding: 'utf8' });
const output = `${result.stdout || ''}\n${result.stderr || ''}`;

if (result.status !== 0) {
  process.stderr.write(output);
  process.exit(result.status || 1);
}

const [pack] = JSON.parse(result.stdout);
const packedFiles = new Set(pack.files.map((file) => file.path));

const required = [
  'bin/launch-action-skill.js',
  'src/index.js',
  'src/planner.js',
  'src/render.js',
  'docs/SAFETY.md',
  'docs/RELEASE_CANDIDATE.md',
  'SKILL.md',
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md'
];

const missing = required.filter((entry) => !packedFiles.has(entry));

if (missing.length > 0) {
  console.error(`package smoke missing entries:\n${missing.join('\n')}`);
  process.exit(1);
}

const archive = path.join(workspace, pack.filename);
const installRoot = path.join(workspace, 'install');
const install = spawnSync('npm', ['install', '--ignore-scripts', '--prefix', installRoot, archive], {
  encoding: 'utf8'
});
if (install.status !== 0) {
  process.stderr.write(`${install.stdout || ''}\n${install.stderr || ''}`);
  process.exit(install.status || 1);
}

const executable = path.join(installRoot, 'node_modules', '.bin', 'launch-action-skill');
const snapshot = path.resolve('fixtures/sample-repo');
const cases = [
  { name: 'default format', args: [snapshot], status: 0, output: /# Launch Action Plan/ },
  { name: 'markdown format', args: [snapshot, '--format', 'markdown'], status: 0, output: /# Launch Action Plan/ },
  { name: 'json format', args: [snapshot, '--format', 'json'], status: 0, output: /"readiness": "ready"/ },
  { name: 'extra positional', args: [snapshot, 'extra'], status: 1, error: /unexpected argument/i },
  { name: 'duplicate format', args: [snapshot, '--format', 'json', '--format', 'markdown'], status: 1, error: /only be specified once/i },
  { name: 'unknown flag', args: [snapshot, '--pretty'], status: 1, error: /unknown option/i },
  { name: 'missing flag value', args: [snapshot, '--format'], status: 1, error: /requires markdown or json/i },
  { name: 'option before snapshot', args: ['--format', 'json', snapshot], status: 1, error: /must be the first argument/i }
];

for (const smokeCase of cases) {
  const invocation = spawnSync(executable, smokeCase.args, { encoding: 'utf8' });
  if (invocation.status !== smokeCase.status
      || (smokeCase.output && !smokeCase.output.test(invocation.stdout))
      || (smokeCase.error && !smokeCase.error.test(invocation.stderr))) {
    console.error(`installed CLI smoke failed: ${smokeCase.name}`);
    process.stderr.write(`${invocation.stdout || ''}${invocation.stderr || ''}`);
    process.exit(1);
  }
}

console.log(`package smoke passed: ${pack.filename} includes ${pack.files.length} files; ${cases.length} installed CLI cases passed`);
