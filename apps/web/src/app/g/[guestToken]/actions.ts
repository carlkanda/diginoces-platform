"use server";

import { redirect } from "next/navigation";
import { submitPublicGuestRsvp } from "@/lib/rsvp/rsvp-db";
import type { RsvpResponseStatus } from "@/lib/rsvp/rsvp-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const publicResponses = new Set<RsvpResponseStatus>(["maybe", "no", "yes"]);
const supportedLanguages = new Set(["en", "fr"]);

export async function submitPublicRsvpAction(
  guestToken: string,
  eventId: string,
  formData: FormData,
) {
  const response = String(formData.get("response") ?? "");
  const rawPreferredLanguage = String(formData.get("preferredLanguage") ?? "")
    .trim()
    .toLowerCase();

  if (!publicResponses.has(response as RsvpResponseStatus)) {
    redirect(`/g/${guestToken}?rsvp=invalid_response`);
  }

  if (
    rawPreferredLanguage.length > 5 ||
    (rawPreferredLanguage.length > 0 &&
      (!/^[a-z]+$/.test(rawPreferredLanguage) ||
        !supportedLanguages.has(rawPreferredLanguage)))
  ) {
    redirect(`/g/${guestToken}?rsvp=invalid_language`);
  }

  const preferredLanguage = rawPreferredLanguage || null;
  let result: Awaited<ReturnType<typeof submitPublicGuestRsvp>>;

  try {
    result = await submitPublicGuestRsvp(
      await createSupabaseServerClient(),
      guestToken,
      eventId,
      response as RsvpResponseStatus,
      preferredLanguage,
    );
  } catch {
    console.error("Public RSVP submission failed.");
    redirect(`/g/${guestToken}?rsvp=error`);
  }

  const status = result?.status ?? "error";

  if (status === "saved") {
    redirect(`/g/${guestToken}?rsvp=saved`);
  }

  redirect(`/g/${guestToken}?rsvp=${encodeURIComponent(status)}`);
}
