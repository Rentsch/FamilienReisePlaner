import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { SubmitButton } from "@/components/SubmitButton";
import { updateTrip } from "../../actions";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const [trip, people, vehicles, trailers] = await Promise.all([
    prisma.trip.findUnique({
      where: { id, adminUserId: user.id },
      include: { participants: true, tripVehicles: true, tripTrailers: true },
    }),
    prisma.person.findMany({ where: { adminUserId: user.id }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { adminUserId: user.id }, orderBy: { name: "asc" } }),
    prisma.trailer.findMany({ where: { adminUserId: user.id }, orderBy: { name: "asc" } }),
  ]);

  if (!trip) notFound();

  const participantByPersonId = new Map(trip.participants.map((p) => [p.personId, p]));
  const vehicleIds = new Set(trip.tripVehicles.map((v) => v.vehicleId));
  const trailerIds = new Set(trip.tripTrailers.map((t) => t.trailerId));
  const dateValue = trip.date ? trip.date.toISOString().slice(0, 10) : "";

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-10">
        <Link href={`/trips/${trip.id}`} className="text-sm text-zinc-500 hover:text-foreground">
          ← {trip.name}
        </Link>
        <h1 className="mt-2 mb-6 text-2xl font-semibold text-foreground">
          Reise bearbeiten
        </h1>

        <form action={updateTrip.bind(null, trip.id)} className="flex flex-col gap-6">
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name der Reise
            <input
              name="name"
              required
              defaultValue={trip.name}
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-[var(--surface)]"
            />
          </label>

          <label className="flex max-w-[200px] flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Datum
            <input
              name="date"
              type="date"
              defaultValue={dateValue}
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-[var(--surface)]"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              Wer fährt mit?
            </legend>
            <div className="flex flex-col gap-2">
              {people.map((person) => {
                const participant = participantByPersonId.get(person.id);
                return (
                  <div
                    key={person.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2"
                  >
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        name="personIds"
                        value={person.id}
                        defaultChecked={!!participant}
                        className="h-4 w-4"
                      />
                      {person.name}
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        name={`hasBike_${person.id}`}
                        defaultChecked={participant?.hasBike ?? false}
                        className="h-4 w-4"
                      />
                      mit Fahrrad
                    </label>
                  </div>
                );
              })}
              {people.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Keine Personen vorhanden.
                </p>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              Welche Autos?
            </legend>
            <div className="flex flex-col gap-2">
              {vehicles.map((vehicle) => (
                <label
                  key={vehicle.id}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <input
                    type="checkbox"
                    name="vehicleIds"
                    value={vehicle.id}
                    defaultChecked={vehicleIds.has(vehicle.id)}
                    className="h-4 w-4"
                  />
                  {vehicle.name} ({vehicle.seats} Plätze)
                </label>
              ))}
              {vehicles.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Keine Autos vorhanden.
                </p>
              )}
            </div>
          </fieldset>

          {trailers.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Welche Anhänger?
              </legend>
              <div className="flex flex-col gap-2">
                {trailers.map((trailer) => (
                  <label
                    key={trailer.id}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      name="trailerIds"
                      value={trailer.id}
                      defaultChecked={trailerIds.has(trailer.id)}
                      className="h-4 w-4"
                    />
                    {trailer.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Personen, Autos oder Anhänger, die bereits in einer gespeicherten Variante verwendet werden, lassen
            sich hier nicht entfernen — entferne sie zuerst aus der jeweiligen Variante.
          </p>

          <SubmitButton
            pendingText="Wird gespeichert…"
            className="self-start rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Speichern
          </SubmitButton>
        </form>
      </main>
    </div>
  );
}
