import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { createFamily, deleteFamily } from "./actions";

export default async function FamiliesPage() {
  const user = await requireAdmin();
  const families = await prisma.family.findMany({
    where: { adminUserId: user.id },
    orderBy: { name: "asc" },
    include: { people: { orderBy: { name: "asc" } } },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-10">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Familien</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Personen einer Familie bleiben eigenständige Teilnehmer, teilen sich aber z.B. die Packliste
          unter dem hier festgelegten Anzeigenamen.
        </p>

        <form
          action={createFamily}
          className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-4"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Anzeigename
            <input
              name="name"
              required
              placeholder="z.B. Familie Müller"
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <SubmitButton
            pendingText="Wird hinzugefügt…"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Hinzufügen
          </SubmitButton>
        </form>

        <ul className="flex flex-col gap-2">
          {families.map((family) => (
            <li
              key={family.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{family.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {family.people.length === 0
                    ? "Noch keine Personen zugeordnet"
                    : family.people.map((p) => p.name).join(", ")}
                </p>
              </div>
              <Link
                href={`/families/${family.id}/edit`}
                className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
              >
                Bearbeiten
              </Link>
              <ConfirmDeleteButton
                action={deleteFamily.bind(null, family.id)}
                confirmMessage={<>„{family.name}“ wirklich löschen? Die Personen bleiben erhalten, verlieren aber die Zuordnung.</>}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
              />
            </li>
          ))}
          {families.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch keine Familien angelegt.</p>
          )}
        </ul>
      </main>
    </div>
  );
}
