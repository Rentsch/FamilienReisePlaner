import Link from "next/link";
import { logout } from "@/app/login/actions";
import { APP_VERSION } from "@/lib/version";
import { AdminNavMobileMenu } from "./AdminNavMobileMenu";
import { SubmitButton } from "./SubmitButton";

const links = [
  { href: "/", label: "Reisen" },
  { href: "/people", label: "Personen" },
  { href: "/vehicles", label: "Autos" },
  { href: "/trailers", label: "Anhänger" },
];

export function AdminNav({ email }: { email: string }) {
  return (
    <nav className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 sm:px-6 sm:py-3">
      <div className="flex min-w-0 items-center gap-4">
        <span className="shrink-0 font-semibold text-foreground">
          FamilienReisePlaner{" "}
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">v{APP_VERSION}</span>
        </span>
        <div className="hidden items-center gap-4 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <AdminNavMobileMenu links={links} />
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="hidden sm:inline">{email}</span>
        <form action={logout}>
          <SubmitButton
            pendingText="Abmelden…"
            className="rounded-full border border-[var(--border)] px-3 py-1 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            Abmelden
          </SubmitButton>
        </form>
      </div>
    </nav>
  );
}
