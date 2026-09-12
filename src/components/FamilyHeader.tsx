import Link from "next/link";

// Shared top bar for every family-facing /t/[shareToken]/... page: a
// constant "Familien Reise Planer" brand plus whatever back-navigation
// applies. The brand always sits on the left and back links always on the
// right, so the brand doesn't shift position depending on which page has a
// back link and which doesn't.
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
      <span className="shrink-0 font-semibold text-foreground">Familien Reise Planer</span>
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link href={backHref} className="shrink-0 truncate text-sm text-zinc-500 hover:text-foreground">
            ← {backLabel}
          </Link>
        )}
        {isAdminView && tripId && (
          <Link
            href={`/trips/${tripId}`}
            className="shrink-0 text-xs font-medium text-accent hover:underline"
          >
            ← Zurück zum Admin-Bereich
          </Link>
        )}
      </div>
    </header>
  );
}
