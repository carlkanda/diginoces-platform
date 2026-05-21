import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnvironment } from "@/lib/env/public-env";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  const env = requireSupabasePublicEnvironment();

  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
  );
}
