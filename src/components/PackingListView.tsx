"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconDownload } from "@tabler/icons-react";
import { getStoredParticipant } from "@/lib/participant";
import type { PackingStats } from "@/lib/packingStats";
import {
  addPackingItem,
  claimPackingItem,
  unclaimPackingItem,
  addPackingListTemplateToTrip,
} from "@/app/t/[shareToken]/packing/actions";
import { FamilyHeader } from "./FamilyHeader";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

// Fixed width the export image is rendered at, regardless of the device that triggers it,
// so the exported PNG looks identical whether it's generated from a phone or a desktop.
const EXPORT_WIDTH = 640;

function slug(s: string) {
  return s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

type PackingItem = {
  id: string;
  name: string;
  isPacked: boolean;
  claimedByParticipantId: string | null;
  claimedByName: string | null;
};

export function PackingListView({
  shareToken,
  tripId,
  tripName,
  isAdminView,
  participants,
  items,
  stats,
  templates,
}: {
  shareToken: string;
  tripId: string;
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValid = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (checked && !isValid) router.replace(`/t/${shareToken}`);
  }, [checked, isValid, shareToken, router]);

  if (!checked || !isValid || !me) return null;

  // Open items first, then what I claimed myself, then everything else grouped by
  // family (alphabetically) so each family's items sit together at the bottom.
  function itemRank(item: PackingItem) {
    if (item.claimedByParticipantId === null) return 0;
    if (item.claimedByParticipantId === me!.id) return 1;
    return 2;
  }
  const sortedItems = [...items].sort((a, b) => {
    const rankDiff = itemRank(a) - itemRank(b);
    if (rankDiff !== 0) return rankDiff;
    if (itemRank(a) === 2) return (a.claimedByName ?? "").localeCompare(b.claimedByName ?? "", "de");
    return 0;
  });
  const myClaimedCount = items.filter((item) => item.claimedByParticipantId === me.id).length;

  async function handleClaim(itemId: string) {
    if (!me) return;
    setPendingItemId(itemId);
    await claimPackingItem(shareToken, itemId, me.id);
    setPendingItemId(null);
  }

  async function handleUnclaim(itemId: string) {
    if (!me) return;
    await unclaimPackingItem(shareToken, itemId, me.id);
  }

  async function handleExport() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    setExportError(null);

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.left = "-99999px";
    host.style.width = `${EXPORT_WIDTH}px`;
    host.style.pointerEvents = "none";
    const clone = exportRef.current.cloneNode(true) as HTMLDivElement;
    clone.style.width = `${EXPORT_WIDTH}px`;
    clone.querySelectorAll("[data-export-hide]").forEach((el) => el.remove());
    // Lay the item list out in two columns just for the export — keeps the
    // on-screen single-column list (better for tapping) untouched, while
    // stopping the shared image from getting too tall with a long list.
    const list = clone.querySelector("ul");
    if (list instanceof HTMLElement) {
      list.style.display = "grid";
      list.style.gridTemplateColumns = "1fr 1fr";
      list.style.columnGap = "12px";
      list.style.rowGap = "8px";
    }
    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      const { toPng } = await import("html-to-image");
      const backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      const dataUrl = await Promise.race([
        toPng(clone, { backgroundColor: backgroundColor || undefined, pixelRatio: 2 }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("export timed out")), 20000)),
      ]);
      const filename = `packliste-${slug(tripName)}.png`;

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Packliste ${tripName}` });
          return;
        } catch (shareError) {
          if (shareError instanceof Error && shareError.name === "AbortError") return;
        }
      }

      const link = document.createElement("a");
      const objectUrl = URL.createObjectURL(file);
      link.download = filename;
      link.href = objectUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (e) {
      console.error("Packliste export failed", e);
      setExportError("Export fehlgeschlagen. Versuch's nochmal.");
    } finally {
      host.remove();
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <FamilyHeader
        shareToken={shareToken}
        backHref={`/t/${shareToken}/trip`}
        backLabel="Zurück zur Reise"
        isAdminView={isAdminView}
        tripId={tripId}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="text-lg font-semibold text-foreground">Packliste</h1>
        <p className="mb-6 text-xs text-zinc-500 dark:text-zinc-400">{tripName}</p>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <strong className="font-semibold text-foreground">{stats.claimedCount}</strong> von{" "}
            <strong className="font-semibold text-foreground">{stats.totalCount}</strong> übernommen, davon{" "}
            <strong className="font-semibold text-foreground">{myClaimedCount}</strong> von dir ·{" "}
            <strong className="font-semibold text-foreground">{stats.packedCount}</strong> gepackt
          </p>
          <div className="flex gap-2">
            <Link
              href={`/t/${shareToken}/packing/mine`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Meine Packliste
            </Link>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || items.length === 0}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
            >
              <IconDownload size={16} stroke={1.75} />
              {exporting ? "Exportiere…" : "Export"}
            </button>
          </div>
        </div>
        {exportError && (
          <p className="mb-4 text-xs text-red-600 dark:text-red-400">{exportError}</p>
        )}

        {isAdminView && templates.length > 0 && (
          <form
            action={addPackingListTemplateToTrip.bind(null, shareToken)}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-4"
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
          className="mb-6 flex items-end gap-3"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Neuer Gegenstand
            <input
              name="name"
              required
              placeholder="z.B. Zelt, Erste-Hilfe-Set, Grill"
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Mehrere Gegenstände mit Komma trennen
            </span>
          </label>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Hinzufügen
          </button>
        </form>

        <div ref={exportRef} className="flex flex-col gap-2 bg-background">
          <div className="mb-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tripName}</p>
            <h2 className="text-base font-semibold text-foreground">Packliste</h2>
          </div>
          <ul className="flex flex-col gap-2">
            {sortedItems.map((item) => {
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
                      data-export-hide
                      disabled={pendingItemId === item.id}
                      onClick={() => handleClaim(item.id)}
                      className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
                    >
                      Ich nehme es mit
                    </button>
                  ) : claimedByMe ? (
                    <>
                      <span data-export-hide>
                        <ConfirmDeleteButton
                          action={() => handleUnclaim(item.id)}
                          confirmTitle="Wirklich freigeben?"
                          confirmMessage={<>„{item.name}“ wirklich wieder freigeben?</>}
                          label="Doch nicht ich"
                          pendingLabel="Wird freigegeben…"
                          confirmLabel="Ja, freigeben"
                          className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
                        />
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.claimedByName}
                      </span>
                    </>
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
        </div>
      </main>
    </div>
  );
}
