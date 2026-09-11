import { addMinutesToTime, formatDurationHM } from "@/lib/time";

export type VehicleView = {
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

type TripForVehicleViews = {
  travelTimeMinutes: number | null;
  travelTimeWithBikeTrailerMinutes: number | null;
  travelTimeWithCargoTrailerMinutes: number | null;
  tripVehicles: { id: string }[];
};

type VariantForVehicleViews = {
  personAssignments: {
    tripVehicleId: string;
    row: "FRONT" | "BACK";
    isDriver: boolean;
    tripParticipant: { person: { name: string; photoUrl: string | null } };
    tripVehicle: { vehicle: { name: string; frontSeats: number; seats: number } };
  }[];
  trailerAssignments: {
    tripVehicleId: string;
    tripTrailerId: string;
    tripTrailer: { trailer: { name: string; type: "CARGO" | "BIKE_RACK" } };
  }[];
  bikeAssignments: {
    tripTrailerId: string;
    tripParticipant: { person: { name: string } };
  }[];
  vehiclePlans: {
    tripVehicleId: string;
    departureTime: Date | null;
    travelTimeOverrideMinutes: number | null;
  }[];
};

function formatTime(date: Date) {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

// Builds the per-vehicle view used by both the single-variant detail page and the
// variant-compare table. Vehicle order follows the trip's fixed tripVehicle order (not
// first-appearance in this variant's assignments) so cars line up in the same order and
// position across every variant, making them directly comparable.
export function buildVehicleViews(trip: TripForVehicleViews, variant: VariantForVehicleViews): VehicleView[] {
  const usedVehicleIds = new Set(variant.personAssignments.map((pa) => pa.tripVehicleId));
  const orderedVehicleIds = trip.tripVehicles.map((tv) => tv.id).filter((id) => usedVehicleIds.has(id));

  return orderedVehicleIds.map((vehicleId) => {
    const personAssignmentsForVehicle = variant.personAssignments.filter((pa) => pa.tripVehicleId === vehicleId);
    const vehicle = personAssignmentsForVehicle[0].tripVehicle.vehicle;
    const driver = personAssignmentsForVehicle.find((pa) => pa.isDriver);
    const attachedTrailerAssignment = variant.trailerAssignments.find((ta) => ta.tripVehicleId === vehicleId);
    const attachedTrailerId = attachedTrailerAssignment?.tripTrailerId;
    const bikesOnTrailer = attachedTrailerId
      ? variant.bikeAssignments.filter((ba) => ba.tripTrailerId === attachedTrailerId)
      : [];

    const trailerType = attachedTrailerAssignment?.tripTrailer.trailer.type;
    const defaultMinutes = !trailerType
      ? trip.travelTimeMinutes
      : trailerType === "BIKE_RACK"
        ? trip.travelTimeWithBikeTrailerMinutes
        : trip.travelTimeWithCargoTrailerMinutes;

    const plan = variant.vehiclePlans.find((p) => p.tripVehicleId === vehicleId);
    const effectiveMinutes = plan?.travelTimeOverrideMinutes ?? defaultMinutes ?? null;
    const departure = plan?.departureTime ? formatTime(plan.departureTime) : null;
    const arrival =
      departure && effectiveMinutes != null ? addMinutesToTime(departure, effectiveMinutes) : null;

    return {
      id: vehicleId,
      name: vehicle.name,
      frontSeats: vehicle.frontSeats,
      seats: vehicle.seats,
      driverName: driver?.tripParticipant.person.name ?? null,
      front: personAssignmentsForVehicle
        .filter((pa) => pa.row === "FRONT")
        .map((pa) => ({
          name: pa.tripParticipant.person.name,
          photoUrl: pa.tripParticipant.person.photoUrl,
          isDriver: pa.isDriver,
        }))
        // the driver always renders in the driver's seat (slot 0); remaining front seats are
        // sorted by name so the same set of people always lands in the same table row,
        // regardless of the order they were assigned in.
        .sort((a, b) => Number(b.isDriver) - Number(a.isDriver) || a.name.localeCompare(b.name)),
      back: personAssignmentsForVehicle
        .filter((pa) => pa.row === "BACK")
        .map((pa) => ({ name: pa.tripParticipant.person.name, photoUrl: pa.tripParticipant.person.photoUrl }))
        // back seats have no stored left/right identity — sort by name for the same reason.
        .sort((a, b) => a.name.localeCompare(b.name)),
      trailerName: attachedTrailerAssignment?.tripTrailer.trailer.name ?? null,
      trailerType: trailerType ?? null,
      bikes: bikesOnTrailer
        .map((ba) => ({ name: ba.tripParticipant.person.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      departure,
      arrival: arrival ? `${arrival.time}${arrival.nextDay ? " (+1 Tag)" : ""}` : null,
      travelDuration: departure && effectiveMinutes != null ? formatDurationHM(effectiveMinutes) : null,
    };
  });
}
