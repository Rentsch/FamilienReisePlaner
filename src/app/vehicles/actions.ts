"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function num(formData: FormData, key: string) {
  const v = formData.get(key) as string;
  return v ? Number(v) : undefined;
}

export async function createVehicle(formData: FormData) {
  const user = await requireAdmin();

  await prisma.vehicle.create({
    data: {
      adminUserId: user.id,
      name: (formData.get("name") as string).trim(),
      seats: Number(formData.get("seats")),
      hasTowHitch: formData.get("hasTowHitch") === "on",
      travelTimeMinutes: num(formData, "travelTimeMinutes"),
      travelTimeWithTrailerMinutes: num(formData, "travelTimeWithTrailerMinutes"),
    },
  });

  revalidatePath("/vehicles");
}

export async function deleteVehicle(id: string) {
  const user = await requireAdmin();
  await prisma.vehicle.delete({ where: { id, adminUserId: user.id } });
  revalidatePath("/vehicles");
}
