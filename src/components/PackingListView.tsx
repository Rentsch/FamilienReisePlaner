"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredParticipant } from "@/lib/participant";
import type { PackingStats } from "@/lib/packingStats";
import {
  addPackingItem,
  claimPackingItem,
  unclaimPackingItem,
  addPackingListTemplateToTrip,
} from "@/app/t/[shareToken]/packing/actions";

type PackingItem = {
  id: string;
  name: string;
  isPacked: boolean;
  claimedByParticipantId: string | null;
  claimedByName: string | null;
};

export function PackingListView({
  shareToken,
  tripName,
  isAdminView,
  participants,
  items,
  stats,
  templates,
}: {
  shareToken: string;
  tripName: string;
  isAdminView?: boolean;
  participants: { id: string; name: string }[];
  items: PackingItem[];
  stats: PackingStats;
  templates: { id: string; name: string; itemCount: number }[];
}) {
  const router = useRouter();
  const [{ me, checked }, setParticipantState] = useState<{
    me: { id: string; name: string } | null;
    checked: boolean;
  }>({ me: null, checked: false });
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValid = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (checked && !isValid) router.replace(`/t/${shareToken}`);
  }, [checked, isValid, shareToken, router]);

  if (!checked || !isValid || !me) return null;

  async function handleClaim(itemId: string) {
    if (!me) return;
    setPendingItemId(itemId);
    await claimPackingItem(shareToken, itemId, me.id);
    setPendingItemId(null);
  }

  async function handleUnclaim(itemId: string) {
    if (!me) return;
    setPendingItemId(itemId);
    await unclaimPackingItem(shareToken, itemId, me.id);
    setPendingItemId(null);
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 print:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="truncate text-lg font-semibold text-foreground">{tripName} · Packliste</h1>
        </div>
        <Link href={`/t/${shareToken}/trip`} className="text-[11px] font-medium text-accent hover:underline">
          ← Zurück zur Reise
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <strong className="font-semibold text-foreground">{stats.claimedCount}</strong> von{" "}
            <strong className="font-semibold text-foreground">{stats.totalCount}</strong> vergeben ·{" "}
            <strong className="font-semibold text-foreground">{stats.packedCount}</strong> gepackt
          </p>
          <div className="flex gap-2 print:hidden">
            <Link
              href={`/t/${shareToken}/packing/mine`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Meine Packliste
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Drucken
            </button>
          </div>
        </div>

        {isAdminView && templates.length > 0 && (
          <form
            action={addPackingListTemplateToTrip.bind(null, shareToken)}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-4 print:hidden"
          >
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Vorlage hinzufügen
              <select
                name="templateId"
                required
                className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.itemCount})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
            >
              Hinzufügen
            </button>
          </form>
        )}

        <form
          action={addPackingItem.bind(null, shareToken)}
          className="mb-6 flex items-end gap-3 print:hidden"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Neuer Gegenstand
            <input
              name="name"
              required
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Hinzufügen
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const claimedByMe = item.claimedByParticipantId === me.id;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
              >
                <span className="flex-1 text-sm text-foreground">
                  {item.name}
                  {item.isPacked && <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">(gepackt)</span>}
                </span>
                {item.claimedByName === null ? (
                  <button
                    type="button"
                    disabled={pendingItemId === item.id}
                    onClick={() => handleClaim(item.id)}
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50 print:hidden"
                  >
                    Ich nehme es mit
                  </button>
                ) : claimedByMe ? (
                  <button
                    type="button"
                    disabled={pendingItemId === item.id}
                    onClick={() => handleUnclaim(item.id)}
                    className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-black/[.04] disabled:opacity-50 print:hidden dark:hover:bg-white/[.06]"
                  >
                    Doch nicht ich
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.claimedByName}
                  </span>
                )}
              </li>
            );
          })}
          {items.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch keine Gegenstände auf der Packliste.</p>
          )}
        </ul>
      </main>
    </div>
  );
}
