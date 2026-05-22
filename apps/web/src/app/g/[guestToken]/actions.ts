"use server";

import { redirect } from "next/navigation";
import { submitPublicGuestRsvp } from "@/lib/rsvp/rsvp-db";
import type { RsvpResponseStatus } from "@/lib/rsvp/rsvp-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const publicResponses = new Set<RsvpResponseStatus>(["maybe", "no", "yes"]);

export async function submitPublicRsvpAction(
  guestToken: string,
  eventId: string,
  formData: FormData,
) {
  const response = String(formData.get("response") ?? "");
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "");

  if (!publicResponses.has(response as RsvpResponseStatus)) {
    redirect(`/g/${guestToken}?rsvp=invalid_response`);
  }

  let result: Awaited<ReturnType<typeof submitPublicGuestRsvp>>;

  try {
    result = await submitPublicGuestRsvp(
      await createSupabaseServerClient(),
      guestToken,
      eventId,
      response as RsvpResponseStatus,
      preferredLanguage || null,
    );
  } catch (error) {
    console.error("Public RSVP submission failed.", error);
    redirect(`/g/${guestToken}?rsvp=error`);
  }

  if (
    result &&
    typeof result === "object" &&
    "status" in result &&
    result.status === "saved"
  ) {
    redirect(`/g/${guestToken}?rsvp=saved`);
  }

  const status =
    result && typeof result === "object" && "status" in result
      ? String(result.status)
      : "error";

  redirect(`/g/${guestToken}?rsvp=${encodeURIComponent(status)}`);
}
