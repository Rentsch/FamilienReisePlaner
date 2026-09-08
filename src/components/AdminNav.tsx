import Link from "next/link";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/", label: "Reisen" },
  { href: "/people", label: "Personen" },
  { href: "/vehicles", label: "Autos" },
  { href: "/trailers", label: "Anhänger" },
];

export function AdminNav({ email }: { email: string }) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-6 py-3 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-semibold text-black dark:text-zinc-50">
          FamilienReisePlaner
        </span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span>{email}</span>
        <form action={logout}>
          <button className="rounded-full border border-black/10 px-3 py-1 hover:bg-black/[.04] dark:border-white/10 dark:hover:bg-[#1a1a1a]">
            Abmelden
          </button>
        </form>
      </div>
    </nav>
  );
}
