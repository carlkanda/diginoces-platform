export type PublicEnvironment = {
  appUrl: string;
  missingSupabaseVariables: string[];
  supabaseConfigured: boolean;
  supabasePublishableKey?: string;
  supabaseUrl?: string;
};

const FALLBACK_APP_URL = "http://localhost:3000";

export function getPublicEnvironment(): PublicEnvironment {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const missingSupabaseVariables = [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      value: supabaseUrl,
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      value: supabasePublishableKey,
    },
  ]
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || FALLBACK_APP_URL,
    missingSupabaseVariables,
    supabaseConfigured: missingSupabaseVariables.length === 0,
    supabasePublishableKey,
    supabaseUrl,
  };
}

export function requireSupabasePublicEnvironment() {
  const env = getPublicEnvironment();

  if (
    !env.supabaseConfigured ||
    !env.supabaseUrl ||
    !env.supabasePublishableKey
  ) {
    throw new Error(
      `Missing Supabase public environment variables: ${env.missingSupabaseVariables.join(", ")}`,
    );
  }

  return {
    supabasePublishableKey: env.supabasePublishableKey,
    supabaseUrl: env.supabaseUrl,
  };
}
