import Link from "next/link";
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
        <h1 className="mb-6 text-2xl font-semibold text-foreground">
          Autos
        </h1>

        <form
          action={createVehicle}
          className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-4"
        >
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Name
            <input
              name="name"
              required
              placeholder="z.B. VW Touran"
              className="w-40 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Sitzplätze gesamt
            <input
              name="seats"
              type="number"
              min={1}
              required
              className="w-24 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            davon vorne (inkl. Fahrer)
            <input
              name="frontSeats"
              type="number"
              min={1}
              defaultValue={2}
              required
              className="w-24 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" name="hasTowHitch" className="h-4 w-4" />
            Anhängerkupplung
          </label>
          <button className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110">
            Hinzufügen
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {vehicle.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {vehicle.frontSeats} vorne / {vehicle.seats - vehicle.frontSeats} hinten
                  {vehicle.hasTowHitch && " · Anhängerkupplung"}
                </p>
              </div>
              <Link
                href={`/vehicles/${vehicle.id}/edit`}
                className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
              >
                Bearbeiten
              </Link>
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
