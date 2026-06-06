import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAuditFoundationSummary } from "@/lib/audit/audit-log";
import { canPerformCommercialAction } from "@/lib/contracts/contract-service";
import type { RoleAssignment } from "@/lib/security/permissions";
import {
  parseLinkPartnerUserPayload,
  parseProjectCommentPayload,
  requiredProjectCommentPermissions,
} from "@/lib/partners/partner-api";
import {
  buildPartnerAuditActions,
  buildPartnerDashboardView,
  canPartnerCreateProject,
  canPerformPartnerAction,
  createPartnerProjectDraft,
  createPartnerProfileFoundation,
  isPartnerRestrictedField,
  linkPartnerUserFoundation,
  PartnerValidationError,
  reviewPartnerProjectSubmission,
  submitPartnerProjectForReview,
  type PartnerProjectSubmission,
} from "@/lib/partners/partner-service";

const now = "2026-05-31T12:00:00.000Z";
const adminAssignments: RoleAssignment[] = [
  {
    role: "diginoces_admin",
    scope: "global",
  },
];
const partnerAssignments: RoleAssignment[] = [
  {
    role: "partner_admin",
    scope: "custom",
    scopeId: "partner-1",
  },
  {
    role: "partner_project_operator",
    scope: "project",
    scopeId: "project-1",
  },
];
const repoRoot = join(process.cwd(), "..", "..");

function submittedSubmission(): PartnerProjectSubmission {
  const partner = createPartnerProfileFoundation({
    actorUserId: "admin-1",
    contactEmail: "planner@example.com",
    now,
    organizationName: "Planner Co",
    partnerType: "planner",
  }).partner;
  const linked = linkPartnerUserFoundation(partner, {
    actorUserId: "admin-1",
    now,
    role: "admin",
    userId: "partner-user-1",
  }).partnerUser;
  const draft = createPartnerProjectDraft({
    actorUserId: "partner-user-1",
    brideName: "Aline",
    groomName: "Cedric",
    now,
    partner,
    partnerUser: linked,
    plannedGuestCount: 180,
    primaryContactEmail: "couple@example.com",
    projectId: "project-1",
  }).submission;

  return submitPartnerProjectForReview(draft, {
    actorUserId: "partner-user-1",
    now,
    partner,
    partnerUser: linked,
  }).submission;
}

