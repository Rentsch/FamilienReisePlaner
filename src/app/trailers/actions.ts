"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTrailer(formData: FormData) {
  const user = await requireAdmin();
  const capacity = formData.get("capacity") as string;

  await prisma.trailer.create({
    data: {
      adminUserId: user.id,
      name: (formData.get("name") as string).trim(),
      type: formData.get("type") as "CARGO" | "BIKE_RACK",
      capacity: capacity ? Number(capacity) : undefined,
    },
  });

  revalidatePath("/trailers");
}

export async function deleteTrailer(id: string) {
  const user = await requireAdmin();
  await prisma.trailer.delete({ where: { id, adminUserId: user.id } });
  revalidatePath("/trailers");
}
