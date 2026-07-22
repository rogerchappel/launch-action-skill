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
  if (hasFailedVerification(evidence.verification)) blockers.push('Verification evidence reports failed checks.');
  else if (!/test|smoke|check/i.test(evidence.verification)) blockers.push('Verification evidence is missing or incomplete.');
  if (!evidence.releaseNotes) blockers.push('Release notes are missing.');
  return blockers;
}

function hasFailedVerification(verification) {
  return /\b(?:tests?|checks?|smoke(?:\s+checks?)?)\b[^.!?\n]{0,80}\b(?:fail(?:ed|ing|ure)?|did\s+not\s+pass|(?:is|are|was|were)\s+not\s+passing)\b/i.test(verification);
}

function angles(evidence) {
  const angles = [];
  if (/local-first/i.test(evidence.readme + evidence.releaseNotes)) angles.push('Local-first workflow with reviewable outputs.');
  if (/agent/i.test(evidence.readme + evidence.packageJson.description)) angles.push('Agent-builder utility for safer automation.');
  if (/fixture|test/i.test(evidence.verification)) angles.push('Fixture-backed verification story.');
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
