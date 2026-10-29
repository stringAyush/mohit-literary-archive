# Operations guide

## 1. Backups

The database holds everything that matters: the works, every version, every publication event, sources and permissions. The code can always be rebuilt; the database cannot.

### Automatic backups from your host

Most hosted PostgreSQL providers keep automatic backups or point-in-time recovery (Neon: *branches/restore*; Supabase: *Database → Backups*). Turn it on and note how many days are kept.

### Your own copies (recommended monthly, and before big changes)

Install the PostgreSQL client tools (they include `pg_dump`) and run:

```bash
# A compressed, complete backup
pg_dump "$DATABASE_URL" --format=custom --no-owner --file="backups/archive-$(date +%Y-%m-%d).dump"
```

Keep at least one recent copy somewhere other than your laptop (cloud drive, external disk). The `backups/` folder is ignored by git so backups are never committed.

Check that a backup is readable:

```bash
pg_restore --list backups/archive-2026-11-01.dump | head
```

### Restoring

Restore into a **new, empty** database first and check it before switching the site over:

```bash
createdb archive_restore                                   # or create one at your host
pg_restore --no-owner --dbname="postgresql://…/archive_restore" backups/archive-2026-11-01.dump
```

Then point `DATABASE_URL` at the restored database and redeploy (or restart). The schema, the search trigger and all history are included in the dump.

A plain-SQL export is also possible for reading by eye: `pg_dump "$DATABASE_URL" --format=plain > archive.sql`.

## 2. Adding content

### One piece at a time

Admin → **Works → New work**. Paste the exact text (line breaks are kept), choose the form and language, and record the source if it appeared elsewhere. Then, in **Rights & review**:

1. choose how permission was given (*Submitted by the writer* or *Granted by the writer*);
2. write the evidence (for example "Mohit sent this on WhatsApp on 2 Nov 2026 and asked for it to be published");
3. confirm authorship (and source verification, if there is a source);
4. **Approve**, then **Publish now** or **Schedule**.

### The discovered YourQuote pieces

The seed adds the two YourQuote links from the brief to **Review queue → Discovered**. They have no text. For each one: ask Mohit for the exact text, paste it into the work, set the original publication date if he knows it, approve with his permission as evidence, and publish.

### Many pieces at once (import)

1. Fill in `content/import-template.csv` (opens in Excel or Google Sheets) or `content/import-template.json`. Delete the example rows.
2. Admin → **Import** → choose the file → **Check file**. Every row is validated; problems are listed by row number.
3. **Import** creates draft works in the review queue with their source references. Duplicates (same source URL or same text) are skipped.

Columns: `title`, `text`, `contentType` (quote, poem, aphorism, reflection, short_piece), `language` (en, hi, mr, ur, hi-Latn, other), `sourcePlatform` (yourquote, linkedin, instagram, personal_submission, print, other), `sourceUrl`, `originalPublishedAt` and `composedOn` (YYYY-MM-DD), `themes` and `collections` (separate with `;`; collections must already exist), `reviewStatus` (discovered, needs_verification, permission_pending), `permissionStatus` (unknown, requested, granted, author_submitted, denied), `permissionNote`, `notes`.

Rows without text must be `discovered` and have a `sourceUrl`. Only import text the writer has supplied or agreed to. Do not copy from websites in ways their terms forbid.

## 3. Contact email (optional)

Without email settings, contact messages are saved and shown in **Admin → Messages**, and the site says so honestly.

To also receive them by email with [Resend](https://resend.com):

1. Create a Resend account and verify a sending domain (or use their test sender while trying it out).
2. Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (where messages go) and `CONTACT_FROM_EMAIL` (a verified sender, e.g. `Archive <hello@your-domain>`).
3. Redeploy. Each message records whether it was emailed.

## 4. Administrator accounts

- Create: `npm run admin:create`
- Reset a password (signs that account out everywhere): `npm run admin:create -- --reset`
- Passwords must be at least 12 characters. Login is limited to 5 attempts per account and 20 per IP address every 15 minutes.

## 5. Changing the database schema

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate:dev -- --name describe-the-change` creates a migration and applies it locally.
3. Commit the new folder in `prisma/migrations/`, deploy, and run `npm run db:migrate` against production.

Take a backup before applying migrations to production.
