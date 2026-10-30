# Mohit Yenugwar — Literary Archive

A personal literary archive and publishing platform: quotes, poems, short stories, prose, reflections and aphorisms, each at a permanent address, with search, collections, quote artwork, and a private admin for drafting, reviewing and publishing.

Built with **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 6**.

---

## What it does

**For readers**

| Page | Address |
| --- | --- |
| Home — hero, featured piece, recent work, collections, writer's note | `/` |
| The Archive — full-text search, filters (form, collection, theme, language), sort, pagination; all kept in the URL | `/works` |
| A single work — full text with line breaks preserved, attribution, dates, source, themes, copy / share / artwork | `/works/<slug>` |
| Quote artwork — square or portrait PNG, 3 templates × 3 tones, never crops text | `/works/<slug>/artwork` |
| Collections and each collection | `/collections`, `/collections/<slug>` |
| About, Copyright & Permissions, Contact | `/about`, `/copyright`, `/contact` |
| Sitemap and robots | `/sitemap.xml`, `/robots.txt` |

**For the administrator** (`/admin`)

- Sign-in with database sessions, rate-limited.
- Overview with real counts and recent activity.
- Create and edit works; drafts never go public.
- **Rights & review** panel: a work can only be published once it is *Approved*, with permission recorded as *granted* or *submitted by the writer*, written evidence of that permission, an administrator's confirmation, and — for works with a source — a verified source.
- Publish, unpublish, schedule, cancel a schedule, archive and restore.
- Every text change is saved as a numbered version (with SHA-256 fingerprint and reason). Earlier text can be restored as a new version. Every lifecycle change is recorded as an event with who did it.
- Collections, themes, the writer's profile (biography shown only after the writer approves it), contact messages, and bulk import from JSON/CSV.

---

## Content and authorship rules built in

- **Nothing is published by default.** New and imported works start as drafts in review.
- **Imported works stay in review** until permission and source are verified. Imports can never mark a work approved.
- **The two YourQuote links in the brief** are recorded as *Discovered* items (source URL only, no text). The YourQuote pages could not be read from the build environment, and the text is not reconstructed from URLs. Ask Mohit for the exact text and permission, paste it into each work, approve it, then publish.
- **The biography is empty** until real details are entered and marked as approved by the writer. Nothing about education, work, awards or location has been invented.
- **Demonstration content** (sample text by "Sample Writer (demo)", not by Mohit) exists only when you seed it with `SEED_DEMO_CONTENT=true`, and is shown only when `SHOW_DEMO_CONTENT=true`. Never set these on the live site.
- Dates are kept separately: *written* (if known), *first appeared on the original platform*, *imported*, *first published on this site* (never overwritten), and *last revised*.
- Text fingerprints are described honestly: they identify exact wording; they are not proof of authorship or a copyright registration.

The Copyright & Permissions page (`src/app/(public)/copyright/page.tsx`) is a sensible default policy. **Ask Mohit to read and confirm it** before launch — it speaks on his behalf.

---

## Run it on your computer

You need **Node.js 20.9+** and a **PostgreSQL** database (local, or a free hosted one such as Neon or Supabase).

```bash
npm install                     # also generates the Prisma client
cp .env.example .env            # then fill in DATABASE_URL and SESSION_SECRET
npm run db:migrate              # creates the tables
npm run db:seed                 # writer profile + the two discovered YourQuote sources
npm run admin:create            # your administrator account (asks for email, name, password)
npm run dev                     # http://localhost:3000  ·  admin at /admin
```

To see the design with sample content while developing:

