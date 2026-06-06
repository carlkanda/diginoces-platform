"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  buildMfaRedirectPath,
  buildLoginRedirectPath,
  normalizeInternalPath,
  requestMagicLink,
  verifyEmailOtp,
} from "@/lib/auth/auth-service";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const next = normalizeInternalPath(
    String(formData.get("next") ?? "/platform"),
  );
  const requestHeaders = await headers();
  const result = await requestMagicLink(email, next, {
    requestOrigin: requestHeaders.get("origin"),
  });

  if (result.status === "sent") {
    redirect(
      `/login?${new URLSearchParams({
        email,
        next,
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

export async function signInWithEmailCode(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "");
  const next = normalizeInternalPath(
    String(formData.get("next") ?? "/platform"),
  );
  const result = await verifyEmailOtp(email, token);

  if (result.status === "authenticated") {
    if (result.requiresMfa) {
      redirect(buildMfaRedirectPath(next));
    }

    redirect(next);
  }

  redirect(
    `/login?${new URLSearchParams({
      email,
      error: result.message,
      next,
    }).toString()}`,
  );
}
