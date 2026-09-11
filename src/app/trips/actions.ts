"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function num(formData: FormData, key: string) {
  const v = formData.get(key) as string;
  return v ? Number(v) : undefined;
}

export async function createTrip(formData: FormData) {
  const user = await requireAdmin();

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string) || undefined;
  const date = (formData.get("date") as string) || undefined;

  const personIds = formData.getAll("personIds") as string[];
  const vehicleIds = formData.getAll("vehicleIds") as string[];
  const trailerIds = formData.getAll("trailerIds") as string[];

  const trip = await prisma.trip.create({
    data: {
      adminUserId: user.id,
      name,
      description,
      date: date ? new Date(date) : undefined,
      travelTimeMinutes: num(formData, "travelTimeMinutes"),
      travelTimeWithBikeTrailerMinutes: num(formData, "travelTimeWithBikeTrailerMinutes"),
      travelTimeWithCargoTrailerMinutes: num(formData, "travelTimeWithCargoTrailerMinutes"),
      participants: {
        create: personIds.map((personId) => ({
          personId,
          hasBike: formData.get(`hasBike_${personId}`) === "on",
        })),
      },
      tripVehicles: {
        create: vehicleIds.map((vehicleId) => ({ vehicleId })),
      },
      tripTrailers: {
        create: trailerIds.map((trailerId) => ({ trailerId })),
      },
    },
  });

  redirect(`/trips/${trip.id}`);
}

export async function updateTrip(id: string, formData: FormData) {
  const user = await requireAdmin();

  const trip = await prisma.trip.findUnique({
    where: { id, adminUserId: user.id },
    include: { participants: true, tripVehicles: true, tripTrailers: true },
  });
  if (!trip) return;

  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string) || undefined;
  const date = (formData.get("date") as string) || undefined;
  const personIds = formData.getAll("personIds") as string[];
  const vehicleIds = formData.getAll("vehicleIds") as string[];
  const trailerIds = formData.getAll("trailerIds") as string[];

  await prisma.trip.update({
    where: { id },
    data: { name, description, date: date ? new Date(date) : null },
  });

  const existingPersonIds = new Set(trip.participants.map((p) => p.personId));
  const newPersonIds = personIds.filter((pid) => !existingPersonIds.has(pid));
  const removedParticipants = trip.participants.filter((p) => !personIds.includes(p.personId));
  const keptParticipants = trip.participants.filter((p) => personIds.includes(p.personId));

  await Promise.all([
    ...newPersonIds.map((personId) =>
      prisma.tripParticipant.create({
        data: { tripId: id, personId, hasBike: formData.get(`hasBike_${personId}`) === "on" },
      }),
    ),
    ...keptParticipants
      .filter((p) => (formData.get(`hasBike_${p.personId}`) === "on") !== p.hasBike)
      .map((p) =>
        prisma.tripParticipant.update({
          where: { id: p.id },
          data: { hasBike: formData.get(`hasBike_${p.personId}`) === "on" },
        }),
      ),
    // participants already used in a saved variant can't be removed without breaking that variant's data
    ...removedParticipants.map((p) => prisma.tripParticipant.delete({ where: { id: p.id } }).catch(() => {})),
  ]);

  const existingVehicleIds = new Set(trip.tripVehicles.map((v) => v.vehicleId));
  const newVehicleIds = vehicleIds.filter((vid) => !existingVehicleIds.has(vid));
  const removedVehicles = trip.tripVehicles.filter((v) => !vehicleIds.includes(v.vehicleId));

  await Promise.all([
    ...newVehicleIds.map((vehicleId) => prisma.tripVehicle.create({ data: { tripId: id, vehicleId } })),
    ...removedVehicles.map((v) => prisma.tripVehicle.delete({ where: { id: v.id } }).catch(() => {})),
  ]);

  const existingTrailerIds = new Set(trip.tripTrailers.map((t) => t.trailerId));
  const newTrailerIds = trailerIds.filter((tid) => !existingTrailerIds.has(tid));
  const removedTrailers = trip.tripTrailers.filter((t) => !trailerIds.includes(t.trailerId));

  await Promise.all([
    ...newTrailerIds.map((trailerId) => prisma.tripTrailer.create({ data: { tripId: id, trailerId } })),
    ...removedTrailers.map((t) => prisma.tripTrailer.delete({ where: { id: t.id } }).catch(() => {})),
  ]);

  revalidatePath(`/trips/${id}`);
  redirect(`/trips/${id}`);
}

export async function updateTripTravelTimes(id: string, formData: FormData) {
  const user = await requireAdmin();

  const defaultDepartureTime = (formData.get("defaultDepartureTime") as string) || null;

  await prisma.trip.update({
    where: { id, adminUserId: user.id },
    data: {
      travelTimeMinutes: num(formData, "travelTimeMinutes"),
      travelTimeWithBikeTrailerMinutes: num(formData, "travelTimeWithBikeTrailerMinutes"),
      travelTimeWithCargoTrailerMinutes: num(formData, "travelTimeWithCargoTrailerMinutes"),
      defaultDepartureTime,
    },
  });

  revalidatePath(`/trips/${id}`);
}

export async function deleteTrip(id: string) {
  const user = await requireAdmin();
  await prisma.trip.delete({ where: { id, adminUserId: user.id } });
  revalidatePath("/");
}
