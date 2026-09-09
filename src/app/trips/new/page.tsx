import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { createTrip } from "../actions";

export default async function NewTripPage() {
  const user = await requireAdmin();

  const [people, vehicles, trailers] = await Promise.all([
    prisma.person.findMany({ where: { adminUserId: user.id }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { adminUserId: user.id }, orderBy: { name: "asc" } }),
    prisma.trailer.findMany({ where: { adminUserId: user.id }, orderBy: { name: "asc" } }),
  ]);

  const nothingConfigured = people.length === 0 && vehicles.length === 0;

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">
          Neue Reise
        </h1>

        {nothingConfigured && (
          <p className="mb-6 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
            Lege zuerst ein paar{" "}
            <Link href="/people" className="underline">
              Personen
            </Link>{" "}
            und{" "}
            <Link href="/vehicles" className="underline">
              Autos
            </Link>{" "}
            an.
          </p>
        )}

        <form action={createTrip} className="flex flex-col gap-6">
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name der Reise
            <input
              name="name"
              required
              placeholder="z.B. Sommerurlaub Ostsee"
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>

          <label className="flex max-w-[200px] flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Datum
            <input
              name="date"
              type="date"
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              Fahrzeiten für diese Reise
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                Ohne Anhänger (Min.)
                <input
                  name="travelTimeMinutes"
                  type="number"
                  min={0}
                  className="w-32 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                Mit Fahrradanhänger (Min.)
                <input
                  name="travelTimeWithBikeTrailerMinutes"
                  type="number"
                  min={0}
                  className="w-32 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                Mit Lastenanhänger (Min.)
                <input
                  name="travelTimeWithCargoTrailerMinutes"
                  type="number"
                  min={0}
                  className="w-32 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              Wer fährt mit?
            </legend>
            <div className="flex flex-col gap-2">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2"
                >
                  <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      name="personIds"
                      value={person.id}
                      className="h-4 w-4"
                    />
                    {person.name}
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      name={`hasBike_${person.id}`}
                      className="h-4 w-4"
                    />
                    mit Fahrrad
                  </label>
                </div>
              ))}
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
                      className="h-4 w-4"
                    />
                    {trailer.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <button className="self-start rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground hover:brightness-110">
            Reise anlegen
          </button>
        </form>
      </main>
    </div>
  );
}
