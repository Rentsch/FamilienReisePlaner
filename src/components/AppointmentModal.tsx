"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { IconFileTypePdf, IconPaperclip, IconX } from "@tabler/icons-react";

export type AppointmentAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

export type AppointmentInitial = {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  title: string;
  address: string;
  attachments?: AppointmentAttachment[];
};

export function AppointmentModal({
  trigger,
  heading,
  initial,
  onSubmit,
}: {
  trigger: (open: () => void) => ReactNode;
  heading: string;
  initial?: AppointmentInitial;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AppointmentAttachment[]>(initial?.attachments ?? []);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(formData);
        setOpen(false);
      } catch {
        setError("Speichern fehlgeschlagen. Versuch's nochmal.");
      }
    });
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setRemovedIds((prev) => [...prev, id]);
  }

  function openModal() {
    // re-sync with the latest saved attachments and discard any pending
    // removals from a previous open/cancel cycle
    setAttachments(initial?.attachments ?? []);
    setRemovedIds([]);
    setError(null);
    setOpen(true);
  }

  return (
    <>
      {trigger(openModal)}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="pop-in w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
          >
            <h2 className="text-base font-semibold text-foreground">{heading}</h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                Überschrift
                <input
                  name="title"
                  required
                  defaultValue={initial?.title}
                  className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                Anschrift
                <input
                  name="address"
                  defaultValue={initial?.address}
                  placeholder="Straße, PLZ Ort"
                  className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                Datum
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={initial?.date}
                  className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                  Start
                  <input
                    name="startTime"
                    type="time"
                    required
                    defaultValue={initial?.startTime}
                    className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                  Ende
                  <input
                    name="endTime"
                    type="time"
                    required
                    defaultValue={initial?.endTime}
                    className="rounded border border-[var(--border)] px-3 py-2 dark:bg-[var(--surface)]"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Anhänge (Bilder, PDF)</span>
                {attachments.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {attachments.map((a) => (
                      <li key={a.id} className="relative">
                        {a.mimeType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.url}
                            alt={a.filename}
                            className="h-14 w-14 rounded-lg border border-[var(--border)] object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-lg border border-[var(--border)] p-1 text-center">
                            <IconFileTypePdf size={20} stroke={1.5} />
                            <span className="w-full truncate text-[9px] text-zinc-500 dark:text-zinc-400">
                              {a.filename}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.id)}
                          aria-label={`${a.filename} entfernen`}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          <IconX size={12} stroke={2.5} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {removedIds.map((id) => (
                  <input key={id} type="hidden" name="removeAttachmentIds" value={id} />
                ))}
                <label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <IconPaperclip size={14} stroke={1.75} className="shrink-0" />
                  <input
                    name="attachments"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="w-full text-xs file:mr-2 file:rounded-full file:border file:border-[var(--border)] file:bg-transparent file:px-2 file:py-1 file:text-xs"
                  />
                </label>
              </div>
              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-full border border-[var(--border)] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-50 dark:hover:bg-white/[.06]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                >
                  {pending ? "Speichern…" : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
