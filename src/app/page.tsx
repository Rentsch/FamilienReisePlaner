import Link from "next/link";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { formatTripDate } from "@/lib/time";
import { deleteTrip } from "./trips/actions";

export default async function Home() {
  const user = await getAdminUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          FamilienReisePlaner
        </h1>
        <Link
          href="/login"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
        >
          Anmelden
        </Link>
      </div>
    );
  }

  const trips = await prisma.trip.findMany({
    where: { adminUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: { participants: true, variants: true },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            Reisen
          </h1>
          <Link
            href="/trips/new"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Neue Reise
          </Link>
        </div>

        <ul className="flex flex-col gap-2">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-3 hover:bg-black/[.02] dark:hover:bg-white/[.03]"
            >
              <Link href={`/trips/${trip.id}`} className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{trip.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTripDate(trip.date) && <>{formatTripDate(trip.date)} · </>}
                  {trip.participants.length} Teilnehmer · {trip.variants.length} Varianten
                </p>
              </Link>
              <ConfirmDeleteButton
                action={deleteTrip.bind(null, trip.id)}
                confirmMessage={
                  <>
                    „{trip.name}“ wird inklusive aller Teilnehmer, Fahrzeuge, Anhänger und Varianten
                    unwiderruflich gelöscht.
                  </>
                }
                className="shrink-0 text-sm text-red-600 hover:text-red-800 dark:text-red-400"
              />
            </li>
          ))}
          {trips.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Reisen angelegt.
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
