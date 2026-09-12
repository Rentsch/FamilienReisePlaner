import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { createTemplate, deleteTemplate } from "./actions";

export default async function PackingListsPage() {
  const user = await requireAdmin();
  const templates = await prisma.packingListTemplate.findMany({
    where: { adminUserId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-10">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">
          Packlisten
        </h1>

        <form
          action={createTemplate}
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
          <SubmitButton
            pendingText="Wird angelegt…"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Anlegen
          </SubmitButton>
        </form>

        <ul className="flex flex-col gap-2">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{template.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {template._count.items} {template._count.items === 1 ? "Gegenstand" : "Gegenstände"}
                </p>
              </div>
              <Link
                href={`/packing-lists/${template.id}/edit`}
                className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
              >
                Bearbeiten
              </Link>
              <ConfirmDeleteButton
                action={deleteTemplate.bind(null, template.id)}
                confirmMessage={<>„{template.name}“ wirklich löschen?</>}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
              />
            </li>
          ))}
          {templates.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Packlisten angelegt.
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
