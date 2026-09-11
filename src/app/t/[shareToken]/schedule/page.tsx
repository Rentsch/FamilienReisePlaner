import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { ScheduleClient } from "@/components/ScheduleClient";

export default async function TripSchedulePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const [trip, adminUser] = await Promise.all([
    prisma.trip.findUnique({
      where: { shareToken },
      select: {
        id: true,
        name: true,
        adminUserId: true,
        appointments: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
      },
    }),
    getAdminUser(),
  ]);
  if (!trip) notFound();

  return (
    <ScheduleClient
      shareToken={shareToken}
      tripId={trip.id}
      tripName={trip.name}
      isAdminView={adminUser?.id === trip.adminUserId}
      appointments={trip.appointments}
    />
  );
}
