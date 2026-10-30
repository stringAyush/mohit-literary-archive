import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/ui/MotionWrapper";
import type { PublicCollection } from "@/lib/works/queries";

export function CollectionPanel({ collection, index }: { collection: PublicCollection; index?: number }) {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(20,19,18,0.08)]">
      <div className="flex items-center justify-between">
        {index !== undefined && (
          <Badge variant="muted" className="tabular-nums">
            Collection {String(index + 1).padStart(2, "0")}
          </Badge>
        )}
        <FolderKanban className="h-4 w-4 text-muted/60 transition-colors group-hover:text-ink" />
      </div>

      <h3 className="mt-4 font-display text-[1.6rem] font-normal leading-snug text-ink transition-all group-hover:underline decoration-accent decoration-2 underline-offset-4">
        <Link
          href={`/collections/${collection.slug}`}
          className="no-underline after:absolute after:inset-0 after:content-['']"
        >
          {collection.name}
        </Link>
      </h3>

      {collection.description && (
        <p className="mt-2.5 font-editorial text-[1.1875rem] leading-snug text-ink/80 line-clamp-2">
          {collection.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t hairline pt-4 font-sans text-xs text-muted">
        <span className="font-medium">
          {collection.workCount} {collection.workCount === 1 ? "work" : "works"}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-ink transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true">
          <span>Explore</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}

export function CollectionGrid({ collections }: { collections: PublicCollection[] }) {
  return (
    <StaggerContainer>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, index) => (
          <StaggerItem key={collection.id}>
            <CollectionPanel collection={collection} index={index} />
          </StaggerItem>
        ))}
      </ul>
    </StaggerContainer>
  );
}
