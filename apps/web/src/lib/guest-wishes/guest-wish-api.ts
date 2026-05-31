import { InvalidJsonBodyError } from "@/lib/api/read-json";
import {
  handleProjectApiError,
  hasProjectPermission,
  jsonError,
  ProjectAccessError,
  requireProjectPermission,
  type ProjectApiContext,
} from "@/lib/projects/project-api";
import { GuestWishValidationError } from "@/lib/guest-wishes/guest-wish-service";

export async function requireGuestMessageReadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "guest_messages.read");
}

export async function requireGuestMessageModerationPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "guest_messages.moderate");
}

export async function requireGuestMessageCoupleReviewPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(
    context,
    projectId,
    "guest_messages.couple_review",
  );
}

export async function requireGuestBookExportCreatePermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(
    context,
    projectId,
    "guest_book_exports.create",
  );
}

export async function requireGuestBookExportReadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(context, projectId, "guest_book_exports.read");
}

export async function getGuestBookPagePermissions(
  context: ProjectApiContext,
  projectId: string,
) {
  const [
    canReadMessages,
    canModerateMessages,
    canReviewAsCouple,
    canReadExports,
    canCreateExports,
  ] = await Promise.all([
    hasProjectPermission(context, projectId, "guest_messages.read"),
    hasProjectPermission(context, projectId, "guest_messages.moderate"),
    hasProjectPermission(context, projectId, "guest_messages.couple_review"),
    hasProjectPermission(context, projectId, "guest_book_exports.read"),
    hasProjectPermission(context, projectId, "guest_book_exports.create"),
  ]);

  return {
    canCreateExports,
    canModerateMessages,
    canReadExports,
    canReadMessages,
    canReviewAsCouple,
  };
}

export async function requirePostEventFeedbackSubmitPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(
    context,
    projectId,
    "post_event_feedback.submit",
  );
}

export async function requirePostEventFeedbackReadPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(
    context,
    projectId,
    "post_event_feedback.read",
  );
}

export async function requirePostEventFeedbackReviewPermission(
  context: ProjectApiContext,
  projectId: string,
) {
  await requireProjectPermission(
    context,
    projectId,
    "post_event_feedback.review",
  );
}

export async function getPostEventFeedbackPagePermissions(
  context: ProjectApiContext,
  projectId: string,
) {
  const [canSubmitFeedback, canReadFeedback, canReviewFeedback] =
    await Promise.all([
      hasProjectPermission(context, projectId, "post_event_feedback.submit"),
      hasProjectPermission(context, projectId, "post_event_feedback.read"),
      hasProjectPermission(context, projectId, "post_event_feedback.review"),
    ]);

  return {
    canReadFeedback,
    canReviewFeedback,
    canSubmitFeedback,
  };
}

export async function requireAnyGuestBookPagePermission(
  context: ProjectApiContext,
  projectId: string,
) {
  const permissions = await getGuestBookPagePermissions(context, projectId);

  if (Object.values(permissions).some(Boolean)) {
    return permissions;
  }

  throw new ProjectAccessError("Guest-book access denied.", 403);
}

export async function requireAnyFeedbackPagePermission(
  context: ProjectApiContext,
  projectId: string,
) {
  const permissions = await getPostEventFeedbackPagePermissions(
    context,
    projectId,
  );

  if (Object.values(permissions).some(Boolean)) {
    return permissions;
  }

  throw new ProjectAccessError("Post-event feedback access denied.", 403);
}

export function handleGuestWishApiError(error: unknown) {
  if (error instanceof InvalidJsonBodyError) {
    return jsonError(400, "invalid_json", error.message);
  }

  if (error instanceof GuestWishValidationError) {
    return jsonError(400, "invalid_guest_wish_request", error.message);
  }

  return handleProjectApiError(error);
}
