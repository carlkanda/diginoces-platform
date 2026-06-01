"use server";

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  parseCreatePartnerProjectDraftPayload,
  parseCreatePartnerProfilePayload,
  parseLinkPartnerUserPayload,
  parsePartnerStatusPayload,
  parseProjectCommentPayload,
  parseReviewPartnerProjectPayload,
  requiredProjectCommentPermissions,
  requirePartnerManagePermission,
  requirePartnerPermission,
} from "@/lib/partners/partner-api";
import {
  createPartnerProfile,
  createPartnerProjectDraft,
  createProjectComment,
  linkPartnerUser,
  reviewPartnerProjectSubmissionRecord,
  submitPartnerProjectSubmission,
  updatePartnerStatus,
} from "@/lib/partners/partner-db";
import { PartnerValidationError } from "@/lib/partners/partner-service";
import {
  requireGlobalPermission,
  requireProjectPermission,
} from "@/lib/projects/project-api";

function formObject(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(
      ([, value]) => typeof value === "string",
    ),
  );
}

function nextPath(path: string, params: Record<string, string>) {
  const [pathname, existingQuery = ""] = path.split("?", 2);
  const searchParams = new URLSearchParams(existingQuery);

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value);
  }

  return `${pathname}?${searchParams.toString()}`;
}

function partnerDashboardPath(partnerId: string) {
  return `/platform/partner-dashboard?${new URLSearchParams({
    partnerId,
  }).toString()}`;
}

async function getActionContext() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    throw new PartnerValidationError("Authentication is required.");
  }

  if (authContext.status === "not_configured") {
    throw new PartnerValidationError("Supabase is not configured.");
  }

  return {
    supabase: authContext.supabase,
    user: authContext.user,
  };
}

async function runPartnerAction(path: string, action: () => Promise<string>) {
  let status: string;

  try {
    status = await action();
  } catch (error) {
    redirect(
      nextPath(path, {
        partnerError:
          error instanceof PartnerValidationError
            ? "invalid_partner_request"
            : "partner_action_failed",
      }),
    );
  }

  redirect(nextPath(path, { partnerStatus: status }));
}

export async function createPartnerAction(formData: FormData) {
  await runPartnerAction("/platform/partners", async () => {
    const context = await getActionContext();

    await requirePartnerManagePermission(context);
    const input = parseCreatePartnerProfilePayload(formObject(formData));
    await createPartnerProfile(context.supabase, {
      ...input,
      actorUserId: context.user.id,
    });

    return "partner_created";
  });
}

export async function updatePartnerStatusAction(
  partnerId: string,
  formData: FormData,
) {
  await runPartnerAction(`/platform/partners/${partnerId}`, async () => {
    const context = await getActionContext();

    await requirePartnerManagePermission(context);
    const input = parsePartnerStatusPayload(formObject(formData));
    await updatePartnerStatus(context.supabase, {
      actorUserId: context.user.id,
      partnerId,
      status: input.status,
    });

    return "partner_status_updated";
  });
}

export async function linkPartnerUserAction(
  partnerId: string,
  formData: FormData,
) {
  await runPartnerAction(`/platform/partners/${partnerId}`, async () => {
    const context = await getActionContext();

    await requirePartnerManagePermission(context);
    const input = parseLinkPartnerUserPayload(formObject(formData));
    await linkPartnerUser(context.supabase, {
      partnerId,
      role: input.role,
      userId: input.userId,
    });

    return "partner_user_linked";
  });
}

export async function createPartnerProjectDraftAction(
  partnerId: string,
  formData: FormData,
) {
  await runPartnerAction(partnerDashboardPath(partnerId), async () => {
    const context = await getActionContext();

    await requirePartnerPermission(
      context,
      partnerId,
      "partner_projects.create",
    );
    const input = parseCreatePartnerProjectDraftPayload(formObject(formData));
    await createPartnerProjectDraft(context.supabase, {
      ...input,
      partnerId,
    });

    return "partner_project_draft_created";
  });
}

export async function submitPartnerProjectAction(
  partnerId: string,
  submissionId: string,
) {
  await runPartnerAction(`/platform/partners/${partnerId}`, async () => {
    const context = await getActionContext();

    await requirePartnerPermission(
      context,
      partnerId,
      "partner_projects.submit",
    );
    await submitPartnerProjectSubmission(context.supabase, submissionId);

    return "partner_project_submitted";
  });
}

export async function submitPartnerDashboardProjectAction(
  partnerId: string,
  submissionId: string,
) {
  await runPartnerAction(partnerDashboardPath(partnerId), async () => {
    const context = await getActionContext();

    await requirePartnerPermission(
      context,
      partnerId,
      "partner_projects.submit",
    );
    await submitPartnerProjectSubmission(context.supabase, submissionId);

    return "partner_project_submitted";
  });
}

export async function reviewPartnerProjectAction(
  submissionId: string,
  formData: FormData,
) {
  await runPartnerAction("/platform/partners/review", async () => {
    const context = await getActionContext();

    await requireGlobalPermission(context, "partner_projects.review");
    const input = parseReviewPartnerProjectPayload(formObject(formData));
    await reviewPartnerProjectSubmissionRecord(context.supabase, {
      ...input,
      submissionId,
    });

    return `partner_project_${input.action}`;
  });
}

export async function createPartnerCommentAction(
  projectId: string,
  formData: FormData,
) {
  await runPartnerAction(
    `/platform/projects/${projectId}/comments`,
    async () => {
      const context = await getActionContext();
      const input = parseProjectCommentPayload(formObject(formData));

      await Promise.all(
        requiredProjectCommentPermissions(input.visibility).map((permission) =>
          requireProjectPermission(context, projectId, permission),
        ),
      );

      await createProjectComment(context.supabase, {
        ...input,
        projectId,
      });

      return "project_comment_created";
    },
  );
}
