import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShareEntry } from "@/components/ShareEntry";
import { computeTripStats } from "@/lib/tripStats";

export default async function ShareTokenPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const trip = await prisma.trip.findUnique({
    where: { shareToken },
    include: {
      participants: { include: { person: true } },
      _count: { select: { tripVehicles: true, variants: true } },
    },
  });

  if (!trip) notFound();

  // children (backSeatOnly) don't use the app themselves, so they're not selectable here
  const participants = trip.participants
    .filter((p) => !p.person.backSeatOnly)
    .map((p) => ({ id: p.id, name: p.person.name }));

  const stats = computeTripStats({
    participants: trip.participants,
    vehicleCount: trip._count.tripVehicles,
    variantCount: trip._count.variants,
  });

  return (
    <ShareEntry
      shareToken={shareToken}
      participants={participants}
      redirectTo={`/t/${shareToken}/trip`}
      stats={stats}
    />
  );
}
