"use server";

import { redirect } from "next/navigation";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { serverLogger } from "@/lib/logging";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signOutFailurePath = "/platform?signOut=failed";

export async function signOut() {
  const env = getPublicEnvironment();
  let redirectPath = "/login";

  if (env.supabaseConfigured) {
    try {
      const supabase = await createSupabaseServerClient({
        throwOnCookieWriteError: true,
      });
      const { error } = await supabase.auth.signOut();

      if (error) {
        serverLogger.error("Supabase sign-out returned an error.", { error });
        redirectPath = signOutFailurePath;
      } else {
        serverLogger.info("Supabase sign-out completed.");
      }
    } catch (error) {
      serverLogger.error("Supabase sign-out failed.", { error });
      redirectPath = signOutFailurePath;
    }
  } else {
    serverLogger.info("Sign-out requested without Supabase configuration.");
  }

  redirect(redirectPath);
}
