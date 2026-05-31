import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { RoleAssignment } from "@/lib/security/permissions";
import {
  buildGuestBookCanvaCsv,
  buildGuestBookCanvaRows,
  canEditGuestMessage,
  coupleReviewGuestMessage,
  getGuestWishPermissionSummary,
  getSprint12GuestWishesStatus,
  isPublicTestimonialEligible,
  moderateGuestMessage,
  parsePostEventFeedbackPayload,
  parsePublicGuestMessagePayload,
  toCoupleGuestMessageView,
  upsertGuestMessage,
  type GuestMessage,
} from "@/lib/guest-wishes/guest-wish-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const guestId = "22222222-2222-4222-8222-222222222222";
const otherGuestId = "33333333-3333-4333-8333-333333333333";

const here = fileURLToPath(new URL(".", import.meta.url));

function findMigrationRoot(startDirectory: string) {
  let currentDirectory = startDirectory;

  while (currentDirectory !== dirname(currentDirectory)) {
    const candidate = join(currentDirectory, "supabase", "migrations");

    if (existsSync(candidate)) {
      return candidate;
    }

    currentDirectory = dirname(currentDirectory);
  }

  throw new Error("Supabase migrations directory was not found.");
}

const migrationRoot = findMigrationRoot(here);
const repoRoot = dirname(dirname(migrationRoot));

function sprint12Migration() {
  const migrationMatches = readdirSync(migrationRoot).filter(
    (name) =>
      name.includes("sprint_12_guest_wishes_feedback") && name.endsWith(".sql"),
  );

  if (migrationMatches.length === 0) {
    throw new Error("Sprint 12 migration was not found.");
  }

  if (migrationMatches.length > 1) {
    throw new Error("Multiple Sprint 12 migrations were found.");
  }

  return readFileSync(join(migrationRoot, migrationMatches[0]!), "utf8");
}

