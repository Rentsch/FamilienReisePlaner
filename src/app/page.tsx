import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          FamilienReisePlaner
        </h1>
        <Link
          href="/login"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
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
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Reisen
          </h1>
          <Link
            href="/trips/new"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Neue Reise
          </Link>
        </div>

        <ul className="flex flex-col gap-2">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 hover:bg-black/[.02] dark:border-white/10 dark:hover:bg-white/[.03]"
              >
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">{trip.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
