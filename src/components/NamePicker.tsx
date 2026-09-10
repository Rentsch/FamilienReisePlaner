"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredParticipant } from "@/lib/participant";
import type { TripStats } from "@/lib/tripStats";
import { TripStatsOverview } from "./TripStatsOverview";

export function NamePicker({
  shareToken,
  participants,
  redirectTo,
  stats,
}: {
  shareToken: string;
  participants: { id: string; name: string }[];
  redirectTo: string;
  stats: TripStats;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold text-foreground">Wer fährt mit wem?</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Willkommen beim Familien-Reiseplaner – gemeinsam finden wir die beste Aufteilung von
            Personen, Autos und Fahrrädern für unsere Reise.
          </p>
        </div>

        <TripStatsOverview stats={stats} />

        <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-4">
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
