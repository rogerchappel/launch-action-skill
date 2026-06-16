import fs from 'node:fs';
import path from 'node:path';

export function readLaunchEvidence(root) {
  const file = name => readIfExists(path.join(root, name));
  const packageJson = parseJson(file('package.json'));
  return {
    root,
    readme: file('README.md'),
    packageJson,
    releaseNotes: file('docs/RELEASE_NOTES.md') || file('CHANGELOG.md'),
    verification: file('docs/VERIFICATION.md') || file('verification.log'),
    launchNotes: file('docs/LAUNCH_NOTES.md'),
    files: listFiles(root)
  };
}

function readIfExists(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

function parseJson(text) {
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function listFiles(root) {
  try { return fs.readdirSync(root, { recursive: true }).map(String).sort(); } catch { return []; }
}
