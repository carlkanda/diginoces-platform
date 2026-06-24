"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  LOGIN_EMAIL_COOKIE_MAX_AGE_SECONDS,
  LOGIN_EMAIL_COOKIE_NAME,
  LOGIN_EMAIL_DRAFT_COOKIE_NAME,
} from "./login-email-cookie";
import {
  buildMfaRedirectPath,
  LOGIN_AUTH_ERROR_CODES,
  normalizeInternalPath,
  requestEmailSignInCode,
  verifyEmailOtp,
} from "@/lib/auth/auth-service";

export async function requestEmailCode(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const normalizedEmail = email.trim().toLowerCase();
  const next = normalizeInternalPath(
    String(formData.get("next") ?? "/platform"),
  );
  const requestHeaders = await headers();
  const result = await requestEmailSignInCode(normalizedEmail, next, {
    requestOrigin: requestHeaders.get("origin"),
  });

  if (result.status === "sent") {
    const cookieStore = await cookies();

    cookieStore.set(LOGIN_EMAIL_COOKIE_NAME, normalizedEmail, {
      httpOnly: true,
      maxAge: LOGIN_EMAIL_COOKIE_MAX_AGE_SECONDS,
      path: "/login",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.delete({ name: LOGIN_EMAIL_DRAFT_COOKIE_NAME, path: "/login" });

    redirect(
      `/login?${new URLSearchParams({
        next,
        sent: "1",
      }).toString()}`,
    );
  }

  const cookieStore = await cookies();

  cookieStore.delete({ name: LOGIN_EMAIL_COOKIE_NAME, path: "/login" });

  if (normalizedEmail) {
    cookieStore.set(LOGIN_EMAIL_DRAFT_COOKIE_NAME, normalizedEmail, {
      httpOnly: true,
      maxAge: LOGIN_EMAIL_COOKIE_MAX_AGE_SECONDS,
      path: "/login",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    cookieStore.delete({ name: LOGIN_EMAIL_DRAFT_COOKIE_NAME, path: "/login" });
  }

  redirect(
    `/login?${new URLSearchParams({
      error: result.code,
      next,
    }).toString()}`,
  );
}

export async function signInWithEmailCode(formData: FormData) {
  const cookieStore = await cookies();
  const email = cookieStore.get(LOGIN_EMAIL_COOKIE_NAME)?.value ?? "";
  const token = String(formData.get("token") ?? "");
  const next = normalizeInternalPath(
    String(formData.get("next") ?? "/platform"),
  );

  if (!email) {
    redirect(
      `/login?${new URLSearchParams({
        error: LOGIN_AUTH_ERROR_CODES.AUTH_EMAIL_INVALID,
        next,
      }).toString()}`,
    );
  }

  const result = await verifyEmailOtp(email, token);

  if (result.status === "authenticated") {
    cookieStore.delete({ name: LOGIN_EMAIL_COOKIE_NAME, path: "/login" });
    cookieStore.delete({ name: LOGIN_EMAIL_DRAFT_COOKIE_NAME, path: "/login" });

    if (result.requiresMfa) {
      redirect(buildMfaRedirectPath(next));
    }

    redirect(next);
  }

  redirect(
    `/login?${new URLSearchParams({
      error: result.code,
      next,
      sent: "1",
    }).toString()}`,
  );
}
