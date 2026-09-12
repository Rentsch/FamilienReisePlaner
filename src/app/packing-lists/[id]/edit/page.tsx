import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { updateTemplate, addTemplateItem, deleteTemplateItem } from "../../actions";

export default async function EditPackingListTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const template = await prisma.packingListTemplate.findUnique({
    where: { id, adminUserId: user.id },
    include: { items: { orderBy: { name: "asc" } } },
  });
  if (!template) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-md flex-1 px-6 pt-6 pb-10">
        <Link href="/packing-lists" className="text-sm text-zinc-500 hover:text-foreground">
          ← Packlisten
        </Link>
        <h1 className="mt-2 mb-6 text-2xl font-semibold text-foreground">
          Packliste bearbeiten
        </h1>

        <form
          action={updateTemplate.bind(null, template.id)}
          className="mb-8 flex flex-col gap-4 rounded-xl border border-[var(--border)] p-6"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              defaultValue={template.name}
              required
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <SubmitButton
            pendingText="Wird gespeichert…"
            className="self-start rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Speichern
          </SubmitButton>
        </form>

        <h2 className="mb-2 text-sm font-medium text-foreground">Gegenstände</h2>

        <form
          action={addTemplateItem.bind(null, template.id)}
          className="mb-4 flex items-end gap-3"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Neuer Gegenstand
            <input
              name="name"
              required
              placeholder="z.B. Zelt, Erste-Hilfe-Set, Grill"
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Mehrere Gegenstände mit Komma trennen
            </span>
          </label>
          <SubmitButton
            pendingText="Wird hinzugefügt…"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Hinzufügen
          </SubmitButton>
        </form>

        <ul className="flex flex-col gap-2">
          {template.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-2"
            >
              <span className="flex-1 text-sm text-foreground">{item.name}</span>
              <ConfirmDeleteButton
                action={deleteTemplateItem.bind(null, template.id, item.id)}
                confirmMessage={<>„{item.name}“ wirklich löschen?</>}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
              />
            </li>
          ))}
          {template.items.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Gegenstände auf dieser Liste.
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
