# Orchestration

1. Point the skill at a local repo snapshot or fixture directory.
2. Read local evidence: README, package metadata, release notes, verification logs, and optional content notes.
3. Generate a dry-run launch plan.
4. Review blockers and approval gates.
5. Use separate approved tools for any external publish or post action.

## Boundaries

- Local file reads are allowed.
- Local command output is allowed.
- GitHub releases, package publishing, social posts, and metadata writes require explicit approval outside this skill.
