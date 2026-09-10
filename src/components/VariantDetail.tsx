"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBike, IconCaravan, IconCar, IconDownload } from "@tabler/icons-react";
import { getStoredParticipant } from "@/lib/participant";
import { formatTripDate } from "@/lib/time";
import { voteForVariant } from "@/app/t/[shareToken]/actions";

const SLOT_SIZE = 44;
const BIKE_SLOT_SIZE = 30;

type VehicleView = {
  id: string;
  name: string;
  frontSeats: number;
  seats: number;
  driverName: string | null;
  front: { name: string; photoUrl: string | null; isDriver: boolean }[];
  back: { name: string; photoUrl: string | null }[];
  trailerName: string | null;
  trailerType: "CARGO" | "BIKE_RACK" | null;
  bikes: { name: string }[];
  departure: string | null;
  arrival: string | null;
  travelDuration: string | null;
};

function Avatar({ name, photoUrl, size }: { name: string; photoUrl: string | null; size: number }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        crossOrigin="anonymous"
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-[var(--surface)] text-lg font-medium text-zinc-600 dark:text-zinc-300"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function PersonSlot({ name, photoUrl, isDriver }: { name: string; photoUrl: string | null; isDriver?: boolean }) {
  return (
    <div className="relative flex shrink-0 flex-col items-center gap-1 p-1.5 text-center">
      <Avatar name={name} photoUrl={photoUrl} size={SLOT_SIZE} />
      {isDriver && (
        <span
          title="Fährt dieses Auto"
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-accent bg-accent text-accent-foreground"
        >
          <IconCar size={14} stroke={2} />
        </span>
      )}
      <span className="max-w-[76px] truncate text-xs text-zinc-700 dark:text-zinc-300">{name}</span>
    </div>
  );
}

function BikeSlot({ name }: { name: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 p-1 text-center">
      <div
        style={{ width: BIKE_SLOT_SIZE, height: BIKE_SLOT_SIZE }}
        className="flex items-center justify-center rounded-full bg-[var(--surface)] text-zinc-500 dark:text-zinc-300"
      >
        <IconBike size={BIKE_SLOT_SIZE * 0.6} stroke={1.75} />
      </div>
      <span className="max-w-[60px] truncate text-[11px] text-zinc-700 dark:text-zinc-300">{name}</span>
    </div>
  );
}

