#!/usr/bin/env bash
set -euo pipefail
npm test
npm run check
npm run smoke >/tmp/launch-action-skill-smoke.md
test -s /tmp/launch-action-skill-smoke.md
