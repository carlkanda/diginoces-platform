"use server";

import { redirect } from "next/navigation";
import {
  normalizeInternalPath,
  requestMagicLink,
} from "@/lib/auth/auth-service";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const next = normalizeInternalPath(
    String(formData.get("next") ?? "/platform"),
  );
  const result = await requestMagicLink(email, next);

  if (result.status === "sent") {
    redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
  }

  redirect(`/login?error=${encodeURIComponent(result.message)}&next=${next}`);
}
