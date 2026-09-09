import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addMinutesToTime } from "@/lib/time";
import { getAdminUser } from "@/lib/auth";
import { VariantDetail } from "@/components/VariantDetail";

export default async function VariantDetailPage({
  params,
}: {
  params: Promise<{ shareToken: string; variantId: string }>;
}) {
  const { shareToken, variantId } = await params;

  const [trip, adminUser] = await Promise.all([
    prisma.trip.findUnique({
      where: { shareToken },
      include: { participants: true },
    }),
    getAdminUser(),
  ]);
  if (!trip) notFound();

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: {
      createdBy: { include: { person: true } },
      votes: true,
      personAssignments: {
        include: { tripParticipant: { include: { person: true } }, tripVehicle: { include: { vehicle: true } } },
      },
      bikeAssignments: {
        include: { tripParticipant: { include: { person: true } }, tripTrailer: { include: { trailer: true } } },
      },
      trailerAssignments: {
        include: { tripTrailer: { include: { trailer: true } } },
      },
      vehiclePlans: true,
    },
  });
  if (!variant || variant.tripId !== trip.id) notFound();

  function formatTime(date: Date) {
    return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  }

  const usedVehicleIds = new Set(variant.personAssignments.map((pa) => pa.tripVehicleId));

  const vehicles = [...usedVehicleIds].map((vehicleId) => {
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
        })),
      back: personAssignmentsForVehicle
        .filter((pa) => pa.row === "BACK")
        .map((pa) => ({ name: pa.tripParticipant.person.name, photoUrl: pa.tripParticipant.person.photoUrl })),
      trailerName: attachedTrailerAssignment?.tripTrailer.trailer.name ?? null,
      bikes: bikesOnTrailer.map((ba) => ba.tripParticipant.person.name),
      departure,
      arrival: arrival ? `${arrival.time}${arrival.nextDay ? " (+1 Tag)" : ""}` : null,
    };
  });

  return (
    <VariantDetail
      shareToken={shareToken}
      tripId={trip.id}
      isAdminView={adminUser?.id === trip.adminUserId}
      participants={trip.participants.map((p) => p.id)}
      variant={{
        id: variant.id,
        name: variant.name,
        creatorName: variant.createdBy.person.name,
        voteCount: variant.votes.length,
        voterParticipantIds: variant.votes.map((v) => v.tripParticipantId),
        vehicles,
      }}
    />
  );
}
