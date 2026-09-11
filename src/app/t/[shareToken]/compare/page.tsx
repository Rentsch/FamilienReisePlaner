import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { buildVehicleViews } from "@/lib/variantView";
import { VariantCompareView } from "@/components/VariantCompareView";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ variants?: string }>;
}) {
  const { shareToken } = await params;
  const { variants: variantsParam } = await searchParams;

  const [trip, adminUser] = await Promise.all([
    prisma.trip.findUnique({
      where: { shareToken },
      include: {
        participants: { include: { person: true } },
        tripVehicles: { orderBy: { id: "asc" } },
        variants: {
          orderBy: { createdAt: "asc" },
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
        },
      },
    }),
    getAdminUser(),
  ]);
  if (!trip) notFound();
  if (trip.variants.length < 2) notFound();

  const allVariants = trip.variants.map((v) => ({
    id: v.id,
    name: v.name,
    creatorName: v.createdBy.person.name,
    voteCount: v.votes.length,
    voterParticipantIds: v.votes.map((vote) => vote.tripParticipantId),
    vehicles: buildVehicleViews(trip, v),
  }));

  const requestedIds = (variantsParam ?? "").split(",").filter((id) => allVariants.some((v) => v.id === id));
  const initialSelectedIds = requestedIds.length >= 2 ? requestedIds : allVariants.slice(0, 2).map((v) => v.id);

  return (
    <VariantCompareView
      shareToken={shareToken}
      tripId={trip.id}
      tripName={trip.name}
      tripDate={trip.date}
      isAdminView={adminUser?.id === trip.adminUserId}
      participants={trip.participants.map((p) => ({ id: p.id, name: p.person.name }))}
      vehicleOrder={trip.tripVehicles.map((tv) => tv.id)}
      allVariants={allVariants}
      initialSelectedIds={initialSelectedIds}
    />
  );
}
