import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { SubmitButton } from "@/components/SubmitButton";
import { updateTrailer } from "../../actions";

export default async function EditTrailerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const trailer = await prisma.trailer.findUnique({ where: { id, adminUserId: user.id } });
  if (!trailer) notFound();

  const updateTrailerWithId = updateTrailer.bind(null, trailer.id);

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-md flex-1 px-6 pt-6 pb-10">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">
          Anhänger bearbeiten
        </h1>

        <form
          action={updateTrailerWithId}
          className="flex flex-col gap-4 rounded-xl border border-[var(--border)] p-6"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              defaultValue={trailer.name}
              required
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Typ
            <select
              name="type"
              defaultValue={trailer.type}
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            >
              <option value="CARGO">Lasten-Anhänger</option>
              <option value="BIKE_RACK">Fahrradträger</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Kapazität (Fahrräder, nur bei Fahrradträger)
            <input
              name="capacity"
              type="number"
              min={0}
              defaultValue={trailer.capacity ?? ""}
              className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>

          <SubmitButton
            pendingText="Wird gespeichert…"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Speichern
          </SubmitButton>
        </form>
      </main>
    </div>
  );
}
