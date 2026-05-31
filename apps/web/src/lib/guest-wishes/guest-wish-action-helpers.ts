import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";

// Form IDs must be real database UUIDs. Nil/sentinel UUIDs are rejected.
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function requireFormText(formData: FormData, key: string) {
  const value = formText(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export function requireUuid(formData: FormData, key: string) {
  const value = requireFormText(formData, key);

  if (!uuidPattern.test(value)) {
    throw new Error(`${key} must be a valid UUID.`);
  }

  return value;
}

export async function getGuestWishActionContext(nextPath: string) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(nextPath));
  }

  if (authContext.status === "not_configured") {
    throw new Error("Supabase is not configured.");
  }

  return {
    supabase: authContext.supabase,
    user: authContext.user,
  };
}
