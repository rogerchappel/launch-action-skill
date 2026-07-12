import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' });
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

console.log(`package smoke passed: ${pack.filename} includes ${pack.files.length} files`);
