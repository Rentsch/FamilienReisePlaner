import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { buildVehicleViews } from "@/lib/variantView";
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
      include: { participants: true, tripVehicles: { orderBy: { id: "asc" } } },
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

  const vehicles = buildVehicleViews(trip, variant);

  return (
    <VariantDetail
      shareToken={shareToken}
      tripId={trip.id}
      isAdminView={adminUser?.id === trip.adminUserId}
      participants={trip.participants.map((p) => p.id)}
      tripName={trip.name}
      tripDate={trip.date}
      variant={{
        id: variant.id,
        name: variant.name,
        creatorName: variant.createdBy.person.name,
        createdByParticipantId: variant.createdByParticipantId,
        voteCount: variant.votes.length,
        voterParticipantIds: variant.votes.map((v) => v.tripParticipantId),
        vehicles,
      }}
    />
  );
}
