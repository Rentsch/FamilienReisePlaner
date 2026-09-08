import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        FamilienReisePlaner
      </h1>

      {user ? (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">
            Angemeldet als <span className="font-medium">{user.email}</span>
          </p>
          <form action={logout}>
            <button className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/10 dark:hover:bg-[#1a1a1a]">
              Abmelden
            </button>
          </form>
        </>
      ) : (
        <Link
          href="/login"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Anmelden
        </Link>
      )}
    </div>
  );
}
