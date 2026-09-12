import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { MyPackingListView } from "@/components/MyPackingListView";

export default async function MyPackingListPage({
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
        packingItems: { orderBy: { createdAt: "asc" } },
      },
    }),
    getAdminUser(),
  ]);

  if (!trip) notFound();

  const participants = trip.participants.map((p) => ({ id: p.id, name: p.person.name }));

  const items = trip.packingItems.map((item) => ({
    id: item.id,
    name: item.name,
    isPacked: item.isPacked,
    claimedByParticipantId: item.claimedByParticipantId,
  }));

  return (
    <MyPackingListView
      shareToken={shareToken}
      tripId={trip.id}
      tripName={trip.name}
      isAdminView={adminUser?.id === trip.adminUserId}
      participants={participants}
      items={items}
    />
  );
}
