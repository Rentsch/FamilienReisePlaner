"use client";

import { useRouter } from "next/navigation";

export function AdminNavMobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const router = useRouter();

  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const href = e.target.value;
        if (href) router.push(href);
        e.target.value = "";
      }}
      className="rounded border border-[var(--border)] bg-transparent px-2 py-1 text-sm text-foreground sm:hidden dark:bg-[var(--surface)]"
    >
      <option value="" disabled>
        Menü
      </option>
      {links.map((link) => (
        <option key={link.href} value={link.href}>
          {link.label}
        </option>
      ))}
    </select>
  );
}
