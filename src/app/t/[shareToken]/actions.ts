"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function voteForVariant(
  shareToken: string,
  tripId: string,
  tripParticipantId: string,
  variantId: string,
) {
  await prisma.vote.upsert({
    where: { tripParticipantId },
    create: { tripId, tripParticipantId, variantId },
    update: { variantId },
  });

  revalidatePath(`/t/${shareToken}/trip`);
}
