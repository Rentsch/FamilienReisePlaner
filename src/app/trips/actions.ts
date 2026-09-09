"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function num(formData: FormData, key: string) {
  const v = formData.get(key) as string;
  return v ? Number(v) : undefined;
}

export async function createTrip(formData: FormData) {
  const user = await requireAdmin();

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string) || undefined;
  const date = (formData.get("date") as string) || undefined;

  const personIds = formData.getAll("personIds") as string[];
  const vehicleIds = formData.getAll("vehicleIds") as string[];
  const trailerIds = formData.getAll("trailerIds") as string[];

  const trip = await prisma.trip.create({
    data: {
      adminUserId: user.id,
      name,
      description,
      date: date ? new Date(date) : undefined,
      travelTimeMinutes: num(formData, "travelTimeMinutes"),
      travelTimeWithBikeTrailerMinutes: num(formData, "travelTimeWithBikeTrailerMinutes"),
      travelTimeWithCargoTrailerMinutes: num(formData, "travelTimeWithCargoTrailerMinutes"),
      participants: {
        create: personIds.map((personId) => ({
          personId,
          hasBike: formData.get(`hasBike_${personId}`) === "on",
        })),
      },
      tripVehicles: {
        create: vehicleIds.map((vehicleId) => ({ vehicleId })),
      },
      tripTrailers: {
        create: trailerIds.map((trailerId) => ({ trailerId })),
      },
    },
  });

  redirect(`/trips/${trip.id}`);
}

export async function updateTripTravelTimes(id: string, formData: FormData) {
  const user = await requireAdmin();

  await prisma.trip.update({
    where: { id, adminUserId: user.id },
    data: {
      travelTimeMinutes: num(formData, "travelTimeMinutes"),
      travelTimeWithBikeTrailerMinutes: num(formData, "travelTimeWithBikeTrailerMinutes"),
      travelTimeWithCargoTrailerMinutes: num(formData, "travelTimeWithCargoTrailerMinutes"),
    },
  });

  revalidatePath(`/trips/${id}`);
}

export async function deleteTrip(id: string) {
  const user = await requireAdmin();
  await prisma.trip.delete({ where: { id, adminUserId: user.id } });
  revalidatePath("/");
}
