import fs from "node:fs";
import path from "node:path";

const ARCHIVE_DIR = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes and stories/mohit_yenugwar_full_archive";
const TEXT_DIR = path.join(ARCHIVE_DIR, "Text");
const QUOTES_DIR = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes";
const STORIES_DIR = "/home/phoenix/Downloads/mohit-literary-archive/src/lib/stories";

// Exact verified manual transcriptions for pages where OCR needed assistance or had image artifacts
const VERIFIED_PAGE_TRANSCRIPTIONS = {
  3: {
    title: "Prodigy",
    body: "i made myself a prodigy,\njust for life to nerf me later.",
    type: "QUOTE",
    language: "en",
    categories: ["identity-and-introspection", "choices-and-consequences"],
    tags: ["prodigy", "life", "nerf", "introspection"]
  },
  4: {
    title: "काग़ज़ और दर्द",
    body: "सालों को गिनना भूल गया,\nउनका पता-सा भूल गया,\nशायद मैं लिखना भूल गया,\nअब भी काग़ज़ सामने है,\nबस दर्द को लिखना भूल गया...",
    type: "QUOTE",
    language: "hi",
    categories: ["writing-and-creativity", "emotional-struggle"],
    tags: ["kavita", "dard", "shayari", "lekhak"]
  },
  5: {
    title: "लफ़्ज़",
    body: "चाहा था इक दफ़ा उसे अपना नाम दें,\nलफ़्ज़ होंठों तक आए, मगर ठहर न सके...",
    type: "QUOTE",
    language: "hi",
    categories: ["love-and-relationships", "farewell-and-separation"],
    tags: ["naam", "lafz", "woh", "mohityenugwar"]
  },
  7: {
    title: "स्याही और पन्ने",
    body: "मैंने लिखा \"हम फिर अजनबी हो गये\"\nऔर कलम की नोक टूट गई...\nस्याही फैली है पन्ने पर इस कदर,\nकि वो मुझे फिर से सौंप गई...\nमैं कहता रहा यही बस वस्ल-ए-यार...",
    type: "QUOTE",
    language: "hi",
    categories: ["writing-and-creativity", "farewell-and-separation"],
    tags: ["ajnabi", "qalam", "kavita", "judaai"]
  },
  8: {
    title: "आखिरी सफ़र",
    body: "मुझे मरने का इतना शौक है\nकि इक रोज़\nतेज़ गाड़ी के सामने आऊँगा\nऔर ठहर जाऊँगा...\nशायद वो भी\nमेरी तरह थकी होगी;\nआखिरी सफ़र पर...",
    type: "POEM",
    language: "hi",
    categories: ["human-nature-and-philosophy", "emotional-struggle"],
    tags: ["maut", "safar", "zindagi", "thakan"]
  },
  10: {
    title: "गीत और अँधेरा",
    body: "दिल नहीं करता अब तुझ पे कोई गीत गाने को।\nमेरी आँखें घिरी हुई हैं दुष्कर हालातों से,\nकौन आएगा अब अँधेरे के दीप जलाने को?\nएक उम्मीद का धागा भी धीरे से खो दिया;\nबस एक आखिरी बार गले लगाने को।\nअब तो आदत-सी है टूट जाने की मोहित,\nकौन रोकेगा तुझे यूँ बिखर जाने को?",
    type: "POEM",
    language: "hi",
    categories: ["emotional-struggle", "farewell-and-separation"],
    tags: ["geet", "andhera", "bikharna", "tootna"]
  },
  12: {
    title: "हालात",
    body: "ऐसे दिनों,\nकिन्हीं हालातों में\nजब मैं बिखर जाता हूँ\nमैं तुमसे प्यार करता हूँ।",
    type: "QUOTE",
    language: "hi",
    categories: ["love-and-relationships", "longing-and-waiting"],
    tags: ["pyaar", "din", "tum", "dilse"]
  },
  13: {
    title: "रात",
    body: "रात नहीं है यह\nसच को छुपाने की,\nदूर, निर्वाक चाँद से\nनज़रें चुराने की।\nरात नहीं है यह\nदिल दुखाने की,\nतेरे आकर\nयूँ ही लौट जाने की।\nरात नहीं है यह\nसपनों के बह जाने की...",
    type: "POEM",
    language: "hi",
    categories: ["memory-and-presence", "longing-and-waiting"],
    tags: ["raat", "chaand", "sapne", "intezaar"]
  },
  14: {
    title: "इतना भी दिखावा ठीक नहीं",
    body: "इतना भी दिखावा ठीक नहीं\nरोने को हो तुम--चेहरे पर ये हँसी का मुखौटा ठीक नहीं।\nदुःख-दर्द भी हिस्से हैं ज़िंदगी के,\nउन्हें मन में यूँ दबाना ठीक नहीं।\nतुम सोचती होगी--लिखता है कुछ,\nहाँ, शायद मुझे ही जैसा कुछ,\nफिर तुम्हारा ये अकड़ दिखाना ठीक नहीं।\nमैं भी सोया नहीं, तुम भी खोई-सी रहती हो,\nयूँ किसी की नींद चुराना ठीक नहीं।\nमोहब्बत है तो कह दो साफ़-साफ़,\nयूँ छुप-छुपकर स्टॉक करना ठीक नहीं।\nइश्क़ होते हुए महबूब से किनारा करके,\nयूँ दिल को दुखाना ठीक नहीं।",
    type: "POEM",
    language: "hi",
    categories: ["relationships-and-emotions", "love-and-relationships"],
    tags: ["dikhawa", "mukhota", "mohabbat", "ishq"]
  },
  15: {
    title: "समझौता",
    body: "समझौता कर लेते हैं\nदो प्यारी बातें आज फिर कर लेते हैं।\nतुम भी खुश नहीं, मैं भी उदास हूँ,\nआज फिर एक मुलाक़ात तय कर लेते हैं।",
    type: "QUOTE",
    language: "hi",
    categories: ["relationships-and-emotions", "love-and-relationships"],
    tags: ["samjhauta", "mulaqaat", "baatein", "pyaar"]
  },
  19: {
    title: "तेरी दुनिया आबाद हो",
    body: "मैं नहीं चाहता तुझे किसी से कोई फ़रियाद हो,\nचाहे मैं बर्बाद हो जाऊँ, तेरी दुनिया मगर आबाद हो...",
    type: "QUOTE",
    language: "hi",
    categories: ["relationships-and-emotions", "farewell-and-separation"],
    tags: ["fariyaad", "barbaad", "aabaad", "shayari"]
  },
  198: {
    title: "सुकून",
    body: "ना जाने ये जान कर कितना सुकून पहुंचे,\nकी उसके बाद तबाह हो गया हूं मैं...",
    type: "QUOTE",
    language: "hi",
    categories: ["emotional-struggle", "farewell-and-separation"],
    tags: ["sukoon", "tabah", "heartbreak", "pain"]
  }
};

