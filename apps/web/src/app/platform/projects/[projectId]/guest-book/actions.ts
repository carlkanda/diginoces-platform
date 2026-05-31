"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  requireGuestBookExportCreatePermission,
  requireGuestMessageCoupleReviewPermission,
  requireGuestMessageModerationPermission,
} from "@/lib/guest-wishes/guest-wish-api";
import {
  formText,
  getGuestWishActionContext,
  requireUuid,
} from "@/lib/guest-wishes/guest-wish-action-helpers";
import {
  coupleReviewGuestMessageRecord,
  generateGuestBookExport,
  reviewGuestMessage,
} from "@/lib/guest-wishes/guest-wish-db";

const moderationActions = new Set([
  "approve",
  "edit_and_approve",
  "exclude",
  "flag",
  "restore",
]);
const coupleReviewActions = new Set([
  "approve",
  "exclude",
  "request_correction",
]);

function actionFailurePath(nextPath: string) {
  return `${nextPath}?${new URLSearchParams({ status: "error" }).toString()}`;
}

function logGuestBookActionError(
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

function requireAllowedAction(
  formData: FormData,
  key: string,
  allowedActions: Set<string>,
) {
  const value = formText(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  if (!allowedActions.has(value)) {
    throw new Error(`${key} is not supported.`);
  }

  return value;
}

export async function moderateGuestMessageAction(
  projectId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/guest-book`;
  const context = await getGuestWishActionContext(nextPath);

  await requireGuestMessageModerationPermission(context, projectId);
  const messageId = requireUuid(formData, "messageId");
  const action = requireAllowedAction(formData, "action", moderationActions);

  try {
    await reviewGuestMessage(context.supabase, {
      action,
      approvedText: formText(formData, "approvedText"),
      internalNote: formText(formData, "internalNote"),
      messageId,
    });
  } catch (error) {
    logGuestBookActionError(
      "Guest message moderation failed.",
      error,
      projectId,
    );
    redirect(actionFailurePath(nextPath));
  }

  redirect(`${nextPath}?status=moderated`);
}

export async function coupleReviewGuestMessageAction(
  projectId: string,
  formData: FormData,
) {
  const nextPath = `/platform/projects/${projectId}/guest-book/couple-review`;
  const context = await getGuestWishActionContext(nextPath);

  await requireGuestMessageCoupleReviewPermission(context, projectId);
  const messageId = requireUuid(formData, "messageId");
  const action = requireAllowedAction(formData, "action", coupleReviewActions);

  try {
    await coupleReviewGuestMessageRecord(context.supabase, {
      action,
      comment: formText(formData, "comment"),
      messageId,
    });
  } catch (error) {
    logGuestBookActionError(
      "Couple guest message review failed.",
      error,
      projectId,
    );
    redirect(actionFailurePath(nextPath));
  }

  redirect(`${nextPath}?status=reviewed`);
}

export async function exportGuestBookAction(projectId: string) {
  const nextPath = `/platform/projects/${projectId}/guest-book`;
  const context = await getGuestWishActionContext(nextPath);

  await requireGuestBookExportCreatePermission(context, projectId);
  let result: Awaited<ReturnType<typeof generateGuestBookExport>>;

  try {
    result = await generateGuestBookExport(context.supabase, projectId);
  } catch (error) {
    logGuestBookActionError(
      "Guest-book export generation failed.",
      error,
      projectId,
    );
    redirect(actionFailurePath(nextPath));
  }

  redirect(
    `${nextPath}?status=exported&rows=${encodeURIComponent(
      String(result.rowCount),
    )}`,
  );
}
