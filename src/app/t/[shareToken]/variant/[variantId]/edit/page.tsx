import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { VariantEditor, type InitialVariant } from "@/components/VariantEditor";

export default async function EditVariantPage({
  params,
}: {
  params: Promise<{ shareToken: string; variantId: string }>;
}) {
  const { shareToken, variantId } = await params;

  const [trip, adminUser] = await Promise.all([
    prisma.trip.findUnique({
      where: { shareToken },
      include: {
        participants: { include: { person: true } },
        tripVehicles: { include: { vehicle: true } },
        tripTrailers: { include: { trailer: true } },
      },
    }),
    getAdminUser(),
  ]);
  if (!trip) notFound();

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: {
      personAssignments: true,
      bikeAssignments: true,
      trailerAssignments: true,
      vehiclePlans: true,
    },
  });
  if (!variant || variant.tripId !== trip.id) notFound();

  function formatTime(date: Date) {
    return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  }

  const initialVariant: InitialVariant = {
    id: variant.id,
    name: variant.name,
    createdByParticipantId: variant.createdByParticipantId,
    personAssignment: Object.fromEntries(
      variant.personAssignments.map((pa) => [pa.tripParticipantId, { vehicleId: pa.tripVehicleId, row: pa.row }]),
    ),
    driverByVehicle: Object.fromEntries(
      variant.personAssignments.filter((pa) => pa.isDriver).map((pa) => [pa.tripVehicleId, pa.tripParticipantId]),
    ),
    bikeAssignment: Object.fromEntries(
      variant.bikeAssignments.map((ba) => [ba.tripParticipantId, ba.tripTrailerId]),
    ),
    trailerAssignment: Object.fromEntries(
      variant.trailerAssignments.map((ta) => [ta.tripTrailerId, ta.tripVehicleId]),
    ),
    departureByVehicle: Object.fromEntries(
      variant.vehiclePlans
        .filter((p) => p.departureTime)
        .map((p) => [p.tripVehicleId, formatTime(p.departureTime as Date)]),
    ),
    travelTimeOverrideByVehicle: Object.fromEntries(
      variant.vehiclePlans
        .filter((p) => p.travelTimeOverrideMinutes != null)
        .map((p) => [p.tripVehicleId, p.travelTimeOverrideMinutes as number]),
    ),
  };

  return (
    <VariantEditor
      shareToken={shareToken}
      tripId={trip.id}
      isAdminView={adminUser?.id === trip.adminUserId}
      initialVariant={initialVariant}
      participants={trip.participants.map((p) => ({
        id: p.id,
        name: p.person.name,
        photoUrl: p.person.photoUrl,
        hasBike: p.hasBike,
        canDrive: p.person.canDrive,
        backSeatOnly: p.person.backSeatOnly,
      }))}
      vehicles={trip.tripVehicles.map((v) => ({
        id: v.id,
        name: v.vehicle.name,
        seats: v.vehicle.seats,
        frontSeats: v.vehicle.frontSeats,
        hasTowHitch: v.vehicle.hasTowHitch,
      }))}
      trailers={trip.tripTrailers.map((t) => ({
        id: t.id,
        name: t.trailer.name,
        type: t.trailer.type,
        capacity: t.trailer.capacity,
      }))}
      tripTravelTimes={{
        default: trip.travelTimeMinutes,
        bikeTrailer: trip.travelTimeWithBikeTrailerMinutes,
        cargoTrailer: trip.travelTimeWithCargoTrailerMinutes,
      }}
      defaultDepartureTime={trip.defaultDepartureTime}
    />
  );
}
