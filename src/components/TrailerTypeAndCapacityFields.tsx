"use client";

import { useState } from "react";

export function TrailerTypeAndCapacityFields({
  defaultType,
  defaultCapacity,
}: {
  defaultType?: "CARGO" | "BIKE_RACK";
  defaultCapacity?: number | null;
}) {
  const [type, setType] = useState<"CARGO" | "BIKE_RACK">(defaultType ?? "CARGO");

  return (
    <>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Typ
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "CARGO" | "BIKE_RACK")}
          className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
        >
          <option value="CARGO">Lasten-Anhänger</option>
          <option value="BIKE_RACK">Fahrradträger</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Fahrrad-Kapazität (optional)
        <input
          name="capacity"
          type="number"
          min={0}
          defaultValue={defaultCapacity ?? ""}
          className="w-24 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
        />
      </label>
    </>
  );
}
