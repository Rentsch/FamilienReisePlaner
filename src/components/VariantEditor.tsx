"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IconSteeringWheel, IconLink, IconBike, IconCaravan, IconCar } from "@tabler/icons-react";
import { getStoredParticipant } from "@/lib/participant";
import { addMinutesToTime } from "@/lib/time";
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
type TripTravelTimes = { default: number | null; bikeTrailer: number | null; cargoTrailer: number | null };

type ChipData =
  | { type: "person"; id: string; name: string; photoUrl: string | null }
  | { type: "bike"; id: string; name: string }
  | { type: "trailer"; id: string; name: string };

const AVATAR_SIZE = 56;
const SLOT_SIZE = 44;

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
      className="flex items-center justify-center rounded-full bg-[var(--surface)] text-lg font-medium text-zinc-600 dark:text-zinc-300"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function EmptySlot({
  size = SLOT_SIZE,
  icon,
}: {
  size?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--border)] text-zinc-300 dark:text-zinc-600"
    >
      {icon ?? <span className="text-lg leading-none">+</span>}
    </div>
  );
}

function Chip({
  chip,
  selected,
  onClick,
  badge,
  size = AVATAR_SIZE,
}: {
  chip: ChipData;
  selected: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
  size?: number;
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
      className={`relative flex shrink-0 flex-col items-center gap-1 rounded-lg p-1.5 text-center ${
        selected ? "ring-2 ring-accent" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {chip.type === "person" ? (
        <Avatar name={chip.name} photoUrl={chip.photoUrl} size={size} />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center rounded-full bg-[var(--surface)] text-zinc-500 dark:text-zinc-300"
        >
          {chip.type === "bike" ? (
            <IconBike size={size * 0.5} stroke={1.75} />
          ) : (
            <IconCaravan size={size * 0.5} stroke={1.75} />
          )}
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
      className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border ${
        isDriver
          ? "border-accent bg-accent text-accent-foreground"
          : "border-[var(--border)] bg-[var(--surface)] text-zinc-400"
      }`}
    >
      <IconCar size={14} stroke={2} />
    </button>
  );
}

