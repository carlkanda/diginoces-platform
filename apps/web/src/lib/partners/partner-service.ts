import { randomUUID } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export type PartnerStatus =
  | "active"
  | "archived"
  | "inactive"
  | "pending"
  | "suspended";
export type PartnerUserRole = "admin" | "member";
export type PartnerUserStatus = "active" | "inactive" | "invited" | "suspended";
export type PartnerProjectSubmissionStatus =
  | "approved"
  | "archived"
  | "changes_requested"
  | "draft"
  | "rejected"
  | "submitted";
export type PartnerProjectReviewAction =
  | "approve"
  | "archive"
  | "reject"
  | "request_changes";
export type PartnerProjectApprovalStatus =
  | "approved"
  | "archived"
  | "changes_requested"
  | "draft"
  | "rejected"
  | "submitted";
export type PartnerProjectSourceType =
  | "partner_assigned"
  | "partner_originated";
export type ProjectCommentVisibility = "internal_only" | "partner_visible";
export type ProjectCommentAuthorType = "admin" | "couple" | "partner" | "staff";

export type PartnerProfile = {
  approvedAt: string | null;
  approvedBy: string | null;
  archivedAt: string | null;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
  createdBy: string;
  id: string;
  internalNotes: string | null;
  organizationName: string;
  partnerType: string;
  primaryContactName: string | null;
  status: PartnerStatus;
  suspendedAt: string | null;
  updatedAt: string;
  updatedBy: string;
  whatsappPhone: string | null;
};

export type PartnerUser = {
  activeAt: string | null;
  createdAt: string;
  id: string;
  invitedAt: string | null;
  invitedBy: string | null;
  partnerId: string;
  role: PartnerUserRole;
  status: PartnerUserStatus;
  updatedAt: string;
  userId: string;
};

export type PartnerProjectSubmission = {
  approvalReason: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  brideName: string;
  createdAt: string;
  createdBy: string;
  eventNotes: string | null;
  groomName: string;
  id: string;
  partnerId: string;
  partnerNotes: string | null;
  plannedGuestCount: number | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  projectId: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  status: PartnerProjectSubmissionStatus;
  submittedAt: string | null;
  submittedBy: string | null;
  updatedAt: string;
};

export type PartnerProjectSource = {
  approvalStatus: PartnerProjectApprovalStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  createdBy: string;
  id: string;
  operationalRole: string | null;
  partnerId: string;
  projectId: string;
  sourceNotes: string | null;
  sourceType: PartnerProjectSourceType;
  submittedAt: string | null;
  submittedBy: string | null;
  updatedAt: string;
};

export type PartnerProjectDraft = {
  brideName: string;
  coupleAccessOpen: boolean;
  groomName: string;
  plannedGuestCount: number | null;
  primaryContactEmail: string | null;
  projectId: string;
  status: "draft" | "submitted" | "approved";
};

export type PartnerProjectDashboardInput = {
  approvalStatus: PartnerProjectApprovalStatus;
  assignedPartnerIds: string[];
  balanceDueCents?: number | null;
  brideName: string;
  contractStatus?: string | null;
  eventDates: string[];
  groomName: string;
  internalNotes?: string | null;
  paymentExceptionReason?: string | null;
  paymentStatus?: string | null;
  projectCode: string;
  projectId: string;
  revenueCents?: number | null;
  sourcePartnerId?: string | null;
  status: string;
};

export type PartnerDashboardProject = {
  approvalStatus: PartnerProjectApprovalStatus;
  commercialStatus: string;
  coupleNames: string;
  eventDates: string[];
  projectCode: string;
  projectId: string;
  status: string;
};

export type PartnerDashboardView = {
  generatedAt: string;
  partnerId: string;
  projects: PartnerDashboardProject[];
  requirementIds: string[];
};

export type PartnerAction =
  | "comments.create"
  | "comments.internal.read"
  | "comments.read"
  | "dashboard.read"
  | "profile.manage"
  | "profile.read"
  | "projects.assign"
  | "projects.create"
  | "projects.review"
  | "projects.submit"
  | "users.manage";

export const partnerAuditActions = [
  "partners.created",
  "partners.updated",
  "partners.activated",
  "partners.suspended",
  "partners.reactivated",
  "partners.archived",
  "partner_users.linked",
  "partner_users.updated",
  "partner_project_submissions.created",
  "partner_project_submissions.submitted",
  "partner_project_submissions.approved",
  "partner_project_submissions.rejected",
  "partner_project_submissions.changes_requested",
  "partner_project_submissions.archived",
  "partner_project_sources.created",
  "partner_project_sources.updated",
  "partner_project_assignments.created",
  "partner_project_assignments.removed",
  "project_comments.created",
  "project_comments.updated",
  "project_comments.deleted",
] as const;

