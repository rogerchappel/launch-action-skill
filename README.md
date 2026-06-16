# launch-action-skill

Local-first agent skill for converting repository evidence into a dry-run OSS launch action plan.

## Quickstart

~~~bash
npm test
npm run smoke
node bin/launch-action-skill.js fixtures/sample-repo --format json
~~~

## What It Produces

- Readiness status and blocker list
- Announcement angles grounded in local evidence
- Asset needs for launch material
- Dry-run actions for an agent workflow
- Approval gates for external publish actions

## Limitations

This tool does not tag releases, publish packages, post announcements, create GitHub releases, or write to external services.

## Safety Notes

Use the output as a review plan. Any downstream publish, post, release, or metadata action needs explicit human approval and a separate tool.
