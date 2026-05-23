"use server";

import { redirect } from "next/navigation";
import { submitPublicGuestRsvp } from "@/lib/rsvp/rsvp-db";
import type { RsvpResponseStatus } from "@/lib/rsvp/rsvp-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const publicResponses = new Set<RsvpResponseStatus>(["maybe", "no", "yes"]);
const supportedLanguages = new Set(["en", "fr"]);

function guestPageResultPath(guestToken: string, rsvp: string) {
  return `/g/${encodeURIComponent(guestToken)}?${new URLSearchParams({
    rsvp,
  }).toString()}`;
}

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
    redirect(guestPageResultPath(guestToken, "invalid_response"));
  }

  if (
    rawPreferredLanguage.length > 5 ||
    (rawPreferredLanguage.length > 0 &&
      (!/^[a-z]+$/.test(rawPreferredLanguage) ||
        !supportedLanguages.has(rawPreferredLanguage)))
  ) {
    redirect(guestPageResultPath(guestToken, "invalid_language"));
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
    redirect(guestPageResultPath(guestToken, "error"));
  }

  const status = result?.status ?? "error";

  if (status === "saved") {
    redirect(guestPageResultPath(guestToken, "saved"));
  }

  redirect(guestPageResultPath(guestToken, status));
}
