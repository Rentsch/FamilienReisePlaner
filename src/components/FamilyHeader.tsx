import Link from "next/link";

// Shared top bar for every family-facing /t/[shareToken]/... page: a
// constant "Familien Reise" brand plus whatever back-navigation applies,
// so back buttons live in one consistent place instead of scattered
// through each page's own content.
export function FamilyHeader({
  backHref,
  backLabel,
  isAdminView,
  tripId,
  className,
}: {
  backHref?: string;
  backLabel?: string;
  isAdminView?: boolean;
  tripId?: string;
  className?: string;
}) {
  return (
    <header
      className={`flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 ${className ?? ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link href={backHref} className="shrink-0 text-sm text-zinc-500 hover:text-foreground">
            ← {backLabel}
          </Link>
        )}
        <span className="truncate font-semibold text-foreground">Familien Reise Planer</span>
      </div>
      {isAdminView && tripId && (
        <Link
          href={`/trips/${tripId}`}
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          ← Zurück zum Admin-Bereich
        </Link>
      )}
    </header>
  );
}
