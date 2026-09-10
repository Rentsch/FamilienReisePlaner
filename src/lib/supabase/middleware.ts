import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Headers we forward to Server Components once we've validated the user
// here, so pages don't have to make their own round trip to Supabase Auth.
// Any value the client sent itself is stripped first so it can't be forged.
const TRUSTED_USER_HEADERS = ["x-user-id", "x-user-email"];

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  TRUSTED_USER_HEADERS.forEach((name) => requestHeaders.delete(name));

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session if expired — required for Server Components,
  // which can't set cookies themselves.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-email", user.email ?? "");
    // Rebuild once more so the trusted headers reach the Server Component
    // render, carrying over any Set-Cookie already queued above.
    const finalResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie);
    });
    supabaseResponse = finalResponse;
  }

  return supabaseResponse;
}