describe("Sprint 13 partner foundation", () => {
  it("creates an active partner profile and links a partner user without exposing commission fields", () => {
    const result = createPartnerProfileFoundation({
      actorUserId: "admin-1",
      contactEmail: "planner@example.com",
      contactPhone: "+243 999 000 111",
      internalNotes: "Internal vetting note",
      now,
      organizationName: "Planner Co",
      partnerType: "planner",
    });

    expect(result.partner).toMatchObject({
      approvedAt: now,
      approvedBy: "admin-1",
      contactEmail: "planner@example.com",
      organizationName: "Planner Co",
      status: "active",
    });
    expect(Object.keys(result.partner)).not.toContain("commissionRate");
    expect(Object.keys(result.partner)).not.toContain("referralFee");
    expect(result.auditActions).toEqual([
      "partners.created",
      "partners.activated",
    ]);

    const linked = linkPartnerUserFoundation(result.partner, {
      actorUserId: "admin-1",
      now,
      role: "admin",
      userId: "partner-user-1",
    });

    expect(linked.partnerUser).toMatchObject({
      partnerId: result.partner.id,
      role: "admin",
      status: "active",
      userId: "partner-user-1",
    });
    expect(linked.auditActions).toEqual(["partner_users.linked"]);
  });

  it("allows active partner users to create and submit drafts without opening couple access", () => {
    const partner = createPartnerProfileFoundation({
      actorUserId: "admin-1",
      contactEmail: "planner@example.com",
      now,
      organizationName: "Planner Co",
      partnerType: "planner",
    }).partner;
    const partnerUser = linkPartnerUserFoundation(partner, {
      actorUserId: "admin-1",
      now,
      role: "admin",
      userId: "partner-user-1",
    }).partnerUser;

    expect(canPartnerCreateProject(partner, partnerUser)).toBe(true);

    const draft = createPartnerProjectDraft({
      actorUserId: "partner-user-1",
      brideName: "Aline",
      groomName: "Cedric",
      now,
      partner,
      partnerUser,
      plannedGuestCount: 180,
      primaryContactEmail: "couple@example.com",
      projectId: "project-1",
    });

    expect(draft.project).toMatchObject({
      coupleAccessOpen: false,
      projectId: "project-1",
      status: "draft",
    });
    expect(draft.submission.status).toBe("draft");
    expect(draft.source).toMatchObject({
      partnerId: partner.id,
      projectId: "project-1",
      sourceType: "partner_originated",
    });
    expect(draft.auditActions).toEqual([
      "partner_project_submissions.created",
      "partner_project_sources.created",
    ]);

    const submitted = submitPartnerProjectForReview(draft.submission, {
      actorUserId: "partner-user-1",
      now,
      partner,
      partnerUser,
    });

    expect(submitted.submission.status).toBe("submitted");
    expect(submitted.projectStatus).toBe("submitted");
    expect(submitted.coupleAccessOpen).toBe(false);
    expect(submitted.auditActions).toEqual([
      "partner_project_submissions.submitted",
    ]);
  });

  it("blocks suspended partners from creating new projects", () => {
    const partner = {
      ...createPartnerProfileFoundation({
        actorUserId: "admin-1",
        contactEmail: "planner@example.com",
        now,
        organizationName: "Planner Co",
        partnerType: "planner",
      }).partner,
      status: "suspended" as const,
    };
    const partnerUser = linkPartnerUserFoundation(partner, {
      actorUserId: "admin-1",
      now,
      role: "admin",
      userId: "partner-user-1",
    }).partnerUser;

    expect(canPartnerCreateProject(partner, partnerUser)).toBe(false);
    expect(() =>
      createPartnerProjectDraft({
        actorUserId: "partner-user-1",
        brideName: "Aline",
        groomName: "Cedric",
        now,
        partner,
        partnerUser,
        projectId: "project-1",
      }),
    ).toThrow("Active partner status is required");
  });

  it("lets admin approve, reject, or request changes on submitted partner projects", () => {
    const submitted = submittedSubmission();

    const approved = reviewPartnerProjectSubmission(submitted, {
      actorUserId: "admin-1",
      action: "approve",
      now,
      reason: "Validated by Diginoces",
    });

    expect(approved.submission.status).toBe("approved");
    expect(approved.projectStatus).toBe("approved");
    expect(approved.coupleAccessOpen).toBe(false);
    expect(approved.source.approvalStatus).toBe("approved");
    expect(approved.auditActions).toEqual([
      "partner_project_submissions.approved",
      "partner_project_sources.updated",
    ]);

    const rejected = reviewPartnerProjectSubmission(submitted, {
      actorUserId: "admin-1",
      action: "reject",
      now,
      reason: "Missing contract-ready details",
    });
    expect(rejected.submission.status).toBe("rejected");
    expect(rejected.projectStatus).toBe("draft");

    const changes = reviewPartnerProjectSubmission(submitted, {
      actorUserId: "admin-1",
      action: "request_changes",
      now,
      reason: "Confirm event date",
    });
    expect(changes.submission.status).toBe("changes_requested");
    expect(changes.projectStatus).toBe("draft");
  });

  it("enforces partner permission and commercial restrictions", () => {
    expect(
      canPerformPartnerAction(partnerAssignments, "partner-1", "profile.read"),
    ).toBe(true);
    expect(
      canPerformPartnerAction(partnerAssignments, "partner-2", "profile.read"),
    ).toBe(false);
    expect(
      canPerformPartnerAction(
        partnerAssignments,
        "partner-1",
        "profile.manage",
      ),
    ).toBe(false);
    expect(
      canPerformPartnerAction(
        partnerAssignments,
        "partner-1",
        "dashboard.read",
        "project-1",
      ),
    ).toBe(true);
    expect(
      canPerformPartnerAction(
        partnerAssignments,
        "partner-1",
        "comments.create",
        "project-2",
      ),
    ).toBe(false);
    expect(
      canPerformPartnerAction(
        partnerAssignments,
        "partner-1",
        "comments.create",
        "project-2",
        {
          // canPerformPartnerAction checks permission grants; callers must
          // prove project-to-partner binding before partner-scope fallback.
          projectBelongsToPartner: true,
        },
      ),
    ).toBe(true);
    expect(
      canPerformPartnerAction(adminAssignments, "partner-2", "profile.manage"),
    ).toBe(true);

    expect(
      canPerformCommercialAction(
        partnerAssignments,
        "project-1",
        "payments.record",
      ),
    ).toBe(false);
    expect(
      canPerformCommercialAction(
        partnerAssignments,
        "project-1",
        "revenue.read",
      ),
    ).toBe(false);
    expect(isPartnerRestrictedField("paymentExceptionReason")).toBe(true);
    expect(isPartnerRestrictedField("internalNotes")).toBe(true);
    expect(isPartnerRestrictedField("auditLogs")).toBe(true);
  });

  it("builds a restricted partner dashboard without revenue, payment, internal note, or audit fields", () => {
    const dashboard = buildPartnerDashboardView({
      now,
      partnerId: "partner-1",
      projects: [
        {
          approvalStatus: "approved",
          assignedPartnerIds: ["partner-2"],
          balanceDueCents: 100_00,
          brideName: "Other",
          contractStatus: "approved",
          eventDates: ["2026-09-01"],
          groomName: "Couple",
          internalNotes: "hidden",
          paymentExceptionReason: "hidden",
          paymentStatus: "confirmed",
          projectCode: "OTH-2026-001",
          projectId: "project-2",
          revenueCents: 200_00,
          sourcePartnerId: "partner-2",
          status: "active",
        },
        {
          approvalStatus: "submitted",
          assignedPartnerIds: ["partner-1"],
          balanceDueCents: 500_00,
          brideName: "Aline",
          contractStatus: "pending",
          eventDates: ["2026-08-15"],
          groomName: "Cedric",
          internalNotes: "hidden",
          paymentExceptionReason: "hidden",
          paymentStatus: "partial",
          projectCode: "ALI-2026-001",
          projectId: "project-1",
          revenueCents: 1200_00,
          sourcePartnerId: "partner-1",
          status: "submitted",
        },
      ],
    });

    expect(dashboard.projects).toHaveLength(1);
    expect(dashboard.projects[0]).toMatchObject({
      approvalStatus: "submitted",
      commercialStatus: "contract pending",
      projectCode: "ALI-2026-001",
    });
    expect(JSON.stringify(dashboard)).not.toContain("120000");
    expect(JSON.stringify(dashboard)).not.toContain("balanceDue");
    expect(JSON.stringify(dashboard)).not.toContain("paymentExceptionReason");
    expect(JSON.stringify(dashboard)).not.toContain("internalNotes");
    expect(JSON.stringify(dashboard)).not.toContain("audit");
  });

  it("keeps partner-visible comments separate from internal notes", () => {
    const comment = parseProjectCommentPayload({
      body: "Could we confirm the reception date?",
    });
    const internal = parseProjectCommentPayload({
      body: "Finance follow-up",
      visibility: "internal_only",
    });

    expect(comment).toMatchObject({
      body: "Could we confirm the reception date?",
      visibility: "partner_visible",
    });
    expect(internal.visibility).toBe("internal_only");
    expect(isPartnerRestrictedField("internalNotes")).toBe(true);
  });

  it("requires visibility-appropriate permissions for project comments", () => {
    expect(requiredProjectCommentPermissions("partner_visible")).toEqual([
      "project_comments.create",
    ]);
    expect(requiredProjectCommentPermissions("internal_only")).toEqual([
      "project_comments.create",
      "project_comments.internal.read",
    ]);
  });

  it("rejects unsupported project comment visibility values", () => {
    expect(() =>
      parseProjectCommentPayload({
        body: "Visibility should fail",
        visibility: "unsupported_visibility",
      }),
    ).toThrow(PartnerValidationError);
  });

  it("defaults linked partner users to member unless admin is explicit", () => {
    expect(
      parseLinkPartnerUserPayload({
        userId: "partner-user-1",
      }),
    ).toEqual({
      role: "member",
      userId: "partner-user-1",
    });
    expect(
      parseLinkPartnerUserPayload({
        role: "admin",
        userId: "partner-user-1",
      }).role,
    ).toBe("admin");
  });

  it("lists partner audit actions and omits out-of-scope commission management", () => {
    expect(buildPartnerAuditActions()).toEqual(
      expect.arrayContaining([
        "partners.created",
        "partners.activated",
        "partners.suspended",
        "partner_users.linked",
        "partner_project_submissions.created",
        "partner_project_submissions.submitted",
        "partner_project_submissions.approved",
        "partner_project_submissions.rejected",
        "partner_project_submissions.changes_requested",
        "partner_project_sources.created",
        "partner_project_sources.updated",
        "project_comments.created",
      ]),
    );
    expect(buildPartnerAuditActions().join(" ")).not.toMatch(
      /commission|referral|payout|billing/i,
    );
    expect(getAuditFoundationSummary().sensitiveActionsTracked).toEqual(
      expect.arrayContaining([
        "partners",
        "partner_users",
        "partner_project_sources",
        "partner_project_submissions",
        "partner_project_assignments",
        "project_comments",
      ]),
    );
  });

  it("documents Sprint 13 app wiring, routes, migration, and completion report", () => {
    const migration = readFileSync(
      join(
        repoRoot,
        "supabase/migrations/20260531224203_sprint_13_partner_provider_model.sql",
      ),
      "utf8",
    );
    const partnerAuditHardeningMigration = readFileSync(
      join(
        repoRoot,
        "supabase/migrations/20260606172422_mvp_partner_audit_trigger_project_scope_fix.sql",
      ),
      "utf8",
    );
    const healthRoute = readFileSync(
      join(repoRoot, "apps/web/src/app/api/health/route.ts"),
      "utf8",
    );
    const homePage = readFileSync(
      join(repoRoot, "apps/web/src/app/page.tsx"),
      "utf8",
    );
    const localSetup = readFileSync(
      join(repoRoot, "docs/setup/local-development.md"),
      "utf8",
    );
    const partnerDashboardPage = readFileSync(
      join(repoRoot, "apps/web/src/app/platform/partner-dashboard/page.tsx"),
      "utf8",
    );
    const projectCommentRoute = readFileSync(
      join(
        repoRoot,
        "apps/web/src/app/api/projects/[projectId]/comments/route.ts",
      ),
      "utf8",
    );
    const partnerActions = readFileSync(
      join(repoRoot, "apps/web/src/app/platform/partners/actions.ts"),
      "utf8",
    );
    const partnerDb = readFileSync(
      join(repoRoot, "apps/web/src/lib/partners/partner-db.ts"),
      "utf8",
    );

    expect(migration).toContain("create table if not exists public.partners");
    expect(migration).toContain(
      "create table if not exists public.partner_users",
    );
    expect(migration).toContain(
      "create table if not exists public.partner_project_submissions",
    );
    expect(migration).toContain(
      "create table if not exists public.project_comments",
    );
    expect(migration).not.toMatch(
      /partner_commissions|commission_rate|referral_fee|billing_account|payout_account/i,
    );
    expect(migration).toMatch(
      /\bapp_private\.partner_user_is_active\(\s*p_user_id\s*,\s*p_partner_id\s*\)/,
    );
    expect(migration).toContain("p_role text default 'member'");
    expect(migration).not.toMatch(/\bv_existing_role\b/i);
    expect(migration).toMatch(
      /delete\s+from\s+public\.role_assignments[\s\S]*scope_id\s*=\s*p_partner_id/i,
    );
    expect(migration).toMatch(
      /\bgrant\s+select\s+on\s+public\.project_comments\b/i,
    );
    expect(migration).toMatch(
      /\bgrant\s+select\s+on\s+public\.partner_project_submissions\b/i,
    );
    // Prevent review reasons from overwriting partner-provided source notes.
    expect(migration).not.toMatch(
      /source_notes\s*=\s*trim\s*\(\s*p_reason\s*\)/i,
    );
    expect(partnerAuditHardeningMigration).toContain(
      "create or replace function app_private.audit_partner_change()",
    );
    expect(partnerAuditHardeningMigration).toContain(
      "new_snapshot ->> 'project_id'",
    );
    expect(partnerAuditHardeningMigration).toContain(
      "old_snapshot ->> 'project_id'",
    );
    expect(partnerAuditHardeningMigration).toContain(
      "new_snapshot ->> 'status'",
    );
    expect(partnerAuditHardeningMigration).not.toMatch(
      /\bnew\.(project_id|review_reason|source_notes|status|deleted_at|updated_by|created_by|invited_by|approved_by|submitted_by|reviewed_by|removed_by|assigned_by|author_user_id)\b/i,
    );
    expect(partnerAuditHardeningMigration).not.toMatch(
      /\bold\.(project_id|review_reason|source_notes|status|deleted_at|updated_by|created_by|invited_by|approved_by|submitted_by|reviewed_by|removed_by|assigned_by|author_user_id)\b/i,
    );
    expect(partnerDashboardPage).toContain("searchParams");
    expect(partnerDashboardPage).not.toMatch(/partners\s*\[\s*0\s*\]/);
    expect(partnerDashboardPage).toContain("partnerId");
    expect(partnerDashboardPage).toContain(
      "redirect(buildLoginRedirectPath(dashboardPath))",
    );
    expect(projectCommentRoute).toContain("Request body must be valid JSON.");
    expect(partnerActions).toMatch(/partner_projects\.submit/);
    expect(partnerActions).toMatch(/requiredProjectCommentPermissions/);
    expect(partnerDb).toMatch(/\bpartner_project_assignments\b/);
    expect(partnerDb).toMatch(/\bevent_date\b/);
    expect(healthRoute).toContain("getSprint13PartnerStatus");
    expect(homePage).toContain("getSprint13PartnerStatus");
    expect(homePage).toContain("Project comments");
    expect(localSetup).toContain("Sprint 13 partner");
    expect(localSetup).toContain("/platform/partners");
    expect(
      existsSync(
        join(repoRoot, "docs/planning/sprint-13-completion-report.md"),
      ),
    ).toBe(true);
  });
});
