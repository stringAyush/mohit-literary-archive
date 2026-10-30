import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { publicSiteUrl } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(publicSiteUrl()),
    title: { default: `${SITE_NAME} — Writer & Poet`, template: `%s — ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    openGraph: {
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
    },
    twitter: { card: "summary" },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#F7F4EE",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh bg-paper text-ink">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
