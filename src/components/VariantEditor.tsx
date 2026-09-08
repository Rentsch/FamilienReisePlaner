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
import { saveVariant, type SeatRow } from "@/app/t/[shareToken]/variant/actions";

type Participant = {
  id: string;
  name: string;
  photoUrl: string | null;
  hasBike: boolean;
  canDrive: boolean;
  backSeatOnly: boolean;
};
type Vehicle = { id: string; name: string; seats: number; frontSeats: number; hasTowHitch: boolean };
type Trailer = { id: string; name: string; type: "CARGO" | "BIKE_RACK"; capacity: number | null };

type ChipData =
  | { type: "person"; id: string; name: string; photoUrl: string | null }
  | { type: "bike"; id: string; name: string }
  | { type: "trailer"; id: string; name: string };

const AVATAR_SIZE = 56;

function Avatar({ name, photoUrl, size = AVATAR_SIZE }: { name: string; photoUrl: string | null; size?: number }) {
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
      className="flex items-center justify-center rounded-full bg-zinc-200 text-lg font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function EmptySlot({ size = AVATAR_SIZE }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full border-2 border-dashed border-zinc-300 text-xl text-zinc-300 dark:border-zinc-700 dark:text-zinc-700"
    >
      +
    </div>
  );
}

function Chip({
  chip,
  selected,
  onClick,
  badge,
}: {
  chip: ChipData;
  selected: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
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
      className={`relative flex shrink-0 flex-col items-center gap-1 rounded-lg p-2 text-center ${
        selected ? "ring-2 ring-black dark:ring-white" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {chip.type === "person" ? (
        <Avatar name={chip.name} photoUrl={chip.photoUrl} />
      ) : (
        <div
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          className="flex items-center justify-center rounded-full bg-zinc-100 text-2xl dark:bg-zinc-800"
        >
          {chip.type === "bike" ? "🚲" : "🚚"}
        </div>
      )}
      {badge}
      <span className="max-w-[76px] truncate text-xs text-zinc-700 dark:text-zinc-300">
        {chip.name}
      </span>
    </button>
  );
}

function DriverBadge({ isDriver, onToggle }: { isDriver: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={isDriver ? "Fährt dieses Auto" : "Als Fahrer festlegen"}
      className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
        isDriver
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-zinc-300 bg-white text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
      }`}
    >
      🚗
    </button>
  );
}

