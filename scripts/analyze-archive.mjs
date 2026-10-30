import fs from "node:fs";
import path from "node:path";

const dir = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes and stories/mohit_yenugwar_full_archive/Text";

function parsePage(content, filename) {
  const pageNum = parseInt(filename.replace("page_", "").replace(".md", ""), 10);
  const dateMatch = content.match(/\*\*Visible post date:\*\*\s*(.*)/);
  const date = dateMatch ? dateMatch[1].trim() : null;

  const ocrParts = content.split("```text");
  let ocr = "";
  let native = "";

  if (ocrParts.length > 1) {
    ocr = ocrParts[1].split("```")[0].trim();
  }
  if (ocrParts.length > 2) {
    native = ocrParts[2].split("```")[0].trim();
  }

  return { pageNum, date, ocr, native };
}

for (let i = 2; i <= 15; i++) {
  const p = String(i).padStart(3, "0");
  const file = `page_${p}.md`;
  const content = fs.readFileSync(path.join(dir, file), "utf8");
  const parsed = parsePage(content, file);
  console.log(`\n================ PAGE ${parsed.pageNum} (Date: ${parsed.date}) ================`);
  console.log("--- OCR ---");
  console.log(parsed.ocr);
  console.log("--- NATIVE ---");
  console.log(parsed.native);
}
