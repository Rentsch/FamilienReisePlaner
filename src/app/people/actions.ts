"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

async function uploadPhoto(supabase: Awaited<ReturnType<typeof createClient>>, adminUserId: string, photo: File) {
  if (!photo || photo.size === 0) return undefined;

  const ext = photo.name.split(".").pop() ?? "jpg";
  const path = `${adminUserId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, photo);
  if (error) throw new Error(`Foto-Upload fehlgeschlagen: ${error.message}`);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function createPerson(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string).trim();
  const canDrive = formData.get("canDrive") === "on";
  const backSeatOnly = formData.get("backSeatOnly") === "on";
  const familyId = (formData.get("familyId") as string) || null;
  const photo = formData.get("photo") as File | null;

  const photoUrl = photo ? await uploadPhoto(supabase, user.id, photo) : undefined;

  await prisma.person.create({
    data: { adminUserId: user.id, name, canDrive, backSeatOnly, familyId, photoUrl },
  });

  revalidatePath("/people");
  revalidatePath("/families");
}

export async function updatePerson(id: string, formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string).trim();
  const canDrive = formData.get("canDrive") === "on";
  const backSeatOnly = formData.get("backSeatOnly") === "on";
  const familyId = (formData.get("familyId") as string) || null;
  const photo = formData.get("photo") as File | null;

  const photoUrl = photo ? await uploadPhoto(supabase, user.id, photo) : undefined;

  await prisma.person.update({
    where: { id, adminUserId: user.id },
    data: { name, canDrive, backSeatOnly, familyId, ...(photoUrl ? { photoUrl } : {}) },
  });

  revalidatePath("/people");
  revalidatePath("/families");
  redirect("/people");
}

export async function deletePerson(id: string) {
  const user = await requireAdmin();
  try {
    await prisma.person.delete({ where: { id, adminUserId: user.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      redirect(`/people?error=${encodeURIComponent("Kann nicht gelöscht werden – wird noch in mindestens einer Reise verwendet.")}`);
    }
    throw e;
  }
  revalidatePath("/people");
}
