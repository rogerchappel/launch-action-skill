# Changelog

## Unreleased

- Require verification evidence to report completed passing checks before a
  launch plan can be marked ready.
- Reject missing, nonexistent, unreadable, and non-directory snapshot inputs.
- Reject missing or unsupported `--format` values instead of silently rendering
  Markdown.
- Enforce one snapshot followed by at most one `--format` flag, rejecting extra
  positionals, duplicate or unknown flags, and options before the snapshot.
- Exercise valid and malformed invocations through the installed package binary
  during package smoke checks.

## 0.1.0

- Initial public skill package with dry-run OSS launch planning, fixture-backed
  checks, CLI smoke coverage, and release-readiness validation.
