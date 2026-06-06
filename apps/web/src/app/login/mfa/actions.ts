"use server";

import { redirect } from "next/navigation";
import {
  buildMfaRedirectPath,
  normalizeInternalPath,
  verifyMfaCode,
} from "@/lib/auth/auth-service";

export async function verifyMfaAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const next = normalizeInternalPath(
    String(formData.get("next") ?? "/platform"),
  );
  const result = await verifyMfaCode(code);

  if (result.status === "verified") {
    redirect(next);
  }

  redirect(buildMfaRedirectPath(next, result.message));
}
