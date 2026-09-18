#!/usr/bin/env bash

set -euo pipefail

readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly D1_DATABASE="hopamine-db"
readonly D1_BINDING="hopamine_db"
readonly R2_BUCKET="hopamine-files"

cd "$PROJECT_ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  printf 'Error: pnpm is required but was not found.\n' >&2
  exit 1
fi

printf 'Checking Cloudflare authentication...\n'
pnpm wrangler whoami

printf 'Checking D1 database %s...\n' "$D1_DATABASE"
if ! pnpm wrangler d1 info "$D1_DATABASE" >/dev/null; then
  printf 'Error: D1 database %s was not found in this Cloudflare account.\n' "$D1_DATABASE" >&2
  printf 'Create it with: pnpm wrangler d1 create %s\n' "$D1_DATABASE" >&2
  printf 'Then update database_id in wrangler.jsonc before deploying.\n' >&2
  exit 1
fi

printf 'Checking R2 bucket %s...\n' "$R2_BUCKET"
if ! pnpm wrangler r2 bucket info "$R2_BUCKET" >/dev/null; then
  printf 'Error: R2 bucket %s was not found in this Cloudflare account.\n' "$R2_BUCKET" >&2
  printf 'Create it with: pnpm wrangler r2 bucket create %s\n' "$R2_BUCKET" >&2
  exit 1
fi

printf 'Building the application...\n'
pnpm build

printf 'Applying pending D1 migrations...\n'
pnpm wrangler d1 migrations apply "$D1_BINDING" --remote

printf 'Deploying Hopamine to Cloudflare...\n'
pnpm wrangler deploy

printf 'Deployment completed successfully.\n'
