import Link from "next/link";

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="border-y hairline py-16 text-center">
      <p className="font-editorial text-[1.75rem] italic leading-snug text-ink sm:text-[2rem]">{title}</p>
      {message && <p className="mx-auto mt-3 max-w-md font-sans text-sm text-muted">{message}</p>}
      {action && (
        <Link href={action.href} className="btn btn-secondary mt-8">
          {action.label}
        </Link>
      )}
    </div>
  );
}
