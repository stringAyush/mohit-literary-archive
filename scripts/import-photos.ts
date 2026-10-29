import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "../src/lib/db";

// Helper to extract PNG width and height without heavy external dependencies
function getPngDimensions(buffer: Buffer) {
  if (buffer.length > 24 && buffer.toString("ascii", 12, 16) === "IHDR") {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  return { width: 950, height: 630 };
}

type PhotoSeedDefinition = {
  slug: string;
  title: string;
  caption: string;
  bookTitle?: string;
  bookAuthor?: string;
  publisher?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  sortOrder: number;
  files: {
    sourceFile: string;
    targetName: string;
    altText: string;
    caption?: string;
  }[];
};

const SEED_POSTS: PhotoSeedDefinition[] = [
  {
    slug: "norwegian-wood-haruki-murakami",
    title: "Norwegian Wood in Stillness",
    caption: "Marked pages and quiet afternoon light with Haruki Murakami's timeless novel of memory, music, and melancholy.",
    bookTitle: "Norwegian Wood",
    bookAuthor: "Haruki Murakami",
    publisher: "Vintage",
    category: "Currently Reading",
    tags: ["Murakami", "Japanese Literature", "Annotated Pages", "Reading Notes"],
    featured: true,
    sortOrder: 1,
    files: [
      {
        sourceFile: "Pasted image (2).png",
        targetName: "norwegian-wood-haruki-murakami.png",
        altText: "Haruki Murakami's Norwegian Wood Vintage edition with sunglasses and colorful tab markers resting on stone",
        caption: "Sunglasses resting across the red and white cover with colorful page flags marking evocative lines.",
      },
    ],
  },
  {
    slug: "khaled-hosseini-box-set",
    title: "The Complete Khaled Hosseini Collection",
    caption: "Golden hour sunset catching the spines of The Kite Runner, A Thousand Splendid Suns, and And the Mountains Echoed.",
    bookTitle: "The Complete Khaled Hosseini Box Set",
    bookAuthor: "Khaled Hosseini",
    publisher: "Bloomsbury India",
    category: "Book Collections",
    tags: ["Khaled Hosseini", "Box Set", "Golden Hour", "Contemporary Classics"],
    featured: true,
    sortOrder: 2,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-37-16.png",
        targetName: "khaled-hosseini-box-set.png",
        altText: "Khaled Hosseini three-book box set resting diagonally on a dark rock in warm evening sunlight",
        caption: "Three masterworks of Afghan heart and history resting on natural stone at dusk.",
      },
    ],
  },
  {
    slug: "empire-of-the-moghul-chronicles",
    title: "Chronicles of the Moghul Empire",
    caption: "Alex Rutherford's sweeping historical saga captured under dramatic nocturnal lighting and macro detail.",
    bookTitle: "Empire of the Moghul Series",
    bookAuthor: "Alex Rutherford",
    publisher: "Headline Review",
    category: "Book Collections",
    tags: ["Historical Fiction", "Moghul Empire", "Book Stack", "Night Photography"],
    featured: true,
    sortOrder: 3,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-36-13.png",
        targetName: "empire-of-the-moghul-trilogy.png",
        altText: "Alex Rutherford's Empire of the Moghul trilogy books arranged on a concrete ledge at night with bokeh lights",
        caption: "Raiders from the North, Brothers at War, and Traitors in the Shadows against the deep night sky.",
      },
      {
        sourceFile: "Screenshot From 2026-10-30 00-35-40.png",
        targetName: "empire-of-the-moghul-traitors-in-the-shadows.png",
        altText: "Macro closeup of intricate embossed gold lettering and artwork on Empire of the Moghul book cover",
        caption: "Intricate gilded cover artwork and embossed typography in closeup perspective.",
      },
    ],
  },
  {
    slug: "unfinished-portrait-agatha-christie",
    title: "Unfinished Portrait in the Grove",
    caption: "A rare Mary Westmacott edition of Agatha Christie's semi-autobiographical novel resting among rugged tree bark.",
    bookTitle: "Unfinished Portrait",
    bookAuthor: "Agatha Christie (Mary Westmacott)",
    publisher: "HarperCollins",
    category: "Book Covers",
    tags: ["Agatha Christie", "Mary Westmacott", "Nature Reading", "Yellow Cover"],
    featured: true,
    sortOrder: 4,
    files: [
      {
        sourceFile: "Pasted image.png",
        targetName: "unfinished-portrait-agatha-christie.png",
        altText: "Bright yellow cover of Agatha Christie's Unfinished Portrait wedged gently between two tree trunks",
        caption: "Vivid yellow cover framed naturally by tree bark and soft foliage.",
      },
    ],
  },
  {
    slug: "the-book-thief-markus-zusak",
    title: "The Book Thief on Cobalt Stone",
    caption: "Markus Zusak's poignant masterpiece framed against deep azure blue and dark textured rock.",
    bookTitle: "The Book Thief",
    bookAuthor: "Markus Zusak",
    publisher: "Black Swan / Transworld",
    category: "Book Covers",
    tags: ["Markus Zusak", "Historical Fiction", "Color Contrast", "Dramatic Setting"],
    featured: false,
    sortOrder: 5,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-36-59.png",
        targetName: "the-book-thief-markus-zusak.png",
        altText: "Markus Zusak's The Book Thief paperback standing upright against a textured cobalt blue painted pillar",
        caption: "Contrasting the fiery cover palette against an electric blue stone backdrop.",
      },
    ],
  },
  {
    slug: "sense-and-sensibility-jane-austen",
    title: "Austen Beside Iron and Bolt",
    caption: "Jane Austen's classic tale of heart and restraint placed against an industrial crimson iron backdrop.",
    bookTitle: "Sense and Sensibility",
    bookAuthor: "Jane Austen",
    publisher: "Classics Library",
    category: "Reading Setups",
    tags: ["Jane Austen", "Classics", "Industrial Aesthetic", "Paperback"],
    featured: false,
    sortOrder: 6,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-36-26.png",
        targetName: "sense-and-sensibility-jane-austen.png",
        altText: "Jane Austen's Sense and Sensibility paperback resting against textured red ironwork with a prominent bolt",
        caption: "Juxtaposing classic 19th-century romance with rugged red metal and hardware.",
      },
    ],
  },
  {
    slug: "dilli-durbar-satya-vyas",
    title: "Dilli Durbar Over the Keys",
    caption: "Satya Vyas's energetic Hindi contemporary novel resting on a laptop workspace ready for an evening reading break.",
    bookTitle: "दिल्ली दरबार (Dilli Durbar)",
    bookAuthor: "सत्य व्यास (Satya Vyas)",
    publisher: "Hind Yugm",
    category: "Reading Setups",
    tags: ["Hindi Literature", "Satya Vyas", "Modern Fiction", "Reading Desk"],
    featured: false,
    sortOrder: 7,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-35-53.png",
        targetName: "dilli-durbar-satya-vyas.png",
        altText: "Hindi paperback Dilli Durbar by Satya Vyas resting against an open laptop keyboard",
        caption: "Vibrant cover art depicting Delhi metro and kites resting over keyboard keys.",
      },
    ],
  },
  {
    slug: "the-girl-in-the-spiders-web",
    title: "Millennium Series in Mirror",
    caption: "David Lagercrantz's continuation of Stieg Larsson's Millennium saga reflected in sleek dark lacquer.",
    bookTitle: "The Girl in the Spider's Web",
    bookAuthor: "David Lagercrantz",
    publisher: "Maclehose Quercus",
    category: "Literary Details",
    tags: ["Thriller", "Millennium Series", "Reflections", "Minimalist"],
    featured: false,
    sortOrder: 8,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-35-35.png",
        targetName: "the-girl-in-the-spiders-web-david-lagercrantz.png",
        altText: "Yellow and black book spine of The Girl in the Spider's Web reflected on a glossy dark surface",
        caption: "Minimalist yellow spine reflecting sharp geometric symmetry on a black mirror plane.",
      },
    ],
  },
  {
    slug: "safe-haven-nicholas-sparks",
    title: "Safe Haven in Green Solitude",
    caption: "Nicholas Sparks' tender romance novel nestled softly into fresh emerald green lawn grass.",
    bookTitle: "Safe Haven",
    bookAuthor: "Nicholas Sparks",
    publisher: "Sphere",
    category: "Reading Setups",
    tags: ["Nicholas Sparks", "Lawn Reading", "Outdoor", "Romance"],
    featured: false,
    sortOrder: 9,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-36-42.png",
        targetName: "safe-haven-nicholas-sparks.png",
        altText: "Nicholas Sparks' Safe Haven paperback lying peacefully on lush trimmed green grass",
        caption: "A serene outdoor reading session surrounded by fresh green turf.",
      },
    ],
  },
  {
    slug: "love-affairs-for-grown-ups",
    title: "Love Affairs for Grown-ups",
    caption: "Debby Holt's witty, lighthearted novel captured in a minimalist, bright aesthetic.",
    bookTitle: "Love Affairs for Grown-ups",
    bookAuthor: "Debby Holt",
    publisher: "Pocket Books",
    category: "Book Covers",
    tags: ["Debby Holt", "Contemporary Fiction", "Pastel Aesthetic"],
    featured: false,
    sortOrder: 10,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-35-06.png",
        targetName: "love-affairs-for-grown-ups-debby-holt.png",
        altText: "Debby Holt's novel Love Affairs for Grown-ups on a clean white surface with artistic car illustration",
        caption: "Clean high-key composition emphasizing playful cover illustration and typography.",
      },
    ],
  },
  {
    slug: "reckless-sidney-sheldon-tilly-bagshawe",
    title: "Reckless Angles",
    caption: "Dramatic angled perspective highlighting the rich teal background and crimson accents of Tilly Bagshawe's thriller.",
    bookTitle: "Sidney Sheldon's Reckless",
    bookAuthor: "Sidney Sheldon & Tilly Bagshawe",
    publisher: "HarperCollins",
    category: "Book Covers",
    tags: ["Thriller", "Sidney Sheldon", "Dramatic Angle", "Teal and Red"],
    featured: false,
    sortOrder: 11,
    files: [
      {
        sourceFile: "Screenshot From 2026-10-30 00-35-28.png",
        targetName: "reckless-sidney-sheldon-tilly-bagshawe.png",
        altText: "Angled macro perspective of Sidney Sheldon's Reckless cover showing embossed title and cloaked silhouette",
        caption: "Dynamic perspective highlighting typographic relief and moody cinematic lighting.",
      },
    ],
  },
];

