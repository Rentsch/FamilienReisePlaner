"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";

export type AppointmentInitial = {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  title: string;
  address: string;
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

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="pop-in w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
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
                  required
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
