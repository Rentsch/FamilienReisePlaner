import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AdminUser = { id: string; email: string | null };

// The middleware already validated the session against Supabase Auth for
// this request and forwarded the result via trusted headers, so we can skip
// a second network round trip here in the common case.
async function getUserFromHeaders(): Promise<AdminUser | null> {
  const headersList = await headers();
  const id = headersList.get("x-user-id");
  if (!id) return null;
  return { id, email: headersList.get("x-user-email") || null };
}

export async function requireAdmin(): Promise<AdminUser> {
  const fromHeaders = await getUserFromHeaders();
  if (fromHeaders) return fromHeaders;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { id: user.id, email: user.email ?? null };
}

// Non-redirecting check for pages that render for both the family (via share
// link) and the logged-in admin, so the admin can still see a way back.
export async function getAdminUser(): Promise<AdminUser | null> {
  const fromHeaders = await getUserFromHeaders();
  if (fromHeaders) return fromHeaders;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}
