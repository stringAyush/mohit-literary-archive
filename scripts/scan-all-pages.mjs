import fs from "node:fs";
import path from "node:path";

const dir = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes and stories/mohit_yenugwar_full_archive/Text";

function cleanOCRText(ocrRaw) {
  const lines = ocrRaw.split("\n");
  const filtered = [];

  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) continue;
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

const under50 = [];
const allRecords = [];

for (let i = 1; i <= 207; i++) {
  const p = String(i).padStart(3, "0");
  const file = `page_${p}.md`;
  const content = fs.readFileSync(path.join(dir, file), "utf8");

  if (i === 1) continue; // Profile header

  const ocrParts = content.split("```text");
  let ocr = "";
  let native = "";
  if (ocrParts.length > 1) ocr = ocrParts[1].split("```")[0].trim();
  if (ocrParts.length > 2) native = ocrParts[2].split("```")[0].trim();

  const cleaned = cleanOCRText(ocr);
  const isHindi = /[\u0900-\u097F]/.test(cleaned);

  if (cleaned.length < 50) {
    under50.push({ page: i, file, length: cleaned.length, text: cleaned, native });
  }

  allRecords.push({
    page: i,
    file,
    isHindi,
    length: cleaned.length,
    lineCount: cleaned.split("\n").filter(Boolean).length
  });
}

console.log(`Total literary pages scanned: ${allRecords.length}`);
console.log(`Hindi pages: ${allRecords.filter(r => r.isHindi).length}`);
console.log(`English pages: ${allRecords.filter(r => !r.isHindi).length}`);
console.log(`Pages with cleaned text < 50 chars: ${under50.length}`);
console.log("\nDetails of pages under 50 chars:");
for (const u of under50) {
  console.log(`Page ${u.page} (${u.length} chars):`);
  console.log("  Text:", JSON.stringify(u.text));
  console.log("  Native:", JSON.stringify(u.native.slice(0, 100)));
}
