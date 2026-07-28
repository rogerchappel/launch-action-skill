# launch-action-skill

Local-first agent skill for converting repository evidence into a dry-run OSS launch action plan.

## Quickstart

~~~bash
npm install
npm test
npm run smoke
node bin/launch-action-skill.js fixtures/sample-repo --format json
~~~

For a reviewable Markdown plan:

~~~bash
node bin/launch-action-skill.js fixtures/sample-repo --format markdown
~~~

The snapshot argument must name a readable directory. Output defaults to
Markdown; `--format` accepts only `markdown` or `json`. Invalid paths and format
values print an error to stderr and exit nonzero.

## What It Produces

- Readiness status and blocker list
- Announcement angles grounded in local evidence
- Asset needs for launch material
- Dry-run actions for an agent workflow
- Approval gates for external publish actions

## Input Expectations

Point the CLI at a local repository checkout or fixture directory. The planner
looks for README, release notes, verification docs, package metadata, and launch
notes; missing evidence is reported as a blocker or follow-up rather than being
invented.

Verification evidence must name a test, check, or smoke check and affirm that it
passed, succeeded, or completed successfully. Every named outcome must be
passing, so one passing test does not hide another check that is incomplete. A
failed result gets a failure blocker. Pending, skipped, not-run, unknown,
missing, and other non-affirmative results get an incomplete-verification
blocker; they cannot produce ready status, a verification announcement angle,
or a queue-publish action.

## Verification

Run the release-readiness gate before publishing or handing the skill to another
agent:

~~~bash
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
~~~

## Limitations

This tool does not tag releases, publish packages, post announcements, create GitHub releases, or write to external services.

## Safety Notes

Use the output as a review plan. Any downstream publish, post, release, or metadata action needs explicit human approval and a separate tool.