function guestMessage(
  id: string,
  overrides: Partial<GuestMessage> = {},
): GuestMessage {
  return {
    approvedText: null,
    coupleComment: null,
    coupleReviewedAt: null,
    currentText: "Initial wish",
    eventId: null,
    exportedAt: null,
    guestDisplayName: `Guest ${id}`,
    guestId: id,
    id: `message-${id}`,
    internalModerationNote: null,
    language: "fr",
    originalText: "Initial wish",
    projectCode: "ADA-BEN-2026",
    projectId,
    status: "pending_review",
    submittedAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("Sprint 12 guest wishes, guest-book export, and feedback foundation", () => {
  it("parses text-only public guest message payloads with emoji support and rejects uploads", () => {
    expect(
      parsePublicGuestMessagePayload({
        language: "fr",
        messageText: "Tous nos voeux de bonheur \u{1F389}",
        profilePhoto: "https://example.test/photo.jpg",
      }),
    ).toEqual({
      language: "fr",
      messageText: "Tous nos voeux de bonheur \u{1F389}",
    });

    expect(() =>
      parsePublicGuestMessagePayload({
        attachmentCount: 1,
        messageText: "See photo",
      }),
    ).toThrow("file uploads are not supported");
    expect(() =>
      parsePublicGuestMessagePayload({
        messageText: "See photo",
        photoData: new Uint8Array([1]),
      }),
    ).toThrow("file uploads are not supported");

    expect(() =>
      parsePublicGuestMessagePayload({
        messageText: "",
      }),
    ).toThrow("message text is required");
  });

  it("enforces one message per guest while preserving original text on edits before deadline", () => {
    const first = upsertGuestMessage([], {
      guestDisplayName: "Ada Guest",
      guestId,
      language: "fr",
      messageText: "Original text",
      now: "2026-08-01T10:00:00.000Z",
      projectCode: "ADA-BEN-2026",
      projectId,
    });
    const edited = upsertGuestMessage(first.messages, {
      guestDisplayName: "Ada Guest",
      guestId,
      language: "fr",
      messageText: "Edited text \u{1F49A}",
      now: "2026-08-01T11:00:00.000Z",
      projectCode: "ADA-BEN-2026",
      projectId,
    });

    expect(first.result.status).toBe("created");
    expect(edited.result.status).toBe("updated");
    expect(edited.messages).toHaveLength(1);
    expect(edited.messages[0]).toMatchObject({
      currentText: "Edited text \u{1F49A}",
      originalText: "Original text",
      status: "pending_review",
    });
  });

  it("allows guest edits before the configured deadline and rejects direct edits after it", () => {
    expect(
      canEditGuestMessage({
        deadlineAt: "2026-08-02T00:00:00.000Z",
        now: "2026-08-01T23:59:00.000Z",
      }),
    ).toEqual({ allowed: true });

    expect(
      canEditGuestMessage({
        deadlineAt: "2026-08-02T00:00:00.000Z",
        now: "2026-08-02T00:00:01.000Z",
      }),
    ).toEqual({
      allowed: false,
      reason: "deadline_passed",
    });
  });

  it("preserves original text when admin edits approved guest-book text", () => {
    const reviewed = moderateGuestMessage(
      guestMessage(guestId, {
        currentText: "raw text",
        originalText: "raw text",
      }),
      {
        action: "edit_and_approve",
        approvedText: "Clean approved text",
        internalNote: "Removed typo",
        now: "2026-08-02T10:00:00.000Z",
        reviewerUserId: "admin-user",
      },
    );

    expect(reviewed.message).toMatchObject({
      approvedText: "Clean approved text",
      currentText: "raw text",
      internalModerationNote: "Removed typo",
      originalText: "raw text",
      status: "admin_edited",
    });
    expect(reviewed.reviewEvent.action).toBe("edit_and_approve");
    expect(() =>
      moderateGuestMessage(guestMessage(guestId), {
        action: "publish" as never,
        now: "2026-08-02T10:00:00.000Z",
        reviewerUserId: "admin-user",
      }),
    ).toThrow("not supported");
  });

  it("exposes couple-safe message views without internal moderation notes", () => {
    const message = guestMessage(guestId, {
      approvedText: "Approved text",
      internalModerationNote: "Internal staff note",
      status: "admin_approved",
    });

    expect(toCoupleGuestMessageView(message)).toEqual({
      approvedText: "Approved text",
      coupleComment: null,
      guestDisplayName: "Guest 22222222-2222-4222-8222-222222222222",
      id: "message-22222222-2222-4222-8222-222222222222",
      status: "admin_approved",
      submittedAt: "2026-08-01T10:00:00.000Z",
    });
  });

  it("records couple review actions before export", () => {
    const reviewed = coupleReviewGuestMessage(
      guestMessage(guestId, {
        approvedText: "Approved text",
        status: "admin_approved",
      }),
      {
        action: "approve",
        comment: "Ready for the book",
        now: "2026-08-03T10:00:00.000Z",
        reviewerUserId: "bride-user",
      },
    );

    expect(reviewed.message.status).toBe("couple_approved");
    expect(reviewed.message.coupleComment).toBe("Ready for the book");
    expect(reviewed.reviewEvent.action).toBe("approve");
  });

  it("exports only couple-approved messages to Canva CSV with formula neutralization", () => {
    const rows = buildGuestBookCanvaRows([
      {
        ...guestMessage(guestId, {
          approvedText: "A beautiful message",
          guestDisplayName: "Ada Guest",
          status: "couple_approved",
        }),
        coupleNames: "Ada & Ben",
        eventName: "Reception",
      },
      guestMessage(otherGuestId, {
        approvedText: "=CMD",
        guestDisplayName: "=Formula Guest",
        status: "couple_approved",
      }),
      guestMessage("pending", {
        approvedText: "A beautiful message",
        status: "admin_approved",
      }),
      guestMessage("excluded", {
        approvedText: "Excluded",
        status: "excluded",
      }),
    ]);
    const csv = buildGuestBookCanvaCsv(rows);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      couple_names: "Ada & Ben",
      event_name: "Reception",
    });
    expect(csv).toContain("guest_display_name,message_text,project_code");
    expect(csv).toContain("Ada Guest,A beautiful message,ADA-BEN-2026");
    expect(csv).toContain("'=Formula Guest,'=CMD");
    expect(csv).not.toContain("Pending");
    expect(csv).not.toContain("Excluded");
  });

  it("stores post-event feedback and keeps testimonials private until permission and admin review", () => {
    const feedback = parsePostEventFeedbackPayload({
      feedbackText: "The service was thoughtful.",
      improvementSuggestions: "More reminders.",
      invitationCommunicationRating: 5,
      overallRating: 5,
      publicDisplayName: "Ada & Ben",
      serviceQualityRating: 5,
      testimonialPermissionGranted: true,
      testimonialText: "Excellent support.",
    });

    expect(feedback).toMatchObject({
      overallRating: 5,
      testimonialPermissionGranted: true,
    });
    expect(
      isPublicTestimonialEligible({
        adminReviewStatus: "pending",
        permissionGranted: true,
        testimonialText: "Excellent support.",
      }),
    ).toBe(false);
    expect(
      isPublicTestimonialEligible({
        adminReviewStatus: "reviewed",
        permissionGranted: true,
        testimonialText: "Excellent support.",
      }),
    ).toBe(false);
    expect(
      isPublicTestimonialEligible({
        adminReviewStatus: "approved_for_public_use",
        permissionGranted: true,
        testimonialText: "Excellent support.",
      }),
    ).toBe(true);
  });

  it("keeps partner users away from wishes and feedback while allowing couple review and feedback submission", () => {
    const admin: RoleAssignment[] = [
      { role: "diginoces_admin", scope: "global" },
    ];
    const operations: RoleAssignment[] = [
      { role: "operations_manager", scope: "global" },
    ];
    const bride: RoleAssignment[] = [
      { role: "bride", scope: "project", scopeId: projectId },
    ];
    const partner: RoleAssignment[] = [
      { role: "partner_admin", scope: "custom", scopeId: projectId },
    ];

    expect(getGuestWishPermissionSummary(admin, projectId)).toMatchObject({
      canExportGuestBook: true,
      canModerateMessages: true,
      canReviewFeedback: true,
    });
    expect(getGuestWishPermissionSummary(operations, projectId)).toMatchObject({
      canExportGuestBook: true,
      canModerateMessages: true,
    });
    expect(getGuestWishPermissionSummary(bride, projectId)).toMatchObject({
      canModerateMessages: false,
      canReviewAsCouple: true,
      canSubmitFeedback: true,
    });
    expect(getGuestWishPermissionSummary(partner, projectId)).toMatchObject({
      canReadFeedback: false,
      canReadMessages: false,
      canSubmitFeedback: false,
    });
  });

  it("documents Sprint 12 database, permission, audit, public-page, and route foundations", () => {
    const migration = sprint12Migration();

    expect(migration).toContain(
      "create table if not exists public.guest_messages",
    );
    expect(migration).toContain(
      "create table if not exists public.guest_message_reviews",
    );
    expect(migration).toContain(
      "create table if not exists public.guest_book_exports",
    );
    expect(migration).toContain(
      "create table if not exists public.post_event_feedback",
    );
    expect(migration).toContain(
      "create table if not exists public.testimonial_permissions",
    );
    expect(migration).toContain("unique (guest_id)");
    expect(migration).toContain("list_couple_guest_messages");
    expect(migration).toContain(
      "revoke all on function app_private.public_guest_page_payload",
    );
    expect(migration).toContain("manual_printed_only");
    expect(migration).toContain("submit_public_guest_message");
    expect(migration).toContain("review_guest_message");
    expect(migration).toContain("couple_review_guest_message");
    expect(migration).toContain("submit_post_event_feedback");
    expect(migration).toContain("review_post_event_feedback");
    expect(migration).toContain(
      "Public testimonial approval requires couple permission and testimonial text.",
    );
    expect(migration).toContain("create_guest_book_export");
    expect(migration).toContain("guest_messages.moderate");
    expect(migration).toContain("post_event_feedback.review");
    expect(migration).toContain(
      "('operations_manager', 'guest_messages.couple_review')",
    );
    expect(migration).toContain("reviewed_by = null");
    expect(migration).toContain("md5(p_project_id::text)");
    expect(migration).not.toContain("changed_project_id");
    expect(migration).not.toContain("hashtext('guest_book_export");
    expect(migration).toContain("guest_messages.submitted");
    expect(migration).toContain("guest_book_exports.generated");
    expect(migration).toContain("post_event_feedback.submitted");
    expect(migration).toContain("enable row level security");
    expect(migration).not.toMatch(
      /or\s+app_private\.user_can_access_project\(\(select\s+auth\.uid\(\)\),\s+project_id,\s+'guest_messages\.couple_review'\)/i,
    );
    expect(migration).not.toMatch(
      /post_event_feedback\.submit'\)\s+or\s+app_private\.user_can_access_project\(\(select\s+auth\.uid\(\)\),\s+project_id,\s+'post_event_feedback\.review'\)/i,
    );
    expect(migration).not.toContain("audio_upload");
    expect(migration).not.toContain("video_upload");
    expect(migration).not.toContain("canva_api");
    expect(migration).not.toContain("partner_commissions");

    for (const routeFile of [
      "apps/web/src/app/platform/projects/[projectId]/guest-book/page.tsx",
      "apps/web/src/app/platform/projects/[projectId]/guest-book/couple-review/page.tsx",
      "apps/web/src/app/platform/projects/[projectId]/feedback/page.tsx",
      "apps/web/src/app/api/projects/[projectId]/guest-book/route.ts",
      "apps/web/src/app/api/projects/[projectId]/feedback/route.ts",
    ]) {
      expect(existsSync(join(repoRoot, routeFile))).toBe(true);
    }

    const publicGuestActions = readFileSync(
      join(repoRoot, "apps/web/src/app/g/[guestToken]/actions.ts"),
      "utf8",
    );
    const actionHelpers = readFileSync(
      join(
        repoRoot,
        "apps/web/src/lib/guest-wishes/guest-wish-action-helpers.ts",
      ),
      "utf8",
    );
    const guestBookPage = readFileSync(
      join(
        repoRoot,
        "apps/web/src/app/platform/projects/[projectId]/guest-book/page.tsx",
      ),
      "utf8",
    );
    const coupleReviewPage = readFileSync(
      join(
        repoRoot,
        "apps/web/src/app/platform/projects/[projectId]/guest-book/couple-review/page.tsx",
      ),
      "utf8",
    );
    const guestBookActions = readFileSync(
      join(
        repoRoot,
        "apps/web/src/app/platform/projects/[projectId]/guest-book/actions.ts",
      ),
      "utf8",
    );
    const guestBookRoute = readFileSync(
      join(
        repoRoot,
        "apps/web/src/app/api/projects/[projectId]/guest-book/route.ts",
      ),
      "utf8",
    );
    const feedbackActions = readFileSync(
      join(
        repoRoot,
        "apps/web/src/app/platform/projects/[projectId]/feedback/actions.ts",
      ),
      "utf8",
    );
    const feedbackPage = readFileSync(
      join(
        repoRoot,
        "apps/web/src/app/platform/projects/[projectId]/feedback/page.tsx",
      ),
      "utf8",
    );
    const guestWishDb = readFileSync(
      join(repoRoot, "apps/web/src/lib/guest-wishes/guest-wish-db.ts"),
      "utf8",
    );

    expect(publicGuestActions).toContain("readPreferredLanguage");
    expect(publicGuestActions).toContain("invalid_language");
    expect(actionHelpers).toContain("authContext.supabase");
    expect(actionHelpers).toContain("Nil/sentinel UUIDs are rejected");
    expect(guestBookPage).toContain("guestBookActionNotice");
    expect(guestBookPage).toContain("parseExportedRowCount");
    expect(guestBookPage).toContain("[1-9]\\d*");
    expect(guestBookPage).toContain('status === "exported"');
    expect(guestBookPage).toContain('status === "error"');
    expect(coupleReviewPage).toContain('query.status === "reviewed"');
    expect(coupleReviewPage).toContain('query.status === "error"');
    expect(guestBookActions).toContain("actionFailurePath");
    expect(guestBookActions).toContain("randomUUID");
    expect(guestBookActions).toContain("Guest-book export generation failed");
    expect(guestBookRoute).toContain("text/csv; charset=utf-8");
    expect(guestBookRoute).toContain("Content-Disposition");
    expect(feedbackActions).toContain("feedbackActionFailurePath");
    expect(feedbackActions).toContain("Post-event feedback review failed");
    expect(feedbackActions).not.toContain('"pending",');
    expect(feedbackPage).toContain("feedbackSuccessStatuses");
    expect(feedbackPage).toContain('name="internalReviewNote"');
    expect(guestWishDb).toContain("databaseRowCount");
  });

  it("reports Sprint 12 traceability and explicitly defers future modules", () => {
    const status = getSprint12GuestWishesStatus();

    expect(status.issue).toBe(28);
    expect(status.epic).toBe("EPIC-WISH");
    expect(status.features).toEqual([
      "FEAT-WISH-001",
      "FEAT-WISH-002",
      "FEAT-FEEDBACK-001",
      "FEAT-FEEDBACK-002",
    ]);
    expect(status.requirementIds).toEqual(
      expect.arrayContaining([
        "WISH-001",
        "WISH-008",
        "FILE-008",
        "REP-006",
        "ROLE-009",
        "TECH-004",
      ]),
    );
    expect(status.outOfScope).toEqual(
      expect.arrayContaining([
        "audio/video/photo guest submissions",
        "direct Canva API integration",
        "automatic public testimonial publishing",
        "partner commission management",
        "advanced AI assistance",
      ]),
    );
  });
});
