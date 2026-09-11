import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { VariantEditor } from "@/components/VariantEditor";

export default async function NewVariantPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

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

  return (
    <VariantEditor
      shareToken={shareToken}
      tripId={trip.id}
      isAdminView={adminUser?.id === trip.adminUserId}
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
