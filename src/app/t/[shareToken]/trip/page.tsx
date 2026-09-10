import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { TripVariantsView } from "@/components/TripVariantsView";
import { computeTripStats } from "@/lib/tripStats";

export default async function TripVariantsPage({
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
        variants: {
          include: {
            createdBy: { include: { person: true } },
            votes: true,
            personAssignments: { select: { tripVehicleId: true, tripParticipantId: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { tripVehicles: true } },
      },
    }),
    getAdminUser(),
  ]);

  if (!trip) notFound();

  const variants = trip.variants.map((v) => ({
    id: v.id,
    name: v.name,
    creatorName: v.createdBy.person.name,
    voteCount: v.votes.length,
    usedVehicles: new Set(v.personAssignments.map((a) => a.tripVehicleId)).size,
    voterParticipantIds: v.votes.map((vote) => vote.tripParticipantId),
    isIncomplete: new Set(v.personAssignments.map((a) => a.tripParticipantId)).size < trip.participants.length,
  }));

  const participants = trip.participants.map((p) => ({ id: p.id, name: p.person.name }));

  const stats = computeTripStats({
    participants: trip.participants,
    vehicleCount: trip._count.tripVehicles,
    variantCount: trip.variants.length,
  });

  return (
    <TripVariantsView
      shareToken={shareToken}
      tripId={trip.id}
      tripName={trip.name}
      tripDate={trip.date}
      isAdminView={adminUser?.id === trip.adminUserId}
      participants={participants}
      variants={variants}
      stats={stats}
    />
  );
}
