"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconDownload } from "@tabler/icons-react";
import { getStoredParticipant } from "@/lib/participant";
import { setPackingItemPacked } from "@/app/t/[shareToken]/packing/actions";
import { FamilyHeader } from "./FamilyHeader";

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

  const myParticipant = participants.find((p) => p.id === me.id);
  const myFamilyId = myParticipant?.familyId ?? null;
  const myItems = myFamilyId
    ? items.filter((item) => item.claimedByFamilyId === myFamilyId)
    : items.filter((item) => item.claimedByParticipantId === me.id);
  const title = myFamilyId && myParticipant?.familyName ? `Packliste – ${myParticipant.familyName}` : "Meine Packliste";

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
    clone.querySelectorAll("[data-export-show]").forEach((el) => el.removeAttribute("hidden"));
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
      const filename = `${slug(title)}-${slug(tripName)}.png`;

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title });
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
        backHref={`/t/${shareToken}/packing`}
        backLabel="Zurück zur Packliste"
        isAdminView={isAdminView}
        tripId={tripId}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tripName}</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || myItems.length === 0}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
          >
            <IconDownload size={16} stroke={1.75} />
            {exporting ? "Exportiere…" : "Export"}
          </button>
        </div>
        {exportError && (
          <p className="mb-4 text-xs text-red-600 dark:text-red-400">{exportError}</p>
        )}

        <div ref={exportRef} className="flex flex-col gap-2 bg-background">
          <div data-export-show hidden className="mb-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tripName}</p>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
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
                    data-export-hide
                    defaultChecked={item.isPacked}
                    onChange={(e) => setPackingItemPacked(shareToken, item.id, me.id, e.target.checked)}
                    className="h-4 w-4"
                  />
                  {item.name}
                  {item.isPacked && <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">(gepackt)</span>}
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
        </div>
      </main>
    </div>
  );
}
