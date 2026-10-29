export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "The Archive", href: "/works" },
  { label: "Book Photography", href: "/bookstagram" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
