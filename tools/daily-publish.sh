#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Generate today's page; prints JSON to stdout
node tools/daily-html.mjs
# Stage & push
git add daily tools
git commit -m "Daily creative HTML: $(date +%F)" >/dev/null 2>&1 || true
git push >/dev/null