// Map keywords/tags to canonical collection slugs
function inferCategories(text, tags) {
  const t = (text + " " + tags.join(" ")).toLowerCase();
  const cats = new Set();

  if (/love|pyaar|ishq|mohabbat|dil|mehboob|heart|tum|ter[aei]|crush|preface/i.test(t)) {
    cats.add("love-and-relationships");
  }
  if (/separation|alvida|judaai|door|chhod|farewell|khona|bichhad/i.test(t)) {
    cats.add("farewell-and-separation");
  }
  if (/pain|dard|toot|bikh|aansu|tears|ruin|tabah|wound|hurt|gham|chot/i.test(t)) {
    cats.add("emotional-struggle");
  }
  if (/memory|yaad|beete|lamhe|remembrance|past|nostalgia/i.test(t)) {
    cats.add("memory-and-presence");
  }
  if (/write|kalam|syahi|words|poem|shayari|poetry|lekhak|kagaz|books|art|read/i.test(t)) {
    cats.add("writing-and-creativity");
  }
  if (/who am i|identity|myself|prodigy|swayam|ahem|soul|revisions/i.test(t)) {
    cats.add("identity-and-self-reflection");
  }
  if (/change|grow|safar|badal|become|journey|waqt|time|future/i.test(t)) {
    cats.add("change-and-growth");
  }
  if (/wait|intezaar|longing|raat|chaand|tadap|taras/i.test(t)) {
    cats.add("longing-and-waiting");
  }
  if (/choice|decision|decision|faisla|chuna|path|koshish/i.test(t)) {
    cats.add("choices-and-consequences");
  }

  if (cats.size === 0) {
    cats.add("identity-and-self-reflection");
  }
  return Array.from(cats);
}

