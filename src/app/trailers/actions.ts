"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

function trailerData(formData: FormData) {
  const capacity = formData.get("capacity") as string;

  return {
    name: (formData.get("name") as string).trim(),
    type: formData.get("type") as "CARGO" | "BIKE_RACK",
    capacity: capacity ? Number(capacity) : null,
  };
}

export async function createTrailer(formData: FormData) {
  const user = await requireAdmin();

  await prisma.trailer.create({
    data: { adminUserId: user.id, ...trailerData(formData) },
  });

  revalidatePath("/trailers");
}

export async function updateTrailer(id: string, formData: FormData) {
  const user = await requireAdmin();

  await prisma.trailer.update({
    where: { id, adminUserId: user.id },
    data: trailerData(formData),
  });

  revalidatePath("/trailers");
  redirect("/trailers");
}

export async function deleteTrailer(id: string) {
  const user = await requireAdmin();
  try {
    await prisma.trailer.delete({ where: { id, adminUserId: user.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      redirect(`/trailers?error=${encodeURIComponent("Kann nicht gelöscht werden – wird noch in mindestens einer Reise verwendet.")}`);
    }
    throw e;
  }
  revalidatePath("/trailers");
}
