#!/usr/bin/env bash
set -euo pipefail

# Run on the VPS inside the project directory.
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

ENV=${1:-production}

echo "Installing dependencies (using package-lock.json)..."
if [ -f package-lock.json ]; then
  npm ci --only=production
else
  npm install --production
fi

echo "Starting app with pm2 (environment=${ENV})"
if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found, installing globally"
  npm install -g pm2
fi

pm2 start ecosystem.config.js --env ${ENV} --update-env || pm2 reload ecosystem.config.js --env ${ENV}
pm2 save

echo "Done."
