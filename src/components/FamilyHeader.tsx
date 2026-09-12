"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearStoredParticipant } from "@/lib/participant";

// Shared top bar for every family-facing /t/[shareToken]/... page: a
// constant "Familien Reise Planer" brand plus whatever back-navigation
// applies. The brand always sits on the left and back links always on the
// right, so the brand doesn't shift position depending on which page has a
// back link and which doesn't.
export function FamilyHeader({
  shareToken,
  backHref,
  backLabel,
  isAdminView,
  tripId,
  className,
}: {
  shareToken: string;
  backHref?: string;
  backLabel?: string;
  isAdminView?: boolean;
  tripId?: string;
  className?: string;
}) {
  const router = useRouter();

  function switchPerson() {
    clearStoredParticipant(shareToken);
    router.push(`/t/${shareToken}`);
  }

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
        <button
          type="button"
          onClick={switchPerson}
          title="Nicht du? Person wechseln"
          className="shrink-0 text-sm text-zinc-500 hover:text-foreground"
        >
          🔁 Wechseln
        </button>
        {isAdminView && tripId && (
          <Link
            href={`/trips/${tripId}`}
            title="Zurück zum Admin-Bereich"
            aria-label="Zurück zum Admin-Bereich"
            className="shrink-0 text-2xl leading-none font-bold text-yellow-500 hover:text-yellow-400"
          >
            ←
          </Link>
        )}
      </div>
    </header>
  );
}