function SeatRowArea({
  vehicleId,
  row,
  capacity,
  occupants,
  driverId,
  onAreaClick,
  onOccupantClick,
  onDriverToggle,
}: {
  vehicleId: string;
  row: SeatRow;
  capacity: number;
  occupants: { id: string; name: string; photoUrl: string | null; canDrive: boolean }[];
  driverId?: string;
  onAreaClick: () => void;
  onOccupantClick: (participantId: string) => void;
  onDriverToggle: (participantId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `vehicle:${vehicleId}:${row.toLowerCase()}` });

  return (
    <div
      ref={setNodeRef}
      onClick={onAreaClick}
      className={`flex flex-wrap gap-2 rounded-lg p-2 transition-colors ${
        isOver ? "bg-black/[.04] dark:bg-white/[.08]" : ""
      }`}
    >
      {Array.from({ length: capacity }).map((_, i) => {
        const occupant = occupants[i];
        if (!occupant) return <EmptySlot key={i} />;
        return (
          <Chip
            key={occupant.id}
            chip={{ type: "person", id: occupant.id, name: occupant.name, photoUrl: occupant.photoUrl }}
            selected={false}
            onClick={() => onOccupantClick(occupant.id)}
            badge={
              row === "FRONT" && occupant.canDrive ? (
                <DriverBadge
                  isDriver={driverId === occupant.id}
                  onToggle={() => onDriverToggle(occupant.id)}
                />
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}

function VehicleBlock({
  vehicle,
  frontOccupants,
  backOccupants,
  driverId,
  attachedTrailer,
  bikesOnAttached,
  onFrontTap,
  onBackTap,
  onHitchTap,
  onBikeSlotTap,
  onOccupantClick,
  onDriverToggle,
  onDetachTrailer,
  onUnassignBike,
}: {
  vehicle: Vehicle;
  frontOccupants: { id: string; name: string; photoUrl: string | null; canDrive: boolean }[];
  backOccupants: { id: string; name: string; photoUrl: string | null; canDrive: boolean }[];
  driverId?: string;
  attachedTrailer: Trailer | null | undefined;
  bikesOnAttached: Participant[];
  onFrontTap: () => void;
  onBackTap: () => void;
  onHitchTap: () => void;
  onBikeSlotTap: () => void;
  onOccupantClick: (participantId: string) => void;
  onDriverToggle: (participantId: string) => void;
  onDetachTrailer: (trailerId: string) => void;
  onUnassignBike: (participantId: string) => void;
}) {
  const { setNodeRef: setHitchRef, isOver: isOverHitch } = useDroppable({
    id: `vehicle:${vehicle.id}:hitch`,
  });
  const { setNodeRef: setBikeSlotsRef, isOver: isOverBikeSlots } = useDroppable({
    id: attachedTrailer ? `trailer:${attachedTrailer.id}:bikes` : `trailer:none:bikes`,
  });

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium text-black dark:text-zinc-50">{vehicle.name}</p>
        {!driverId && (frontOccupants.length > 0 || backOccupants.length > 0) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Fahrer fehlt</p>
        )}
      </div>

      <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
        Vorne ({frontOccupants.length}/{vehicle.frontSeats})
      </p>
      <SeatRowArea
        vehicleId={vehicle.id}
        row="FRONT"
        capacity={vehicle.frontSeats}
        occupants={frontOccupants}
        driverId={driverId}
        onAreaClick={onFrontTap}
        onOccupantClick={onOccupantClick}
        onDriverToggle={onDriverToggle}
      />

      <p className="mb-1 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Hinten ({backOccupants.length}/{vehicle.seats - vehicle.frontSeats})
      </p>
      <SeatRowArea
        vehicleId={vehicle.id}
        row="BACK"
        capacity={vehicle.seats - vehicle.frontSeats}
        occupants={backOccupants}
        onAreaClick={onBackTap}
        onOccupantClick={onOccupantClick}
        onDriverToggle={() => {}}
      />

      {vehicle.hasTowHitch && (
        <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
          <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Anhänger</p>
          <div
            ref={setHitchRef}
            onClick={onHitchTap}
            className={`flex min-h-[56px] items-center gap-2 rounded-lg p-2 transition-colors ${
              isOverHitch ? "bg-black/[.04] dark:bg-white/[.08]" : ""
            }`}
          >
            {attachedTrailer ? (
              <Chip
                chip={{ type: "trailer", id: attachedTrailer.id, name: attachedTrailer.name }}
                selected={false}
                onClick={() => onDetachTrailer(attachedTrailer.id)}
              />
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-600">Kupplung frei</span>
            )}
          </div>
        </div>
      )}

      {attachedTrailer?.type === "BIKE_RACK" && (
        <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/5">
          <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
            Fahrräder ({bikesOnAttached.length}/{attachedTrailer.capacity ?? 0})
          </p>
          <div
            ref={setBikeSlotsRef}
            onClick={onBikeSlotTap}
            className={`flex flex-wrap gap-2 rounded-lg p-2 transition-colors ${
              isOverBikeSlots ? "bg-black/[.04] dark:bg-white/[.08]" : ""
            }`}
          >
            {Array.from({ length: attachedTrailer.capacity ?? 0 }).map((_, i) => {
              const bikeOwner = bikesOnAttached[i];
              return bikeOwner ? (
                <Chip
                  key={bikeOwner.id}
                  chip={{ type: "bike", id: bikeOwner.id, name: bikeOwner.name }}
                  selected={false}
                  onClick={() => onUnassignBike(bikeOwner.id)}
                />
              ) : (
                <EmptySlot key={i} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function VariantEditorInner({
  shareToken,
  tripId,
  participants,
  vehicles,
  trailers,
  me,
}: {
  shareToken: string;
  tripId: string;
  participants: Participant[];
  vehicles: Vehicle[];
  trailers: Trailer[];
  me: { id: string; name: string };
}) {
  const [name, setName] = useState("");
  const [personAssignment, setPersonAssignment] = useState<Record<string, { vehicleId: string; row: SeatRow }>>({});
  const [driverByVehicle, setDriverByVehicle] = useState<Record<string, string>>({});
  const [bikeAssignment, setBikeAssignment] = useState<Record<string, string>>({});
  const [trailerAssignment, setTrailerAssignment] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<{ type: ChipData["type"]; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const bikeOwners = useMemo(() => participants.filter((p) => p.hasBike), [participants]);

  function countInRow(vehicleId: string, row: SeatRow, excludeId?: string) {
    return Object.entries(personAssignment).filter(
      ([pid, a]) => a.vehicleId === vehicleId && a.row === row && pid !== excludeId,
    ).length;
  }

  function assignPersonToSeat(participantId: string, vehicleId: string, row: SeatRow) {
    const person = participants.find((p) => p.id === participantId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!person || !vehicle) return;
    if (row === "FRONT" && person.backSeatOnly) return;

    const capacity = row === "FRONT" ? vehicle.frontSeats : vehicle.seats - vehicle.frontSeats;
    if (countInRow(vehicleId, row, participantId) >= capacity) return;

    const old = personAssignment[participantId];
    if (old && (old.vehicleId !== vehicleId || old.row !== row) && driverByVehicle[old.vehicleId] === participantId) {
      setDriverByVehicle((prev) => {
        const next = { ...prev };
        delete next[old.vehicleId];
        return next;
      });
    }

    setPersonAssignment((prev) => ({ ...prev, [participantId]: { vehicleId, row } }));
  }

  function unassignPerson(participantId: string) {
    const removed = personAssignment[participantId];
    setPersonAssignment((prev) => {
      const next = { ...prev };
      delete next[participantId];
      return next;
    });
    if (removed && driverByVehicle[removed.vehicleId] === participantId) {
      setDriverByVehicle((prev) => {
        const next = { ...prev };
        delete next[removed.vehicleId];
        return next;
      });
    }
  }

  function toggleDriver(vehicleId: string, participantId: string) {
    const person = participants.find((p) => p.id === participantId);
    if (!person?.canDrive) return;
    setDriverByVehicle((prev) =>
      prev[vehicleId] === participantId
        ? (() => {
            const next = { ...prev };
            delete next[vehicleId];
            return next;
          })()
        : { ...prev, [vehicleId]: participantId },
    );
  }

  function assignBike(participantId: string, trailerId: string) {
    const trailer = trailers.find((t) => t.id === trailerId);
    if (!trailer || trailer.type !== "BIKE_RACK" || !trailerAssignment[trailerId]) return;
    const capacity = trailer.capacity ?? 0;
    const current = Object.entries(bikeAssignment).filter(
      ([pid, tid]) => tid === trailerId && pid !== participantId,
    ).length;
    if (current >= capacity) return;
    setBikeAssignment((prev) => ({ ...prev, [participantId]: trailerId }));
  }

  function unassignBike(participantId: string) {
    setBikeAssignment((prev) => {
      const next = { ...prev };
      delete next[participantId];
      return next;
    });
  }

  function attachTrailer(trailerId: string, vehicleId: string) {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle?.hasTowHitch) return;
    const alreadyTowing = Object.entries(trailerAssignment).some(
      ([tid, vid]) => vid === vehicleId && tid !== trailerId,
    );
    if (alreadyTowing) return;
    setTrailerAssignment((prev) => ({ ...prev, [trailerId]: vehicleId }));
  }

  function detachTrailer(trailerId: string) {
    setTrailerAssignment((prev) => {
      const next = { ...prev };
      delete next[trailerId];
      return next;
    });
    setBikeAssignment((prev) => {
      const next = { ...prev };
      for (const pid of Object.keys(next)) {
        if (next[pid] === trailerId) delete next[pid];
      }
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const [type, id] = String(active.id).split(":") as [ChipData["type"], string];
    const overId = String(over.id);

    if (overId === "tray") {
      if (type === "person") unassignPerson(id);
      else if (type === "bike") unassignBike(id);
      else if (type === "trailer") detachTrailer(id);
      return;
    }

    const parts = overId.split(":");
    if (parts[0] === "vehicle" && (parts[2] === "front" || parts[2] === "back") && type === "person") {
      assignPersonToSeat(id, parts[1], parts[2].toUpperCase() as SeatRow);
    } else if (parts[0] === "vehicle" && parts[2] === "hitch" && type === "trailer") {
      attachTrailer(id, parts[1]);
    } else if (parts[0] === "trailer" && parts[2] === "bikes" && type === "bike") {
      assignBike(id, parts[1]);
    }
  }

  function handleAreaTap(kind: "front" | "back" | "hitch", vehicleId: string) {
    if (!selected) return;
    if ((kind === "front" || kind === "back") && selected.type === "person") {
      assignPersonToSeat(selected.id, vehicleId, kind.toUpperCase() as SeatRow);
      setSelected(null);
    } else if (kind === "hitch" && selected.type === "trailer") {
      attachTrailer(selected.id, vehicleId);
      setSelected(null);
    }
  }

  function handleBikeSlotTap(trailerId: string) {
    if (selected?.type === "bike") {
      assignBike(selected.id, trailerId);
      setSelected(null);
    }
  }

  function handleTrayChipClick(chip: ChipData) {
    setSelected((prev) => (prev?.id === chip.id && prev.type === chip.type ? null : { type: chip.type, id: chip.id }));
  }

  const { setNodeRef: setTrayRef, isOver: isOverTray } = useDroppable({ id: "tray" });

  const unassignedPeople: ChipData[] = participants
    .filter((p) => !personAssignment[p.id])
    .map((p) => ({ type: "person", id: p.id, name: p.name, photoUrl: p.photoUrl }));
  const unassignedBikes: ChipData[] = bikeOwners
    .filter((p) => !bikeAssignment[p.id])
    .map((p) => ({ type: "bike", id: p.id, name: p.name }));
  const unassignedTrailers: ChipData[] = trailers
    .filter((t) => !trailerAssignment[t.id])
    .map((t) => ({ type: "trailer", id: t.id, name: t.name }));

  const allPeopleAssigned = participants.every((p) => personAssignment[p.id]);
  const allBikesAssigned = bikeOwners.every((p) => bikeAssignment[p.id]);
  const allUsedVehiclesHaveDrivers = vehicles.every((v) => {
    const used = countInRow(v.id, "FRONT") + countInRow(v.id, "BACK") > 0;
    return !used || !!driverByVehicle[v.id];
  });
  const isComplete = allPeopleAssigned && allBikesAssigned && allUsedVehiclesHaveDrivers && name.trim().length > 0;

  async function handleSave() {
    if (!isComplete) return;
    setSaving(true);
    setError(null);
    try {
      await saveVariant({
        shareToken,
        tripId,
        name: name.trim(),
        createdByParticipantId: me.id,
        personAssignment: Object.fromEntries(
          Object.entries(personAssignment).map(([pid, a]) => [pid, { tripVehicleId: a.vehicleId, row: a.row }]),
        ),
        driverByVehicle,
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

        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-6 pb-44">
          <div className="flex flex-col gap-4">
            {vehicles.map((vehicle) => {
              const frontOccupants = participants
                .filter((p) => personAssignment[p.id]?.vehicleId === vehicle.id && personAssignment[p.id]?.row === "FRONT")
                .map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, canDrive: p.canDrive }));
              const backOccupants = participants
                .filter((p) => personAssignment[p.id]?.vehicleId === vehicle.id && personAssignment[p.id]?.row === "BACK")
                .map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, canDrive: p.canDrive }));

              const attachedTrailerId = Object.entries(trailerAssignment).find(([, vId]) => vId === vehicle.id)?.[0];
              const attachedTrailer = attachedTrailerId ? trailers.find((t) => t.id === attachedTrailerId) : null;
              const bikesOnAttached = attachedTrailerId
                ? bikeOwners.filter((p) => bikeAssignment[p.id] === attachedTrailerId)
                : [];

              return (
                <VehicleBlock
                  key={vehicle.id}
                  vehicle={vehicle}
                  frontOccupants={frontOccupants}
                  backOccupants={backOccupants}
                  driverId={driverByVehicle[vehicle.id]}
                  attachedTrailer={attachedTrailer}
                  bikesOnAttached={bikesOnAttached}
                  onFrontTap={() => handleAreaTap("front", vehicle.id)}
                  onBackTap={() => handleAreaTap("back", vehicle.id)}
                  onHitchTap={() => handleAreaTap("hitch", vehicle.id)}
                  onBikeSlotTap={() => attachedTrailer && handleBikeSlotTap(attachedTrailer.id)}
                  onOccupantClick={unassignPerson}
                  onDriverToggle={(pid) => toggleDriver(vehicle.id, pid)}
                  onDetachTrailer={detachTrailer}
                  onUnassignBike={unassignBike}
                />
              );
            })}

            {unassignedBikes.length > 0 &&
              !trailers.some((t) => t.type === "BIKE_RACK" && trailerAssignment[t.id]) && (
                <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                  Für Fahrräder muss zuerst ein Fahrradträger an ein Auto angehängt werden.
                </p>
              )}
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
                  onClick={() => handleTrayChipClick(chip)}
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
  const isValidParticipant = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (!isValidParticipant) router.replace(`/t/${shareToken}`);
  }, [isValidParticipant, shareToken, router]);

  if (!isValidParticipant || !me) return null;

  return (
    <VariantEditorInner
      shareToken={shareToken}
      tripId={tripId}
      participants={participants}
      vehicles={vehicles}
      trailers={trailers}
      me={me}
    />
  );
}
