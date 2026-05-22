import { describe, expect, it } from "vitest";
import {
  buildGuestPublicToken,
  canPreviewGuestPublicPage,
  canSubmitPublicRsvp,
  getGuestPageLabels,
  getGuestPublicPageAuditActions,
  getInvitedPublicEvents,
  getRsvpOperationalEffect,
  getSprint5RsvpStatus,
  hashGuestPublicToken,
  resolveGuestPublicToken,
  upsertRsvpRecord,
  type GuestPublicTokenRecord,
  type PublicGuestEvent,
  type RsvpRecord,
} from "@/lib/rsvp/rsvp-service";
import type { RoleAssignment } from "@/lib/security/permissions";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const guestId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const otherGuestId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const eventA = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const eventB = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const eventC = "abababab-abab-4aba-8aba-abababababab";

function tokenRecord(
  token: string,
  overrides: Partial<GuestPublicTokenRecord> = {},
): GuestPublicTokenRecord {
  return {
    expiresAt: null,
    guestId,
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    projectId,
    status: "active",
    tokenHash: hashGuestPublicToken(token),
    tokenType: "guest_public_page",
    ...overrides,
  };
}

const invitedEvents: PublicGuestEvent[] = [
  {
    eventDate: "2026-08-08",
    eventId: eventA,
    invited: true,
    name: "Religious ceremony",
    rsvpDeadlineAt: "2026-07-31T21:59:59.000Z",
    startsAt: "15:00:00",
    venueName: "Notre Dame",
  },
  {
    eventDate: "2026-08-09",
    eventId: eventB,
    invited: true,
    name: "Reception",
    rsvpDeadlineAt: null,
    startsAt: "18:00:00",
    venueName: "Diginoces Hall",
  },
  {
    eventDate: "2026-08-10",
    eventId: "99999999-9999-4999-8999-999999999999",
    invited: false,
    name: "Private brunch",
    rsvpDeadlineAt: null,
    startsAt: null,
    venueName: null,
  },
];

