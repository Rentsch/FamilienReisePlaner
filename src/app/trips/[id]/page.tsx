import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { formatTripDate } from "@/lib/time";
import { updateTripTravelTimes } from "../actions";
import { deleteVariant } from "@/app/t/[shareToken]/variant/actions";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id, adminUserId: user.id },
    include: {
      participants: { include: { person: true } },
      tripVehicles: { include: { vehicle: true }, orderBy: { id: "asc" } },
      tripTrailers: { include: { trailer: true } },
      variants: {
        include: { votes: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!trip) notFound();

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/t/${trip.shareToken}`;

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-6 pb-10">
        <Link
          href="/"
          className="mb-1 inline-block text-xs font-medium text-accent hover:underline"
        >
          ← Alle Reisen
        </Link>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{trip.name}</h1>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/trips/${trip.id}/schedule`}
              className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Tagesablauf
            </Link>
            <Link
              href={`/trips/${trip.id}/edit`}
              className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Bearbeiten
            </Link>
          </div>
        </div>
        {formatTripDate(trip.date) && (
          <p className="mb-1 text-sm font-medium text-accent">{formatTripDate(trip.date)}</p>
        )}
        {trip.description && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{trip.description}</p>
        )}

        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Share-Link für die Familie</p>
            <p className="hidden break-all font-mono text-sm text-foreground sm:block">{shareUrl}</p>
          </div>
          <CopyLinkButton url={shareUrl} />
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            In neuem Tab öffnen
          </a>
        </div>

        <section className="mb-8">
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Teilnehmer
          </h2>
          <ul className="flex flex-wrap gap-2">
            {trip.participants.map((p) => (
              <li
                key={p.id}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300"
              >
                {p.person.name}
                {p.hasBike && " 🚲"}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Autos {trip.tripTrailers.length > 0 && "& Anhänger"}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {trip.tripVehicles.map((v) => (
              <li
                key={v.id}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300"
              >
                {v.vehicle.name}
              </li>
            ))}
            {trip.tripTrailers.map((t) => (
              <li
                key={t.id}
                className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300"
              >
                {t.trailer.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Fahrzeiten
          </h2>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Die Standard-Abfahrtszeit wird bei einer neuen Variante für jedes Auto vorausgefüllt und kann dort pro
            Auto angepasst werden.
          </p>
          <form
            action={updateTripTravelTimes.bind(null, trip.id)}
            className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--border)] p-4"
          >
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Ohne Anhänger (Min.)
              <input
                name="travelTimeMinutes"
                type="number"
                min={0}
                defaultValue={trip.travelTimeMinutes ?? ""}
                className="w-32 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Mit Fahrradanhänger (Min.)
              <input
                name="travelTimeWithBikeTrailerMinutes"
                type="number"
                min={0}
                defaultValue={trip.travelTimeWithBikeTrailerMinutes ?? ""}
                className="w-32 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Mit Lastenanhänger (Min.)
              <input
                name="travelTimeWithCargoTrailerMinutes"
                type="number"
                min={0}
                defaultValue={trip.travelTimeWithCargoTrailerMinutes ?? ""}
                className="w-32 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Standard-Abfahrtszeit
              <input
                name="defaultDepartureTime"
                type="time"
                defaultValue={trip.defaultDepartureTime ?? ""}
                className="w-32 rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
              />
            </label>
            <SubmitButton
              pendingText="Wird gespeichert…"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Speichern
            </SubmitButton>
          </form>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">
              Varianten
            </h2>
            <Link
              href={`/t/${trip.shareToken}/variant/new`}
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110"
            >
              Neue Variante
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {trip.variants.map((variant) => (
              <li
                key={variant.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-4 py-3 text-sm"
              >
                <Link
                  href={`/t/${trip.shareToken}/variant/${variant.id}`}
                  className="flex flex-1 items-center justify-between gap-2 hover:underline"
                >
                  <span className="text-foreground">{variant.name}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {variant.votes.length} Stimme{variant.votes.length !== 1 && "n"}
                  </span>
                </Link>
                <Link
                  href={`/t/${trip.shareToken}/variant/${variant.id}/edit`}
                  className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                >
                  Bearbeiten
                </Link>
                <ConfirmDeleteButton
                  action={deleteVariant.bind(null, trip.shareToken, variant.id)}
                  confirmMessage={<>Variante „{variant.name}“ wirklich löschen?</>}
                  className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
                />
              </li>
            ))}
            {trip.variants.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Noch keine Varianten erstellt.
              </p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
