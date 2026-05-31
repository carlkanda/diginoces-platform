"use server";

import { redirect } from "next/navigation";
import { submitPublicGuestMessage } from "@/lib/guest-wishes/guest-wish-db";
import { GuestWishValidationError } from "@/lib/guest-wishes/guest-wish-service";
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

function guestPageMessageResultPath(guestToken: string, message: string) {
  return `/g/${encodeURIComponent(guestToken)}?${new URLSearchParams({
    message,
  }).toString()}`;
}

function readPreferredLanguage(formData: FormData) {
  return String(formData.get("preferredLanguage") ?? "")
    .trim()
    .toLowerCase();
}

function hasInvalidPreferredLanguage(value: string) {
  return (
    value.length > 5 ||
    (value.length > 0 &&
      (!/^[a-z]+$/.test(value) || !supportedLanguages.has(value)))
  );
}

export async function submitPublicRsvpAction(
  guestToken: string,
  eventId: string,
  formData: FormData,
) {
  const response = String(formData.get("response") ?? "");
  const rawPreferredLanguage = readPreferredLanguage(formData);

  if (!publicResponses.has(response as RsvpResponseStatus)) {
    redirect(guestPageResultPath(guestToken, "invalid_response"));
  }

  if (hasInvalidPreferredLanguage(rawPreferredLanguage)) {
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

export async function submitPublicGuestMessageAction(
  guestToken: string,
  formData: FormData,
) {
  const messageText = String(formData.get("messageText") ?? "");
  const rawPreferredLanguage = readPreferredLanguage(formData);

  if (hasInvalidPreferredLanguage(rawPreferredLanguage)) {
    redirect(guestPageMessageResultPath(guestToken, "invalid_language"));
  }

  const language = rawPreferredLanguage || null;
  // Count unexpected file fields so the text-only parser rejects upload attempts.
  const attachmentCount = ["attachment", "file", "photo", "video", "audio"]
    .flatMap((key) => formData.getAll(key))
    .filter((value) => {
      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      if (value instanceof File) {
        return value.size > 0 && value.name.length > 0;
      }

      return Boolean(value);
    }).length;

  let result: Awaited<ReturnType<typeof submitPublicGuestMessage>>;

  try {
    result = await submitPublicGuestMessage(
      await createSupabaseServerClient(),
      guestToken,
      {
        attachmentCount,
        language,
        messageText,
      },
    );
  } catch (error) {
    if (error instanceof GuestWishValidationError) {
      console.warn("Public guest message validation failed.");
      redirect(guestPageMessageResultPath(guestToken, "invalid_message_text"));
    }

    console.error(
      "Public guest message submission failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    redirect(guestPageMessageResultPath(guestToken, "error"));
  }

  if (result.status === "saved") {
    redirect(guestPageMessageResultPath(guestToken, "saved"));
  }

  redirect(guestPageMessageResultPath(guestToken, result.status));
}
