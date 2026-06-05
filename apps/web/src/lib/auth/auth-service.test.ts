import { describe, expect, it } from "vitest";
import {
  buildLoginErrorRedirectPath,
  buildLoginRedirectPath,
  getMagicLinkRequestErrorMessage,
  normalizeInternalPath,
} from "@/lib/auth/auth-service";

describe("auth redirect helpers", () => {
  it("normalizes login return paths to internal routes only", () => {
    expect(normalizeInternalPath("/platform/projects")).toBe(
      "/platform/projects",
    );
    expect(normalizeInternalPath("  /platform  ")).toBe("/platform");
    expect(normalizeInternalPath("")).toBe("/platform");
    expect(normalizeInternalPath("/platform?key=value&foo=bar")).toBe(
      "/platform?key=value&foo=bar",
    );
    expect(normalizeInternalPath("https://example.test/platform")).toBe(
      "/platform",
    );
    expect(normalizeInternalPath("//example.test/platform")).toBe("/platform");
    expect(normalizeInternalPath("/platform\n/projects")).toBe("/platform");
    expect(normalizeInternalPath("/platform%0A/projects")).toBe("/platform");
    expect(normalizeInternalPath("/platform%7f/projects")).toBe("/platform");
    expect(normalizeInternalPath("/platform/../admin")).toBe("/platform");
    expect(normalizeInternalPath("/platform/%2e%2e/admin")).toBe("/platform");
    expect(normalizeInternalPath("/platform/%2E%2E/admin")).toBe("/platform");
    expect(normalizeInternalPath("/platform/%252e%252e/admin")).toBe(
      "/platform",
    );
    expect(normalizeInternalPath("/platform/%252E%252E/admin")).toBe(
      "/platform",
    );
    expect(normalizeInternalPath("/platform\\admin")).toBe("/platform");
    expect(normalizeInternalPath("/platform/%5C../admin")).toBe("/platform");
    expect(normalizeInternalPath("/platform/%5c..%5cadmin")).toBe("/platform");
    expect(normalizeInternalPath("/platform/%255c..%255cadmin")).toBe(
      "/platform",
    );
  });

  it("encodes nested next paths without broadening login query params", () => {
    const loginPath = buildLoginRedirectPath(
      "/platform/projects/project-1/guests?side=bride&eventId=event-1",
    );
    const parsed = new URL(loginPath, "https://diginoces.test");

    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("next")).toBe(
      "/platform/projects/project-1/guests?side=bride&eventId=event-1",
    );
    expect(parsed.searchParams.get("side")).toBeNull();
    expect(parsed.searchParams.get("eventId")).toBeNull();
  });

  it("preserves safe next paths when building login error redirects", () => {
    const loginPath = buildLoginErrorRedirectPath(
      "/platform/audit-logs?actor=diginoces",
      "Authentication link is invalid or expired. Request a fresh magic link.",
    );
    const parsed = new URL(loginPath, "https://diginoces.test");

    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("next")).toBe(
      "/platform/audit-logs?actor=diginoces",
    );
    expect(parsed.searchParams.get("error")).toBe(
      "Authentication link is invalid or expired. Request a fresh magic link.",
    );
    expect(parsed.searchParams.get("actor")).toBeNull();
  });

  it("defaults unsafe encoded next paths without leaking their query params", () => {
    const loginPath = buildLoginRedirectPath(
      "/platform%0A/guests?side=bride&eventId=event-1",
    );
    const parsed = new URL(loginPath, "https://diginoces.test");

    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("next")).toBe("/platform");
    expect(parsed.searchParams.get("side")).toBeNull();
    expect(parsed.searchParams.get("eventId")).toBeNull();
  });

  it("defaults path traversal attempts without leaking their query params", () => {
    const loginPath = buildLoginRedirectPath(
      "/platform/%2e%2e/admin?side=bride&eventId=event-1",
    );
    const parsed = new URL(loginPath, "https://diginoces.test");

    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("next")).toBe("/platform");
    expect(parsed.searchParams.get("side")).toBeNull();
    expect(parsed.searchParams.get("eventId")).toBeNull();
  });

  it("surfaces a retry delay when Supabase rate limits magic links", () => {
    expect(
      getMagicLinkRequestErrorMessage({
        code: "over_email_send_rate_limit",
        status: 429,
      }),
    ).toBe(
      "Too many magic links requested. Wait a few minutes, then request a fresh link.",
    );
    expect(
      getMagicLinkRequestErrorMessage({
        code: "unexpected_failure",
        status: 500,
      }),
    ).toBe("Unable to request a magic link.");
  });

  it("surfaces a retry delay when Supabase sends the rate-limit error code", () => {
    expect(
      getMagicLinkRequestErrorMessage({
        code: "over_email_send_rate_limit",
        status: 400,
      }),
    ).toBe(
      "Too many magic links requested. Wait a few minutes, then request a fresh link.",
    );
  });

  it("surfaces a retry delay when Supabase sends a 429 status", () => {
    expect(
      getMagicLinkRequestErrorMessage({
        code: "unexpected_failure",
        status: 429,
      }),
    ).toBe(
      "Too many magic links requested. Wait a few minutes, then request a fresh link.",
    );
  });
});