```bash
SEED_DEMO_CONTENT=true npm run db:seed
# then in .env:  SHOW_DEMO_CONTENT="true"
```

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit + integration tests (integration needs `TEST_DATABASE_URL`) |
| `npm run test:e2e` | Browser test of the publishing path (needs `TEST_DATABASE_URL` and `npm run build` first; install a browser once with `npx playwright install chromium`) |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:migrate:dev` | Create a new migration after changing `prisma/schema.prisma` |
| `npm run db:seed` | Seed (safe to repeat) |
| `npm run catalog:import` | Idempotently import the supplied partial research catalog as private drafts |
| `npm run admin:create` | Create an admin; add `-- --reset` to reset a password |
| `npm run publish:scheduled` | Publish due scheduled works once (for crontab) |

---

## Environment variables

See `.env.example` for the full list with explanations.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SITE_URL` | yes in production | Public address, no trailing slash. Used for canonical URLs, the sitemap and cookies (`https://` makes the session cookie Secure) |
| `SESSION_SECRET` | yes | 32+ random characters. Signs contact-form tokens and hashes IPs for rate limiting |
| `CRON_SECRET` | for scheduling | Shared secret for `/api/cron/publish-scheduled`. Empty = endpoint disabled |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | optional | Email contact messages through [Resend](https://resend.com). Without them, messages are saved and shown in **Admin → Messages** only |
| `SHOW_DEMO_CONTENT` | dev only | `"true"` shows demonstration works |

Production configuration is checked when server features load: `DATABASE_URL` must be PostgreSQL, `SITE_URL` must use HTTPS, `SESSION_SECRET` must be at least 32 characters, and `SHOW_DEMO_CONTENT` must be `false`. If scheduling is enabled, `CRON_SECRET` must be at least 32 characters. Email delivery settings are all-or-nothing: configure the Resend key and both email addresses together, or leave all three empty.

### Importing the supplied research catalog

`content/works.json` and `content/collections.json` are the catalog source of truth. Run `npm run catalog:import` after applying migrations. The command validates IDs, slugs, and collection references, inserts missing records in one transaction, and skips existing source URLs or slugs. Imported works remain drafts and are not approved for publication. The supplied package is partial: 12 candidates, 2 excerpts, 10 metadata-only records, and no complete work texts. Re-run the command after updating the JSON to add newly supplied records; existing records are preserved for manual review rather than overwritten.

---

## Deploying (Vercel + Neon, the simplest route)

1. Create a PostgreSQL database (e.g. Neon) and copy its connection string.
2. Push this project to GitHub and import it into Vercel.
3. In Vercel → Settings → Environment Variables, add `DATABASE_URL`, `SITE_URL` (your real `https://` address), `SESSION_SECRET` and `CRON_SECRET`.
4. Run the migrations and seed against the production database **from your computer**, with `DATABASE_URL` pointing at it:
   ```bash
   npm run db:migrate && npm run db:seed && npm run admin:create
   ```
5. Deploy. Visit `/admin` and sign in.

### Scheduled publishing

Scheduled works are published by a server-side job — never by a browser tab. The job is `/api/cron/publish-scheduled` (it needs `Authorization: Bearer <CRON_SECRET>`) and is safe to call any number of times. Use one of:

- **GitHub Actions** (included): `.github/workflows/publish-scheduled.yml` calls it every 15 minutes. Add `SITE_URL` and `CRON_SECRET` as repository secrets.
- **Vercel Cron** (included in `vercel.json`): once a day on the free plan; change the schedule to `*/15 * * * *` on a Pro plan.
- **Your own server**: `*/5 * * * * cd /srv/archive && npm run publish:scheduled`.

When the job runs, it checks the publishing rules again; if a scheduled work is no longer approved, it is returned to draft and the reason is recorded in its history.

### Other hosts

Any host that runs Node.js works (Railway, Render, a VPS): `npm ci && npm run build && npm start`, with the same environment variables.

---

## Architecture

```
prisma/
  schema.prisma          data model (works, versions, sources, events, collections, themes, admin…)
  migrations/            SQL migrations, incl. the full-text search trigger
  seed.ts                writer profile, discovered sources, optional demo content
src/
  app/(public)/          reader-facing pages
  app/admin/             login + dashboard (every page and action checks the admin on the server)
  app/api/               search API, scheduler endpoint
  components/            UI (site chrome, works, archive, artwork, admin forms)
  lib/works/service.ts   ALL changes to works: validation, transactions, versions, events
  lib/works/queries.ts   ALL public reads — each starts from publicWorkWhere()
  lib/works/publishing-rules.ts   the publish checklist
  lib/auth/              scrypt passwords, hashed database sessions, admin guard
  lib/artwork/           text layout for quote images (pure, tested)
tests/unit, tests/integration, tests/e2e
```

Key decisions:

- **Search** uses PostgreSQL full-text search with the language-neutral `simple` configuration (works for English, Hindi and Marathi alike), a trigger-maintained `tsvector` column and a GIN index. Readers' input is reduced to letters and numbers before it reaches the database, and always sent as a parameter.
- **Public pages render on the server per request**, so publishing, unpublishing and scheduled publication show up immediately without cache invalidation.
- **Security**: server-side admin checks on every page and action; HttpOnly SameSite session cookies (Secure on https) with only token hashes stored; rate limits on login and contact; Zod validation everywhere; Next.js Server Actions' built-in origin check against CSRF; React escaping plus a Content Security Policy against XSS; security headers and `noindex` on admin and API routes.
- **Fonts** (Playfair Display, Cormorant Garamond, Inter, Noto Serif Devanagari) are self-hosted from npm through `next/font`, with size-matched fallbacks to avoid layout shift.
- **Colour**: the specification's secondary text colour `#777168` measures 4.4:1 on the page background, just under WCAG AA's 4.5:1, so `#6E685F` is used instead.

---

## Backups and recovery

See [`docs/OPERATIONS.md`](docs/OPERATIONS.md) for backups, restoring, importing content, and email setup.
