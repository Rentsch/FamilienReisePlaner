import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { createPerson, deletePerson } from "./actions";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireAdmin();
  const { error } = await searchParams;
  const people = await prisma.person.findMany({
    where: { adminUserId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-10">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">
          Personen
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form
          action={createPerson}
          className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-4"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              required
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Foto
            <input
              name="photo"
              type="file"
              accept="image/*"
              className="text-sm"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" name="canDrive" className="h-4 w-4" />
            Kann fahren
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" name="backSeatOnly" className="h-4 w-4" />
            Nur Rücksitz (Kind)
          </label>
          <button className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110">
            Hinzufügen
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              {person.photoUrl ? (
                <Image
                  src={person.photoUrl}
                  alt={person.name}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {person.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {person.name}
                </p>
                {(person.canDrive || person.backSeatOnly) && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {[
                      person.canDrive && "Kann fahren",
                      person.backSeatOnly && "Nur Rücksitz",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <Link
                href={`/people/${person.id}/edit`}
                className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
              >
                Bearbeiten
              </Link>
              <form action={deletePerson.bind(null, person.id)}>
                <button className="text-sm text-red-600 hover:text-red-800 dark:text-red-400">
                  Löschen
                </button>
              </form>
            </li>
          ))}
          {people.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Personen angelegt.
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
