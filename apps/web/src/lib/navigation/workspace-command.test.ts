import { describe, expect, it } from "vitest";
import {
  getWorkspaceCommandGroups,
  getWorkspaceRouteContext,
} from "@/lib/navigation/workspace-command";
import type { SupportedLanguage } from "@/lib/i18n/config";

const projectId = "de3378cd-ea21-4982-b507-a178eb88a34c";
const eventId = "088aebc4-05d9-45c2-b73a-803f73706163";

function flattenedLabels(pathname: string, language: SupportedLanguage = "en") {
  const context = getWorkspaceRouteContext(pathname);

  return getWorkspaceCommandGroups({ context, language }).flatMap((group) =>
    group.items.map((item) => item.label),
  );
}

describe("workspace command navigation", () => {
  it("extracts contextual project and event IDs only from UUID route segments", () => {
    expect(
      getWorkspaceRouteContext(`/platform/projects/${projectId}/guests`),
    ).toEqual({ projectId });
    expect(
      getWorkspaceRouteContext(`/platform/events/${eventId}/check-in/scan`),
    ).toEqual({ eventId });
    expect(getWorkspaceRouteContext("/platform/projects/new").projectId).toBe(
      undefined,
    );
    expect(getWorkspaceRouteContext("/platform/events/not-an-id").eventId).toBe(
      undefined,
    );
  });

  it("adds wedding shortcuts only when a current wedding route is known", () => {
    expect(flattenedLabels("/platform/projects")).not.toContain("Guest list");
    expect(flattenedLabels(`/platform/projects/${projectId}`)).toEqual(
      expect.arrayContaining([
        "Wedding overview",
        "Guest list",
        "Guest imports",
        "RSVP overview",
        "Message queue",
        "Wedding files",
      ]),
    );
  });

  it("adds event-day shortcuts only when a current event route is known", () => {
    expect(flattenedLabels("/platform/dashboard")).not.toContain(
      "Check-in desk",
    );
    expect(flattenedLabels(`/platform/events/${eventId}`)).toEqual(
      expect.arrayContaining([
        "Event overview",
        "Invitation designs",
        "Table plan",
        "Seating map",
        "Check-in desk",
        "Scan QR",
      ]),
    );
  });

  it("keeps command labels and descriptions user-facing across languages", () => {
    const blockedWords = /\b(sprint|foundation|mvp|backlog|issue|pr)\b/iu;
    const englishLabelsAndDescriptions = getWorkspaceCommandGroups({
      context: { eventId, projectId },
      language: "en",
    }).flatMap((group) => [
      group.label,
      ...group.items.flatMap((item) => [item.label, item.description]),
    ]);
    const frenchLabelsAndDescriptions = getWorkspaceCommandGroups({
      context: { eventId, projectId },
      language: "fr",
    }).flatMap((group) => [
      group.label,
      ...group.items.flatMap((item) => [item.label, item.description]),
    ]);

    expect(
      [...englishLabelsAndDescriptions, ...frenchLabelsAndDescriptions].every(
        (value) => value.trim().length > 0,
      ),
    ).toBe(true);
    expect(
      englishLabelsAndDescriptions.filter((value) => blockedWords.test(value)),
    ).toEqual([]);
    expect(
      frenchLabelsAndDescriptions.some((value) => /[éèêàçôîû]/iu.test(value)),
    ).toBe(true);
    expect(flattenedLabels(`/platform/projects/${projectId}`, "fr")).toContain(
      "Liste d'invités",
    );
  });
});
