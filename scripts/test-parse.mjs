import fs from "node:fs";
import path from "node:path";

const dir = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes and stories/mohit_yenugwar_full_archive/Text";

function cleanOCRText(ocrRaw) {
  const lines = ocrRaw.split("\n");
  const filtered = [];

  for (let line of lines) {
    const trimmed = line.trim();
    // Skip empty
    if (!trimmed) continue;
    // Skip browser print headers/footers
    if (/\d+\/\d+\/\d+.*YourQuote/i.test(trimmed)) continue;
    if (/https?:\/\//i.test(trimmed)) continue;
    if (/\b\d+\/207\b/.test(trimmed)) continue;
    if (/Search people & hashtags/i.test(trimmed)) continue;
    if (/Write your own quotes/i.test(trimmed)) continue;
    if (/Open App/i.test(trimmed)) continue;
    if (/Add your comment/i.test(trimmed)) continue;
    if (/^\d+\s*likes?/i.test(trimmed)) continue;
    if (/^Your@?uote(\.in)?$/i.test(trimmed)) continue;
    if (/^HomeExploreBookstore/i.test(trimmed)) continue;
    if (/^Mohit Yenugwar\s*\(Mohit Yenugwar\)/i.test(trimmed)) continue;
    if (/^Follow\b/i.test(trimmed)) continue;
    if (/^\d+\s*Followers/i.test(trimmed)) continue;
    if (/^Joined\s+\d+/i.test(trimmed)) continue;
    if (/^Quotes\s+\d+/i.test(trimmed)) continue;
    if (/^Testimonials\s+\d+/i.test(trimmed)) continue;
    if (/^Ayush\b/i.test(trimmed)) continue;
    if (/^A yush\b/i.test(trimmed)) continue;
    if (/^401 yush\b/i.test(trimmed)) continue;
    if (/^C yush\b/i.test(trimmed)) continue;
    if (/^©\s*$/i.test(trimmed)) continue;
    if (/^[e® छि छ ° \(\)]\s*$/i.test(trimmed)) continue;
    if (/^—\s*Mohit Yenugwar$/i.test(trimmed) || /^~\s*Mohit Yenugwar$/i.test(trimmed) || /^-+\s*Mohit Yenugwar$/i.test(trimmed)) continue;
    if (/^Mohit Yenugwar$/i.test(trimmed)) continue;

    filtered.push(trimmed);
  }
  return filtered.join("\n");
}

function extractMetadata(nativeRaw, content) {
  // Extract date
  const dateMatch = content.match(/\*\*Visible post date:\*\*\s*(.*)/);
  const date = dateMatch && dateMatch[1].trim() ? dateMatch[1].trim() : null;

  // Extract hashtags from native text or ocr
  const tagMatches = content.match(/#[a-zA-Z0-9_\u0900-\u097F]+/g) || [];
  const cleanTags = Array.from(new Set(tagMatches.map(t => t.replace(/^#/, "").toLowerCase())));

  // Extract likes if available
  const likesMatch = content.match(/(\d+)\s*likes?/i);
  const likes = likesMatch ? parseInt(likesMatch[1], 10) : 0;

  return { date, tags: cleanTags, likes };
}

const inventory = [];

for (let i = 1; i <= 207; i++) {
  const p = String(i).padStart(3, "0");
  const file = `page_${p}.md`;
  const content = fs.readFileSync(path.join(dir, file), "utf8");

  // Skip page 1 (profile header)
  if (i === 1) {
    inventory.push({ page: i, file, type: "PROFILE_HEADER", text: "", tags: [], date: null, status: "SKIPPED_PROFILE_HEADER" });
    continue;
  }

  const ocrParts = content.split("```text");
  let ocr = "";
  let native = "";
  if (ocrParts.length > 1) ocr = ocrParts[1].split("```")[0].trim();
  if (ocrParts.length > 2) native = ocrParts[2].split("```")[0].trim();

  const cleaned = cleanOCRText(ocr);
  const meta = extractMetadata(native, content);

  inventory.push({
    page: i,
    file,
    text: cleaned,
    rawOcr: ocr,
    native,
    date: meta.date,
    tags: meta.tags,
    likes: meta.likes,
    length: cleaned.length,
    lineCount: cleaned.split("\n").filter(Boolean).length
  });
}

console.log(`Parsed ${inventory.length} total pages.`);
const empty = inventory.filter(p => p.page > 1 && p.length < 10);
console.log(`Pages with < 10 chars: ${empty.length} (pages: ${empty.map(e => e.page).join(", ")})`);

const sample = inventory.slice(1, 10);
for (const s of sample) {
  console.log(`\n--- PAGE ${s.page} (${s.date}) [lines: ${s.lineCount}, chars: ${s.length}] ---`);
  console.log(s.text.slice(0, 150));
}