export type PartnerAuditAction = (typeof partnerAuditActions)[number];

const actionPermissions: Record<PartnerAction, PermissionSlug> = {
  "comments.create": "project_comments.create",
  "comments.internal.read": "project_comments.internal.read",
  "comments.read": "project_comments.read",
  "dashboard.read": "dashboards.partner.read",
  "profile.manage": "partners.manage",
  "profile.read": "partners.read",
  "projects.assign": "partner_projects.assign",
  "projects.create": "partner_projects.create",
  "projects.review": "partner_projects.review",
  "projects.submit": "partner_projects.submit",
  "users.manage": "partner_users.manage",
};

const activePartnerStatuses = new Set<PartnerStatus>(["active"]);
const restrictedFieldPattern =
  /(revenue|amount|balance|payment|price|pricing|discount|gesture|exception|internal|audit|commission|referral|payout|billing)/i;

export class PartnerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartnerValidationError";
  }
}

function requiredText(value: string | null | undefined, fieldName: string) {
  if (!value || value.trim().length === 0) {
    throw new PartnerValidationError(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function assertNonNegativeInteger(value: number | null, fieldName: string) {
  if (value === null) {
    return;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new PartnerValidationError(`${fieldName} must be non-negative.`);
  }
}

export function createPartnerProfileFoundation(input: {
  actorUserId: string;
  contactEmail: string;
  contactPhone?: string | null;
  internalNotes?: string | null;
  now: string;
  organizationName: string;
  partnerType: string;
  primaryContactName?: string | null;
  whatsappPhone?: string | null;
}) {
  const actorUserId = requiredText(input.actorUserId, "actorUserId");
  const partner: PartnerProfile = {
    approvedAt: input.now,
    approvedBy: actorUserId,
    archivedAt: null,
    contactEmail: requiredText(input.contactEmail, "contactEmail"),
    contactPhone: optionalText(input.contactPhone),
    createdAt: input.now,
    createdBy: actorUserId,
    id: randomUUID(),
    internalNotes: optionalText(input.internalNotes),
    organizationName: requiredText(input.organizationName, "organizationName"),
    partnerType: requiredText(input.partnerType, "partnerType"),
    primaryContactName: optionalText(input.primaryContactName),
    status: "active",
    suspendedAt: null,
    updatedAt: input.now,
    updatedBy: actorUserId,
    whatsappPhone: optionalText(input.whatsappPhone),
  };

  return {
    auditActions: [
      "partners.created",
      "partners.activated",
    ] satisfies PartnerAuditAction[],
    partner,
  };
}

export function linkPartnerUserFoundation(
  partner: PartnerProfile,
  input: {
    actorUserId: string;
    now: string;
    role: PartnerUserRole;
    userId: string;
  },
) {
  const partnerUser: PartnerUser = {
    activeAt: input.now,
    createdAt: input.now,
    id: randomUUID(),
    invitedAt: input.now,
    invitedBy: requiredText(input.actorUserId, "actorUserId"),
    partnerId: partner.id,
    role: input.role,
    status: "active",
    updatedAt: input.now,
    userId: requiredText(input.userId, "userId"),
  };

  return {
    auditActions: ["partner_users.linked"] satisfies PartnerAuditAction[],
    partnerUser,
  };
}

export function canPartnerCreateProject(
  partner: PartnerProfile,
  partnerUser: PartnerUser,
) {
  return (
    partner.id === partnerUser.partnerId &&
    activePartnerStatuses.has(partner.status) &&
    partnerUser.status === "active"
  );
}

export function createPartnerProjectDraft(input: {
  actorUserId: string;
  brideName: string;
  eventNotes?: string | null;
  groomName: string;
  now: string;
  partner: PartnerProfile;
  partnerNotes?: string | null;
  partnerUser: PartnerUser;
  plannedGuestCount?: number | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  projectId?: string;
}) {
  if (!canPartnerCreateProject(input.partner, input.partnerUser)) {
    throw new PartnerValidationError(
      "Active partner status is required before creating projects.",
    );
  }

  const plannedGuestCount = input.plannedGuestCount ?? null;
  assertNonNegativeInteger(plannedGuestCount, "plannedGuestCount");

  const actorUserId = requiredText(input.actorUserId, "actorUserId");
  const projectId = input.projectId ?? randomUUID();
  const project: PartnerProjectDraft = {
    brideName: requiredText(input.brideName, "brideName"),
    coupleAccessOpen: false,
    groomName: requiredText(input.groomName, "groomName"),
    plannedGuestCount,
    primaryContactEmail: optionalText(input.primaryContactEmail),
    projectId,
    status: "draft",
  };
  const submission: PartnerProjectSubmission = {
    approvalReason: null,
    approvedAt: null,
    approvedBy: null,
    brideName: project.brideName,
    createdAt: input.now,
    createdBy: actorUserId,
    eventNotes: optionalText(input.eventNotes),
    groomName: project.groomName,
    id: randomUUID(),
    partnerId: input.partner.id,
    partnerNotes: optionalText(input.partnerNotes),
    plannedGuestCount,
    primaryContactEmail: project.primaryContactEmail,
    primaryContactPhone: optionalText(input.primaryContactPhone),
    projectId,
    reviewedAt: null,
    reviewedBy: null,
    status: "draft",
    submittedAt: null,
    submittedBy: null,
    updatedAt: input.now,
  };
  const source: PartnerProjectSource = {
    approvalStatus: "draft",
    approvedAt: null,
    approvedBy: null,
    createdAt: input.now,
    createdBy: actorUserId,
    id: randomUUID(),
    operationalRole: "originating_partner",
    partnerId: input.partner.id,
    projectId,
    sourceNotes: optionalText(input.partnerNotes),
    sourceType: "partner_originated",
    submittedAt: null,
    submittedBy: null,
    updatedAt: input.now,
  };

  return {
    auditActions: [
      "partner_project_submissions.created",
      "partner_project_sources.created",
    ] satisfies PartnerAuditAction[],
    project,
    source,
    submission,
  };
}

export function submitPartnerProjectForReview(
  submission: PartnerProjectSubmission,
  input: {
    actorUserId: string;
    now: string;
    partner: PartnerProfile;
    partnerUser: PartnerUser;
  },
) {
  if (!canPartnerCreateProject(input.partner, input.partnerUser)) {
    throw new PartnerValidationError(
      "Active partner status is required before submitting projects.",
    );
  }

  if (submission.partnerId !== input.partner.id) {
    throw new PartnerValidationError(
      "Submission must belong to the active partner.",
    );
  }

  if (
    submission.status !== "draft" &&
    submission.status !== "changes_requested"
  ) {
    throw new PartnerValidationError(
      "Only draft or changes-requested partner submissions can be submitted.",
    );
  }

  return {
    auditActions: [
      "partner_project_submissions.submitted",
    ] satisfies PartnerAuditAction[],
    coupleAccessOpen: false,
    projectStatus: "submitted" as const,
    submission: {
      ...submission,
      status: "submitted" as const,
      submittedAt: input.now,
      submittedBy: requiredText(input.actorUserId, "actorUserId"),
      updatedAt: input.now,
    },
  };
}

export function reviewPartnerProjectSubmission(
  submission: PartnerProjectSubmission,
  input: {
    action: PartnerProjectReviewAction;
    actorUserId: string;
    now: string;
    reason: string;
  },
) {
  if (submission.status !== "submitted") {
    throw new PartnerValidationError(
      "Only submitted partner projects can be reviewed.",
    );
  }

  const reason = requiredText(input.reason, "reason");
  const actorUserId = requiredText(input.actorUserId, "actorUserId");
  const transition = {
    approve: {
      action: "partner_project_submissions.approved",
      projectStatus: "approved",
      status: "approved",
    },
    archive: {
      action: "partner_project_submissions.archived",
      projectStatus: "draft",
      status: "archived",
    },
    reject: {
      action: "partner_project_submissions.rejected",
      projectStatus: "draft",
      status: "rejected",
    },
    request_changes: {
      action: "partner_project_submissions.changes_requested",
      projectStatus: "draft",
      status: "changes_requested",
    },
  } satisfies Record<
    PartnerProjectReviewAction,
    {
      action: PartnerAuditAction;
      projectStatus: "approved" | "draft";
      status: PartnerProjectSubmissionStatus;
    }
  >;
  const selected = transition[input.action];
  const reviewedSubmission: PartnerProjectSubmission = {
    ...submission,
    approvalReason: reason,
    approvedAt: selected.status === "approved" ? input.now : null,
    approvedBy: selected.status === "approved" ? actorUserId : null,
    reviewedAt: input.now,
    reviewedBy: actorUserId,
    status: selected.status,
    updatedAt: input.now,
  };

  return {
    auditActions: [
      selected.action,
      "partner_project_sources.updated",
    ] satisfies PartnerAuditAction[],
    coupleAccessOpen: false,
    projectStatus: selected.projectStatus,
    source: {
      approvalStatus: selected.status,
      approvedAt: reviewedSubmission.approvedAt,
      approvedBy: reviewedSubmission.approvedBy,
    },
    submission: reviewedSubmission,
  };
}

export function canPerformPartnerAction(
  assignments: RoleAssignment[],
  partnerId: string,
  action: PartnerAction,
  projectId?: string,
  options: {
    projectBelongsToPartner?: boolean;
  } = {},
) {
  const permission = actionPermissions[action];

  if (
    action === "comments.create" ||
    action === "comments.internal.read" ||
    action === "comments.read" ||
    action === "dashboard.read"
  ) {
    const hasPartnerScopedPermission = hasScopedPermission(
      assignments,
      permission,
      {
        scope: "custom",
        scopeId: partnerId,
      },
    );

    return projectId
      ? hasScopedPermission(assignments, permission, {
          projectId,
          scope: "project",
        }) ||
          (options.projectBelongsToPartner === true &&
            hasPartnerScopedPermission)
      : hasPartnerScopedPermission;
  }

  return hasScopedPermission(assignments, permission, {
    scope: "custom",
    scopeId: partnerId,
  });
}

export function isPartnerRestrictedField(fieldName: string) {
  return restrictedFieldPattern.test(fieldName);
}

function commercialStatusFor(project: PartnerProjectDashboardInput) {
  if (
    project.status === "draft" ||
    project.status === "submitted" ||
    project.approvalStatus !== "approved"
  ) {
    return "contract pending";
  }

  if (project.contractStatus !== "approved") {
    return "contract pending";
  }

  return project.paymentStatus === "confirmed"
    ? "operationally active"
    : "payment gate pending";
}

export function buildPartnerDashboardView(input: {
  now: string;
  partnerId: string;
  projects: PartnerProjectDashboardInput[];
}): PartnerDashboardView {
  const visibleProjects = input.projects.filter(
    (project) =>
      project.sourcePartnerId === input.partnerId ||
      project.assignedPartnerIds.includes(input.partnerId),
  );

  return {
    generatedAt: input.now,
    partnerId: input.partnerId,
    projects: visibleProjects.map((project) => ({
      approvalStatus: project.approvalStatus,
      commercialStatus: commercialStatusFor(project),
      coupleNames: `${project.brideName} & ${project.groomName}`,
      eventDates: [...project.eventDates],
      projectCode: project.projectCode,
      projectId: project.projectId,
      status: project.status,
    })),
    requirementIds: ["PART-005", "PART-006", "REP-004", "ROLE-004"],
  };
}

export function buildPartnerAuditActions() {
  return [...partnerAuditActions];
}

export function getSprint13PartnerStatus() {
  return {
    epic: "EPIC-PART",
    features: ["FEAT-PART-001", "FEAT-PART-002"],
    issue: 29,
    modules: [
      {
        name: "Partner profile, user linkage, and lifecycle foundation",
        requirementIds: ["PART-001", "PART-002", "ROLE-004"],
      },
      {
        name: "Partner-created project draft and admin review workflow",
        requirementIds: ["PART-003", "PART-004", "TECH-004"],
      },
      {
        name: "Partner project source tracking and restricted dashboard",
        requirementIds: ["PART-005", "PART-007", "REP-004"],
      },
      {
        name: "Partner-visible project comments and internal note separation",
        requirementIds: ["PART-006", "ROLE-004"],
      },
      {
        name: "Commercial restrictions, permissions, and audit logging",
        requirementIds: ["PV-003", "PAY-015", "REP-006", "TECH-004"],
      },
    ],
    outOfScope: [
      "partner commission management",
      "referral-fee calculation",
      "partner billing",
      "white-label SaaS",
      "partner-controlled pricing",
      "partner-controlled contracts",
      "partner payment exception approval",
      "public partner marketplace",
    ],
    requirementIds: [
      "PART-001",
      "PART-002",
      "PART-003",
      "PART-004",
      "PART-005",
      "PART-006",
      "PART-007",
      "ROLE-001",
      "ROLE-004",
      "REP-004",
      "PAY-015",
      "PV-003",
      "REP-006",
      "TECH-004",
    ],
    sprint: "Sprint 13 - Partner / External Provider Model",
    stories: [],
    tasks: [],
    tests: [],
  };
}
