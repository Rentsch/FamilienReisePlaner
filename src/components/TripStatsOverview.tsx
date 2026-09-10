import type { TripStats } from "@/lib/tripStats";

function Chip({ value, label, emoji }: { value: number; label: string; emoji: string }) {
  return (
    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400">
      <span aria-hidden>{emoji}</span> <strong className="font-semibold text-foreground">{value}</strong> {label}
    </span>
  );
}

export function TripStatsOverview({
  stats,
  hideVariantHint,
}: {
  stats: TripStats;
  hideVariantHint?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        <Chip emoji="👨‍👩‍👧‍👦" value={stats.participantCount} label="Teilnehmer" />
        <Chip emoji="🧑" value={stats.adultCount} label="Erwachsene" />
        <Chip emoji="🧒" value={stats.kidCount} label="Kinder" />
        <Chip emoji="🚲" value={stats.bikeCount} label={stats.bikeCount === 1 ? "Rad" : "Räder"} />
        <Chip emoji="🚗" value={stats.vehicleCount} label={stats.vehicleCount === 1 ? "Auto" : "Autos"} />
      </div>
      {!hideVariantHint && (
        <p className="text-sm font-medium text-accent">
          {stats.variantCount === 0
            ? "Noch keine Varianten"
            : stats.variantCount === 1
              ? "1 Variante steht zur Wahl"
              : `${stats.variantCount} Varianten stehen zur Wahl`}
        </p>
      )}
    </div>
  );
}
