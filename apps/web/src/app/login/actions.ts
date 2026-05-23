"use server";

import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
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
    redirect(
      `/login?${new URLSearchParams({
        email,
        sent: "1",
      }).toString()}`,
    );
  }

  redirect(
    `${buildLoginRedirectPath(next)}&${new URLSearchParams({
      error: result.message,
    }).toString()}`,
  );
}
