#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Generate today's page; prints JSON to stdout (last line)
node tools/daily-html.mjs

# Keep repo in a pushable state (avoid non-fast-forward)
git pull --rebase >/dev/null 2>&1 || true

# Stage & push
git add daily tools
git commit -m "Daily creative HTML: $(date +%F)" >/dev/null 2>&1 || true

# Retry push to reduce transient network failures
for i in 1 2 3; do
  if git push >/dev/null 2>&1; then
    exit 0
  fi
  sleep $((i * 2))
done

echo "git push failed after retries" >&2
exit 1
