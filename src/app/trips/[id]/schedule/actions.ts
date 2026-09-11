"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireTripOwnership(tripId: string) {
  const user = await requireAdmin();
  const trip = await prisma.trip.findUnique({
    where: { id: tripId, adminUserId: user.id },
    select: { id: true },
  });
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

export async function createAppointment(tripId: string, formData: FormData) {
  await requireTripOwnership(tripId);

  await prisma.appointment.create({
    data: { tripId, ...readFields(formData) },
  });

  revalidatePath(`/trips/${tripId}/schedule`);
}

export async function updateAppointment(tripId: string, id: string, formData: FormData) {
  await requireTripOwnership(tripId);

  await prisma.appointment.update({
    where: { id, tripId },
    data: readFields(formData),
  });

  revalidatePath(`/trips/${tripId}/schedule`);
}

export async function deleteAppointment(tripId: string, id: string) {
  await requireTripOwnership(tripId);
  await prisma.appointment.delete({ where: { id, tripId } });
  revalidatePath(`/trips/${tripId}/schedule`);
}
