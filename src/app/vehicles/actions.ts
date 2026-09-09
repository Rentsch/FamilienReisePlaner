"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

function vehicleData(formData: FormData) {
  const seats = Number(formData.get("seats"));
  const frontSeats = Math.min(Number(formData.get("frontSeats")), seats);

  return {
    name: (formData.get("name") as string).trim(),
    seats,
    frontSeats,
    hasTowHitch: formData.get("hasTowHitch") === "on",
  };
}

export async function createVehicle(formData: FormData) {
  const user = await requireAdmin();

  await prisma.vehicle.create({
    data: { adminUserId: user.id, ...vehicleData(formData) },
  });

  revalidatePath("/vehicles");
}

export async function updateVehicle(id: string, formData: FormData) {
  const user = await requireAdmin();

  await prisma.vehicle.update({
    where: { id, adminUserId: user.id },
    data: vehicleData(formData),
  });

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function deleteVehicle(id: string) {
  const user = await requireAdmin();
  try {
    await prisma.vehicle.delete({ where: { id, adminUserId: user.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      redirect(`/vehicles?error=${encodeURIComponent("Kann nicht gelöscht werden – wird noch in mindestens einer Reise verwendet.")}`);
    }
    throw e;
  }
  revalidatePath("/vehicles");
}
