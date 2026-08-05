import { readLaunchEvidence } from './evidence.js';

export function createLaunchPlan(root) {
  const evidence = readLaunchEvidence(root);
  const blockers = findBlockers(evidence);
  const readiness = blockers.length === 0 ? 'ready' : blockers.length <= 2 ? 'needs-review' : 'blocked';
  return {
    project: evidence.packageJson.name || inferProjectName(evidence),
    readiness,
    blockers,
    announcementAngles: angles(evidence),
    assetNeeds: assetNeeds(evidence),
    dryRunActions: dryRunActions(readiness),
    approvalGates: approvalGates(),
    evidenceSummary: summarizeEvidence(evidence)
  };
}

function findBlockers(evidence) {
  const blockers = [];
  if (!evidence.readme) blockers.push('README.md is missing.');
  if (!evidence.packageJson.name) blockers.push('package.json name is missing.');
  const verificationStatus = classifyVerification(evidence.verification);
  if (verificationStatus === 'failed') blockers.push('Verification evidence reports failed checks.');
  else if (verificationStatus !== 'passed') blockers.push('Verification evidence does not report completed passing checks.');
  if (!evidence.releaseNotes) blockers.push('Release notes are missing.');
  return blockers;
}

function classifyVerification(verification) {
  const check = String.raw`\b(?:tests?|checks?|smoke(?:\s+checks?)?)\b`;
  const failed = String.raw`\b(?:fail(?:ed|ing|ure)?|did\s+not\s+pass|(?:is|are|was|were)\s+not\s+passing)\b`;
  const negatedOutcome = String.raw`\b(?:no\s+(?:tests?|checks?|smoke(?:\s+checks?)?)\s+(?:(?:have|has|had)\s+)?(?:passed|succeeded)|(?:tests?|checks?|smoke(?:\s+checks?)?)\s+(?:(?:have|has|had|do|does|did|can|could|will|would)\s+not|never)\s+(?:pass(?:ed|ing)?|succeed(?:ed|ing)?|complete(?:d|ing)?\s+successfully)|not\s+all\s+(?:tests?|checks?|smoke(?:\s+checks?)?)\s+(?:passed|succeeded|completed\s+successfully))\b`;
  const passed = String.raw`\b(?:pass(?:ed|ing)?|succeed(?:ed|ing)?|completed\s+successfully)\b`;
  const incomplete = String.raw`\b(?:pending|skipped|not[\s-]+run|unknown)\b`;
  const checkPattern = new RegExp(check, 'i');
  const failedPattern = new RegExp(failed, 'i');
  const negatedOutcomePattern = new RegExp(negatedOutcome, 'i');
  const passedPattern = new RegExp(passed, 'i');
  const incompletePattern = new RegExp(incomplete, 'i');
  const outcomes = verification
    .split(/[.!?\n]+/)
    .filter(statement => checkPattern.test(statement))
    .map(statement => {
      if (failedPattern.test(statement)) return 'failed';
      if (negatedOutcomePattern.test(statement)) return 'incomplete';
      if (incompletePattern.test(statement)) return 'incomplete';
      return passedPattern.test(statement) ? 'passed' : 'incomplete';
    });

  if (outcomes.includes('failed')) return 'failed';
  if (outcomes.length > 0 && outcomes.every(outcome => outcome === 'passed')) return 'passed';
  return 'incomplete';
}

function angles(evidence) {
  const angles = [];
  if (/local-first/i.test(evidence.readme + evidence.releaseNotes)) angles.push('Local-first workflow with reviewable outputs.');
  if (/agent/i.test(evidence.readme + evidence.packageJson.description)) angles.push('Agent-builder utility for safer automation.');
  if (classifyVerification(evidence.verification) === 'passed') angles.push('Fixture-backed verification story.');
  return angles.length ? angles : ['Explain the concrete user workflow and proof from local docs.'];
}

function assetNeeds(evidence) {
  const needs = [];
  if (!/example|quickstart/i.test(evidence.readme)) needs.push('Add a concise quickstart example.');
  if (!evidence.launchNotes) needs.push('Draft launch notes for the target audience.');
  if (!/screenshot|demo|gif/i.test(evidence.launchNotes + evidence.readme)) needs.push('Decide whether a screenshot, terminal capture, or short demo clip is needed.');
  return needs;
}

function dryRunActions(readiness) {
  const actions = ['Prepare announcement draft from README and release notes.', 'Check that all claims are backed by local evidence.', 'Review blockers and asset needs with a human.'];
  if (readiness === 'ready') actions.push('Queue publish/post actions only after explicit approval.');
  else actions.push('Resolve blockers before preparing external publish actions.');
  return actions;
}

function approvalGates() {
  return ['Approve final release/tag action.', 'Approve package publishing action.', 'Approve social or community post text.', 'Approve any GitHub metadata writes.'];
}

function summarizeEvidence(evidence) {
  return {
    hasReadme: Boolean(evidence.readme),
    hasPackageMetadata: Boolean(evidence.packageJson.name),
    hasReleaseNotes: Boolean(evidence.releaseNotes),
    hasVerification: Boolean(evidence.verification),
    fileCount: evidence.files.length
  };
}

function inferProjectName(evidence) {
  return evidence.root.split(/[\/]/).filter(Boolean).at(-1) || 'unknown-project';
}
