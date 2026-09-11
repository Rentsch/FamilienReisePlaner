"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";

export type SeatRow = "FRONT" | "BACK";

export type SaveVariantInput = {
  shareToken: string;
  tripId: string;
  variantId?: string; // set to update an existing variant instead of creating a new one
  name: string;
  // Required when creating (becomes the variant's creator). When updating, this
  // identifies the caller so we can verify they're the creator (or the admin).
  createdByParticipantId?: string;
  personAssignment: Record<string, { tripVehicleId: string; row: SeatRow }>; // participantId -> seat
  driverByVehicle: Record<string, string>; // tripVehicleId -> participantId
  bikeAssignment: Record<string, string>; // participantId -> tripTrailerId
  trailerAssignment: Record<string, string>; // tripTrailerId -> tripVehicleId
  vehiclePlan: Record<string, { departureTime?: string; travelTimeOverrideMinutes?: number }>; // tripVehicleId -> plan
};

export async function saveVariant(input: SaveVariantInput) {
  const nested = {
    name: input.name,
    personAssignments: {
      create: Object.entries(input.personAssignment).map(
        ([tripParticipantId, { tripVehicleId, row }]) => ({
          tripParticipantId,
          tripVehicleId,
          row,
          isDriver: input.driverByVehicle[tripVehicleId] === tripParticipantId,
        }),
      ),
    },
    bikeAssignments: {
      create: Object.entries(input.bikeAssignment).map(
        ([tripParticipantId, tripTrailerId]) => ({ tripParticipantId, tripTrailerId }),
      ),
    },
    trailerAssignments: {
      create: Object.entries(input.trailerAssignment).map(
        ([tripTrailerId, tripVehicleId]) => ({ tripTrailerId, tripVehicleId }),
      ),
    },
    vehiclePlans: {
      create: Object.entries(input.vehiclePlan).map(([tripVehicleId, plan]) => ({
        tripVehicleId,
        departureTime: plan.departureTime ? new Date(`1970-01-01T${plan.departureTime}:00`) : undefined,
        travelTimeOverrideMinutes: plan.travelTimeOverrideMinutes,
      })),
    },
  };

  let variantId: string;

  if (input.variantId) {
    const [existing, adminUser] = await Promise.all([
      prisma.variant.findUnique({
        where: { id: input.variantId },
        select: { tripId: true, createdByParticipantId: true, trip: { select: { adminUserId: true } } },
      }),
      getAdminUser(),
    ]);
    if (!existing || existing.tripId !== input.tripId) throw new Error("Variante nicht gefunden");
    const isAdmin = adminUser?.id === existing.trip.adminUserId;
    const isCreator = !!input.createdByParticipantId && input.createdByParticipantId === existing.createdByParticipantId;
    if (!isAdmin && !isCreator) throw new Error("Keine Berechtigung, diese Variante zu bearbeiten");

    await prisma.$transaction([
      prisma.personAssignment.deleteMany({ where: { variantId: input.variantId } }),
      prisma.bikeAssignment.deleteMany({ where: { variantId: input.variantId } }),
      prisma.trailerAssignment.deleteMany({ where: { variantId: input.variantId } }),
      prisma.variantVehiclePlan.deleteMany({ where: { variantId: input.variantId } }),
      prisma.variant.update({ where: { id: input.variantId }, data: nested }),
    ]);
    variantId = input.variantId;
  } else {
    if (!input.createdByParticipantId) throw new Error("createdByParticipantId is required to create a variant");
    const variant = await prisma.variant.create({
      data: { tripId: input.tripId, createdByParticipantId: input.createdByParticipantId, ...nested },
    });
    variantId = variant.id;
  }

  redirect(`/t/${input.shareToken}/variant/${variantId}`);
}

export async function deleteVariant(shareToken: string, variantId: string, participantId?: string) {
  const [variant, adminUser] = await Promise.all([
    prisma.variant.findUnique({
      where: { id: variantId },
      select: { tripId: true, createdByParticipantId: true, trip: { select: { adminUserId: true } } },
    }),
    getAdminUser(),
  ]);
  if (!variant) return;

  const isAdmin = adminUser?.id === variant.trip.adminUserId;
  const isCreator = !!participantId && participantId === variant.createdByParticipantId;
  if (!isAdmin && !isCreator) return;

  await prisma.variant.delete({ where: { id: variantId } });

  revalidatePath(`/trips/${variant.tripId}`);
  revalidatePath(`/t/${shareToken}/trip`);
}