async function main() {
  const photosDir = path.resolve(process.cwd(), "Photos");
  const publicDir = path.resolve(process.cwd(), "public", "photos");

  console.log("=== Bookstagram Photography Importer ===");
  console.log(`Source directory: ${photosDir}`);
  console.log(`Public target directory: ${publicDir}`);

  if (!fs.existsSync(photosDir)) {
    throw new Error(`Photos directory not found at ${photosDir}`);
  }
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const discoveredFiles = fs.readdirSync(photosDir);
  console.log(`Discovered ${discoveredFiles.length} files in ${photosDir}`);

  let importedCount = 0;
  let skippedCount = 0;
  const inventory: Array<{
    postTitle: string;
    bookTitle?: string;
    sourceFile: string;
    targetUrl: string;
    dimensions: string;
    fileSize: number;
    hash: string;
    status: "created" | "updated" | "skipped";
  }> = [];

  for (const postDef of SEED_POSTS) {
    console.log(`\nProcessing post: "${postDef.title}" (${postDef.slug})`);

    const imageRecords = [];

    for (let i = 0; i < postDef.files.length; i++) {
      const fileDef = postDef.files[i];
      const srcPath = path.join(photosDir, fileDef.sourceFile);
      const destPath = path.join(publicDir, fileDef.targetName);

      if (!fs.existsSync(srcPath)) {
        console.warn(`Warning: Source file ${fileDef.sourceFile} does not exist. Skipping.`);
        continue;
      }

      const buffer = fs.readFileSync(srcPath);
      const stat = fs.statSync(srcPath);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      const dims = getPngDimensions(buffer);

      // Ensure copied into public/photos
      fs.copyFileSync(srcPath, destPath);

      const targetUrl = `/photos/${fileDef.targetName}`;
      imageRecords.push({
        url: targetUrl,
        altText: fileDef.altText,
        caption: fileDef.caption,
        width: dims.width,
        height: dims.height,
        fileSize: stat.size,
        hash,
        sortOrder: i,
      });

      inventory.push({
        postTitle: postDef.title,
        bookTitle: postDef.bookTitle,
        sourceFile: fileDef.sourceFile,
        targetUrl,
        dimensions: `${dims.width}x${dims.height}`,
        fileSize: stat.size,
        hash: hash.slice(0, 10),
        status: "created",
      });
    }

    if (imageRecords.length === 0) {
      console.warn(`No valid images found for post ${postDef.slug}. Skipping.`);
      skippedCount++;
      continue;
    }

    // Upsert post to ensure idempotence
    const existingPost = await db.photoPost.findUnique({
      where: { slug: postDef.slug },
      include: { images: true },
    });

    if (existingPost) {
      console.log(`Post ${postDef.slug} exists. Updating images and metadata...`);
      await db.photoPost.update({
        where: { id: existingPost.id },
        data: {
          title: postDef.title,
          caption: postDef.caption,
          bookTitle: postDef.bookTitle,
          bookAuthor: postDef.bookAuthor,
          publisher: postDef.publisher,
          category: postDef.category,
          tags: postDef.tags,
          featured: postDef.featured ?? false,
          sortOrder: postDef.sortOrder,
          isPublished: true,
        },
      });

      // Update image records
      await db.photoImage.deleteMany({ where: { postId: existingPost.id } });
      await db.photoImage.createMany({
        data: imageRecords.map((img) => ({
          ...img,
          postId: existingPost.id,
        })),
      });

      importedCount++;
    } else {
      console.log(`Creating new post ${postDef.slug}...`);
      await db.photoPost.create({
        data: {
          slug: postDef.slug,
          title: postDef.title,
          caption: postDef.caption,
          bookTitle: postDef.bookTitle,
          bookAuthor: postDef.bookAuthor,
          publisher: postDef.publisher,
          category: postDef.category,
          tags: postDef.tags,
          featured: postDef.featured ?? false,
          sortOrder: postDef.sortOrder,
          isPublished: true,
          images: {
            create: imageRecords,
          },
        },
      });
      importedCount++;
    }
  }

  console.log("\n==========================================");
  console.log("IMPORT COMPLETE SUMMARY:");
  console.log(`Total photos discovered: ${discoveredFiles.length}`);
  console.log(`Total posts processed: ${importedCount}`);
  console.log(`Total images imported to public/photos: ${inventory.length}`);
  console.log(`Total skipped: ${skippedCount}`);
  console.log("==========================================");
  console.log("\nImage Inventory:");
  console.table(inventory);
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
