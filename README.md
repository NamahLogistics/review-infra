# Review Infra

Headless reviews, moderation, nudges, widgets, SDK, and developer-first APIs.

## Apps
- apps/api — API server
- apps/web — demo dashboard and review flows
- apps/docs — docs app

## Packages
- packages/widget — embeddable review UI
- packages/sdk — typed client SDK
- packages/ui — shared UI bits
- packages/db — Prisma schema

## Core features
- user auth
- store ownership
- product sync/upsert
- public review submission
- moderation
- review pagination / filtering / sorting
- review nudges
- auto-ingest orders
- cron-driven auto nudges
- analytics
- basic anti-spam protection

## Local dev

pnpm install
pnpm check-types
pnpm build
# review-infra
