import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { updateVehicle } from "../../actions";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({ where: { id, adminUserId: user.id } });
  if (!vehicle) notFound();

  const updateVehicleWithId = updateVehicle.bind(null, vehicle.id);

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          Auto bearbeiten
        </h1>

        <form
          action={updateVehicleWithId}
          className="flex flex-col gap-4 rounded-xl border border-black/10 p-6 dark:border-white/10"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              defaultValue={vehicle.name}
              required
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Sitzplätze gesamt
            <input
              name="seats"
              type="number"
              min={1}
              defaultValue={vehicle.seats}
              required
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            davon vorne (inkl. Fahrer)
            <input
              name="frontSeats"
              type="number"
              min={1}
              defaultValue={vehicle.frontSeats}
              required
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Fahrzeit (Min.)
            <input
              name="travelTimeMinutes"
              type="number"
              min={0}
              defaultValue={vehicle.travelTimeMinutes ?? ""}
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Fahrzeit mit Anhänger (Min.)
            <input
              name="travelTimeWithTrailerMinutes"
              type="number"
              min={0}
              defaultValue={vehicle.travelTimeWithTrailerMinutes ?? ""}
              className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="hasTowHitch"
              defaultChecked={vehicle.hasTowHitch}
              className="h-4 w-4"
            />
            Anhängerkupplung
          </label>

          <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]">
            Speichern
          </button>
        </form>
      </main>
    </div>
  );
}
