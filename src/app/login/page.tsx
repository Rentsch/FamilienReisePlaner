import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <form className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <h1 className="text-xl font-semibold text-foreground">
          FamilienReisePlaner
        </h1>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {message}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          E-Mail
          <input
            name="email"
            type="email"
            required
            className="rounded border border-[var(--border)] px-3 py-2 text-foreground dark:bg-[var(--surface)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Passwort
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded border border-[var(--border)] px-3 py-2 text-foreground dark:bg-[var(--surface)]"
          />
        </label>

        <div className="flex pt-2">
          <button
            formAction={login}
            className="flex-1 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
          >
            Anmelden
          </button>
        </div>
      </form>
    </div>
  );
}
