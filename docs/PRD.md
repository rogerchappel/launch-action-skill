# Product Requirements

## Goal

`launch-action-skill` turns local repository evidence into a dry-run launch action plan that an agent can review before publishing, tagging, posting, or announcing.

## Users

- Agents preparing OSS launch material.
- Maintainers checking readiness before public announcements.
- Workflow builders testing launch pipelines with fixtures.

## MVP

- Read a local repo snapshot folder.
- Inspect README, package metadata, release notes, and verification logs.
- Produce readiness status, blockers, announcement angles, asset needs, dry-run actions, and approval gates.
- Emit markdown or JSON.

## Safety

The MVP never tags releases, publishes packages, posts to social channels, creates GitHub releases, or writes to external services.
