import Link from "next/link";
import type { PublicCollection } from "@/lib/works/queries";

export function CollectionPanel({ collection, index }: { collection: PublicCollection; index?: number }) {
  return (
    <article className="group relative flex h-full flex-col border-t border-ink/80 pt-5 pb-8">
      {index !== undefined && (
        <span className="font-sans text-xs tabular-nums text-muted" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <h3 className="mt-3 font-display text-[1.625rem] leading-tight">
        <Link
          href={`/collections/${collection.slug}`}
          className="no-underline after:absolute after:inset-0 after:content-[''] group-hover:text-accent"
        >
          {collection.name}
        </Link>
      </h3>
      {collection.description && (
        <p className="mt-3 font-editorial text-[1.25rem] leading-snug text-ink/80">{collection.description}</p>
      )}
      <p className="mt-auto pt-6 font-sans text-[0.8125rem] text-muted">
        {collection.workCount} {collection.workCount === 1 ? "piece" : "pieces"}
        <span className="ml-3 text-accent" aria-hidden="true">
          →
        </span>
      </p>
    </article>
  );
}

export function CollectionGrid({ collections }: { collections: PublicCollection[] }) {
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection, index) => (
        <li key={collection.id}>
          <CollectionPanel collection={collection} index={index} />
        </li>
      ))}
    </ul>
  );
}
