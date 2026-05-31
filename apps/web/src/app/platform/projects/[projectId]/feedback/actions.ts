"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  requirePostEventFeedbackReviewPermission,
  requirePostEventFeedbackSubmitPermission,
} from "@/lib/guest-wishes/guest-wish-api";
import {
  formText,
  getGuestWishActionContext,
  requireFormText,
  requireUuid,
} from "@/lib/guest-wishes/guest-wish-action-helpers";
import {
  reviewPostEventFeedback,
  submitPostEventFeedback,
} from "@/lib/guest-wishes/guest-wish-db";

const feedbackReviewStatuses = new Set([
  "approved_for_public_use",
  "rejected",
  "reviewed",
]);

function feedbackActionFailurePath(nextPath: string) {
  return `${nextPath}?${new URLSearchParams({ status: "error" }).toString()}`;
}

function logFeedbackActionError(
  label: string,
  error: unknown,
  projectId: string,
) {
  const requestId = randomUUID();

  console.error(label, {
    error: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : undefined,
    projectId,
    requestId,
  });
}

function parseRating(formData: FormData, key: string, required: true): number;
function parseRating(
  formData: FormData,
  key: string,
  required?: false,
): number | null;
function parseRating(formData: FormData, key: string, required = false) {
  const value = formText(formData, key);

  if (!value) {
    if (required) {
      throw new Error(`${key} is required.`);
    }

    return null;
  }

  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`${key} must be between 1 and 5.`);
  }

  return rating;
}

function requireFeedbackReviewStatus(formData: FormData) {
  const value = formText(formData, "reviewStatus") ?? "reviewed";

  if (!feedbackReviewStatuses.has(value)) {
    throw new Error("reviewStatus is not supported.");
  }

  return value;
}

export async function submitPostEventFeedbackAction(
  projectId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/feedback`;
  const context = await getGuestWishActionContext(nextPath);

  await requirePostEventFeedbackSubmitPermission(context, projectId);
  const feedbackText = requireFormText(formData, "feedbackText");

  try {
    await submitPostEventFeedback(context.supabase, projectId, {
      feedbackText,
      improvementSuggestions: formText(formData, "improvementSuggestions"),
      invitationCommunicationRating: parseRating(
        formData,
        "invitationCommunicationRating",
      ),
      overallRating: parseRating(formData, "overallRating", true),
      publicDisplayName: formText(formData, "publicDisplayName"),
      serviceQualityRating: parseRating(formData, "serviceQualityRating"),
      testimonialPermissionGranted:
        formData.get("testimonialPermissionGranted") === "on",
      testimonialText: formText(formData, "testimonialText"),
    });
  } catch (error) {
    logFeedbackActionError(
      "Post-event feedback submission failed.",
      error,
      projectId,
    );
    redirect(feedbackActionFailurePath(nextPath));
  }

  redirect(`${nextPath}?status=submitted`);
}

export async function reviewPostEventFeedbackAction(
  projectId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/feedback`;
  const context = await getGuestWishActionContext(nextPath);

  await requirePostEventFeedbackReviewPermission(context, projectId);
  const feedbackId = requireUuid(formData, "feedbackId");
  const reviewStatus = requireFeedbackReviewStatus(formData);

  try {
    await reviewPostEventFeedback(context.supabase, {
      feedbackId,
      internalReviewNote: formText(formData, "internalReviewNote"),
      reviewStatus,
    });
  } catch (error) {
    logFeedbackActionError(
      "Post-event feedback review failed.",
      error,
      projectId,
    );
    redirect(feedbackActionFailurePath(nextPath));
  }

  redirect(`${nextPath}?status=reviewed`);
}
