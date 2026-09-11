"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

function storagePathFromUrl(url: string): string | null {
  const marker = "/object/public/attachments/";
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

async function uploadAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appointmentId: string,
  files: File[],
) {
  return Promise.all(
    files.map(async (file) => {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${appointmentId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("attachments")
        .upload(path, file, { contentType: file.type || undefined });
      if (error) throw new Error(`Anhang-Upload fehlgeschlagen: ${error.message}`);

      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      return { url: data.publicUrl, filename: file.name, mimeType: file.type || "application/octet-stream" };
    }),
  );
}

async function removeAttachments(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  const attachments = await prisma.appointmentAttachment.findMany({
    where: { id: { in: ids } },
    select: { id: true, url: true },
  });
  const paths = attachments.map((a) => storagePathFromUrl(a.url)).filter((p): p is string => p !== null);
  if (paths.length > 0) await supabase.storage.from("attachments").remove(paths);
  await prisma.appointmentAttachment.deleteMany({ where: { id: { in: ids } } });
}

function readAttachmentFiles(formData: FormData) {
  return (formData.getAll("attachments") as File[]).filter((f) => f.size > 0);
}

export async function createAppointment(shareToken: string, formData: FormData) {
  const trip = await resolveTrip(shareToken);

  const appointment = await prisma.appointment.create({
    data: { tripId: trip.id, ...readFields(formData) },
  });

  const files = readAttachmentFiles(formData);
  if (files.length > 0) {
    const supabase = await createClient();
    const uploaded = await uploadAttachments(supabase, appointment.id, files);
    await prisma.appointmentAttachment.createMany({
      data: uploaded.map((u) => ({ appointmentId: appointment.id, ...u })),
    });
  }

  revalidatePath(`/t/${shareToken}/schedule`);
  revalidatePath(`/trips/${trip.id}`);
}

export async function updateAppointment(shareToken: string, id: string, formData: FormData) {
  const trip = await resolveTrip(shareToken);

  const removeIds = formData.getAll("removeAttachmentIds") as string[];
  const files = readAttachmentFiles(formData);

  if (removeIds.length > 0 || files.length > 0) {
    const supabase = await createClient();
    if (removeIds.length > 0) await removeAttachments(supabase, removeIds);
    if (files.length > 0) {
      const uploaded = await uploadAttachments(supabase, id, files);
      await prisma.appointmentAttachment.createMany({
        data: uploaded.map((u) => ({ appointmentId: id, ...u })),
      });
    }
  }

  await prisma.appointment.update({
    where: { id, tripId: trip.id },
    data: readFields(formData),
  });

  revalidatePath(`/t/${shareToken}/schedule`);
}

export async function deleteAppointment(shareToken: string, id: string) {
  const trip = await resolveTrip(shareToken);

  const attachments = await prisma.appointmentAttachment.findMany({
    where: { appointmentId: id },
    select: { url: true },
  });
  const paths = attachments.map((a) => storagePathFromUrl(a.url)).filter((p): p is string => p !== null);
  if (paths.length > 0) {
    const supabase = await createClient();
    await supabase.storage.from("attachments").remove(paths);
  }

  await prisma.appointment.delete({ where: { id, tripId: trip.id } });
  revalidatePath(`/t/${shareToken}/schedule`);
}
