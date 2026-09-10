import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { SubmitButton } from "@/components/SubmitButton";
import { TrailerTypeAndCapacityFields } from "@/components/TrailerTypeAndCapacityFields";
import { createTrailer, deleteTrailer } from "./actions";

const typeLabel = { CARGO: "Lasten-Anhänger", BIKE_RACK: "Fahrradträger" };

export default async function TrailersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireAdmin();
  const { error } = await searchParams;
  const trailers = await prisma.trailer.findMany({
    where: { adminUserId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-10">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">
          Anhänger
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form
          action={createTrailer}
          className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-4"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              required
              className="w-40 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <TrailerTypeAndCapacityFields />
          <SubmitButton
            pendingText="Wird hinzugefügt…"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Hinzufügen
          </SubmitButton>
        </form>

        <ul className="flex flex-col gap-2">
          {trailers.map((trailer) => (
            <li
              key={trailer.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {trailer.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {typeLabel[trailer.type]}
                  {trailer.capacity != null && ` · Kapazität ${trailer.capacity}`}
                </p>
              </div>
              <Link
                href={`/trailers/${trailer.id}/edit`}
                className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
              >
                Bearbeiten
              </Link>
              <form action={deleteTrailer.bind(null, trailer.id)}>
                <SubmitButton
                  pendingText="Löschen…"
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                >
                  Löschen
                </SubmitButton>
              </form>
            </li>
          ))}
          {trailers.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Anhänger angelegt.
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