export function VariantDetail({
  shareToken,
  tripId,
  isAdminView,
  participants,
  tripName,
  tripDate,
  variant,
}: {
  shareToken: string;
  tripId: string;
  isAdminView?: boolean;
  participants: string[];
  tripName: string;
  tripDate?: Date | string | null;
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const formattedDate = formatTripDate(tripDate);

  async function handleExport() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    setExportError(null);

    // Re-encode each already-rendered photo to a plain PNG data URI ourselves, using
    // the browser's own decoded bitmap, and swap it in temporarily. html-to-image embeds
    // <img> tags by re-fetching them, and some storage hosts serve photos (e.g. an
    // iPhone .HEIC upload) with a generic content-type that the fetched-and-reconstructed
    // <img> can't decode even though the live page renders it fine — that stalls the
    // export indefinitely rather than failing. Pre-baked data URIs need no re-fetch.
    const swapped: { el: HTMLImageElement; originalSrc: string }[] = [];
    for (const img of Array.from(exportRef.current.querySelectorAll("img"))) {
      if (!img.complete || !img.naturalWidth) continue;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        ctx.drawImage(img, 0, 0);
        const pngDataUrl = canvas.toDataURL("image/png");
        swapped.push({ el: img, originalSrc: img.src });
        img.src = pngDataUrl;
      } catch {
        // couldn't re-encode this one (e.g. a tainted canvas) — leave it as-is and let
        // html-to-image's own embedding attempt it
      }
    }

    try {
      const { toPng } = await import("html-to-image");
      const backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      const dataUrl = await Promise.race([
        toPng(exportRef.current, { backgroundColor: backgroundColor || undefined, pixelRatio: 2 }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("export timed out")), 20000)),
      ]);
      const link = document.createElement("a");
      const slug = (s: string) => s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
      link.download = `${slug(tripName)}-${slug(variant.name)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Variant export failed", e);
      setExportError("Export fehlgeschlagen. Versuch's nochmal.");
    } finally {
      for (const { el, originalSrc } of swapped) el.src = originalSrc;
      setExporting(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValid = me !== null && participants.includes(me.id);

  useEffect(() => {
    if (checked && !isValid && !isAdminView) router.replace(`/t/${shareToken}`);
  }, [checked, isValid, isAdminView, shareToken, router]);

  if (!checked || (!isValid && !isAdminView)) return null;

  const isMyFavorite = !!me && variant.voterParticipantIds.includes(me.id);

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
        <div className="flex items-center justify-between gap-3">
          <div>
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
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
            >
              <IconDownload size={16} stroke={1.75} />
              {exporting ? "Exportiere…" : "Export"}
            </button>
            {isAdminView && (
              <Link
                href={`/t/${shareToken}/variant/${variant.id}/edit`}
                className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              >
                Bearbeiten
              </Link>
            )}
          </div>
        </div>
        {exportError && (
          <p className="mt-2 text-right text-xs text-red-600 dark:text-red-400">{exportError}</p>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div ref={exportRef} className="flex flex-col gap-4 bg-background p-2">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {tripName}
              {formattedDate && ` · ${formattedDate}`}
            </p>
            <h2 className="text-lg font-semibold text-foreground">{variant.name}</h2>
          </div>
          {variant.vehicles.map((v) => (
            <div key={v.id} className="rounded-lg border-l-[3px] border-l-accent/50 bg-[var(--surface)]/60 py-3 pl-3 pr-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="font-medium text-foreground">
                  {v.name}{" "}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ({v.front.length + v.back.length}/{v.seats})
                  </span>
                </p>
                {(v.departure || v.arrival) && (
                  <div className="flex flex-col items-center gap-0.5 rounded-md bg-accent/10 px-2 py-1">
                    {v.travelDuration && (
                      <span className="text-[10px] font-medium leading-none text-accent">
                        {v.travelDuration}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-medium leading-none text-foreground">
                      <span>{v.departure ?? "—"}</span>
                      <span className="text-accent">→</span>
                      <span>{v.arrival ?? "—"}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 overflow-x-auto pb-1">
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Vorne ({v.front.length}/{v.frontSeats})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {v.front.map((p) => (
                      <PersonSlot key={p.name} name={p.name} photoUrl={p.photoUrl} isDriver={p.isDriver} />
                    ))}
                  </div>
                </div>

                {v.back.length > 0 && (
                  <>
                    <div className="mt-4 h-11 w-px shrink-0 bg-[var(--border)]" />
                    <div className="flex shrink-0 flex-col gap-1">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Hinten ({v.back.length}/{v.seats - v.frontSeats})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.back.map((p) => (
                          <PersonSlot key={p.name} name={p.name} photoUrl={p.photoUrl} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {v.trailerName && (
                  <>
                    <div className="mt-4 h-11 w-px shrink-0 bg-[var(--border)]" />
                    <div className="flex shrink-0 flex-col gap-1">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Kupplung</p>
                      <div className="flex shrink-0 flex-col items-center gap-1 p-1.5 text-center">
                        <div
                          style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
                          className="flex items-center justify-center rounded-full bg-[var(--surface)] text-zinc-500 dark:text-zinc-300"
                        >
                          {v.trailerType === "BIKE_RACK" ? (
                            <IconBike size={SLOT_SIZE * 0.5} stroke={1.75} />
                          ) : (
                            <IconCaravan size={SLOT_SIZE * 0.5} stroke={1.75} />
                          )}
                        </div>
                        <span className="max-w-[120px] truncate text-xs text-zinc-700 dark:text-zinc-300">
                          {v.trailerName}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {v.bikes.length > 0 && (
                <div className="mt-2 flex w-fit flex-col gap-1">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Fahrräder ({v.bikes.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {v.bikes.map((b) => (
                      <BikeSlot key={b.name} name={b.name} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {isValid && me && (
          <button
            disabled={pending || isMyFavorite}
            onClick={handleVote}
            className="mt-6 w-full rounded-full border border-[var(--border)] px-5 py-2 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
          >
            {isMyFavorite ? "★ Dein Favorit" : "Als Favorit wählen"}
          </button>
        )}
      </main>
    </div>
  );
}
