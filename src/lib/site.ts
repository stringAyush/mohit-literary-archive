// The public address of the site, safe to use anywhere (including build time).
export function publicSiteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function absolutePublicUrl(path: string): string {
  return `${publicSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