function SeatCluster({
  label,
  vehicleId,
  row,
  capacity,
  occupants,
  driverId,
  draggingChip,
  draggingPerson,
  onAreaClick,
  onOccupantClick,
  onDriverToggle,
}: {
  label: string;
  vehicleId: string;
  row: SeatRow;
  capacity: number;
  occupants: { id: string; name: string; photoUrl: string | null; canDrive: boolean }[];
  driverId?: string;
  draggingChip: ChipData | null;
  draggingPerson: Participant | null;
  onAreaClick: () => void;
  onOccupantClick: (participantId: string) => void;
  onDriverToggle: (participantId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `vehicle:${vehicleId}:${row.toLowerCase()}` });

  const isFront = row === "FRONT";
  const wouldBeFirstDriverSeat = isFront && occupants.length === 0;
  const reject =
    isOver &&
    draggingChip &&
    (draggingChip.type !== "person" ||
      (isFront && draggingPerson?.backSeatOnly) ||
      (wouldBeFirstDriverSeat && draggingPerson && !draggingPerson.canDrive));

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {label} ({occupants.length}/{capacity})
      </p>
      <div
        ref={setNodeRef}
        onClick={onAreaClick}
        className={`flex flex-wrap gap-1.5 rounded-lg p-1 transition-colors ${
          reject ? "bg-red-500/10 ring-1 ring-red-400/60" : isOver ? "bg-accent/10" : ""
        }`}
      >
        {Array.from({ length: capacity }).map((_, i) => {
          const occupant = occupants[i];
          if (!occupant) {
            return (
              <EmptySlot
                key={i}
                icon={
                  isFront && i === 0 ? (
                    <IconSteeringWheel size={20} stroke={1.75} />
                  ) : undefined
                }
              />
            );
          }
          return (
            <Chip
              key={occupant.id}
              size={SLOT_SIZE}
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
    </div>
  );
}

function TravelPlanRow({
  defaultMinutes,
  departure,
  overrideMinutes,
  onDepartureChange,
  onOverrideChange,
}: {
  defaultMinutes: number | null;
  departure: string | undefined;
  overrideMinutes: number | undefined;
  onDepartureChange: (value: string) => void;
  onOverrideChange: (value: number | undefined) => void;
}) {
  const effectiveMinutes = overrideMinutes ?? defaultMinutes ?? undefined;
  const arrival = departure && effectiveMinutes != null ? addMinutesToTime(departure, effectiveMinutes) : null;

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-[var(--border)] pt-3">
      <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Abfahrt
        <input
          type="time"
          value={departure ?? ""}
          onChange={(e) => onDepartureChange(e.target.value)}
          className="rounded border border-[var(--border)] px-2 py-1 text-sm dark:bg-[var(--surface)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Fahrzeit überschreiben (Min.)
        <input
          type="number"
          min={0}
          placeholder={defaultMinutes != null ? String(defaultMinutes) : "—"}
          value={overrideMinutes ?? ""}
          onChange={(e) => onOverrideChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-32 rounded border border-[var(--border)] px-2 py-1 text-sm dark:bg-[var(--surface)]"
        />
      </label>
      {arrival && (
        <p className="pb-1 text-xs text-zinc-500 dark:text-zinc-400">
          Ankunft ca. {arrival.time}
          {arrival.nextDay && " (+1 Tag)"}
        </p>
      )}
      {effectiveMinutes == null && (
        <p className="pb-1 text-xs text-amber-600 dark:text-amber-400">Keine Fahrzeit hinterlegt</p>
      )}
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
  defaultTravelMinutes,
  departure,
  travelTimeOverride,
  draggingChip,
  draggingPerson,
  onFrontTap,
  onBackTap,
  onHitchTap,
  onBikeSlotTap,
  onOccupantClick,
  onDriverToggle,
  onDetachTrailer,
  onUnassignBike,
  onDepartureChange,
  onTravelTimeOverrideChange,
}: {
  vehicle: Vehicle;
  frontOccupants: { id: string; name: string; photoUrl: string | null; canDrive: boolean }[];
  backOccupants: { id: string; name: string; photoUrl: string | null; canDrive: boolean }[];
  driverId?: string;
  attachedTrailer: Trailer | null | undefined;
  bikesOnAttached: Participant[];
  defaultTravelMinutes: number | null;
  departure: string | undefined;
  travelTimeOverride: number | undefined;
  draggingChip: ChipData | null;
  draggingPerson: Participant | null;
  onFrontTap: () => void;
  onBackTap: () => void;
  onHitchTap: () => void;
  onBikeSlotTap: () => void;
  onOccupantClick: (participantId: string) => void;
  onDriverToggle: (participantId: string) => void;
  onDetachTrailer: (trailerId: string) => void;
  onUnassignBike: (participantId: string) => void;
  onDepartureChange: (value: string) => void;
  onTravelTimeOverrideChange: (value: number | undefined) => void;
}) {
  const { setNodeRef: setHitchRef, isOver: isOverHitch } = useDroppable({
    id: `vehicle:${vehicle.id}:hitch`,
  });
  const { setNodeRef: setBikeSlotsRef, isOver: isOverBikeSlots } = useDroppable({
    id: attachedTrailer ? `trailer:${attachedTrailer.id}:bikes` : `trailer:none:bikes`,
  });

  const hitchReject = isOverHitch && draggingChip && draggingChip.type !== "trailer";
  const bikeSlotsReject = isOverBikeSlots && draggingChip && draggingChip.type !== "bike";

  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium text-foreground">{vehicle.name}</p>
        {!driverId && (frontOccupants.length > 0 || backOccupants.length > 0) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Fahrer fehlt</p>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <SeatCluster
          label="Vorne"
          vehicleId={vehicle.id}
          row="FRONT"
          capacity={vehicle.frontSeats}
          occupants={frontOccupants}
          driverId={driverId}
          draggingChip={draggingChip}
          draggingPerson={draggingPerson}
          onAreaClick={onFrontTap}
          onOccupantClick={onOccupantClick}
          onDriverToggle={onDriverToggle}
        />

        <div className="mt-4 h-11 w-px bg-[var(--border)]" />

        <SeatCluster
          label="Hinten"
          vehicleId={vehicle.id}
          row="BACK"
          capacity={vehicle.seats - vehicle.frontSeats}
          occupants={backOccupants}
          draggingChip={draggingChip}
          draggingPerson={draggingPerson}
          onAreaClick={onBackTap}
          onOccupantClick={onOccupantClick}
          onDriverToggle={() => {}}
        />

        {vehicle.hasTowHitch && (
          <>
            <div className="mt-4 h-11 w-px bg-[var(--border)]" />
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Kupplung</p>
              <div
                ref={setHitchRef}
                onClick={onHitchTap}
                className={`flex rounded-lg p-1 transition-colors ${
                  hitchReject ? "bg-red-500/10 ring-1 ring-red-400/60" : isOverHitch ? "bg-accent/10" : ""
                }`}
              >
                {attachedTrailer ? (
                  <Chip
                    size={SLOT_SIZE}
                    chip={{ type: "trailer", id: attachedTrailer.id, name: attachedTrailer.name }}
                    selected={false}
                    onClick={() => onDetachTrailer(attachedTrailer.id)}
                  />
                ) : (
                  <EmptySlot icon={<IconLink size={20} stroke={1.75} />} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {attachedTrailer?.type === "BIKE_RACK" && (
        <div className="pop-in mt-3 border-t border-[var(--border)] pt-3">
          <p className="mb-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Fahrräder ({bikesOnAttached.length}/{attachedTrailer.capacity ?? 0})
          </p>
          <div
            ref={setBikeSlotsRef}
            onClick={onBikeSlotTap}
            className={`flex flex-wrap gap-1.5 rounded-lg p-1 transition-colors ${
              bikeSlotsReject ? "bg-red-500/10 ring-1 ring-red-400/60" : isOverBikeSlots ? "bg-accent/10" : ""
            }`}
          >
            {Array.from({ length: attachedTrailer.capacity ?? 0 }).map((_, i) => {
              const bikeOwner = bikesOnAttached[i];
              return bikeOwner ? (
                <Chip
                  key={bikeOwner.id}
                  size={SLOT_SIZE}
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

      <TravelPlanRow
        defaultMinutes={defaultTravelMinutes}
        departure={departure}
        overrideMinutes={travelTimeOverride}
        onDepartureChange={onDepartureChange}
        onOverrideChange={onTravelTimeOverrideChange}
      />
    </div>
  );
}

const TABS = [
  { key: "person", label: "Personen" },
  { key: "bike", label: "Fahrräder" },
  { key: "trailer", label: "Hänger" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function VariantEditorInner({
  shareToken,
  tripId,
  isAdminView,
  participants,
  vehicles,
  trailers,
  tripTravelTimes,
  me,
}: {
  shareToken: string;
  tripId: string;
  isAdminView?: boolean;
  participants: Participant[];
  vehicles: Vehicle[];
  trailers: Trailer[];
  tripTravelTimes: TripTravelTimes;
  me: { id: string; name: string };
}) {
  const [name, setName] = useState("");
  const [personAssignment, setPersonAssignment] = useState<Record<string, { vehicleId: string; row: SeatRow }>>({});
  const [driverByVehicle, setDriverByVehicle] = useState<Record<string, string>>({});
  const [bikeAssignment, setBikeAssignment] = useState<Record<string, string>>({});
  const [trailerAssignment, setTrailerAssignment] = useState<Record<string, string>>({});
  const [departureByVehicle, setDepartureByVehicle] = useState<Record<string, string>>({});
  const [travelTimeOverrideByVehicle, setTravelTimeOverrideByVehicle] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<{ type: ChipData["type"]; id: string } | null>(null);
  const [draggingChip, setDraggingChip] = useState<ChipData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("person");
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
    // the first front occupant sits in the driver's seat and must be able to drive
    if (row === "FRONT" && countInRow(vehicleId, "FRONT", participantId) === 0 && !person.canDrive) return;

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

  function setDeparture(vehicleId: string, value: string) {
    setDepartureByVehicle((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[vehicleId];
        return next;
      }
      return { ...prev, [vehicleId]: value };
    });
  }

  function setTravelTimeOverride(vehicleId: string, value: number | undefined) {
    setTravelTimeOverrideByVehicle((prev) => {
      const next = { ...prev };
      if (value == null) delete next[vehicleId];
      else next[vehicleId] = value;
      return next;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const chip = event.active.data.current as ChipData | undefined;
    setDraggingChip(chip ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingChip(null);
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

  const draggingPerson = draggingChip?.type === "person" ? participants.find((p) => p.id === draggingChip.id) ?? null : null;

  const unassignedPeople: ChipData[] = participants
    .filter((p) => !personAssignment[p.id])
    .map((p) => ({ type: "person", id: p.id, name: p.name, photoUrl: p.photoUrl }));
  const unassignedBikes: ChipData[] = bikeOwners
    .filter((p) => !bikeAssignment[p.id])
    .map((p) => ({ type: "bike", id: p.id, name: p.name }));
  const unassignedTrailers: ChipData[] = trailers
    .filter((t) => !trailerAssignment[t.id])
    .map((t) => ({ type: "trailer", id: t.id, name: t.name }));

  const tabCounts: Record<TabKey, number> = {
    person: unassignedPeople.length,
    bike: unassignedBikes.length,
    trailer: unassignedTrailers.length,
  };
  const tabItems: Record<TabKey, ChipData[]> = {
    person: unassignedPeople,
    bike: unassignedBikes,
    trailer: unassignedTrailers,
  };

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
        vehiclePlan: Object.fromEntries(
          vehicles
            .filter((v) => departureByVehicle[v.id] || travelTimeOverrideByVehicle[v.id] != null)
            .map((v) => [
              v.id,
              { departureTime: departureByVehicle[v.id], travelTimeOverrideMinutes: travelTimeOverrideByVehicle[v.id] },
            ]),
        ),
      });
    } catch {
      setError("Speichern fehlgeschlagen. Versuch's nochmal.");
      setSaving(false);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setDraggingChip(null)}>
      <div className="flex flex-1 flex-col bg-background">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
          {isAdminView && (
            <Link
              href={`/trips/${tripId}`}
              className="mb-1 inline-block text-xs font-medium text-accent hover:underline"
            >
              ← Zurück zum Admin-Bereich
            </Link>
          )}
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name der Variante (z.B. 'Vorschlag Sebastian')"
              className="w-full flex-1 rounded border border-[var(--border)] px-3 py-2 text-sm dark:bg-[var(--surface)]"
            />
            <button
              disabled={!isComplete || saving}
              onClick={handleSave}
              className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40 hover:brightness-110"
            >
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-6 pb-40">
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

              const defaultTravelMinutes = !attachedTrailer
                ? tripTravelTimes.default
                : attachedTrailer.type === "BIKE_RACK"
                  ? tripTravelTimes.bikeTrailer
                  : tripTravelTimes.cargoTrailer;

              return (
                <VehicleBlock
                  key={vehicle.id}
                  vehicle={vehicle}
                  frontOccupants={frontOccupants}
                  backOccupants={backOccupants}
                  driverId={driverByVehicle[vehicle.id]}
                  attachedTrailer={attachedTrailer}
                  bikesOnAttached={bikesOnAttached}
                  defaultTravelMinutes={defaultTravelMinutes}
                  departure={departureByVehicle[vehicle.id]}
                  travelTimeOverride={travelTimeOverrideByVehicle[vehicle.id]}
                  draggingChip={draggingChip}
                  draggingPerson={draggingPerson}
                  onFrontTap={() => handleAreaTap("front", vehicle.id)}
                  onBackTap={() => handleAreaTap("back", vehicle.id)}
                  onHitchTap={() => handleAreaTap("hitch", vehicle.id)}
                  onBikeSlotTap={() => attachedTrailer && handleBikeSlotTap(attachedTrailer.id)}
                  onOccupantClick={unassignPerson}
                  onDriverToggle={(pid) => toggleDriver(vehicle.id, pid)}
                  onDetachTrailer={detachTrailer}
                  onUnassignBike={unassignBike}
                  onDepartureChange={(value) => setDeparture(vehicle.id, value)}
                  onTravelTimeOverrideChange={(value) => setTravelTimeOverride(vehicle.id, value)}
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
        </main>

        <div
          ref={setTrayRef}
          className={`fixed inset-x-0 bottom-0 border-t bg-[var(--surface)] px-4 pb-3 pt-2 ${
            isOverTray ? "border-accent" : "border-[var(--border)]"
          }`}
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-1.5 flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-accent text-accent-foreground"
                      : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
                  }`}
                >
                  {tab.label} ({tabCounts[tab.key]})
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto py-1">
              {tabItems[activeTab].map((chip) => (
                <Chip
                  key={`${chip.type}:${chip.id}`}
                  chip={chip}
                  selected={selected?.id === chip.id && selected.type === chip.type}
                  onClick={() => handleTrayChipClick(chip)}
                />
              ))}
              {tabItems[activeTab].length === 0 && (
                <p className="whitespace-nowrap text-sm text-zinc-400 dark:text-zinc-600">
                  {unassignedPeople.length + unassignedBikes.length + unassignedTrailers.length === 0
                    ? "Alles zugeordnet 🎉"
                    : "Nichts mehr offen in dieser Kategorie"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}

export function VariantEditor({
  shareToken,
  tripId,
  isAdminView,
  participants,
  vehicles,
  trailers,
  tripTravelTimes,
}: {
  shareToken: string;
  tripId: string;
  isAdminView?: boolean;
  participants: Participant[];
  vehicles: Vehicle[];
  trailers: Trailer[];
  tripTravelTimes: TripTravelTimes;
}) {
  const router = useRouter();
  // localStorage isn't available during SSR, so `me` starts null on both server
  // and the first client render (avoiding a hydration mismatch) and is filled
  // in after mount; `checked` distinguishes "still loading" from "no participant".
  const [{ me, checked }, setParticipantState] = useState<{
    me: { id: string; name: string } | null;
    checked: boolean;
  }>({ me: null, checked: false });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read, see comment above
    setParticipantState({ me: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const isValidParticipant = me !== null && participants.some((p) => p.id === me.id);

  useEffect(() => {
    if (checked && !isValidParticipant) router.replace(`/t/${shareToken}`);
  }, [checked, isValidParticipant, shareToken, router]);

  if (!checked || !isValidParticipant || !me) return null;

  return (
    <VariantEditorInner
      shareToken={shareToken}
      tripId={tripId}
      isAdminView={isAdminView}
      participants={participants}
      vehicles={vehicles}
      trailers={trailers}
      tripTravelTimes={tripTravelTimes}
      me={me}
    />
  );
}
