import { db } from "@/lib/db";

export type HomepageConfig = {
  heroHeadline: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaHref: string;
  heroSecondaryText: string;
  heroSecondaryHref: string;
  showHeroBadge: boolean;
  heroBadgeText: string;

  showContentsCard: boolean;
  contentsCardTitle: string;
  contentsCardBadge: string;

  marqueeEnabled: boolean;
  marqueeItems: string[];

  showFeaturedWork: boolean;
  featuredSectionTitle: string;
  featuredWorkId?: string;

  showRecentWorks: boolean;
  recentWorksTitle: string;
  recentWorksCount: number;

  showCollections: boolean;
  collectionsTitle: string;
  collectionsCount: number;

  showPhotography: boolean;
  photographyEyebrow: string;
  photographyTitle: string;
  photographySubtitle: string;
  photographyCount: number;

  showAuthorNote: boolean;
  authorNoteEyebrow: string;
  authorNoteTitle: string;
  authorNoteCustomText?: string;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  heroHeadline: "Some things are better left in words.",
  heroSubtitle: "An evolving collection of thoughts, poems, fragments, and observations.",
  heroCtaText: "Enter the archive",
  heroCtaHref: "/works",
  heroSecondaryText: "About the writer",
  heroSecondaryHref: "/about",
  showHeroBadge: false,
  heroBadgeText: "",

  showContentsCard: true,
  contentsCardTitle: "Contents",
  contentsCardBadge: "Archive Index",

  marqueeEnabled: true,
  marqueeItems: [
    "Poetry & Ghazals",
    "Micro-Fiction & Stories",
    "Reflections & Prose",
    "Book Photography",
    "Literary Monograph",
  ],

  showFeaturedWork: true,
  featuredSectionTitle: "Featured Piece",

  showRecentWorks: true,
  recentWorksTitle: "Recently written",
  recentWorksCount: 6,

  showCollections: true,
  collectionsTitle: "Explore by feeling",
  collectionsCount: 6,

  showPhotography: true,
  photographyEyebrow: "Through the reader's lens",
  photographyTitle: "Book Photography",
  photographySubtitle: "Book covers, natural light reading setups, and quiet moments between pages.",
  photographyCount: 6,

  showAuthorNote: true,
  authorNoteEyebrow: "Author Note",
  authorNoteTitle: "Behind the words",
  authorNoteCustomText: "",
};

export async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: "homepage_config" },
    });
    if (!setting) return DEFAULT_HOMEPAGE_CONFIG;
    const parsed = JSON.parse(setting.value);
    return { ...DEFAULT_HOMEPAGE_CONFIG, ...parsed };
  } catch {
    return DEFAULT_HOMEPAGE_CONFIG;
  }
}

export async function saveHomepageConfig(config: Partial<HomepageConfig>): Promise<HomepageConfig> {
  const current = await getHomepageConfig();
  const merged = { ...current, ...config };
  await db.siteSetting.upsert({
    where: { key: "homepage_config" },
    create: {
      key: "homepage_config",
      value: JSON.stringify(merged),
    },
    update: {
      value: JSON.stringify(merged),
    },
  });
  return merged;
}
