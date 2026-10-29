# Mohit Kaushik Yenugwar — Literary Archive Content Seed

This folder is a **partial research seed**, not a complete export of Mohit's writing.

## Source profile

- YourQuote: https://www.yourquote.in/mohit-yenugwar-v0m/quotes
- Additional reference: https://in.linkedin.com/in/mohit-kaushik-yenugwar-b16b99155
- Goodreads quote leads: https://www.goodreads.com/author/quotes/17432747.Mohit_Kaushik_Yenugwar_

The accessible YourQuote profile showed 544 quotes on 2026-10-29. The profile loads its list dynamically; this package does not contain all 544 works.

## Included files

- `content/works.json` — structured records with source URLs, categories, status, and only short excerpts where available.
- `content/collections.json` — editorial categories for the website.
- `content/author-profile.json` — source profile and retrieval snapshot.
- `content/source-inventory.csv` — reviewable CSV inventory.
- `templates/work-import-template.csv` — template for adding further source records.
- `scripts/validate-catalog.mjs` — dependency-free JSON validator and CSV exporter.

## Content and publication rules

All records default to `needs_verification` and `permission_pending`. Do not publish them automatically.

- `verified_from_accessible_source_page` means the individual source page was accessible and the listed metadata was visible.
- `title_seen_in_prior_archive_review` means only a title or identifying phrase was previously surfaced; it is a candidate, not a verified full-text record.
- `needs_individual_post_url` means the individual source URL still needs to be found.
- `excerpt_only` means the record does not contain the complete work.
- `metadata_only` means no literary body text is included.

Before publishing any full work, verify its exact source and establish an appropriate basis for republication. A public post is not by itself permission to republish the complete text elsewhere.

## Categories

Categories are editorial suggestions based on available titles and short excerpts. Treat them as provisional until a human reviewer checks the complete work. A work can belong to multiple collections.

## Validate the files

Run with Node.js (no extra dependencies required):

```bash
node scripts/validate-catalog.mjs
```

The script checks required fields, duplicate IDs/slugs, category references, and publication/rights safeguards. It does not scrape or fetch the source website.

## How to add the remaining works

1. Use a permitted export from the author/platform, or enter individual source records manually.
2. Add each item to `content/works.json` using the schema of existing records.
3. Preserve the original source URL and source date when verifiable.
4. Keep full text blank until it is supplied and verified.
5. Set `rights_status` to `authorized` only when an appropriate permission or ownership basis has been established.
6. Set `verification_status` to `verified` only after checking the original source.
7. Set `publication_status` to `published` only when the full text, source, and rights requirements are satisfied.
8. Run the validator again.

## Important

This is not a legal copyright registration record, not a complete catalog, and not a claim that every candidate title is authentic. No scraping is performed by these files.
