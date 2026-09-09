"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredParticipant } from "@/lib/participant";
import { voteForVariant } from "@/app/t/[shareToken]/actions";

type VehicleView = {
  id: string;
  name: string;
  frontSeats: number;
  seats: number;
  driverName: string | null;
  front: { name: string; photoUrl: string | null; isDriver: boolean }[];
  back: { name: string; photoUrl: string | null }[];
  trailerName: string | null;
  bikes: string[];
  departure: string | null;
  arrival: string | null;
};

export function VariantDetail({
  shareToken,
  tripId,
  isAdminView,
  participants,
  variant,
}: {
  shareToken: string;
  tripId: string;
  isAdminView?: boolean;
  participants: string[];
  variant: {
    id: string;
    name: string;
    creatorName: string;
    voteCount: number;
    voterParticipantIds: string[];
    vehicles: VehicleView[];
  };
}) {
  const router = useRouter();
  const [{ me, checked }, setParticipantState] = useState<{
    me: { id: string; name: string } | null;
    checked: boolean;
  }>({ me: null, checked: false });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValid = me !== null && participants.includes(me.id);

  useEffect(() => {
    if (checked && !isValid) router.replace(`/t/${shareToken}`);
  }, [checked, isValid, shareToken, router]);

  if (!checked || !isValid || !me) return null;

  const isMyFavorite = variant.voterParticipantIds.includes(me.id);

  async function handleVote() {
    if (!me) return;
    setPending(true);
    await voteForVariant(shareToken, tripId, me.id, variant.id);
    setPending(false);
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
        {isAdminView && (
          <Link
            href={`/trips/${tripId}`}
            className="mb-1 block text-xs font-medium text-accent hover:underline"
          >
            ← Zurück zum Admin-Bereich
          </Link>
        )}
        <Link
          href={`/t/${shareToken}/trip`}
          className="text-sm text-zinc-500 hover:text-foreground"
        >
          ← Alle Varianten
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{variant.name}</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          von {variant.creatorName} · {variant.voteCount} Stimme{variant.voteCount !== 1 && "n"}
        </p>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
        <div className="flex flex-col gap-4">
          {variant.vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-[var(--border)] p-4">
              <p className="mb-2 font-medium text-foreground">
                {v.name}{" "}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  ({v.front.length + v.back.length}/{v.seats})
                </span>
              </p>

              <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Vorne</p>
              <div className="mb-2 flex flex-wrap gap-2">
                {v.front.map((p) => (
                  <span
                    key={p.name}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    {p.isDriver && "🚗 "}
                    {p.name}
                  </span>
                ))}
              </div>

              {v.back.length > 0 && (
                <>
                  <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Hinten</p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {v.back.map((p) => (
                      <span
                        key={p.name}
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {(v.bikes.length > 0 || v.trailerName) && (
                <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-2">
                  {v.bikes.map((b) => (
                    <span key={b} className="text-sm text-zinc-500 dark:text-zinc-400">
                      🚲 {b}
                    </span>
                  ))}
                  {v.trailerName && (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">🚚 {v.trailerName}</span>
                  )}
                </div>
              )}

              {(v.departure || v.arrival) && (
                <div className="mt-2 flex gap-4 border-t border-[var(--border)] pt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {v.departure && <span>Abfahrt {v.departure}</span>}
                  {v.arrival && <span>Ankunft ca. {v.arrival}</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          disabled={pending || isMyFavorite}
          onClick={handleVote}
          className="mt-6 w-full rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
        >
          {isMyFavorite ? "★ Dein Favorit" : "Als Favorit wählen"}
        </button>
      </main>
    </div>
  );
}
