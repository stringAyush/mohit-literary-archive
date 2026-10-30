import { db } from "@/lib/db";

export type HomepageConfig = {
  heroHeadline: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaHref: string;
  heroSecondaryText: string;
  heroSecondaryHref: string;
  marqueeEnabled: boolean;
  marqueeItems: string[];
  featuredWorkId?: string;
  showAuthorNote: boolean;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  heroHeadline: "Some things are better left in words.",
  heroSubtitle: "An evolving collection of thoughts, poems, fragments, and observations.",
  heroCtaText: "Enter the archive",
  heroCtaHref: "/works",
  heroSecondaryText: "About the writer",
  heroSecondaryHref: "/about",
  marqueeEnabled: true,
  marqueeItems: [
    "Poetry & Ghazals",
    "Micro-Fiction & Stories",
    "Reflections & Prose",
    "Book Photography",
    "Literary Monograph",
  ],
  showAuthorNote: true,
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
