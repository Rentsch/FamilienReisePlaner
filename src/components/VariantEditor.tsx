"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { getStoredParticipant } from "@/lib/participant";
import { saveVariant } from "@/app/t/[shareToken]/variant/actions";

type Participant = { id: string; name: string; photoUrl: string | null; hasBike: boolean };
type Vehicle = { id: string; name: string; seats: number; hasTowHitch: boolean };
type Trailer = { id: string; name: string };

type ChipData =
  | { type: "person"; id: string; name: string; photoUrl: string | null }
  | { type: "bike"; id: string; name: string }
  | { type: "trailer"; id: string; name: string };

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl: string | null; size?: number }) {
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
      className="flex items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function Chip({
  chip,
  selected,
  onClick,
}: {
  chip: ChipData;
  selected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${chip.type}:${chip.id}`,
    data: chip,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex shrink-0 flex-col items-center gap-1 rounded-lg p-1.5 text-center ${
        selected ? "ring-2 ring-black dark:ring-white" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {chip.type === "person" ? (
        <Avatar name={chip.name} photoUrl={chip.photoUrl} />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
          {chip.type === "bike" ? "🚲" : "🚚"}
        </div>
      )}
      <span className="max-w-[64px] truncate text-[11px] text-zinc-700 dark:text-zinc-300">
        {chip.name}
      </span>
    </button>
  );
}

function VehicleCard({
  vehicle,
  people,
  bikes,
  trailer,
  selected,
  onSlotClick,
  onUnassign,
}: {
  vehicle: Vehicle;
  people: ChipData[];
  bikes: ChipData[];
  trailer: ChipData | null;
  selected: boolean;
  onSlotClick: () => void;
  onUnassign: (chip: ChipData) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `vehicle:${vehicle.id}` });

  return (
    <div
      ref={setNodeRef}
      onClick={onSlotClick}
      className={`rounded-xl border p-4 transition-colors ${
        isOver ? "border-black bg-black/[.03] dark:border-white dark:bg-white/[.06]" : "border-black/10 dark:border-white/10"
      } ${selected ? "ring-2 ring-black dark:ring-white" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-black dark:text-zinc-50">{vehicle.name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {people.length}/{vehicle.seats} Plätze
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: vehicle.seats }).map((_, i) => {
          const occupant = people[i];
          return occupant ? (
            <Chip key={occupant.id} chip={occupant} selected={false} onClick={() => onUnassign(occupant)} />
          ) : (
            <div
              key={i}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-zinc-300 text-zinc-300 dark:border-zinc-700 dark:text-zinc-700"
            >
              +
            </div>
          );
        })}
      </div>

      {(bikes.length > 0 || vehicle.hasTowHitch) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 dark:border-white/5">
          {bikes.map((b) => (
            <Chip key={b.id} chip={b} selected={false} onClick={() => onUnassign(b)} />
          ))}
          {vehicle.hasTowHitch &&
            (trailer ? (
              <Chip chip={trailer} selected={false} onClick={() => onUnassign(trailer)} />
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-600">Kupplung frei</span>
            ))}
        </div>
      )}
    </div>
  );
}

