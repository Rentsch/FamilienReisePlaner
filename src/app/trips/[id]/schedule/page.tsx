import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { ScheduleClient } from "./ScheduleClient";

export default async function TripSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id, adminUserId: user.id },
    select: {
      id: true,
      name: true,
      appointments: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!trip) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <ScheduleClient tripId={trip.id} tripName={trip.name} appointments={trip.appointments} />
    </div>
  );
}
