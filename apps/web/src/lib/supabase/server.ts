import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnvironment } from "@/lib/env/public-env";
import type { Database } from "@/types/database";

/**
 * Options for configuring Supabase server client cookie handling.
 */
export type SupabaseServerClientOptions = {
  /**
   * Throws cookie write failures instead of swallowing them. Defaults to false
   * because Server Components cannot write cookies; enable this for server flows
   * such as sign-out where a failed cookie write must change request handling.
   */
  throwOnCookieWriteError?: boolean;
};

/**
 * Creates a Supabase server client integrated with Next.js request cookies.
 */
export async function createSupabaseServerClient(
  options: SupabaseServerClientOptions = {},
) {
  const env = requireSupabasePublicEnvironment();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            if (options.throwOnCookieWriteError) {
              throw error;
            }

            // Server Components cannot write cookies. Proxy refresh handles it.
          }
        },
      },
    },
  );
}
