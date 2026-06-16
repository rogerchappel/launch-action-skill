export function renderMarkdown(plan) {
  const lines = ['# Launch Action Plan', '', '- Project: ' + plan.project, '- Readiness: ' + plan.readiness];
  lines.push('', '## Blockers', ...bullets(plan.blockers));
  lines.push('', '## Announcement Angles', ...bullets(plan.announcementAngles));
  lines.push('', '## Asset Needs', ...bullets(plan.assetNeeds));
  lines.push('', '## Dry-Run Actions', ...bullets(plan.dryRunActions));
  lines.push('', '## Approval Gates', ...bullets(plan.approvalGates));
  lines.push('', '## Evidence Summary');
  for (const [key, value] of Object.entries(plan.evidenceSummary)) lines.push('- ' + key + ': ' + value);
  return lines.join('\n') + '\n';
}

function bullets(items) {
  return items.length ? items.map(item => '- ' + item) : ['- None'];
}