function cleanOCR(ocr) {
  const lines = ocr.split("\n");
  const filtered = [];

  for (let l of lines) {
    let t = l.trim();
    if (!t) continue;

    // Check for author attribution signature
    if (/^[-—~]\s*Mohit\s*Yenugwar/i.test(t) || /^Mohit\s*Yenugwar$/i.test(t)) {
      break;
    }

    // Skip print headers & browser noise
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(t) && /YourQuote/i.test(t)) continue;
    if (/https?:\/\//i.test(t)) continue;
    if (/\b\d+\/207\b/.test(t)) continue;
    if (/Search people & hashtags/i.test(t)) continue;
    if (/Write your own quotes/i.test(t)) continue;
    if (/Open App/i.test(t)) continue;
    if (/Add your comment/i.test(t)) continue;
    if (/^\d+\s*likes?/i.test(t)) continue;
    if (/^Your@?uote(\.in)?$/i.test(t)) continue;
    if (/^HomeExploreBookstore/i.test(t)) continue;
    if (/^Follow\b/i.test(t)) continue;
    if (/^\d+\s*Followers/i.test(t)) continue;
    if (/^Joined\s+\d+/i.test(t)) continue;
    if (/^Quotes\s+\d+/i.test(t)) continue;
    if (/^Testimonials\s+\d+/i.test(t)) continue;
    if (/^(Ayush|A yush|401 yush|C yush)/i.test(t)) continue;
    if (/^[©® छि छ ° \(\)e]\s*$/i.test(t)) continue;
    if (/^#\S+/i.test(t)) continue; // hashtag lines

    filtered.push(t);
  }

  // Strip leading short junk (floating background seeds, single letters)
  while (filtered.length > 0 && filtered[0].length <= 3 && !/[\u0900-\u097F]/.test(filtered[0])) {
    filtered.shift();
  }

  return filtered.join("\n").trim();
}

function extractMetadata(content) {
  const dateMatch = content.match(/\*\*Visible post date:\*\*\s*(.*)/);
  const dateStr = dateMatch && dateMatch[1].trim() ? dateMatch[1].trim() : null;

  const tagMatches = content.match(/#[a-zA-Z0-9_\u0900-\u097F]+/g) || [];
  const cleanTags = Array.from(new Set(tagMatches.map(t => t.replace(/^#/, "").toLowerCase())))
    .filter(t => !["yourquote", "yqbaba", "yqdidi", "yourquotedidi", "yourquotebaba", "yqenglish", "yqhindi", "yqpoetry", "yqshayari", "yqkavita", "yqpost"].includes(t));

  const likesMatch = content.match(/(\d+)\s*likes?/i);
  const likes = likesMatch ? parseInt(likesMatch[1], 10) : 0;

  return { dateStr, tags: cleanTags, likes };
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Examples: "24 AUG AT 22:08", "29 OCT 2025 AT 23:32", "9 APR 2024 AT 20:10"
  const months = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  const parts = dateStr.toUpperCase().split(/\s+/);
  const day = parseInt(parts[0], 10);
  const month = months[parts[1]];

  let year = 2024; // Default baseline for post year
  for (let i = 2; i < parts.length; i++) {
    if (/^\d{4}$/.test(parts[i])) {
      year = parseInt(parts[i], 10);
    }
  }

  if (!isNaN(day) && month !== undefined) {
    const d = new Date(Date.UTC(year, month, day));
    return d.toISOString().split("T")[0];
  }
  return null;
}

function generateSlug(text, pageNum, language) {
  if (language === "en") {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join("-");
    if (words.length >= 3) {
      return `${words}-p${pageNum}`;
    }
  }
  return `yq-work-p${String(pageNum).padStart(3, "0")}`;
}

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 150));
  return `${minutes} min read`;
}

// ─── Main Execution ──────────────────────────────────────────────────────────

const quotes = [];
const stories = [];
const duplicateMap = new Map();
const duplicates = [];
const invalidRecords = [];

for (let i = 1; i <= 207; i++) {
  const p = String(i).padStart(3, "0");
  const file = `page_${p}.md`;
  const filePath = path.join(TEXT_DIR, file);

  if (i === 1) {
    invalidRecords.push({ page: i, file, reason: "Profile Header Page (not a literary work)" });
    continue;
  }
  if (i === 207) {
    invalidRecords.push({ page: i, file, reason: "Document Footer Page (no content)" });
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const meta = extractMetadata(content);

  let body = "";
  let title = null;
  let type = "QUOTE";
  let language = "en";
  let categories = [];
  let tags = meta.tags;

  if (VERIFIED_PAGE_TRANSCRIPTIONS[i]) {
    const v = VERIFIED_PAGE_TRANSCRIPTIONS[i];
    body = v.body;
    title = v.title;
    type = v.type;
    language = v.language;
    categories = v.categories;
    tags = Array.from(new Set([...tags, ...(v.tags || [])]));
  } else {
    const ocrParts = content.split("```text");
    const ocr = ocrParts.length > 1 ? ocrParts[1].split("```")[0].trim() : "";
    body = cleanOCR(ocr);
    language = /[\u0900-\u097F]/.test(body) ? "hi" : "en";

    const lines = body.split("\n").filter(Boolean);
    if (lines.length >= 7 || body.length > 250) {
      type = "POEM";
    } else {
      type = "QUOTE";
    }
    categories = inferCategories(body, tags);
  }

  if (!body || body.trim().length === 0) {
    invalidRecords.push({ page: i, file, reason: "Empty text after OCR filtering" });
    continue;
  }

  // Check duplicate
  const norm = body.replace(/\s+/g, " ").trim().toLowerCase();
  if (duplicateMap.has(norm)) {
    duplicates.push({ page: i, originalPage: duplicateMap.get(norm), text: body.slice(0, 50) });
    // Still retain with unique id/slug as author posted on multiple dates
  } else {
    duplicateMap.set(norm, i);
  }

  const slug = generateSlug(body, i, language);
  const originalDate = parseDate(meta.dateStr);

  const record = {
    id: `yq-p${String(i).padStart(3, "0")}`,
    pageNumber: i,
    sourceFile: file,
    imageFile: `page_${String(i).padStart(3, "0")}.jpg`,
    title,
    body,
    contentType: type,
    language,
    author: "Mohit Kaushik Yenugwar",
    sourcePlatform: "YOURQUOTE",
    sourceUrl: "https://www.yourquote.in/mohit-yenugwar-v0m/quotes",
    originalDate,
    visibleDate: meta.dateStr,
    likes: meta.likes,
    categories,
    tags,
    slug,
    readingTime: type === "POEM" || type === "STORY" ? estimateReadingTime(body) : undefined,
    charCount: body.length,
    lineCount: body.split("\n").filter(Boolean).length
  };

  if (type === "QUOTE" || type === "APHORISM") {
    quotes.push(record);
  } else {
    stories.push(record);
  }
}

// Ensure output directories exist
fs.mkdirSync(QUOTES_DIR, { recursive: true });
fs.mkdirSync(STORIES_DIR, { recursive: true });

// Write individual files and master JSONs
fs.writeFileSync(path.join(QUOTES_DIR, "quotes.json"), JSON.stringify(quotes, null, 2), "utf8");
fs.writeFileSync(path.join(STORIES_DIR, "stories.json"), JSON.stringify(stories, null, 2), "utf8");

for (const q of quotes) {
  fs.writeFileSync(path.join(QUOTES_DIR, `${q.id}.json`), JSON.stringify(q, null, 2), "utf8");
}
for (const s of stories) {
  fs.writeFileSync(path.join(STORIES_DIR, `${s.id}.json`), JSON.stringify(s, null, 2), "utf8");
}

// Generate typed index.ts for src/lib/quotes and src/lib/stories
const quotesIndexTs = `// Authoritative Single Source of Truth for Mohit Kaushik Yenugwar's Quotes
import quotesData from "./quotes.json";

export interface QuoteRecord {
  id: string;
  pageNumber: number;
  sourceFile: string;
  imageFile: string;
  title: string | null;
  body: string;
  contentType: "QUOTE" | "APHORISM";
  language: string;
  author: string;
  sourcePlatform: string;
  sourceUrl: string;
  originalDate: string | null;
  visibleDate: string | null;
  likes: number;
  categories: string[];
  tags: string[];
  slug: string;
  charCount: number;
  lineCount: number;
}

export const QUOTES: QuoteRecord[] = quotesData as QuoteRecord[];

export function getQuoteById(id: string): QuoteRecord | undefined {
  return QUOTES.find((q) => q.id === id);
}

export function getQuoteBySlug(slug: string): QuoteRecord | undefined {
  return QUOTES.find((q) => q.slug === slug);
}

export function getQuotesByCategory(category: string): QuoteRecord[] {
  return QUOTES.filter((q) => q.categories.includes(category));
}
`;
fs.writeFileSync(path.join(QUOTES_DIR, "index.ts"), quotesIndexTs, "utf8");

const storiesIndexTs = `// Authoritative Single Source of Truth for Mohit Kaushik Yenugwar's Stories and Poems
import storiesData from "./stories.json";

export interface StoryRecord {
  id: string;
  pageNumber: number;
  sourceFile: string;
  imageFile: string;
  title: string | null;
  body: string;
  contentType: "POEM" | "STORY" | "REFLECTION" | "SHORT_PIECE";
  language: string;
  author: string;
  sourcePlatform: string;
  sourceUrl: string;
  originalDate: string | null;
  visibleDate: string | null;
  likes: number;
  categories: string[];
  tags: string[];
  slug: string;
  readingTime?: string;
  charCount: number;
  lineCount: number;
}

export const STORIES: StoryRecord[] = storiesData as StoryRecord[];

export function getStoryById(id: string): StoryRecord | undefined {
  return STORIES.find((s) => s.id === id);
}

export function getStoryBySlug(slug: string): StoryRecord | undefined {
  return STORIES.find((s) => s.slug === slug);
}

export function getStoriesByCategory(category: string): StoryRecord[] {
  return STORIES.filter((s) => s.categories.includes(category));
}
`;
fs.writeFileSync(path.join(STORIES_DIR, "index.ts"), storiesIndexTs, "utf8");

console.log("================ MIGRATION AND EXTRACTION SUMMARY ================");
console.log(`Total Source Files Analyzed: 207`);
console.log(`Valid Quotes Extracted & Saved to src/lib/quotes: ${quotes.length}`);
console.log(`Valid Stories/Poems Extracted & Saved to src/lib/stories: ${stories.length}`);
console.log(`Total Valid Works: ${quotes.length + stories.length}`);
console.log(`Duplicates Detected: ${duplicates.length}`);
console.log(`Invalid / Skipped Records: ${invalidRecords.length} (Pages: ${invalidRecords.map(r => r.page).join(", ")})`);
console.log(`Quotes Directory: ${QUOTES_DIR}`);
console.log(`Stories Directory: ${STORIES_DIR}`);
console.log("==================================================================");
