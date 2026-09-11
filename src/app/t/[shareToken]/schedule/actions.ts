"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Anyone with the share link may manage the schedule — same trust boundary as
// voting/creating variants elsewhere in this family-facing area.
async function resolveTrip(shareToken: string) {
  const trip = await prisma.trip.findUnique({ where: { shareToken }, select: { id: true } });
  if (!trip) throw new Error("Reise nicht gefunden");
  return trip;
}

function readFields(formData: FormData) {
  return {
    date: new Date(formData.get("date") as string),
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    title: (formData.get("title") as string).trim(),
    address: (formData.get("address") as string).trim(),
  };
}

export async function createAppointment(shareToken: string, formData: FormData) {
  const trip = await resolveTrip(shareToken);

  await prisma.appointment.create({
    data: { tripId: trip.id, ...readFields(formData) },
  });

  revalidatePath(`/t/${shareToken}/schedule`);
  revalidatePath(`/trips/${trip.id}`);
}

export async function updateAppointment(shareToken: string, id: string, formData: FormData) {
  const trip = await resolveTrip(shareToken);

  await prisma.appointment.update({
    where: { id, tripId: trip.id },
    data: readFields(formData),
  });

  revalidatePath(`/t/${shareToken}/schedule`);
}

export async function deleteAppointment(shareToken: string, id: string) {
  const trip = await resolveTrip(shareToken);
  await prisma.appointment.delete({ where: { id, tripId: trip.id } });
  revalidatePath(`/t/${shareToken}/schedule`);
}
