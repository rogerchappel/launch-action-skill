import assert from 'node:assert/strict';
import test from 'node:test';

import { createLaunchPlan, readLaunchEvidence, renderMarkdown } from 'launch-action-skill';

test('package root exposes the supported public API', () => {
  assert.equal(typeof readLaunchEvidence, 'function');
  assert.equal(typeof createLaunchPlan, 'function');
  assert.equal(typeof renderMarkdown, 'function');

  const evidence = readLaunchEvidence('fixtures/sample-repo');
  const plan = createLaunchPlan('fixtures/sample-repo');

  assert.match(evidence.readme, /sample-agent-tool/);
  assert.equal(plan.readiness, 'ready');
  assert.match(renderMarkdown(plan), /^# Launch Action Plan/m);
});
