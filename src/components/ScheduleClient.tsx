"use client";

import { useRef, useState } from "react";
import { IconDownload, IconFileTypePdf, IconMapPin, IconPencil, IconPlus } from "@tabler/icons-react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { AppointmentModal, type AppointmentInitial } from "@/components/AppointmentModal";
import { FamilyHeader } from "@/components/FamilyHeader";
import { createAppointment, deleteAppointment, updateAppointment } from "@/app/t/[shareToken]/schedule/actions";

// Fixed width the export image is rendered at, regardless of the device that triggers it,
// so the exported PNG looks identical whether it's generated from a phone or a desktop.
const EXPORT_WIDTH = 640;

type Attachment = { id: string; url: string; filename: string; mimeType: string };

type Appointment = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  title: string;
  address: string;
  attachments: Attachment[];
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function slug(s: string) {
  return s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}

export function ScheduleClient({
  shareToken,
  tripId,
  tripName,
  isAdminView,
  appointments,
}: {
  shareToken: string;
  tripId: string;
  tripName: string;
  isAdminView?: boolean;
  appointments: Appointment[];
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const groups = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    const key = toDateKey(appointment.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(appointment);
  }
  const dateKeys = [...groups.keys()].sort();

  async function handleExport() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    setExportError(null);

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.left = "-99999px";
    host.style.width = `${EXPORT_WIDTH}px`;
    host.style.pointerEvents = "none";
    const clone = exportRef.current.cloneNode(true) as HTMLDivElement;
    clone.style.width = `${EXPORT_WIDTH}px`;
    clone.querySelectorAll("[data-export-hide]").forEach((el) => el.remove());
    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      const { toPng } = await import("html-to-image");
      const backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      const dataUrl = await Promise.race([
        toPng(clone, { backgroundColor: backgroundColor || undefined, pixelRatio: 2 }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("export timed out")), 20000)),
      ]);
      const filename = `tagesablauf-${slug(tripName)}.png`;

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Tagesablauf ${tripName}` });
          return;
        } catch (shareError) {
          if (shareError instanceof Error && shareError.name === "AbortError") return;
        }
      }

      const link = document.createElement("a");
      const objectUrl = URL.createObjectURL(file);
      link.download = filename;
      link.href = objectUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (e) {
      console.error("Tagesablauf export failed", e);
      setExportError("Export fehlgeschlagen. Versuch's nochmal.");
    } finally {
      host.remove();
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <FamilyHeader
        shareToken={shareToken}
        backHref={`/t/${shareToken}/trip`}
        backLabel="Zurück zur Reise"
        isAdminView={isAdminView}
        tripId={tripId}
      />

      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-foreground">Tagesablauf</h1>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleExport}
              disabled={exporting || appointments.length === 0}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
            >
              <IconDownload size={16} stroke={1.75} />
              {exporting ? "Exportiere…" : "Export"}
            </button>
            <AppointmentModal
              heading="Termin hinzufügen"
              onSubmit={(formData) => createAppointment(shareToken, formData)}
              trigger={(open) => (
                <button
                  onClick={open}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110"
                >
                  <IconPlus size={16} stroke={2} />
                  Termin
                </button>
              )}
            />
          </div>
        </div>
        {exportError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{exportError}</p>}
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
        <div ref={exportRef} className="flex flex-col gap-6 bg-background p-2">
          {dateKeys.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Noch keine Termine eingetragen.</p>
          )}
          {dateKeys.map((dateKey) => (
            <section key={dateKey}>
              <h2 className="mb-2 text-sm font-medium text-accent">{formatDay(dateKey)}</h2>
              <ul className="flex flex-col gap-2">
                {groups.get(dateKey)!.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {appointment.startTime}–{appointment.endTime} Uhr
                      </p>
                      <p className="font-medium text-foreground">{appointment.title}</p>
                      <a
                        href={mapsUrl(appointment.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                      >
                        <IconMapPin size={14} stroke={1.75} className="shrink-0" />
                        <span className="break-words">{appointment.address}</span>
                      </a>
                      {appointment.attachments.length > 0 && (
                        <ul data-export-hide className="mt-2 flex flex-wrap gap-1.5">
                          {appointment.attachments.map((a) => (
                            <li key={a.id}>
                              <a href={a.url} target="_blank" rel="noopener noreferrer" title={a.filename}>
                                {a.mimeType.startsWith("image/") ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={a.url}
                                    alt={a.filename}
                                    className="h-12 w-12 rounded-lg border border-[var(--border)] object-cover"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-black/[.04] dark:hover:bg-white/[.06]">
                                    <IconFileTypePdf size={18} stroke={1.5} />
                                  </div>
                                )}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div data-export-hide className="flex shrink-0 gap-1">
                      <AppointmentModal
                        heading="Termin bearbeiten"
                        initial={toInitial(appointment)}
                        onSubmit={(formData) => updateAppointment(shareToken, appointment.id, formData)}
                        trigger={(open) => (
                          <button
                            onClick={open}
                            aria-label="Bearbeiten"
                            className="rounded-full border border-[var(--border)] p-2 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                          >
                            <IconPencil size={14} stroke={1.75} />
                          </button>
                        )}
                      />
                      <ConfirmDeleteButton
                        action={() => deleteAppointment(shareToken, appointment.id)}
                        confirmMessage={<>Termin „{appointment.title}“ wirklich löschen?</>}
                        label="Löschen"
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-red-600 hover:bg-black/[.04] dark:text-red-400 dark:hover:bg-white/[.06]"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function toInitial(appointment: Appointment): AppointmentInitial {
  return {
    date: toDateKey(appointment.date),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    title: appointment.title,
    address: appointment.address,
    attachments: appointment.attachments,
  };
}
