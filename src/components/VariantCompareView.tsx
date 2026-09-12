"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBike, IconCaravan, IconSteeringWheel, IconPlus, IconX } from "@tabler/icons-react";
import { getStoredParticipant } from "@/lib/participant";
import { formatTripDate } from "@/lib/time";
import { FamilyHeader } from "@/components/FamilyHeader";
import type { VehicleView } from "@/lib/variantView";

type VariantSummary = {
  id: string;
  name: string;
  creatorName: string;
  voteCount: number;
  voterParticipantIds: string[];
  vehicles: VehicleView[];
};

type Row =
  | { kind: "driver" }
  | { kind: "front"; index: number }
  | { kind: "back"; index: number }
  | { kind: "trailer" }
  | { kind: "departure" };

function rowIcon(kind: Row["kind"], trailerType?: "CARGO" | "BIKE_RACK" | null) {
  if (kind === "driver") return <IconSteeringWheel size={13} stroke={2} className="shrink-0 text-accent" />;
  if (kind === "trailer") {
    if (!trailerType) return null;
    return trailerType === "BIKE_RACK" ? (
      <IconBike size={13} stroke={1.75} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
    ) : (
      <IconCaravan size={13} stroke={1.75} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
    );
  }
  return null;
}

function frontOccupants(v: VehicleView) {
  return v.front.filter((p) => !p.isDriver);
}

function cellValue(row: Row, v: VehicleView | undefined): string | null {
  if (!v) return null;
  switch (row.kind) {
    case "driver":
      return v.driverName;
    case "front":
      return frontOccupants(v)[row.index]?.name ?? null;
    case "back":
      return v.back[row.index]?.name ?? null;
    case "trailer":
      // Just the bike count, not who they belong to — that level of detail isn't needed here.
      return v.trailerName ? `${v.trailerName}|${v.bikes.length}` : null;
    case "departure":
      return v.departure ? `${v.departure}|${v.arrival ?? ""}|${v.travelDuration ?? ""}` : null;
  }
}

function cellLabel(row: Row, v: VehicleView | undefined): string {
  if (row.kind === "trailer") {
    if (!v?.trailerName) return "–";
    return v.bikes.length > 0 ? `${v.trailerName} (${v.bikes.length})` : v.trailerName;
  }
  if (row.kind === "departure") {
    if (!v?.departure) return "–";
    return v.arrival ? `${v.departure} → ${v.arrival}` : v.departure;
  }
  const value = cellValue(row, v);
  return value ?? "–";
}

function isSeatRow(kind: Row["kind"]): boolean {
  return kind === "driver" || kind === "front" || kind === "back";
}

// The set of every person seated anywhere in this vehicle (driver included) — used to decide
// whether "different people in the car" counts as a change independent of which exact seat
// they landed in (front/back has no stored left/right seat identity anyway).
function occupantSet(v: VehicleView): Set<string> {
  const names = [v.driverName, ...frontOccupants(v).map((p) => p.name), ...v.back.map((p) => p.name)];
  return new Set(names.filter((n): n is string => n !== null));
}

