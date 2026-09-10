"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredParticipant } from "@/lib/participant";
import { formatTripDate } from "@/lib/time";
import { voteForVariant } from "@/app/t/[shareToken]/actions";
import type { TripStats } from "@/lib/tripStats";
import { TripStatsOverview } from "./TripStatsOverview";

type Variant = {
  id: string;
  name: string;
  creatorName: string;
  voteCount: number;
  usedVehicles: number;
  voterParticipantIds: string[];
  isIncomplete: boolean;
};

export function TripVariantsView({
  shareToken,
  tripId,
  tripName,
  tripDate,
  isAdminView,
  participants,
  variants,
  stats,
}: {
  shareToken: string;
  tripId: string;
  tripName: string;
  tripDate?: Date | string | null;
  isAdminView?: boolean;
  participants: { id: string; name: string }[];
  variants: Variant[];
  stats: TripStats;
}) {
  const router = useRouter();
  const [{ me, checked }, setParticipantState] = useState<{
    me: { id: string; name: string } | null;
    checked: boolean;
  }>({ me: null, checked: false });
  const [pending, setPending] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const participantNameById = new Map(participants.map((p) => [p.id, p.name]));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValid = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (checked && !isValid) router.replace(`/t/${shareToken}`);
  }, [checked, isValid, shareToken, router]);

  if (!checked || !isValid || !me) return null;

  const myVariantId = variants.find((v) => v.voterParticipantIds.includes(me.id))?.id;

  async function handleVote(variantId: string) {
    if (!me) return;
    setPending(true);
    await voteForVariant(shareToken, tripId, me.id, variantId);
    setPending(false);
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="truncate text-lg font-semibold text-foreground">{tripName}</h1>
          {formatTripDate(tripDate) && (
            <p className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{formatTripDate(tripDate)}</p>
          )}
        </div>
        {isAdminView && (
          <Link
            href={`/trips/${tripId}`}
            className="block text-right text-[11px] font-medium text-accent hover:underline"
          >
            ← Zurück zum Admin-Bereich
          </Link>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <TripStatsOverview stats={stats} hideVariantHint />
        </div>

        <div className="mb-6 flex justify-end gap-2">
          <button
            onClick={() => setShowVoters((v) => !v)}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            {showVoters ? "Stimmen ausblenden" : "Wer hat abgestimmt?"}
          </button>
          <Link
            href={`/t/${shareToken}/variant/new`}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Neue Variante
          </Link>
        </div>

        <ul className="flex flex-col gap-3">
          {variants.map((variant) => {
            const isMyFavorite = myVariantId === variant.id;
            return (
              <li
                key={variant.id}
                className={`rounded-xl border p-4 ${
                  isMyFavorite ? "border-accent bg-accent/[.06]" : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/t/${shareToken}/variant/${variant.id}`} className="min-w-0">
                    <p className="flex items-center gap-1.5 font-medium text-foreground hover:underline">
                      {variant.name}
                      {variant.isIncomplete && (
                        <span title="Noch nicht alle Personen zugeordnet" className="text-amber-500">
                          ⚠
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      von {variant.creatorName} · {variant.usedVehicles} Auto
                      {variant.usedVehicles !== 1 && "s"} genutzt · {variant.voteCount} Stimme
                      {variant.voteCount !== 1 && "n"}
                    </p>
                    {showVoters && (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {variant.voterParticipantIds.length > 0
                          ? variant.voterParticipantIds
                              .map((id) => participantNameById.get(id) ?? "?")
                              .join(", ")
                          : "Noch niemand"}
                      </p>
                    )}
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/t/${shareToken}/variant/${variant.id}`}
                      className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                    >
                      Ansehen
                    </Link>
                    <button
                      disabled={pending || isMyFavorite}
                      onClick={() => handleVote(variant.id)}
                      className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
                    >
                      {isMyFavorite ? "★ Favorit" : "Favorisieren"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {variants.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Varianten – leg die erste an!
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
