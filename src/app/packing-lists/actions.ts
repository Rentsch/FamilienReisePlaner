"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseItemNames } from "@/lib/parseItemNames";

export async function createTemplate(formData: FormData) {
  const user = await requireAdmin();
  const name = (formData.get("name") as string).trim();

  await prisma.packingListTemplate.create({
    data: { adminUserId: user.id, name },
  });

  revalidatePath("/packing-lists");
}

export async function updateTemplate(id: string, formData: FormData) {
  const user = await requireAdmin();
  const name = (formData.get("name") as string).trim();

  await prisma.packingListTemplate.update({
    where: { id, adminUserId: user.id },
    data: { name },
  });

  revalidatePath("/packing-lists");
  revalidatePath(`/packing-lists/${id}/edit`);
}

export async function deleteTemplate(id: string) {
  const user = await requireAdmin();
  await prisma.packingListTemplate.delete({ where: { id, adminUserId: user.id } });
  revalidatePath("/packing-lists");
}

export async function addTemplateItem(templateId: string, formData: FormData) {
  const user = await requireAdmin();
  const names = parseItemNames(formData.get("name") as string);
  if (names.length === 0) return;

  const template = await prisma.packingListTemplate.findUnique({
    where: { id: templateId, adminUserId: user.id },
  });
  if (!template) redirect("/packing-lists");

  await prisma.packingListTemplateItem.createMany({
    data: names.map((name) => ({ templateId, name })),
  });

  revalidatePath("/packing-lists");
  revalidatePath(`/packing-lists/${templateId}/edit`);
}

export async function deleteTemplateItem(templateId: string, itemId: string) {
  const user = await requireAdmin();
  const template = await prisma.packingListTemplate.findUnique({
    where: { id: templateId, adminUserId: user.id },
  });
  if (!template) return;

  await prisma.packingListTemplateItem.delete({ where: { id: itemId, templateId } });

  revalidatePath("/packing-lists");
  revalidatePath(`/packing-lists/${templateId}/edit`);
}