describe("Sprint 5 RSVP and public guest page foundation", () => {
  it("hashes public tokens and resolves only the matching active guest token", () => {
    const token = buildGuestPublicToken();
    const tokenHash = hashGuestPublicToken(token);

    expect(token).toHaveLength(64);
    expect(tokenHash).not.toBe(token);
    expect(hashGuestPublicToken(token)).toBe(tokenHash);

    const resolved = resolveGuestPublicToken(token, [
      tokenRecord("wrong-token", { guestId: otherGuestId }),
      tokenRecord(token),
    ]);

    expect(resolved?.guestId).toBe(guestId);
    expect(resolveGuestPublicToken("wrong-token", [tokenRecord(token)])).toBe(
      null,
    );
  });

  it("rejects revoked, expired, and non-public guest tokens", () => {
    const token = buildGuestPublicToken();

    expect(
      resolveGuestPublicToken(token, [
        tokenRecord(token, { status: "revoked" }),
      ]),
    ).toBe(null);
    expect(
      resolveGuestPublicToken(token, [
        tokenRecord(token, { expiresAt: "2026-01-01T00:00:00.000Z" }),
      ]),
    ).toBe(null);
    expect(
      resolveGuestPublicToken(token, [
        tokenRecord(token, { tokenType: "check_in" }),
      ]),
    ).toBe(null);
  });

  it("blocks locked public guest access while allowing internal preview only for admin/staff", () => {
    const admin: RoleAssignment[] = [
      { role: "diginoces_admin", scope: "global" },
    ];
    const staff: RoleAssignment[] = [
      { role: "operations_manager", scope: "global" },
    ];
    const couple: RoleAssignment[] = [
      { role: "couple", scope: "project", scopeId: projectId },
    ];

    expect(
      canSubmitPublicRsvp({
        eventId: eventA,
        invitedEvents,
        now: "2026-07-01T10:00:00.000Z",
        paymentGate: "locked",
        previousStatus: "pending",
        requestedStatus: "yes",
      }).allowed,
    ).toBe(false);
    expect(canPreviewGuestPublicPage(admin, projectId)).toBe(true);
    expect(canPreviewGuestPublicPage(staff, projectId)).toBe(true);
    expect(canPreviewGuestPublicPage(couple, projectId)).toBe(false);
  });

  it("shows only invited events on the public guest page", () => {
    expect(
      getInvitedPublicEvents(invitedEvents).map((event) => event.eventId),
    ).toEqual([eventA, eventB]);
  });

  it("stores RSVP per event and supports Yes/No/Maybe values", () => {
    const initial: RsvpRecord[] = [];
    const withYes = upsertRsvpRecord(initial, {
      eventId: eventA,
      guestId,
      projectId,
      source: "public_guest_page",
      status: "yes",
      submittedAt: "2026-07-01T10:00:00.000Z",
    });
    const withMaybe = upsertRsvpRecord(withYes, {
      eventId: eventB,
      guestId,
      projectId,
      source: "public_guest_page",
      status: "maybe",
      submittedAt: "2026-07-01T10:01:00.000Z",
    });
    const withNo = upsertRsvpRecord(withMaybe, {
      eventId: eventC,
      guestId,
      projectId,
      source: "public_guest_page",
      status: "no",
      submittedAt: "2026-07-01T10:02:00.000Z",
    });

    expect(withNo).toHaveLength(3);
    expect(withNo.find((record) => record.eventId === eventA)?.status).toBe(
      "yes",
    );
    expect(withNo.find((record) => record.eventId === eventB)?.status).toBe(
      "maybe",
    );
    expect(withNo.find((record) => record.eventId === eventC)?.status).toBe(
      "no",
    );
  });

  it("allows guests to change pending or Maybe but locks Yes and No from public changes", () => {
    expect(
      canSubmitPublicRsvp({
        eventId: eventA,
        invitedEvents,
        now: "2026-07-01T10:00:00.000Z",
        paymentGate: "unlocked",
        previousStatus: "pending",
        requestedStatus: "maybe",
      }).allowed,
    ).toBe(true);
    expect(
      canSubmitPublicRsvp({
        eventId: eventA,
        invitedEvents,
        now: "2026-07-01T10:00:00.000Z",
        paymentGate: "unlocked",
        previousStatus: "maybe",
        requestedStatus: "yes",
      }).allowed,
    ).toBe(true);
    expect(
      canSubmitPublicRsvp({
        eventId: eventA,
        invitedEvents,
        now: "2026-07-01T10:00:00.000Z",
        paymentGate: "unlocked",
        previousStatus: "yes",
        requestedStatus: "no",
      }).reason,
    ).toBe("locked_final_response");
    expect(
      canSubmitPublicRsvp({
        eventId: eventA,
        invitedEvents,
        now: "2026-07-01T10:00:00.000Z",
        paymentGate: "unlocked",
        previousStatus: "no",
        requestedStatus: "maybe",
      }).reason,
    ).toBe("locked_final_response");
    expect(
      canSubmitPublicRsvp({
        eventId: eventA,
        invitedEvents,
        now: "2026-07-01T10:00:00.000Z",
        paymentGate: "unlocked",
        previousStatus: "locked",
        requestedStatus: "yes",
      }).reason,
    ).toBe("locked_final_response");
  });

  it("routes post-deadline pending or Maybe responses to manual review", () => {
    const decision = canSubmitPublicRsvp({
      eventId: eventA,
      invitedEvents,
      now: "2026-08-01T00:00:00.000Z",
      paymentGate: "unlocked",
      previousStatus: "maybe",
      requestedStatus: "yes",
    });

    expect(decision.allowed).toBe(true);
    expect(decision.deadlineState).toBe("manual_review");
  });

  it("does not allow printed-only guests to be forced through public RSVP", () => {
    expect(
      canSubmitPublicRsvp({
        eventId: eventA,
        invitedEvents,
        isPrintedOnly: true,
        now: "2026-07-01T10:00:00.000Z",
        paymentGate: "unlocked",
        previousStatus: "pending",
        requestedStatus: "yes",
      }).reason,
    ).toBe("manual_printed_only");
  });

  it("computes operational effects for future seating, reminders, and check-in modules", () => {
    expect(getRsvpOperationalEffect("yes")).toMatchObject({
      includedInExpectedAttendance: true,
    });
    expect(getRsvpOperationalEffect("maybe")).toMatchObject({
      includedInExpectedAttendance: true,
      requiresReview: true,
    });
    expect(getRsvpOperationalEffect("no")).toMatchObject({
      includedInExpectedAttendance: false,
    });
    expect(getRsvpOperationalEffect("locked")).toMatchObject({
      includedInExpectedAttendance: false,
      includedInFutureCheckIn: false,
      includedInFutureReminders: false,
      includedInFutureSeating: false,
      requiresReview: false,
    });
  });

  it("provides French and English public guest labels", () => {
    expect(getGuestPageLabels("fr").yes).toBe("Oui");
    expect(getGuestPageLabels("en").maybe).toBe("Maybe");
    expect(getGuestPageLabels(null).lockedTitle).toBe(
      getGuestPageLabels("fr").lockedTitle,
    );
  });

  it("represents RSVP and public-page audit hooks without exposing future modules", () => {
    expect(getGuestPublicPageAuditActions()).toEqual(
      expect.arrayContaining([
        "guest_public_tokens.created",
        "guest_public_pages.accessed",
        "guest_public_pages.previewed",
        "rsvps.submitted",
        "rsvps.changed",
        "rsvps.deadline_review_required",
      ]),
    );
    expect(getSprint5RsvpStatus().outOfScope).toEqual(
      expect.arrayContaining([
        "invitation PDF generation",
        "QR image generation",
        "WhatsApp sending",
        "seating",
        "check-in",
        "payments",
      ]),
    );
  });
});
