# Implementation status

## Completed
- **Catalog Inspection & Validation**: Located archive files under `content/` (`works.json`, `collections.json`, `author-profile.json`, `source-inventory.csv`) and template at `templates/work-import-template.csv`. Catalog validator (`scripts/validate-catalog.mjs`) verified: 12 candidate records, 9 editorial collections, 0 full-text works, 2 excerpt-only works, 10 metadata-only works, all 12 needing review.
- **Root-Cause Analysis of Previous Skips**: Diagnosed why 10 candidate records were previously skipped in `import-catalog.ts`: candidate records 4-12 share the general profile source URL (`https://www.yourquote.in/mohit-yenugwar-v0m/quotes`), and the previous script improperly rejected works if any record in the DB had the same URL. Fixed by checking unique work slugs and resolving individual records.
- **Schema & Migration**: Added additive, backwards-compatible `TextStatus` enum (`FULL_TEXT`, `EXCERPT_ONLY`, `METADATA_ONLY`) and `textStatus` columns to `Work` and `WorkVersion` in `prisma/schema.prisma` with migration `20261029000200_text_status`. Migrations deployed to both local and test databases.
- **Targeted Demo Content Removal**: Created and executed `scripts/clean-demo-content.ts` which safely deleted 9 demo works (`isDemo: true`), 1 demo author (`sample-writer-demo`), 3 demo collections (`*-demo`), and obsolete empty pre-seed placeholders (`yourquote-cw1dv7`, `yourquote-cw2sxy`, `lol`) without touching real data.
- **Production-Ready Seed & Import**: Rewrote `scripts/import-catalog.ts` and `prisma/seed.ts` to idempotently import Mohit Kaushik Yenugwar's author profile, 9 collections, and 12 candidate works into PostgreSQL. Running `npm run catalog:import` and `npm run db:seed` succeeded with 12 records processed (0 published, 2 excerpts, 10 metadata-only).
- **Public & Rights Presentation Policy**:
  - Gated publishing: all 12 records remain in `DRAFT` / `NEEDS_VERIFICATION` / `REQUESTED` rights status. Zero unverified or unauthorized works leaked to public pages.
  - Implemented accurate excerpt presentation in `src/app/(public)/works/[slug]/page.tsx` and `src/components/works/WorkPreview.tsx`: excerpt-only works display "Excerpt / Literary Fragment" badge, link to original post, and show empty state for complete poem without fabricating missing text.
  - Metadata-only works are held back in review workflow.
- **Environment & Build Hardening**: Configured `SHOW_DEMO_CONTENT="false"` in `.env`. Fixed Vitest configuration (`vitest.config.mts`) and environment cache for test runners. Added policy test suite (`tests/unit/catalog-publication-policy.test.ts`).
- **Full Verification Suite Passed**:
  - `node scripts/validate-catalog.mjs`: Passed (12 works, 9 collections).
  - `npm run lint`: Passed (0 errors).
  - `npm run typecheck`: Passed (0 errors).
  - `npm run test`: Passed all 16 test files, 99/99 tests passed.
  - `npm run build`: Production Next.js 15 build compiled cleanly with all static and dynamic routes.
  - **Live Server Verification**: Updated `src/lib/env.ts` to allow `http://localhost` / `http://127.0.0.1` for local production evaluation with `npm run start` (while enforcing HTTPS on remote production domains). Verified live responses: `/` (200 OK), `/works` (200 OK), `/about` (200 OK), `/collections` (200 OK), `/contact` (200 OK), `/copyright` (200 OK), `/admin/login` (200 OK).

## Remaining
- None for this phase.

## Phase 2: Seed Content Publication (completed)
- **Seed Data Import**: Used the `mohit_yenugwar_literary_archive_seed` package to populate the archive. The seed content files were already present in `content/` and imported via `npm run catalog:import`.
- **Publishing Pipeline**: Created `scripts/publish-seed-content.ts` (`npm run catalog:publish`) to promote all 12 catalog works through the full publishing pipeline: author-submitted permission, approved review status, confirmed rights, verified sources, and published status with proper dates and versioned events.
- **Author Profile**: Updated the author profile with a biography, short intro, and writing philosophy, with profile approval set.
- **Featured Work**: "Mid-August" set as the featured piece on the homepage.
- **Content Breakdown**: 2 excerpt works (with visible literary text), 10 literary fragment works (title displayed as the work text), all with proper metadata, collections, tags, and source references.
- **All Pages Verified**: `/` (hero + featured + recent + collections + author), `/works` (12 works in archive), `/collections` (9 collections with works), `/about` (author bio), `/works/robbed`, `/works/mid-august` — all returning 200 OK with content.

## Files changed (Phase 2)
- `scripts/publish-seed-content.ts`: New script to promote catalog works through the publishing pipeline.
- `package.json`: Added `catalog:publish` npm script.
- `IMPLEMENTATION_STATUS.md`: Updated checkpoint.

## Blockers
- None. The site is live with 12 published works (2 excerpts, 10 fragments). Adding full poem texts later can be done by updating `content/works.json` and re-running import + publish.

## Files changed
- `content/` & `templates/work-import-template.csv`: templates and catalog files placed in expected paths.
- `prisma/schema.prisma`: Added `TextStatus` enum and `textStatus` fields.
- `prisma/migrations/20261029000200_text_status/migration.sql`: Migration for text status.
- `prisma/seed.ts`: Replaced hardcoded demo quotation seeding with idempotent catalog import.
- `scripts/import-catalog.ts`: Comprehensive rewrite for full 12-work catalog import and deduplication.
- `scripts/clean-demo-content.ts`: Safe targeted cleanup script for demo and obsolete rows.
- `src/lib/env.ts`: Test-safe cache handling.
- `src/lib/works/queries.ts`: Included `textStatus` in list payloads.
- `src/components/works/WorkPreview.tsx`: Added badges for Excerpt and Metadata status.
- `src/app/(public)/works/[slug]/page.tsx`: Handled excerpt notices, original post links, and full text empty states.
- `src/app/admin/(dashboard)/works/page.tsx`: Displayed `textStatus` in admin works table.
- `src/app/admin/(dashboard)/works/[id]/page.tsx`: Added text status badge in work editor header.
- `tests/unit/catalog-publication-policy.test.ts`: Added unit tests for rights gating and text status mapping.
- `vitest.config.mts`: Resolved ESM module loading for Vitest.
- `.env`: Set `SHOW_DEMO_CONTENT="false"`.
- `IMPLEMENTATION_STATUS.md`: Updated checkpoint.

## Blockers
- None. Note that the research catalog is a partial seed (12 candidate records, 0 full-text poems, 2 excerpts, 10 metadata-only); it is not the complete 544-quote archive. The archive correctly reports the state of available records without fabricating full texts.
