"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredParticipant } from "@/lib/participant";
import { setPackingItemPacked } from "@/app/t/[shareToken]/packing/actions";
import { FamilyHeader } from "./FamilyHeader";

type PackingItem = {
  id: string;
  name: string;
  isPacked: boolean;
  claimedByParticipantId: string | null;
  claimedByFamilyId: string | null;
  claimedByName: string | null;
};

type Participant = { id: string; name: string; familyId: string | null; familyName: string | null };

export function MyPackingListView({
  shareToken,
  tripId,
  tripName,
  isAdminView,
  participants,
  items,
}: {
  shareToken: string;
  tripId: string;
  tripName: string;
  isAdminView?: boolean;
  participants: Participant[];
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

  const myParticipant = participants.find((p) => p.id === me.id);
  const myFamilyId = myParticipant?.familyId ?? null;
  const myItems = myFamilyId
    ? items.filter((item) => item.claimedByFamilyId === myFamilyId)
    : items.filter((item) => item.claimedByParticipantId === me.id);
  const title = myFamilyId && myParticipant?.familyName ? `Packliste – ${myParticipant.familyName}` : "Meine Packliste";

  return (
    <div className="flex flex-1 flex-col bg-background">
      <FamilyHeader
        className="print:hidden"
        backHref={`/t/${shareToken}/packing`}
        backLabel="Zurück zur Packliste"
        isAdminView={isAdminView}
        tripId={tripId}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tripName}</p>
          </div>
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
              {myFamilyId && item.claimedByParticipantId !== me.id && item.claimedByName && (
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.claimedByName}
                </span>
              )}
            </li>
          ))}
          {myItems.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {myFamilyId
                ? "In eurer Familie wurde noch nichts übernommen."
                : "Du hast noch keine Gegenstände übernommen."}
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
