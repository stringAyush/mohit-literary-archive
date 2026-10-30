import fs from "node:fs";

const quotes = JSON.parse(fs.readFileSync("/home/phoenix/Downloads/mohit-literary-archive/src/lib/quotes/quotes.json", "utf8"));
const stories = JSON.parse(fs.readFileSync("/home/phoenix/Downloads/mohit-literary-archive/src/lib/stories/stories.json", "utf8"));

const allWorks = [...quotes, ...stories];

const collections = [
  {
    slug: "identity-and-self-reflection",
    name: "Identity & Self-Reflection",
    description: "Writing that turns inward to examine identity, choices, and becoming.",
    status: "active"
  },
  {
    slug: "choices-and-consequences",
    name: "Choices & Consequences",
    description: "Work about decisions, silence, and the paths people shape.",
    status: "active"
  },
  {
    slug: "emotional-struggle",
    name: "Emotional Struggle",
    description: "Writing that gives language to difficult or conflicting feelings.",
    status: "active"
  },
  {
    slug: "love-and-relationships",
    name: "Love & Relationships",
    description: "Work about attachment, closeness, love, and relationships.",
    status: "active"
  },
  {
    slug: "memory-and-presence",
    name: "Memory & Presence",
    description: "Writing about absence, remembrance, and the presence people leave behind.",
    status: "active"
  },
  {
    slug: "writing-and-creativity",
    name: "Writing & Creativity",
    description: "Reflections on writing, books, expression, and the creative process.",
    status: "active"
  },
  {
    slug: "farewell-and-separation",
    name: "Farewell & Separation",
    description: "Work about parting, endings, and letting go.",
    status: "active"
  },
  {
    slug: "longing-and-waiting",
    name: "Longing & Waiting",
    description: "Writing shaped by anticipation, distance, and longing.",
    status: "active"
  },
  {
    slug: "change-and-growth",
    name: "Change & Growth",
    description: "Work about transformation and becoming someone new.",
    status: "active"
  },
  {
    slug: "human-nature-and-philosophy",
    name: "Human Nature & Philosophy",
    description: "Reflections on existence, society, time, reality, and life.",
    status: "active"
  },
  {
    slug: "personal-and-emotional-experiences",
    name: "Personal & Emotional Experiences",
    description: "Writing that touches on loneliness, pain, hope, and acceptance.",
    status: "active"
  },
  {
    slug: "relationships-and-emotions",
    name: "Relationships & Emotions",
    description: "Pieces exploring intimacy, heart, connection, and vulnerability.",
    status: "active"
  },
  {
    slug: "identity-and-introspection",
    name: "Identity & Introspection",
    description: "Probing self-discovery, quiet conflict, and authenticity.",
    status: "active"
  },
  {
    slug: "literature-and-creativity",
    name: "Literature & Creativity",
    description: "Reflections on the written word, craft, and art.",
    status: "active"
  }
];

fs.writeFileSync("/home/phoenix/Downloads/mohit-literary-archive/content/collections.json", JSON.stringify(collections, null, 2), "utf8");

const catalogWorks = allWorks.map((w) => {
  return {
    id: w.id,
    slug: w.slug,
    title: w.title,
    content_type: w.contentType.toLowerCase(),
    language: w.language,
    author: "Mohit Kaushik Yenugwar",
    source_author_display: "Mohit Yenugwar",
    source_platform: "yourquote",
    source_url: "https://www.yourquote.in/mohit-yenugwar-v0m/quotes",
    original_publication_date: w.originalDate,
    source_metadata_status: "verified",
    text_status: "full_text",
    excerpt: w.body.split("\n").slice(0, 3).join("\n"),
    full_text: w.body,
    categories: w.categories.filter(c => collections.some(col => col.slug === c)),
    tags: w.tags,
    rights_status: "author_submitted",
    verification_status: "verified",
    publication_status: "published",
    notes: `Page ${w.pageNumber} from 207-page YourQuote profile archive. Visible date: ${w.visibleDate || "unknown"}. Likes: ${w.likes || 0}.`
  };
});

fs.writeFileSync("/home/phoenix/Downloads/mohit-literary-archive/content/works.json", JSON.stringify(catalogWorks, null, 2), "utf8");

console.log(`Generated content/collections.json with ${collections.length} collections.`);
console.log(`Generated content/works.json with ${catalogWorks.length} authentic works.`);
