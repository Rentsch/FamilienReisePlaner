import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { formatTripDate } from "@/lib/time";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
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
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3 hover:bg-black/[.02] dark:hover:bg-white/[.03]"
              >
                <div>
                  <p className="font-medium text-foreground">{trip.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatTripDate(trip.date) && <>{formatTripDate(trip.date)} · </>}
                    {trip.participants.length} Teilnehmer · {trip.variants.length} Varianten
                  </p>
                </div>
              </Link>
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
