import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { PackingListView } from "@/components/PackingListView";
import { computePackingStats } from "@/lib/packingStats";

export default async function PackingListPage({
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
        packingItems: {
          include: { claimedBy: { include: { person: { include: { family: true } } } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getAdminUser(),
  ]);

  if (!trip) notFound();

  const isAdminView = adminUser?.id === trip.adminUserId;

  const templates = isAdminView
    ? await prisma.packingListTemplate.findMany({
        where: { adminUserId: trip.adminUserId },
        orderBy: { name: "asc" },
        include: { _count: { select: { items: true } } },
      })
    : [];

  const participants = trip.participants.map((p) => ({ id: p.id, name: p.person.name }));

  const items = trip.packingItems.map((item) => ({
    id: item.id,
    name: item.name,
    isPacked: item.isPacked,
    claimedByParticipantId: item.claimedByParticipantId,
    claimedByName: item.claimedBy?.person.family?.name ?? item.claimedBy?.person.name ?? null,
  }));

  const stats = computePackingStats(items);

  return (
    <PackingListView
      shareToken={shareToken}
      tripId={trip.id}
      tripName={trip.name}
      isAdminView={isAdminView}
      participants={participants}
      items={items}
      stats={stats}
      templates={templates.map((t) => ({ id: t.id, name: t.name, itemCount: t._count.items }))}
    />
  );
}
