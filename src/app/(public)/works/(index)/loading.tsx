export default function Loading() {
  return (
    <div className="page-container pb-16 pt-12 lg:pt-20" role="status" aria-live="polite">
      <p className="eyebrow">Loading…</p>
      <div className="mt-6 h-12 w-2/3 max-w-md bg-surface-2" aria-hidden="true" />
      <div className="mt-6 h-6 w-1/2 max-w-sm bg-surface-2" aria-hidden="true" />
    </div>
  );
}
