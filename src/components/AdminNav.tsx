import Link from "next/link";
import { logout } from "@/app/login/actions";
import { APP_VERSION } from "@/lib/version";

const links = [
  { href: "/", label: "Reisen" },
  { href: "/people", label: "Personen" },
  { href: "/vehicles", label: "Autos" },
  { href: "/trailers", label: "Anhänger" },
];

export function AdminNav({ email }: { email: string }) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-semibold text-foreground">
          FamilienReisePlaner{" "}
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">v{APP_VERSION}</span>
        </span>
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
      <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span>{email}</span>
        <form action={logout}>
          <button className="rounded-full border border-[var(--border)] px-3 py-1 hover:bg-black/[.04] dark:hover:bg-white/[.06]">
            Abmelden
          </button>
        </form>
      </div>
    </nav>
  );
}