export function VariantEditor({
  shareToken,
  tripId,
  participants,
  vehicles,
  trailers,
}: {
  shareToken: string;
  tripId: string;
  participants: Participant[];
  vehicles: Vehicle[];
  trailers: Trailer[];
}) {
  const router = useRouter();
  const [me] = useState(() => getStoredParticipant(shareToken));
  const [name, setName] = useState("");
  const [personAssignment, setPersonAssignment] = useState<Record<string, string>>({});
  const [bikeAssignment, setBikeAssignment] = useState<Record<string, string>>({});
  const [trailerAssignment, setTrailerAssignment] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<{ type: ChipData["type"]; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const isValidParticipant = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (!isValidParticipant) router.replace(`/t/${shareToken}`);
  }, [isValidParticipant, shareToken, router]);

  const bikeOwners = useMemo(() => participants.filter((p) => p.hasBike), [participants]);

  const unassignedPeople: ChipData[] = participants
    .filter((p) => !personAssignment[p.id])
    .map((p) => ({ type: "person", id: p.id, name: p.name, photoUrl: p.photoUrl }));

  const unassignedBikes: ChipData[] = bikeOwners
    .filter((p) => !bikeAssignment[p.id])
    .map((p) => ({ type: "bike", id: p.id, name: p.name }));

  const unassignedTrailers: ChipData[] = trailers
    .filter((t) => !trailerAssignment[t.id])
    .map((t) => ({ type: "trailer", id: t.id, name: t.name }));

  function assign(type: ChipData["type"], id: string, vehicleId: string) {
    if (type === "person") {
      const occupied = Object.values(personAssignment).filter((v) => v === vehicleId).length;
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle || occupied >= vehicle.seats) return;
      setPersonAssignment((prev) => ({ ...prev, [id]: vehicleId }));
    } else if (type === "bike") {
      setBikeAssignment((prev) => ({ ...prev, [id]: vehicleId }));
    } else if (type === "trailer") {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle?.hasTowHitch) return;
      const alreadyTowing = Object.entries(trailerAssignment).some(
        ([tId, vId]) => vId === vehicleId && tId !== id,
      );
      if (alreadyTowing) return;
      setTrailerAssignment((prev) => ({ ...prev, [id]: vehicleId }));
    }
  }

  function unassign(type: ChipData["type"], id: string) {
    if (type === "person") setPersonAssignment((prev) => { const n = { ...prev }; delete n[id]; return n; });
    if (type === "bike") setBikeAssignment((prev) => { const n = { ...prev }; delete n[id]; return n; });
    if (type === "trailer") setTrailerAssignment((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const [type, id] = String(active.id).split(":") as [ChipData["type"], string];
    if (over.id === "tray") {
      unassign(type, id);
      return;
    }
    const vehicleId = String(over.id).replace("vehicle:", "");
    assign(type, id, vehicleId);
  }

  function handleVehicleClick(vehicleId: string) {
    if (!selected) return;
    assign(selected.type, selected.id, vehicleId);
    setSelected(null);
  }

  function handleChipClick(chip: ChipData, isAssigned: boolean) {
    if (isAssigned) {
      unassign(chip.type, chip.id);
      setSelected(null);
    } else {
      setSelected((prev) => (prev?.id === chip.id && prev.type === chip.type ? null : { type: chip.type, id: chip.id }));
    }
  }

  const { setNodeRef: setTrayRef, isOver: isOverTray } = useDroppable({ id: "tray" });

  if (!isValidParticipant || !me) return null;

  const allPeopleAssigned = participants.every((p) => personAssignment[p.id]);
  const allBikesAssigned = bikeOwners.every((p) => bikeAssignment[p.id]);
  const isComplete = allPeopleAssigned && allBikesAssigned && name.trim().length > 0;

  async function handleSave() {
    if (!isComplete || !me) return;
    setSaving(true);
    setError(null);
    try {
      await saveVariant({
        shareToken,
        tripId,
        name: name.trim(),
        createdByParticipantId: me.id,
        personAssignment,
        bikeAssignment,
        trailerAssignment,
      });
    } catch {
      setError("Speichern fehlgeschlagen. Versuch's nochmal.");
      setSaving(false);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-black/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-zinc-950">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name der Variante (z.B. 'Vorschlag Sebastian')"
            className="w-full rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
          />
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-6 pb-40">
          <div className="flex flex-col gap-4">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                people={participants
                  .filter((p) => personAssignment[p.id] === vehicle.id)
                  .map((p) => ({ type: "person" as const, id: p.id, name: p.name, photoUrl: p.photoUrl }))}
                bikes={bikeOwners
                  .filter((p) => bikeAssignment[p.id] === vehicle.id)
                  .map((p) => ({ type: "bike" as const, id: p.id, name: p.name }))}
                trailer={(() => {
                  const entry = Object.entries(trailerAssignment).find(([, vId]) => vId === vehicle.id);
                  if (!entry) return null;
                  const trailer = trailers.find((t) => t.id === entry[0]);
                  return trailer ? { type: "trailer" as const, id: trailer.id, name: trailer.name } : null;
                })()}
                selected={selected !== null}
                onSlotClick={() => handleVehicleClick(vehicle.id)}
                onUnassign={(chip) => unassign(chip.type, chip.id)}
              />
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </main>

        <div
          ref={setTrayRef}
          className={`fixed inset-x-0 bottom-0 border-t bg-white px-4 py-3 dark:bg-zinc-950 ${
            isOverTray ? "border-black dark:border-white" : "border-black/10 dark:border-white/10"
          }`}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-4">
            <div className="flex flex-1 gap-2 overflow-x-auto py-1">
              {[...unassignedPeople, ...unassignedBikes, ...unassignedTrailers].map((chip) => (
                <Chip
                  key={`${chip.type}:${chip.id}`}
                  chip={chip}
                  selected={selected?.id === chip.id && selected.type === chip.type}
                  onClick={() => handleChipClick(chip, false)}
                />
              ))}
              {unassignedPeople.length + unassignedBikes.length + unassignedTrailers.length === 0 && (
                <p className="whitespace-nowrap text-sm text-zinc-400 dark:text-zinc-600">
                  Alles zugeordnet 🎉
                </p>
              )}
            </div>
            <button
              disabled={!isComplete || saving}
              onClick={handleSave}
              className="shrink-0 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-40 hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
