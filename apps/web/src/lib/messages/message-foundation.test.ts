import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildGuidedManualWhatsappUrl,
  buildMessageAuditActions,
  canPerformMessageAction,
  createApiReadyMessagingAdapter,
  extractMessageVariables,
  filterMaybeFollowUpCandidates,
  getSprint7CommunicationStatus,
  markGuidedManualMessage,
  prepareCommunicationMessage,
  renderMessageTemplate,
  selectMessageTemplate,
  validateMessageReadiness,
  type MessagePreparationInput,
  type MessageTemplate,
} from "@/lib/messages/message-service";
import type { RoleAssignment } from "@/lib/security/permissions";

const projectId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const guestId = "33333333-3333-4333-8333-333333333333";
const invitationId = "44444444-4444-4444-8444-444444444444";
const fileId = "55555555-5555-4555-8555-555555555555";

const frenchInvitationTemplate: MessageTemplate = {
  body: "Bonjour {{guest.display_name}}, voici votre invitation pour {{event.name}}: {{public_guest_page_link}}",
  id: "template-fr",
  language: "fr",
  messageType: "invitation",
  projectId,
  status: "active",
  title: "Invitation FR",
  variables: ["guest.display_name", "event.name", "public_guest_page_link"],
  version: 1,
};

const englishInvitationTemplate: MessageTemplate = {
  ...frenchInvitationTemplate,
  body: "Hello {{guest.display_name}}, your invitation for {{event.name}} is ready: {{public_guest_page_link}}",
  id: "template-en",
  language: "en",
  title: "Invitation EN",
};

const basePreparationInput: MessagePreparationInput = {
  event: {
    id: eventId,
    name: "Reception",
    rsvpDeadlineAt: "2026-07-01T18:00:00.000Z",
    startsAt: "2026-07-10T17:00:00.000Z",
    venueName: "Diginoces Hall",
  },
  guest: {
    displayName: "Ada Kanda",
    eventAssignments: [{ eventId, invited: true }],
    id: guestId,
    isActive: true,
    isPrintedOnly: false,
    preferredLanguage: "fr",
    projectId,
    whatsappNumber: "+243810000001",
  },
  invitation: {
    id: invitationId,
    latestActiveFileId: fileId,
    publicGuestPageLink: "https://example.test/g/guest-token",
    status: "generated",
  },
  messageType: "invitation",
  paymentGate: "unlocked",
  preparedAt: "2026-05-23T21:45:00.000Z",
  preparedBy: "staff-user",
  project: {
    defaultLanguage: "fr",
    id: projectId,
    name: "Ada & Ben",
  },
  templates: [frenchInvitationTemplate, englishInvitationTemplate],
};