export function VariantCompareView({
  shareToken,
  tripId,
  tripName,
  tripDate,
  isAdminView,
  participants,
  vehicleOrder,
  allVariants,
  initialSelectedIds,
}: {
  shareToken: string;
  tripId: string;
  tripName: string;
  tripDate?: Date | string | null;
  isAdminView?: boolean;
  participants: { id: string; name: string }[];
  vehicleOrder: string[];
  allVariants: VariantSummary[];
  initialSelectedIds: string[];
}) {
  const router = useRouter();
  const [{ me, checked }, setParticipantState] = useState<{
    me: { id: string; name: string } | null;
    checked: boolean;
  }>({ me: null, checked: false });
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [strictSeats, setStrictSeats] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValid = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (checked && !isValid && !isAdminView) router.replace(`/t/${shareToken}`);
  }, [checked, isValid, isAdminView, shareToken, router]);

  useEffect(() => {
    // Keep the URL shareable without triggering a server round trip for what's a
    // purely client-side selection change.
    const url = new URL(window.location.href);
    url.searchParams.set("variants", selectedIds.join(","));
    window.history.replaceState(null, "", url);
  }, [selectedIds]);

  if (!checked || (!isValid && !isAdminView)) return null;

  const variantById = new Map(allVariants.map((v) => [v.id, v]));
  const selectedVariants = selectedIds.map((id) => variantById.get(id)!).filter(Boolean);

  const usedVehicleIds = new Set(selectedVariants.flatMap((v) => v.vehicles.map((veh) => veh.id)));
  const orderedVehicleIds = vehicleOrder.filter((id) => usedVehicleIds.has(id));

  function setColumn(colIndex: number, variantId: string) {
    setSelectedIds((ids) => ids.map((id, i) => (i === colIndex ? variantId : id)));
  }

  function addColumn() {
    const unused = allVariants.find((v) => !selectedIds.includes(v.id));
    setSelectedIds((ids) => [...ids, (unused ?? allVariants[0]).id]);
  }

  function removeColumn(colIndex: number) {
    setSelectedIds((ids) => ids.filter((_, i) => i !== colIndex));
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

      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Auto Aufteilung vergleichen</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {tripName}
          {formatTripDate(tripDate) && ` · ${formatTripDate(tripDate)}`}
        </p>
      </div>

      <main className="flex-1 px-4 py-6">
        <label className="mb-3 flex max-w-4xl items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={strictSeats}
            onChange={(e) => setStrictSeats(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
          />
          <span>
            Sitzplatz genau vergleichen
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              Aus: es zählt nur, wer im Auto sitzt — welcher Platz genau ist egal.
            </span>
          </span>
        </label>
        {/* A bounded, self-scrolling box (both axes) rather than relying on page scroll — that's
            what lets the variant-selector header actually stay pinned via `sticky top-0` while
            scrolling down through many vehicles, and keeps extra columns scrollable sideways. */}
        <div className="mx-auto w-full max-w-4xl overflow-auto rounded-lg border border-[var(--border)]" style={{ maxHeight: "calc(100vh - 190px)" }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {selectedIds.map((id, colIndex) => (
                  <th
                    key={colIndex}
                    className="sticky top-0 z-10 min-w-[130px] bg-background px-2 pb-3 pt-2 text-left align-bottom font-normal"
                  >
                    <div className="flex items-center gap-1">
                      <select
                        value={id}
                        onChange={(e) => setColumn(colIndex, e.target.value)}
                        className="w-full flex-1 truncate rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm font-medium text-foreground"
                      >
                        {allVariants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      {selectedIds.length > 2 && (
                        <button
                          onClick={() => removeColumn(colIndex)}
                          aria-label="Spalte entfernen"
                          className="shrink-0 rounded-full p-1 text-zinc-500 hover:bg-black/[.04] hover:text-foreground dark:hover:bg-white/[.06]"
                        >
                          <IconX size={14} stroke={2} />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {variantById.get(id)?.voteCount ?? 0} Stimme
                      {variantById.get(id)?.voteCount !== 1 && "n"}
                    </p>
                  </th>
                ))}
                {allVariants.length > selectedIds.length && (
                  <th className="sticky top-0 z-10 w-10 bg-background pb-3 pt-2 align-bottom">
                    <button
                      onClick={addColumn}
                      aria-label="Variante hinzufügen"
                      className="rounded-full border border-[var(--border)] p-1.5 text-zinc-500 hover:bg-black/[.04] hover:text-foreground dark:hover:bg-white/[.06]"
                    >
                      <IconPlus size={14} stroke={2} />
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {orderedVehicleIds.map((vehicleId, vehicleIdx) => {
                const byColumn = selectedIds.map((id) => variantById.get(id)?.vehicles.find((v) => v.id === vehicleId));
                const meta = byColumn.find((v): v is VehicleView => v !== undefined)!;
                const usedCols = byColumn.filter((v): v is VehicleView => v !== undefined);
                // Names shared by every compared (used) variant for this vehicle — the basis for
                // the lenient "different people in the car" mode, where the exact seat doesn't matter.
                const commonNames =
                  usedCols.length > 0
                    ? usedCols.map(occupantSet).reduce((acc, s) => new Set([...acc].filter((n) => s.has(n))))
                    : new Set<string>();
                const rows: Row[] = [
                  { kind: "driver" },
                  ...Array.from({ length: Math.max(0, meta.frontSeats - 1) }, (_, i) => ({ kind: "front" as const, index: i })),
                  ...Array.from({ length: Math.max(0, meta.seats - meta.frontSeats) }, (_, i) => ({ kind: "back" as const, index: i })),
                  { kind: "trailer" },
                  { kind: "departure" },
                ];

                return (
                  <Fragment key={vehicleId}>
                    <tr>
                      <td
                        colSpan={selectedIds.length + (allVariants.length > selectedIds.length ? 1 : 0)}
                        className={`px-2 pb-1 text-sm font-medium text-foreground ${vehicleIdx > 0 ? "pt-5" : "pt-1"}`}
                      >
                        {meta.name}
                      </td>
                    </tr>
                    {rows.map((row, rowIdx) => {
                      const usedValues = usedCols.map((v) => cellValue(row, v));
                      const allEqual = usedValues.length <= 1 || usedValues.every((val) => val === usedValues[0]);
                      const lenientSeatRow = isSeatRow(row.kind) && !strictSeats;
                      const isFirstRow = rowIdx === 0;
                      const isLastRow = rowIdx === rows.length - 1;

                      return (
                        <tr
                          key={`${vehicleId}-${row.kind}-${"index" in row ? row.index : ""}`}
                          className={`${
                            row.kind === "trailer" || row.kind === "departure" ? "border-t border-[var(--border)]" : ""
                          } ${isFirstRow ? "border-t border-[var(--border)]" : ""}`}
                        >
                          {byColumn.map((v, colIndex) => {
                            const used = v !== undefined;
                            const icon = used ? rowIcon(row.kind, v?.trailerType) : null;
                            const value = used ? cellValue(row, v) : null;
                            const differs = !used
                              ? false
                              : lenientSeatRow
                                ? value !== null && !commonNames.has(value)
                                : !allEqual;
                            return (
                              <td
                                key={colIndex}
                                className={`px-2 py-1.5 ${isLastRow ? "pb-3" : ""} ${differs ? "bg-amber-400/20" : ""}`}
                              >
                                {!used ? (
                                  isFirstRow ? (
                                    <span className="text-xs italic text-zinc-500 dark:text-zinc-400">
                                      nicht genutzt
                                    </span>
                                  ) : null
                                ) : (
                                  <span
                                    className={`flex items-center gap-1 ${
                                      cellLabel(row, v) === "–"
                                        ? "text-zinc-400 dark:text-zinc-500"
                                        : differs
                                          ? "font-medium text-amber-600 dark:text-amber-300"
                                          : "text-foreground"
                                    }`}
                                  >
                                    <span className="truncate">{cellLabel(row, v)}</span>
                                    {icon}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          {allVariants.length > selectedIds.length && <td />}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
              {orderedVehicleIds.length === 0 && (
                <tr>
                  <td colSpan={selectedIds.length} className="px-2 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Keine der ausgewählten Varianten nutzt bisher ein Auto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
