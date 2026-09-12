"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createFamily(formData: FormData) {
  const user = await requireAdmin();
  const name = (formData.get("name") as string).trim();

  await prisma.family.create({
    data: { adminUserId: user.id, name },
  });

  revalidatePath("/families");
  revalidatePath("/people");
}

export async function updateFamily(id: string, formData: FormData) {
  const user = await requireAdmin();
  const name = (formData.get("name") as string).trim();

  await prisma.family.update({
    where: { id, adminUserId: user.id },
    data: { name },
  });

  revalidatePath("/families");
  revalidatePath("/people");
  redirect("/families");
}

export async function deleteFamily(id: string) {
  const user = await requireAdmin();
  // People in this family keep their own account; they just lose the family
  // grouping (Person.familyId -> SetNull).
  await prisma.family.delete({ where: { id, adminUserId: user.id } });
  revalidatePath("/families");
  revalidatePath("/people");
}
