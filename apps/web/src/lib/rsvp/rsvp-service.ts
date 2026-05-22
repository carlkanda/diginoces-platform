import { createHash, randomBytes } from "node:crypto";
import { hasScopedPermission } from "@/lib/projects/project-permissions";
import type {
  PermissionSlug,
  RoleAssignment,
} from "@/lib/security/permissions";

export type GuestPublicTokenStatus = "active" | "expired" | "revoked";
export type GuestPublicTokenType = "check_in" | "guest_public_page";

export type GuestPublicTokenRecord = {
  expiresAt: string | null;
  guestId: string;
  id: string;
  projectId: string;
  status: GuestPublicTokenStatus;
  tokenHash: string;
  tokenType: GuestPublicTokenType;
};

export type PublicGuestEvent = {
  eventDate: string | null;
  eventId: string;
  invited: boolean;
  name: string;
  rsvpDeadlineAt: string | null;
  startsAt: string | null;
  venueName: string | null;
};

export type RsvpResponseStatus = "maybe" | "no" | "yes";
export type RsvpStatus =
  | RsvpResponseStatus
  | "locked"
  | "manual_review"
  | "pending";
export type RsvpSource =
  | "family_confirmation"
  | "in_person"
  | "manual"
  | "phone_call"
  | "public_guest_page"
  | "whatsapp";
export type RsvpDeadlineState = "manual_review" | "open";

export type RsvpRecord = {
  eventId: string;
  guestId: string;
  manualReviewRequired?: boolean;
  projectId: string;
  source: RsvpSource;
  status: RsvpStatus;
  submittedAt: string;
};

export type PublicRsvpDecision = {
  allowed: boolean;
  deadlineState?: RsvpDeadlineState;
  reason?:
    | "invalid_response"
    | "locked_final_response"
    | "manual_printed_only"
    | "not_invited"
    | "payment_gate_locked";
};

export type PublicRsvpDecisionInput = {
  eventId: string;
  invitedEvents: PublicGuestEvent[];
  isPrintedOnly?: boolean;
  now: string;
  paymentGate: "locked" | "unlocked";
  previousStatus?: RsvpStatus | null;
  requestedStatus: RsvpResponseStatus;
};

export type RsvpOperationalEffect = {
  includedInExpectedAttendance: boolean;
  includedInFutureCheckIn: boolean;
  includedInFutureReminders: boolean;
  includedInFutureSeating: boolean;
  requiresReview: boolean;
};

export type GuestPageLanguage = "en" | "fr";

export type GuestPageLabels = {
  downloadPlaceholder: string;
  lockedBody: string;
  lockedTitle: string;
  maybe: string;
  no: string;
  rsvpTitle: string;
  submit: string;
  yes: string;
};

export const guestPublicPageAuditActions = [
  "guest_public_tokens.created",
  "guest_public_tokens.revoked",
  "guest_public_tokens.regenerated",
  "guest_public_pages.accessed",
  "guest_public_pages.previewed",
  "rsvps.submitted",
  "rsvps.changed",
  "rsvps.deadline_review_required",
  "rsvps.manual_recorded",
] as const;

const publicPreviewPermission: PermissionSlug = "guest_public_pages.preview";

const labels: Record<GuestPageLanguage, GuestPageLabels> = {
  en: {
    downloadPlaceholder: "Invitation download will be available later.",
    lockedBody:
      "This personal guest page is not open yet. Please check your invitation link again later.",
    lockedTitle: "Guest page not yet open",
    maybe: "Maybe",
    no: "No",
    rsvpTitle: "Your RSVP",
    submit: "Save RSVP",
    yes: "Yes",
  },
  fr: {
    downloadPlaceholder:
      "Le téléchargement de l'invitation sera disponible plus tard.",
    lockedBody:
      "Cette page personnelle n'est pas encore ouverte. Veuillez réessayer avec votre lien d'invitation plus tard.",
    lockedTitle: "Page invité pas encore ouverte",
    maybe: "Peut-être",
    no: "Non",
    rsvpTitle: "Votre RSVP",
    submit: "Enregistrer RSVP",
    yes: "Oui",
  },
};

function normalizeLanguage(
  value: string | null | undefined,
): GuestPageLanguage {
  const normalized = value?.toLowerCase().trim();
  return normalized?.startsWith("en") ? "en" : "fr";
}

export function buildGuestPublicToken() {
  return randomBytes(32).toString("hex");
}

export function hashGuestPublicToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function resolveGuestPublicToken(
  token: string,
  records: GuestPublicTokenRecord[],
  now: Date = new Date(),
) {
  const tokenHash = hashGuestPublicToken(token);

  return (
    records.find((record) => {
      if (record.tokenHash !== tokenHash) {
        return false;
      }

      if (
        record.tokenType !== "guest_public_page" ||
        record.status !== "active"
      ) {
        return false;
      }

      return !record.expiresAt || new Date(record.expiresAt) > now;
    }) ?? null
  );
}

