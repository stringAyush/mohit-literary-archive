import fs from "node:fs";
import path from "node:path";

const dir = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes and stories/mohit_yenugwar_full_archive/Text";

// Manual overrides for pages where OCR was noisy or missed text
const MANUAL_OVERRIDES = {
  19: {
    text: "मैं नहीं चाहता तुझे किसी से कोई फ़रियाद हो,\nचाहे मैं बर्बाद हो जाऊँ, तेरी दुनिया मगर आबाद हो...",
    title: "तेरी दुनिया आबाद हो",
    type: "QUOTE",
    language: "hi"
  },
  198: {
    text: "ना जाने ये जान कर कितना सुकून पहुंचे,\nकी उसके बाद तबाह हो गया हूं मैं...",
    title: "सुकून",
    type: "QUOTE",
    language: "hi"
  },
  3: {
    text: "i made myself a prodigy,\njust for life to nerf me later.",
    title: "Prodigy",
    type: "QUOTE",
    language: "en"
  },
  5: {
    text: "चाहा था इक दफ़ा उसे अपना नाम दें,\nलफ़्ज़ होंठों तक आए, मगर ठहर न सके...",
    title: "लफ़्ज़",
    type: "QUOTE",
    language: "hi"
  }
};

function extractQuoteFromOCR(ocrRaw) {
  const lines = ocrRaw.split("\n");
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip print headers
    if (/\d+\/\d+\/\d+.*YourQuote/i.test(line)) continue;
    if (/https?:\/\//i.test(line)) continue;
    if (/\b\d+\/207\b/.test(line)) continue;
    if (/Search people & hashtags/i.test(line)) continue;
    if (/Write your own quotes/i.test(line)) continue;
    if (/Open App/i.test(line)) continue;
    if (/Add your comment/i.test(line)) continue;
    if (/^\d+\s*likes?/i.test(line)) continue;
    if (/^Your@?uote(\.in)?$/i.test(line)) continue;
    if (/^HomeExploreBookstore/i.test(line)) continue;
    if (/^Mohit Yenugwar\s*\(Mohit Yenugwar\)/i.test(line)) continue;
    if (/^Follow\b/i.test(line)) continue;
    if (/^\d+\s*Followers/i.test(line)) continue;
    if (/^Joined\s+\d+/i.test(line)) continue;
    if (/^Quotes\s+\d+/i.test(line)) continue;
    if (/^Testimonials\s+\d+/i.test(line)) continue;
    if (/^Ayush\b/i.test(line)) continue;
    if (/^A yush\b/i.test(line)) continue;
    if (/^401 yush\b/i.test(line)) continue;
    if (/^C yush\b/i.test(line)) continue;
    if (/^©\s*$/i.test(line)) continue;
    if (/^[e® छि छ ° \(\)]\s*$/i.test(line)) continue;
    if (/^#\S+/i.test(line)) continue; // skip hashtags in body

    if (/^[-—~]\s*Mohit\s*Yenugwar/i.test(line) || /^Mohit\s*Yenugwar$/i.test(line)) {
      break; // Stop at attribution
    }

    candidates.push(line);
  }

  // Filter out stray short OCR artifacts at the beginning if there are obvious seeds/noise
  // E.g. 1-2 character random symbols
  const cleanLines = [];
  for (let c of candidates) {
    if (cleanLines.length === 0 && c.length <= 3 && !/[\u0900-\u097F]/.test(c)) {
      continue;
    }
    cleanLines.push(c);
  }

  return cleanLines.join("\n").trim();
}

function extractMetadata(content) {
  const dateMatch = content.match(/\*\*Visible post date:\*\*\s*(.*)/);
  const date = dateMatch && dateMatch[1].trim() ? dateMatch[1].trim() : null;

  const tagMatches = content.match(/#[a-zA-Z0-9_\u0900-\u097F]+/g) || [];
  const cleanTags = Array.from(new Set(tagMatches.map(t => t.replace(/^#/, "").toLowerCase())))
    .filter(t => !["yourquote", "yqbaba", "yqdidi", "yourquotedidi", "yourquotebaba", "yqenglish", "yqhindi", "yqpoetry", "yqshayari", "yqkavita"].includes(t));

  const likesMatch = content.match(/(\d+)\s*likes?/i);
  const likes = likesMatch ? parseInt(likesMatch[1], 10) : 0;

  return { date, tags: cleanTags, likes };
}

const records = [];

for (let i = 2; i <= 206; i++) {
  const p = String(i).padStart(3, "0");
  const file = `page_${p}.md`;
  const content = fs.readFileSync(path.join(dir, file), "utf8");

  const meta = extractMetadata(content);

  let text = "";
  let title = null;
  let type = "QUOTE";
  let language = "en";

  if (MANUAL_OVERRIDES[i]) {
    text = MANUAL_OVERRIDES[i].text;
    title = MANUAL_OVERRIDES[i].title;
    type = MANUAL_OVERRIDES[i].type;
    language = MANUAL_OVERRIDES[i].language;
  } else {
    const ocrParts = content.split("```text");
    const ocr = ocrParts.length > 1 ? ocrParts[1].split("```")[0].trim() : "";
    text = extractQuoteFromOCR(ocr);
    language = /[\u0900-\u097F]/.test(text) ? "hi" : "en";

    const lines = text.split("\n").filter(Boolean);
    if (lines.length >= 7 || text.length > 280) {
      type = "POEM"; // Poem or long-form story/reflection
    } else {
      type = "QUOTE"; // Short quote / couplet / aphorism
    }
  }

  records.push({
    page: i,
    file,
    type,
    language,
    date: meta.date,
    tags: meta.tags,
    likes: meta.likes,
    title,
    text,
    charCount: text.length,
    lineCount: text.split("\n").filter(Boolean).length
  });
}

console.log("Total records processed:", records.length);
const quotes = records.filter(r => r.type === "QUOTE");
const stories = records.filter(r => r.type !== "QUOTE");

console.log("Quotes count:", quotes.length);
console.log("Stories / Poems count:", stories.length);
console.log("Hindi count:", records.filter(r => r.language === "hi").length);
console.log("English count:", records.filter(r => r.language === "en").length);

console.log("\nSample Quote (Page 2):", JSON.stringify(quotes.find(q => q.page === 2)?.text));
console.log("\nSample Story / Poem (Page 6):", JSON.stringify(stories.find(s => s.page === 6)?.text.slice(0, 150)));
console.log("\nSample Hindi Quote (Page 15):", JSON.stringify(quotes.find(q => q.page === 15)?.text));
