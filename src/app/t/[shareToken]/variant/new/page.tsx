import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VariantEditor } from "@/components/VariantEditor";

export default async function NewVariantPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const trip = await prisma.trip.findUnique({
    where: { shareToken },
    include: {
      participants: { include: { person: true } },
      tripVehicles: { include: { vehicle: true } },
      tripTrailers: { include: { trailer: true } },
    },
  });

  if (!trip) notFound();

  return (
    <VariantEditor
      shareToken={shareToken}
      tripId={trip.id}
      participants={trip.participants.map((p) => ({
        id: p.id,
        name: p.person.name,
        photoUrl: p.person.photoUrl,
        hasBike: p.hasBike,
      }))}
      vehicles={trip.tripVehicles.map((v) => ({
        id: v.id,
        name: v.vehicle.name,
        seats: v.vehicle.seats,
        hasTowHitch: v.vehicle.hasTowHitch,
      }))}
      trailers={trip.tripTrailers.map((t) => ({ id: t.id, name: t.trailer.name }))}
    />
  );
}