function repoRootFromCwd() {
  let current = resolve(process.cwd());

  while (true) {
    if (existsSync(join(current, ".git"))) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  throw new Error(`Unable to resolve repository root from ${process.cwd()}`);
}

function readRepoFile(pathFromRoot: string) {
  const repoRoot = repoRootFromCwd();
  const fullPath = join(repoRoot, pathFromRoot);

  if (!existsSync(fullPath)) {
    throw new Error(`Expected repository file at ${fullPath}`);
  }

  return readFileSync(fullPath, "utf8");
}

function readSprint7Migration() {
  const repoRoot = repoRootFromCwd();
  const migrationDir = join(repoRoot, "supabase", "migrations");
  const matches = readdirSync(migrationDir).filter((entry) =>
    entry.endsWith("_sprint_7_whatsapp_communication_workflows.sql"),
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one Sprint 7 communication workflow migration file, found ${matches.length}.`,
    );
  }

  return readFileSync(join(migrationDir, matches[0]), "utf8");
}

describe("Sprint 7 WhatsApp communication workflow foundation", () => {
  it("maps implemented scope to EPIC-MSG, issue 21, and approved backlog rows", () => {
    const status = getSprint7CommunicationStatus();

    expect(status.issue).toBe(21);
    expect(status.epic).toBe("EPIC-MSG");
    expect(status.features).toEqual([
      "FEAT-MSG-001",
      "FEAT-MSG-002",
      "FEAT-MSG-003",
    ]);
    expect(status.stories).toEqual(["STORY-MSG-001", "STORY-MSG-002"]);
    expect(status.tasks).toEqual(["TASK-MSG-001", "TASK-MSG-002"]);
    expect(status.tests).toEqual(["TEST-MSG-001", "TEST-MSG-002"]);
    expect(status.requirementIds).toEqual(
      expect.arrayContaining([
        "MSG-001",
        "MSG-002",
        "MSG-003",
        "MSG-004",
        "MSG-005",
        "MSG-006",
        "MSG-008",
        "MSG-009",
        "MSG-010",
        "RSVP-011",
        "INV-013",
        "PAY-014",
        "REP-006",
        "TECH-005",
      ]),
    );
    expect(status.outOfScope.join(" ")).toMatch(/unofficial WhatsApp Web/i);
  });

  it("selects active French or English templates with explicit fallback", () => {
    expect(
      selectMessageTemplate({
        messageType: "invitation",
        preferredLanguage: "en",
        projectDefaultLanguage: "fr",
        templates: [frenchInvitationTemplate, englishInvitationTemplate],
      }),
    ).toMatchObject({
      fallbackUsed: false,
      template: { id: "template-en", language: "en" },
    });

    expect(
      selectMessageTemplate({
        messageType: "invitation",
        preferredLanguage: "en",
        projectDefaultLanguage: "fr",
        templates: [frenchInvitationTemplate],
      }),
    ).toMatchObject({
      fallbackUsed: true,
      template: { id: "template-fr", language: "fr" },
    });

    expect(() =>
      selectMessageTemplate({
        messageType: "invitation",
        preferredLanguage: "fr",
        projectDefaultLanguage: "fr",
        templates: [
          {
            ...frenchInvitationTemplate,
            status: "inactive",
          },
        ],
      }),
    ).toThrow(/active template/i);
  });

  it("renders dynamic variables and reports missing required values", () => {
    const rendered = renderMessageTemplate(frenchInvitationTemplate, {
      event: basePreparationInput.event,
      guest: basePreparationInput.guest,
      invitation: basePreparationInput.invitation,
      project: basePreparationInput.project,
    });

    expect(rendered.renderedBody).toContain("Bonjour Ada Kanda");
    expect(rendered.renderedBody).toContain("Reception");
    expect(rendered.missingRequiredVariables).toEqual([]);

    expect(
      extractMessageVariables(
        "{{guest.display_name}} {{ event.name }} {{guest.display_name}}",
      ),
    ).toEqual(["guest.display_name", "event.name"]);

    const eventStartsAt = basePreparationInput.event.startsAt;

    if (!eventStartsAt) {
      throw new Error("Expected base event start date for rendering test.");
    }

    const englishDate = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(eventStartsAt));
    const englishRendered = renderMessageTemplate(
      {
        ...englishInvitationTemplate,
        body: "Date: {{event.date}}",
        variables: ["event.date"],
      },
      {
        event: basePreparationInput.event,
        guest: basePreparationInput.guest,
        invitation: basePreparationInput.invitation,
        project: basePreparationInput.project,
      },
    );

    expect(englishRendered.renderedBody).toContain(englishDate);

    expect(
      renderMessageTemplate(
        {
          ...frenchInvitationTemplate,
          body: "{{guest.display_name}} table {{table.name}}",
          variables: ["guest.display_name", "table.name"],
        },
        {
          event: basePreparationInput.event,
          guest: basePreparationInput.guest,
          invitation: basePreparationInput.invitation,
          project: basePreparationInput.project,
        },
      ),
    ).toMatchObject({
      missingOptionalVariables: ["table.name"],
    });
  });

  it("validates invitation message readiness and payment/WhatsApp gates", () => {
    expect(validateMessageReadiness(basePreparationInput)).toEqual([]);
    expect(
      validateMessageReadiness({
        ...basePreparationInput,
        guest: { ...basePreparationInput.guest, whatsappNumber: null },
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_whatsapp_number" }),
      ]),
    );
    expect(
      validateMessageReadiness({
        ...basePreparationInput,
        guest: {
          ...basePreparationInput.guest,
          isPrintedOnly: true,
          whatsappNumber: null,
        },
      }),
    ).toEqual([]);
    expect(
      validateMessageReadiness({
        ...basePreparationInput,
        paymentGate: "locked",
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "payment_gate_locked" }),
      ]),
    );
    expect(
      validateMessageReadiness({
        ...basePreparationInput,
        invitation: {
          ...basePreparationInput.invitation!,
          latestActiveFileId: null,
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_active_invitation_file" }),
      ]),
    );
  });

  it("prepares guided manual WhatsApp logs and records opened/sent accountability", () => {
    const prepared = prepareCommunicationMessage(basePreparationInput);

    expect(prepared.status).toBe("prepared");
    expect(prepared.channel).toBe("whatsapp");
    expect(prepared.sendingMode).toBe("guided_manual");
    expect(prepared.templateId).toBe("template-fr");
    expect(prepared.auditActions).toContain("messages.prepared");

    const opened = markGuidedManualMessage(prepared, {
      actorUserId: "staff-user",
      markedAt: "2026-05-23T21:47:00.000Z",
      nextStatus: "opened_manually",
    });

    expect(opened).toMatchObject({
      openedAt: "2026-05-23T21:47:00.000Z",
      openedBy: "staff-user",
      status: "opened_manually",
    });

    const sent = markGuidedManualMessage(opened, {
      actorUserId: "staff-user",
      markedAt: "2026-05-23T21:49:00.000Z",
      nextStatus: "sent",
    });

    expect(sent).toMatchObject({
      sentAt: "2026-05-23T21:49:00.000Z",
      sentConfirmedBy: "staff-user",
      status: "sent",
    });

    expect(() =>
      markGuidedManualMessage(sent, {
        actorUserId: "staff-user",
        markedAt: "2026-05-23T21:50:00.000Z",
        nextStatus: "opened_manually",
      }),
    ).toThrow(/Cannot mark/i);

    expect(() =>
      markGuidedManualMessage(prepared, {
        actorUserId: "staff-user",
        markedAt: "2026-05-23T21:50:00.000Z",
        nextStatus: "failed",
      }),
    ).toThrow(/reason/i);

    expect(
      markGuidedManualMessage(prepared, {
        actorUserId: "staff-user",
        markedAt: "2026-05-23T21:50:00.000Z",
        nextStatus: "skipped",
        reason: "printed_only_manual",
      }),
    ).toMatchObject({
      skippedReason: "printed_only_manual",
      status: "skipped",
    });
  });

  it("builds WhatsApp click links without unofficial automation", () => {
    expect(buildGuidedManualWhatsappUrl("+243 81 000 0001", "Hello Ada")).toBe(
      "https://wa.me/243810000001?text=Hello%20Ada",
    );
    expect(() => buildGuidedManualWhatsappUrl("", "Hello")).toThrow(
      /WhatsApp number/i,
    );
  });

  it("creates separate logs for resends, Maybe follow-ups, reminders, and modifications", () => {
    const initial = prepareCommunicationMessage(basePreparationInput);
    const resend = prepareCommunicationMessage({
      ...basePreparationInput,
      messageType: "invitation_resend",
      templates: [
        {
          ...frenchInvitationTemplate,
          id: "template-resend-fr",
          messageType: "invitation_resend",
          title: "Resend FR",
        },
      ],
    });
    const modification = prepareCommunicationMessage({
      ...basePreparationInput,
      changeReason: "event_time_changed",
      messageType: "modification_notice",
      templates: [
        {
          ...frenchInvitationTemplate,
          body: "{{event.name}} has been updated: {{change.reason}}",
          id: "template-mod-fr",
          messageType: "modification_notice",
          title: "Modification FR",
          variables: ["event.name", "change.reason"],
        },
      ],
    });

    expect(resend.id).not.toBe(initial.id);
    expect(resend.messageType).toBe("invitation_resend");
    expect(resend.previousMessageLogId).toBeNull();
    expect(modification.renderedBody).toContain("event_time_changed");
  });

  it("prepares Maybe follow-up candidates only while RSVP remains Maybe", () => {
    const candidates = filterMaybeFollowUpCandidates([
      {
        eventId,
        guestId: "maybe-guest",
        rsvpDeadlineAt: "2026-07-01T18:00:00.000Z",
        status: "maybe",
      },
      {
        eventId,
        guestId: "yes-guest",
        rsvpDeadlineAt: "2026-07-01T18:00:00.000Z",
        status: "yes",
      },
      {
        eventId,
        guestId: "pending-guest",
        rsvpDeadlineAt: "2026-07-01T18:00:00.000Z",
        status: "pending",
      },
    ]);

    expect(candidates.map((candidate) => candidate.guestId)).toEqual([
      "maybe-guest",
    ]);
  });

  it("keeps API-ready messaging adapter credential-free in Sprint 7", async () => {
    const adapter = createApiReadyMessagingAdapter();
    const prepared = prepareCommunicationMessage(basePreparationInput);

    await expect(adapter.enqueue(prepared)).resolves.toMatchObject({
      externalProviderMessageId: null,
      mode: "api_ready",
      status: "queued",
    });
    await expect(adapter.send(prepared)).rejects.toThrow(
      /real WhatsApp API credentials/i,
    );
  });

  it("gates template management, message preparation, manual send, and history permissions", () => {
    const admin: RoleAssignment[] = [
      { role: "diginoces_admin", scope: "global" },
    ];
    const operations: RoleAssignment[] = [
      { role: "operations_manager", scope: "global" },
    ];
    const bride: RoleAssignment[] = [
      { role: "bride", scope: "project", scopeId: projectId },
    ];

    expect(canPerformMessageAction(admin, projectId, "templates.manage")).toBe(
      true,
    );
    expect(
      canPerformMessageAction(operations, projectId, "messages.send"),
    ).toBe(true);
    expect(canPerformMessageAction(bride, projectId, "messages.send")).toBe(
      false,
    );
    expect(canPerformMessageAction(bride, projectId, "history.read")).toBe(
      false,
    );
  });

  it("exposes audit actions for communication changes", () => {
    expect(buildMessageAuditActions()).toEqual(
      expect.arrayContaining([
        "message_templates.created",
        "message_templates.updated",
        "messages.prepared",
        "messages.opened_manually",
        "messages.sent",
        "messages.failed",
        "messages.skipped",
        "messages.resent",
        "message_reminders.prepared",
      ]),
    );
  });

  it("contains Sprint 7 migration, RLS, permissions, status tracking, and docs evidence", () => {
    const migration = readSprint7Migration();

    expect(migration).toContain(
      "create table if not exists public.message_templates",
    );
    expect(migration).toContain(
      "alter table public.message_templates enable row level security",
    );
    expect(migration).toContain("message_templates.manage");
    expect(migration).toContain("messages.prepare");
    expect(migration).toContain("messages.send");
    expect(migration).toContain("public.message_delivery_status");
    expect(migration).toContain("guided_manual");
    expect(migration).toContain("api_ready");
    expect(migration).toContain("alter type public.invitation_status");
    expect(migration).toContain("prepare_message_log_with_queue");

    expect(
      readRepoFile("docs/planning/sprint-7-completion-report.md"),
    ).toContain("Sprint 7");
  });
});