export function canPreviewGuestPublicPage(
  assignments: RoleAssignment[],
  projectId: string,
) {
  return hasScopedPermission(assignments, publicPreviewPermission, {
    projectId,
    scope: "project",
  });
}

export function getInvitedPublicEvents(events: PublicGuestEvent[]) {
  return events.filter((event) => event.invited);
}

export function canSubmitPublicRsvp(
  input: PublicRsvpDecisionInput,
): PublicRsvpDecision {
  if (input.isPrintedOnly) {
    return {
      allowed: false,
      reason: "manual_printed_only",
    };
  }

  if (input.paymentGate === "locked") {
    return {
      allowed: false,
      reason: "payment_gate_locked",
    };
  }

  const event = input.invitedEvents.find(
    (candidate) => candidate.eventId === input.eventId && candidate.invited,
  );

  if (!event) {
    return {
      allowed: false,
      reason: "not_invited",
    };
  }

  if (!["yes", "no", "maybe"].includes(input.requestedStatus)) {
    return {
      allowed: false,
      reason: "invalid_response",
    };
  }

  if (input.previousStatus === "yes" || input.previousStatus === "no") {
    return {
      allowed: false,
      reason: "locked_final_response",
    };
  }

  const deadlineState =
    event.rsvpDeadlineAt && new Date(input.now) > new Date(event.rsvpDeadlineAt)
      ? "manual_review"
      : "open";

  return {
    allowed: true,
    deadlineState,
  };
}

export function upsertRsvpRecord(
  records: RsvpRecord[],
  nextRecord: RsvpRecord,
) {
  const index = records.findIndex(
    (record) =>
      record.guestId === nextRecord.guestId &&
      record.eventId === nextRecord.eventId,
  );

  if (index === -1) {
    return [...records, nextRecord];
  }

  return records.map((record, recordIndex) =>
    recordIndex === index ? { ...record, ...nextRecord } : record,
  );
}

export function getRsvpOperationalEffect(
  status: RsvpStatus,
): RsvpOperationalEffect {
  if (status === "no" || status === "locked") {
    return {
      includedInExpectedAttendance: false,
      includedInFutureCheckIn: false,
      includedInFutureReminders: false,
      includedInFutureSeating: false,
      requiresReview: false,
    };
  }

  return {
    includedInExpectedAttendance: true,
    includedInFutureCheckIn: true,
    includedInFutureReminders: status !== "yes",
    includedInFutureSeating: true,
    requiresReview: status === "maybe" || status === "manual_review",
  };
}

export function getGuestPageLabels(language: string | null | undefined) {
  return labels[normalizeLanguage(language)];
}

export function getGuestPublicPageAuditActions() {
  return [...guestPublicPageAuditActions];
}

export function getSprint5RsvpStatus() {
  return {
    epic: "EPIC-RSVP",
    features: ["FEAT-RSVP-001", "FEAT-RSVP-002", "FEAT-RSVP-003"],
    issue: 10,
    modules: [
      {
        name: "Secure public guest page token foundation",
        requirementIds: ["RSVP-001", "ROLE-009", "TECH-010"],
      },
      {
        name: "Payment-gated public access and admin preview",
        requirementIds: ["RSVP-002", "RSVP-003", "PAY-014", "PAY-015"],
      },
      {
        name: "Event-specific RSVP records and change rules",
        requirementIds: ["RSVP-006", "RSVP-007", "RSVP-008", "RSVP-009"],
      },
      {
        name: "RSVP operational effects and manual review foundation",
        requirementIds: ["RSVP-010", "RSVP-012", "RSVP-014"],
      },
      {
        name: "Guest language labels and invitation placeholder",
        requirementIds: ["RSVP-005", "RSVP-013"],
      },
      {
        name: "RSVP audit logging",
        requirementIds: ["REP-006"],
      },
    ],
    outOfScope: [
      "invitation PDF generation",
      "invitation template upload",
      "QR image generation",
      "WhatsApp sending",
      "seating",
      "check-in",
      "contracts",
      "pricing",
      "payments",
      "partner project creation",
      "full guest-book workflow",
    ],
    requirementIds: [
      "RSVP-001",
      "RSVP-002",
      "RSVP-003",
      "RSVP-004",
      "RSVP-005",
      "RSVP-006",
      "RSVP-007",
      "RSVP-008",
      "RSVP-009",
      "RSVP-010",
      "RSVP-012",
      "RSVP-013",
      "RSVP-014",
      "ROLE-009",
      "PAY-014",
      "PAY-015",
      "REP-006",
      "TECH-010",
    ],
    sprint: "Sprint 5 - RSVP & Public Guest Page",
    stories: [
      "STORY-RSVP-001",
      "STORY-RSVP-002",
      "STORY-RSVP-003",
      "STORY-RSVP-004",
    ],
  };
}
