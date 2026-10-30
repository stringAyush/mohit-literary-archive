import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader, SkipLink } from "@/components/site/SiteHeader";
import { ReadingProgressBar } from "@/components/ui/MotionWrapper";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ReadingProgressBar />
      <SkipLink />
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
