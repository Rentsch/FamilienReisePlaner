"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredParticipant } from "@/lib/participant";
import { formatTripDate } from "@/lib/time";
import { voteForVariant } from "@/app/t/[shareToken]/actions";
import type { TripStats } from "@/lib/tripStats";
import { TripStatsOverview } from "./TripStatsOverview";
import { FamilyHeader } from "./FamilyHeader";

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
      <FamilyHeader shareToken={shareToken} isAdminView={isAdminView} tripId={tripId} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl" aria-hidden>
              🗺️
            </span>
            <span className="text-base font-semibold text-foreground">{tripName}</span>
            {formatTripDate(tripDate) && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatTripDate(tripDate)}</span>
            )}
          </div>
          <div className="w-full border-t border-[var(--border)] pt-3">
            <TripStatsOverview stats={stats} hideVariantHint />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <Link
            href={`/t/${shareToken}/schedule`}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            <span className="text-2xl" aria-hidden>
              🗓️
            </span>
            <span className="text-sm font-medium text-foreground">Tagesablauf</span>
          </Link>
          <Link
            href={`/t/${shareToken}/packing`}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            <span className="text-2xl" aria-hidden>
              🎒
            </span>
            <span className="text-sm font-medium text-foreground">Packliste</span>
          </Link>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Auto Aufteilung</h2>
          <div className="flex gap-1.5 sm:gap-2">
            {variants.length >= 2 && (
              <Link
                href={`/t/${shareToken}/compare`}
                className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium hover:bg-black/[.04] sm:px-4 sm:text-sm dark:hover:bg-white/[.06]"
              >
                Vergleich
              </Link>
            )}
            <Link
              href={`/t/${shareToken}/variant/new`}
              className="rounded-full bg-accent px-3 py-2 text-xs font-medium text-accent-foreground hover:brightness-110 sm:px-5 sm:text-sm"
            >
              Neue Variante
            </Link>
          </div>
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
                      {variant.voterParticipantIds.length > 0 &&
                        ` (${variant.voterParticipantIds.map((id) => participantNameById.get(id) ?? "?").join(", ")})`}
                    </p>
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
