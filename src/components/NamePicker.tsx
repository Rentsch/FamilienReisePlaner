"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredParticipant } from "@/lib/participant";
import type { TripStats } from "@/lib/tripStats";
import { formatTripDate } from "@/lib/time";
import { TripStatsOverview } from "./TripStatsOverview";

export function NamePicker({
  shareToken,
  participants,
  redirectTo,
  stats,
  tripName,
  tripDate,
}: {
  shareToken: string;
  participants: { id: string; name: string }[];
  redirectTo: string;
  stats: TripStats;
  tripName: string;
  tripDate?: Date | string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const formattedDate = formatTripDate(tripDate);

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h1 className="text-lg font-semibold text-foreground">
            Willkommen beim <span className="whitespace-nowrap">Familien-Reiseplaner</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Wer fährt mit wem?</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Gemeinsam finden wir die beste Aufteilung von Personen, Autos und Fahrrädern für unsere
            Reise.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div>
            <p className="font-medium text-foreground">{tripName}</p>
            {formattedDate && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{formattedDate}</p>
            )}
          </div>
          <TripStatsOverview stats={stats} />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">Wer bist du?</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Wähl deinen Namen aus, um mitzuplanen.
            </p>
          </div>

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
          >
            <option value="">Bitte wählen…</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            disabled={!selected}
            onClick={() => {
              const person = participants.find((p) => p.id === selected);
              if (!person) return;
              setStoredParticipant(shareToken, person);
              router.push(redirectTo);
            }}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40 hover:brightness-110"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  );
}
