import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { createVehicle, deleteVehicle } from "./actions";

export default async function VehiclesPage() {
  const user = await requireAdmin();
  const vehicles = await prisma.vehicle.findMany({
    where: { adminUserId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          Autos
        </h1>

        <form
          action={createVehicle}
          className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              required
              placeholder="z.B. VW Touran"
              className="w-40 rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Sitzplätze
            <input
              name="seats"
              type="number"
              min={1}
              required
              className="w-24 rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Fahrzeit (Min.)
            <input
              name="travelTimeMinutes"
              type="number"
              min={0}
              className="w-28 rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Fahrzeit mit Anhänger (Min.)
            <input
              name="travelTimeWithTrailerMinutes"
              type="number"
              min={0}
              className="w-32 rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" name="hasTowHitch" className="h-4 w-4" />
            Anhängerkupplung
          </label>
          <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]">
            Hinzufügen
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex items-center gap-3 rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
            >
              <div className="flex-1">
                <p className="font-medium text-black dark:text-zinc-50">
                  {vehicle.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {vehicle.seats} Sitzplätze
                  {vehicle.hasTowHitch && " · Anhängerkupplung"}
                  {vehicle.travelTimeMinutes != null &&
                    ` · ${vehicle.travelTimeMinutes} Min.`}
                </p>
              </div>
              <form action={deleteVehicle.bind(null, vehicle.id)}>
                <button className="text-sm text-red-600 hover:text-red-800 dark:text-red-400">
                  Löschen
                </button>
              </form>
            </li>
          ))}
          {vehicles.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Autos angelegt.
            </p>
          )}
        </ul>
      </main>
    </div>
  );
}
