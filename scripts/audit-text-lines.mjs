import fs from "node:fs";
import path from "node:path";

const dir = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes and stories/mohit_yenugwar_full_archive/Text";

function cleanLines(ocr) {
  const lines = ocr.split("\n");
  const result = [];
  for (let l of lines) {
    let t = l.trim();
    if (!t) continue;
    if (/\d+\/\d+\/\d+.*YourQuote/i.test(t)) continue;
    if (/https?:\/\//i.test(t)) continue;
    if (/\b\d+\/207\b/.test(t)) continue;
    if (/Search people & hashtags/i.test(t)) continue;
    if (/Write your own quotes/i.test(t)) continue;
    if (/Open App/i.test(t)) continue;
    if (/Add your comment/i.test(t)) continue;
    if (/^\d+\s*likes?/i.test(t)) continue;
    if (/^Your@?uote(\.in)?$/i.test(t)) continue;
    if (/^HomeExploreBookstore/i.test(t)) continue;
    if (/^Mohit Yenugwar\s*\(Mohit Yenugwar\)/i.test(t)) continue;
    if (/^Follow\b/i.test(t)) continue;
    if (/^\d+\s*Followers/i.test(t)) continue;
    if (/^Joined\s+\d+/i.test(t)) continue;
    if (/^Quotes\s+\d+/i.test(t)) continue;
    if (/^Testimonials\s+\d+/i.test(t)) continue;
    if (/^Ayush\b/i.test(t)) continue;
    if (/^A yush\b/i.test(t)) continue;
    if (/^401 yush\b/i.test(t)) continue;
    if (/^C yush\b/i.test(t)) continue;
    if (/^©\s*$/i.test(t)) continue;
    if (/^[e® छि छ ° \(\)]\s*$/i.test(t)) continue;
    if (/^#\S+/i.test(t)) continue; // Hashtags
    if (/^[-—~]\s*Mohit\s*Yenugwar/i.test(t) || /^Mohit\s*Yenugwar$/i.test(t)) continue;

    result.push(t);
  }
  return result;
}

const suspiciousPages = [];

for (let i = 2; i <= 206; i++) {
  const p = String(i).padStart(3, "0");
  const file = `page_${p}.md`;
  const content = fs.readFileSync(path.join(dir, file), "utf8");
  const ocrParts = content.split("```text");
  const ocr = ocrParts.length > 1 ? ocrParts[1].split("```")[0].trim() : "";
  const lines = cleanLines(ocr);

  // Check if any line has suspicious characters or is very short
  const shortLines = lines.filter(l => l.length < 3);
  if (shortLines.length > 0) {
    suspiciousPages.push({ page: i, shortLines, lines: lines.slice(0, 5) });
  }
}

console.log(`Pages with short/suspicious lines: ${suspiciousPages.length}`);
for (const s of suspiciousPages.slice(0, 15)) {
  console.log(`Page ${s.page}: short lines =`, JSON.stringify(s.shortLines));
}
