"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type SaveVariantInput = {
  shareToken: string;
  tripId: string;
  name: string;
  createdByParticipantId: string;
  personAssignment: Record<string, string>; // participantId -> tripVehicleId
  bikeAssignment: Record<string, string>; // participantId -> tripVehicleId
  trailerAssignment: Record<string, string>; // tripTrailerId -> tripVehicleId
};

export async function saveVariant(input: SaveVariantInput) {
  const variant = await prisma.variant.create({
    data: {
      tripId: input.tripId,
      name: input.name,
      createdByParticipantId: input.createdByParticipantId,
      personAssignments: {
        create: Object.entries(input.personAssignment).map(
          ([tripParticipantId, tripVehicleId]) => ({ tripParticipantId, tripVehicleId }),
        ),
      },
      bikeAssignments: {
        create: Object.entries(input.bikeAssignment).map(
          ([tripParticipantId, tripVehicleId]) => ({ tripParticipantId, tripVehicleId }),
        ),
      },
      trailerAssignments: {
        create: Object.entries(input.trailerAssignment).map(
          ([tripTrailerId, tripVehicleId]) => ({ tripTrailerId, tripVehicleId }),
        ),
      },
    },
  });

  redirect(`/t/${input.shareToken}/variant/${variant.id}`);
}
