"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredParticipant } from "@/lib/participant";
import { voteForVariant } from "@/app/t/[shareToken]/actions";

type VehicleView = {
  id: string;
  name: string;
  seats: number;
  people: { name: string; photoUrl: string | null }[];
  bikes: string[];
  trailer: string | null;
};

export function VariantDetail({
  shareToken,
  tripId,
  participants,
  variant,
}: {
  shareToken: string;
  tripId: string;
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
  const [me] = useState(() => getStoredParticipant(shareToken));
  const [pending, setPending] = useState(false);

  const isValid = me !== null && participants.includes(me.id);

  useEffect(() => {
    if (!isValid) router.replace(`/t/${shareToken}`);
  }, [isValid, shareToken, router]);

  if (!isValid || !me) return null;

  const isMyFavorite = variant.voterParticipantIds.includes(me.id);

  async function handleVote() {
    if (!me) return;
    setPending(true);
    await voteForVariant(shareToken, tripId, me.id, variant.id);
    setPending(false);
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-zinc-950">
        <Link
          href={`/t/${shareToken}/trip`}
          className="text-sm text-zinc-500 hover:text-black dark:hover:text-white"
        >
          ← Alle Varianten
        </Link>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{variant.name}</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          von {variant.creatorName} · {variant.voteCount} Stimme{variant.voteCount !== 1 && "n"}
        </p>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
        <div className="flex flex-col gap-4">
          {variant.vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <p className="mb-2 font-medium text-black dark:text-zinc-50">
                {v.name} <span className="text-xs text-zinc-500 dark:text-zinc-400">({v.people.length}/{v.seats})</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {v.people.map((p) => (
                  <span
                    key={p.name}
                    className="rounded-full border border-black/10 px-3 py-1 text-sm text-zinc-700 dark:border-white/10 dark:text-zinc-300"
                  >
                    {p.name}
                  </span>
                ))}
                {v.bikes.map((b) => (
                  <span key={b} className="text-sm text-zinc-500 dark:text-zinc-400">
                    🚲 {b}
                  </span>
                ))}
                {v.trailer && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">🚚 {v.trailer}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          disabled={pending || isMyFavorite}
          onClick={handleVote}
          className="mt-6 w-full rounded-full border border-black/10 px-5 py-2 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:hover:bg-[#1a1a1a]"
        >
          {isMyFavorite ? "★ Dein Favorit" : "Als Favorit wählen"}
        </button>
      </main>
    </div>
  );
}
