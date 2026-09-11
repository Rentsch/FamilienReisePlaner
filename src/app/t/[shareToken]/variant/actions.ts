"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export type SeatRow = "FRONT" | "BACK";

export type SaveVariantInput = {
  shareToken: string;
  tripId: string;
  variantId?: string; // set to update an existing variant instead of creating a new one
  name: string;
  createdByParticipantId?: string; // required when creating, ignored when updating
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

export async function deleteVariant(shareToken: string, variantId: string) {
  const user = await requireAdmin();

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    select: { tripId: true, trip: { select: { adminUserId: true } } },
  });
  if (!variant || variant.trip.adminUserId !== user.id) return;

  await prisma.variant.delete({ where: { id: variantId } });

  revalidatePath(`/trips/${variant.tripId}`);
  revalidatePath(`/t/${shareToken}/trip`);
}
