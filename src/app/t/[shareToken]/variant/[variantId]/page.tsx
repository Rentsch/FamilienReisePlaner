import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VariantDetail } from "@/components/VariantDetail";

export default async function VariantDetailPage({
  params,
}: {
  params: Promise<{ shareToken: string; variantId: string }>;
}) {
  const { shareToken, variantId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { shareToken },
    include: { participants: true },
  });
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
        include: {
          tripParticipant: { include: { person: true } },
          tripVehicle: { include: { vehicle: true } },
          tripTrailer: { include: { trailer: true } },
        },
      },
      trailerAssignments: {
        include: { tripTrailer: { include: { trailer: true } }, tripVehicle: { include: { vehicle: true } } },
      },
    },
  });
  if (!variant || variant.tripId !== trip.id) notFound();

  const vehicles = variant.personAssignments
    .reduce(
      (acc, pa) => {
        const key = pa.tripVehicleId;
        if (!acc.some((v) => v.id === key)) {
          acc.push({ id: key, name: pa.tripVehicle.vehicle.name, seats: pa.tripVehicle.vehicle.seats });
        }
        return acc;
      },
      [] as { id: string; name: string; seats: number }[],
    )
    .concat(
      variant.bikeAssignments
        .filter((ba) => ba.tripVehicleId && !variant.personAssignments.some((pa) => pa.tripVehicleId === ba.tripVehicleId))
        .map((ba) => ({ id: ba.tripVehicleId!, name: ba.tripVehicle!.vehicle.name, seats: ba.tripVehicle!.vehicle.seats })),
    )
    .map((v) => ({
      ...v,
      people: variant.personAssignments
        .filter((pa) => pa.tripVehicleId === v.id)
        .map((pa) => ({ name: pa.tripParticipant.person.name, photoUrl: pa.tripParticipant.person.photoUrl })),
      bikes: variant.bikeAssignments
        .filter((ba) => ba.tripVehicleId === v.id)
        .map((ba) => ba.tripParticipant.person.name),
      trailer: variant.trailerAssignments.find((ta) => ta.tripVehicleId === v.id)?.tripTrailer.trailer.name ?? null,
    }));

  return (
    <VariantDetail
      shareToken={shareToken}
      tripId={trip.id}
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
