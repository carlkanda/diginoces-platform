import { cookies } from "next/headers";
import {
  LANGUAGE_COOKIE_NAME,
  normalizeLanguage,
  type SupportedLanguage,
} from "@/lib/i18n/config";

export async function getRequestLanguage(): Promise<SupportedLanguage> {
  const cookieStore = await cookies();

  return normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
}
