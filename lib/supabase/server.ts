import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) {
          try {
            for (const c of list) cookieStore.set(c.name, c.value, c.options);
          } catch {
            // Called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  );
}
