"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredParticipant } from "@/lib/participant";
import { voteForVariant } from "@/app/t/[shareToken]/actions";

type Variant = {
  id: string;
  name: string;
  creatorName: string;
  voteCount: number;
  usedVehicles: number;
  voterParticipantIds: string[];
};

export function TripVariantsView({
  shareToken,
  tripId,
  tripName,
  participants,
  variants,
}: {
  shareToken: string;
  tripId: string;
  tripName: string;
  participants: { id: string; name: string }[];
  variants: Variant[];
}) {
  const router = useRouter();
  const [me] = useState(() => getStoredParticipant(shareToken));
  const [pending, setPending] = useState(false);

  const isValid = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (!isValid) router.replace(`/t/${shareToken}`);
  }, [isValid, shareToken, router]);

  if (!isValid || !me) return null;

  const myVariantId = variants.find((v) => v.voterParticipantIds.includes(me.id))?.id;

  async function handleVote(variantId: string) {
    if (!me) return;
    setPending(true);
    await voteForVariant(shareToken, tripId, me.id, variantId);
    setPending(false);
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Hallo, {me.name}</p>
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{tripName}</h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 flex justify-end">
          <Link
            href={`/t/${shareToken}/variant/new`}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
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
                  isMyFavorite
                    ? "border-black bg-black/[.03] dark:border-white dark:bg-white/[.06]"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/t/${shareToken}/variant/${variant.id}`} className="min-w-0">
                    <p className="font-medium text-black hover:underline dark:text-zinc-50">
                      {variant.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      von {variant.creatorName} · {variant.usedVehicles} Auto
                      {variant.usedVehicles !== 1 && "s"} genutzt · {variant.voteCount} Stimme
                      {variant.voteCount !== 1 && "n"}
                    </p>
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/t/${shareToken}/variant/${variant.id}`}
                      className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:border-white/10 dark:hover:bg-[#1a1a1a]"
                    >
                      Ansehen
                    </Link>
                    <button
                      disabled={pending || isMyFavorite}
                      onClick={() => handleVote(variant.id)}
                      className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:hover:bg-[#1a1a1a]"
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
