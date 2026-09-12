"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredParticipant } from "@/lib/participant";
import { setPackingItemPacked } from "@/app/t/[shareToken]/packing/actions";

type PackingItem = {
  id: string;
  name: string;
  isPacked: boolean;
  claimedByParticipantId: string | null;
};

export function MyPackingListView({
  shareToken,
  tripName,
  participants,
  items,
}: {
  shareToken: string;
  tripName: string;
  participants: { id: string; name: string }[];
  items: PackingItem[];
}) {
  const router = useRouter();
  const [{ me, checked }, setParticipantState] = useState<{
    me: { id: string; name: string } | null;
    checked: boolean;
  }>({ me: null, checked: false });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValid = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (checked && !isValid) router.replace(`/t/${shareToken}`);
  }, [checked, isValid, shareToken, router]);

  if (!checked || !isValid || !me) return null;

  const myItems = items.filter((item) => item.claimedByParticipantId === me.id);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 print:hidden">
        <h1 className="truncate text-lg font-semibold text-foreground">{tripName} · Meine Packliste</h1>
        <Link href={`/t/${shareToken}/packing`} className="text-[11px] font-medium text-accent hover:underline">
          ← Zurück zur Packliste
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            Drucken
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {myItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <label className="flex flex-1 items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  defaultChecked={item.isPacked}
                  onChange={(e) => setPackingItemPacked(shareToken, item.id, me.id, e.target.checked)}
                  className="h-4 w-4"
                />
                {item.name}
              </label>
            </li>
          ))}
          {myItems.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Du hast noch keine Gegenstände übernommen.
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
