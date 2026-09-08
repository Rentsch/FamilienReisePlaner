import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { updatePerson } from "../../actions";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const person = await prisma.person.findUnique({ where: { id, adminUserId: user.id } });
  if (!person) notFound();

  const updatePersonWithId = updatePerson.bind(null, person.id);

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          Person bearbeiten
        </h1>

        <form
          action={updatePersonWithId}
          className="flex flex-col gap-4 rounded-xl border border-black/10 p-6 dark:border-white/10"
        >
          {person.photoUrl && (
            <Image
              src={person.photoUrl}
              alt={person.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              defaultValue={person.name}
              required
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Neues Foto (optional)
            <input name="photo" type="file" accept="image/*" className="text-sm" />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="canDrive"
              defaultChecked={person.canDrive}
              className="h-4 w-4"
            />
            Kann fahren
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="backSeatOnly"
              defaultChecked={person.backSeatOnly}
              className="h-4 w-4"
            />
            Nur Rücksitz (Kind)
          </label>

          <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]">
            Speichern
          </button>
        </form>
      </main>
    </div>
  );
}
