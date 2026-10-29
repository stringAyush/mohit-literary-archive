#!/usr/bin/env node
/**
 * Validate the literary archive JSON and export a source-inventory CSV.
 * Usage: node scripts/validate-catalog.mjs
 *
 * This script does not fetch or scrape YourQuote. It validates the local catalog only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const worksPath = path.join(root, "content", "works.json");
const collectionsPath = path.join(root, "content", "collections.json");
const works = JSON.parse(fs.readFileSync(worksPath, "utf8"));
const collections = JSON.parse(fs.readFileSync(collectionsPath, "utf8"));

const errors = [];
const warnings = [];
const ids = new Set();
const slugs = new Set();
const collectionSlugs = new Set(collections.map(c => c.slug));
const allowedStatuses = new Set(["needs_verification", "published", "draft", "archived", "rejected"]);
const allowedRights = new Set(["permission_pending", "authorized", "public_domain", "licensed", "not_applicable"]);

for (const [i, work] of works.entries()) {
  const at = `works[${i}]`;
  for (const key of ["id", "slug", "title", "author", "source_url", "verification_status", "rights_status", "publication_status"]) {
    if (!work[key]) errors.push(`${at}: missing required field "${key}"`);
  }
  if (ids.has(work.id)) errors.push(`${at}: duplicate id "${work.id}"`);
  ids.add(work.id);
  if (slugs.has(work.slug)) errors.push(`${at}: duplicate slug "${work.slug}"`);
  slugs.add(work.slug);
  if (work.source_url && !/^https?:\/\//.test(work.source_url)) errors.push(`${at}: source_url must be HTTP(S)`);
  if (!allowedStatuses.has(work.publication_status)) warnings.push(`${at}: nonstandard publication_status "${work.publication_status}"`);
  if (!allowedRights.has(work.rights_status)) warnings.push(`${at}: nonstandard rights_status "${work.rights_status}"`);
  for (const slug of (work.categories ?? [])) {
    if (!collectionSlugs.has(slug)) warnings.push(`${at}: category "${slug}" has no matching collection`);
  }
  if (work.publication_status === "published" && work.rights_status === "permission_pending") {
    errors.push(`${at}: cannot publish while rights_status is permission_pending`);
  }
  if (work.publication_status === "published" && work.verification_status !== "verified") {
    warnings.push(`${at}: published work is not marked verification_status "verified"`);
  }
  if (work.publication_status === "published" && !work.full_text) {
    errors.push(`${at}: published work has no full_text`);
  }
}

const headers = [
  "id","title","language","content_type","source_platform","source_url",
  "original_publication_date","verification_status","rights_status",
  "publication_status","categories"
];
const csvCell = value => {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const csv = [
  headers.join(","),
  ...works.map(work => headers.map(key => csvCell(
    key === "categories" ? (work.categories ?? []).join(";") : work[key]
  )).join(","))
].join("\n") + "\n";
fs.writeFileSync(path.join(root, "content", "source-inventory.csv"), csv, "utf8");

console.log(`Loaded ${works.length} work records and ${collections.length} collections.`);
console.log(`Records with full text: ${works.filter(w => w.full_text).length}`);
console.log(`Records with excerpt only: ${works.filter(w => w.excerpt && !w.full_text).length}`);
console.log(`Records needing review: ${works.filter(w => w.publication_status !== "published").length}`);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("Catalog validation passed.");
}
