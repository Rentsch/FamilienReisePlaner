"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconCaravan, IconCar } from "@tabler/icons-react";
import { getStoredParticipant } from "@/lib/participant";
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
  bikes: { name: string; photoUrl: string | null }[];
  departure: string | null;
  arrival: string | null;
};

function Avatar({ name, photoUrl, size }: { name: string; photoUrl: string | null; size: number }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
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

function BikeSlot({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 p-1 text-center">
      <Avatar name={name} photoUrl={photoUrl} size={BIKE_SLOT_SIZE} />
      <span className="max-w-[60px] truncate text-[11px] text-zinc-700 dark:text-zinc-300">{name}</span>
    </div>
  );
}

export function VariantDetail({
  shareToken,
  tripId,
  isAdminView,
  participants,
  variant,
}: {
  shareToken: string;
  tripId: string;
  isAdminView?: boolean;
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
  const [{ me, checked }, setParticipantState] = useState<{
    me: { id: string; name: string } | null;
    checked: boolean;
  }>({ me: null, checked: false });
  const [pending, setPending] = useState(false);

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
          {isAdminView && (
            <Link
              href={`/t/${shareToken}/variant/${variant.id}/edit`}
              className="shrink-0 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Bearbeiten
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
        <div className="flex flex-col gap-4">
          {variant.vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-[var(--border)] p-4">
              <p className="mb-2 font-medium text-foreground">
                {v.name}{" "}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  ({v.front.length + v.back.length}/{v.seats})
                </span>
              </p>

              <div className="flex flex-wrap items-start gap-3">
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
                    <div className="mt-4 h-11 w-px bg-[var(--border)]" />
                    <div className="flex flex-col gap-1">
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
                    <div className="mt-4 h-11 w-px bg-[var(--border)]" />
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Kupplung</p>
                      <div className="flex shrink-0 flex-col items-center gap-1 p-1.5 text-center">
                        <div
                          style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
                          className="flex items-center justify-center rounded-full bg-[var(--surface)] text-zinc-500 dark:text-zinc-300"
                        >
                          <IconCaravan size={SLOT_SIZE * 0.5} stroke={1.75} />
                        </div>
                        <span className="max-w-[76px] truncate text-xs text-zinc-700 dark:text-zinc-300">
                          {v.trailerName}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {v.bikes.length > 0 && (
                  <>
                    <div className="mt-4 h-11 w-px bg-[var(--border)]" />
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Fahrräder ({v.bikes.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {v.bikes.map((b) => (
                          <BikeSlot key={b.name} name={b.name} photoUrl={b.photoUrl} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {(v.departure || v.arrival) && (
                <div className="mt-3 flex gap-4 border-t border-[var(--border)] pt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {v.departure && <span>Abfahrt {v.departure}</span>}
                  {v.arrival && <span>Ankunft ca. {v.arrival}</span>}
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
