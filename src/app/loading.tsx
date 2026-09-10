export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Lädt…</p>
    </div>
  );
}
