# Launch Action Skill

Use this skill when an agent needs to prepare launch readiness notes and a dry-run action plan from local repository evidence.

## Inputs

- A local repository snapshot or fixture directory.
- Optional release notes, verification logs, and launch notes stored in that directory.

## Side Effects

This skill reads local files and writes command output only. It must not tag releases, publish packages, create GitHub releases, post to social channels, or change repository metadata.

## Approval Requirements

Ask for explicit approval before any downstream external action, including publishing a package, tagging a release, opening a final launch announcement, posting to social channels, or writing to GitHub.

## Example

~~~bash
launch-action-skill fixtures/sample-repo --format markdown
~~~

## Validation

Run `npm test`, `npm run check`, and `npm run smoke`. Confirm every launch claim is backed by local evidence or listed as an asset need/blocker.
