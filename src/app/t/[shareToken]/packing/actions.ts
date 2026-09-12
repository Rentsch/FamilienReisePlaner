"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { parseItemNames } from "@/lib/parseItemNames";

// Anyone with the share link may add items and claim/unclaim them — same
// trust boundary as voting/creating variants and managing the schedule.
async function resolveTrip(shareToken: string) {
  const trip = await prisma.trip.findUnique({ where: { shareToken }, select: { id: true } });
  if (!trip) throw new Error("Reise nicht gefunden");
  return trip;
}

function revalidatePackingPaths(shareToken: string) {
  revalidatePath(`/t/${shareToken}/packing`);
  revalidatePath(`/t/${shareToken}/packing/mine`);
}

export async function addPackingItem(shareToken: string, formData: FormData) {
  const trip = await resolveTrip(shareToken);
  const names = parseItemNames(formData.get("name") as string);
  if (names.length === 0) return;

  await prisma.tripPackingItem.createMany({
    data: names.map((name) => ({ tripId: trip.id, name })),
  });
  revalidatePackingPaths(shareToken);
}

export async function claimPackingItem(shareToken: string, itemId: string, participantId: string) {
  const trip = await resolveTrip(shareToken);

  await prisma.tripPackingItem.updateMany({
    where: { id: itemId, tripId: trip.id, claimedByParticipantId: null },
    data: { claimedByParticipantId: participantId },
  });
  revalidatePackingPaths(shareToken);
}

export async function unclaimPackingItem(shareToken: string, itemId: string, participantId: string) {
  const trip = await resolveTrip(shareToken);

  // The `where` below is what actually enforces "only the claimer may release
  // it" — if participantId doesn't match, updateMany simply touches 0 rows.
  await prisma.tripPackingItem.updateMany({
    where: { id: itemId, tripId: trip.id, claimedByParticipantId: participantId },
    data: { claimedByParticipantId: null, isPacked: false },
  });
  revalidatePackingPaths(shareToken);
}

export async function setPackingItemPacked(
  shareToken: string,
  itemId: string,
  participantId: string,
  packed: boolean,
) {
  const trip = await resolveTrip(shareToken);

  // Family members share one packing list, so anyone in the same family as
  // the claimer may also check items off — not just the claimer themself.
  const [actingParticipant, item] = await Promise.all([
    prisma.tripParticipant.findUnique({
      where: { id: participantId },
      select: { person: { select: { familyId: true } } },
    }),
    prisma.tripPackingItem.findUnique({
      where: { id: itemId, tripId: trip.id },
      select: {
        claimedByParticipantId: true,
        claimedBy: { select: { person: { select: { familyId: true } } } },
      },
    }),
  ]);
  if (!item) return;

  const actingFamilyId = actingParticipant?.person.familyId ?? null;
  const claimedByFamilyId = item.claimedBy?.person.familyId ?? null;
  const sameFamily = actingFamilyId !== null && actingFamilyId === claimedByFamilyId;
  const isClaimer = item.claimedByParticipantId === participantId;
  if (!isClaimer && !sameFamily) return;

  await prisma.tripPackingItem.updateMany({
    where: { id: itemId, tripId: trip.id },
    data: { isPacked: packed },
  });
  revalidatePackingPaths(shareToken);
}

// Admin-only: copies a template's items into the trip as a one-time snapshot.
export async function addPackingListTemplateToTrip(shareToken: string, formData: FormData) {
  const templateId = formData.get("templateId") as string;
  if (!templateId) return;

  const [user, trip] = await Promise.all([
    getAdminUser(),
    prisma.trip.findUnique({ where: { shareToken }, select: { id: true, adminUserId: true } }),
  ]);
  if (!user || !trip || user.id !== trip.adminUserId) return;

  const template = await prisma.packingListTemplate.findUnique({
    where: { id: templateId, adminUserId: user.id },
    include: { items: true },
  });
  if (!template || template.items.length === 0) return;

  await prisma.tripPackingItem.createMany({
    data: template.items.map((item) => ({ tripId: trip.id, name: item.name })),
  });
  revalidatePackingPaths(shareToken);
}
