import { describe, expect, it } from "vitest";
import {
  buildImplicitAuthCallbackPage,
  buildLoginErrorRedirectPath,
  buildLoginRedirectPath,
  getAuthRedirectOrigin,
  getAuthCallbackNextPath,
  getAuthCallbackOtpType,
  getAuthCallbackTokenHash,
  getMagicLinkRequestErrorMessage,
  parseImplicitAuthCallbackPayload,
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

  it("accepts token_hash and token callback aliases", () => {
    expect(
      getAuthCallbackTokenHash(
        new URLSearchParams({
          token_hash: "hash-from-custom-template",
        }),
      ),
    ).toBe("hash-from-custom-template");
    expect(
      getAuthCallbackTokenHash(
        new URLSearchParams({
          token: "hash-from-confirmation-url-shape",
        }),
      ),
    ).toBe("hash-from-confirmation-url-shape");
  });

  it("treats older documented type=email callback links as magic links", () => {
    expect(
      getAuthCallbackOtpType(
        new URLSearchParams({
          type: "email",
        }),
      ),
    ).toBe("magiclink");
  });

  it("uses the current loopback origin for magic-link callbacks", () => {
    expect(
      getAuthRedirectOrigin("http://127.0.0.1:3000", "http://localhost:3000"),
    ).toBe("http://127.0.0.1:3000");
    expect(
      getAuthRedirectOrigin("http://localhost:3002", "http://localhost:3000"),
    ).toBe("http://localhost:3002");
  });

  it("falls back to the configured app origin for unsafe callback origins", () => {
    expect(
      getAuthRedirectOrigin(
        "https://attacker.test",
        "https://app.diginoces.test",
      ),
    ).toBe("https://app.diginoces.test");
    expect(getAuthRedirectOrigin("not a url", "http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(getAuthRedirectOrigin(null, "http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("derives callback next paths from safe redirect_to values", () => {
    expect(
      getAuthCallbackNextPath(
        new URLSearchParams({
          redirect_to:
            "http://localhost:3000/auth/callback?next=%2Fplatform%2Faudit-logs",
        }),
        ["http://localhost:3000"],
      ),
    ).toBe("/platform/audit-logs");
    expect(
      getAuthCallbackNextPath(
        new URLSearchParams({
          redirect_to: "http://127.0.0.1:3000/platform/projects?tab=active",
        }),
        ["http://localhost:3000", "http://127.0.0.1:3000"],
      ),
    ).toBe("/platform/projects?tab=active");
  });

  it("rejects unsafe callback redirect_to values", () => {
    expect(
      getAuthCallbackNextPath(
        new URLSearchParams({
          redirect_to:
            "https://attacker.test/auth/callback?next=%2Fplatform%2Faudit-logs",
        }),
        ["http://localhost:3000"],
      ),
    ).toBe("/platform");
    expect(
      getAuthCallbackNextPath(
        new URLSearchParams({
          redirect_to:
            "http://localhost:3000/auth/callback?next=%2Fplatform%2F..%2Fadmin",
        }),
        ["http://localhost:3000"],
      ),
    ).toBe("/platform");
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

  it("builds an implicit callback bridge without embedding auth tokens", () => {
    const html = buildImplicitAuthCallbackPage(
      "/platform/audit-logs?actor=diginoces",
    );

    expect(html).toContain("Completing sign-in");
    expect(html).toContain('"/platform/audit-logs?actor=diginoces"');
    expect(html).toContain("window.history.replaceState");
    expect(html).toContain('params.get("access_token")');
    expect(html).toContain('params.get("refresh_token")');
    expect(html).toContain('fetch("/auth/callback/implicit"');
    expect(html).not.toContain("example-access-token");
    expect(html).not.toContain("example-refresh-token");
  });

  it("defaults unsafe implicit callback next paths", () => {
    const html = buildImplicitAuthCallbackPage(
      "https://attacker.test/platform",
    );

    expect(html).toContain('"/platform"');
    expect(html).not.toContain("attacker.test");
  });

  it("parses implicit callback payloads with safe internal next paths", () => {
    expect(
      parseImplicitAuthCallbackPayload({
        accessToken: " access-token ",
        next: "/platform/projects?tab=active",
        refreshToken: " refresh-token ",
      }),
    ).toEqual({
      accessToken: "access-token",
      nextPath: "/platform/projects?tab=active",
      refreshToken: "refresh-token",
    });
  });

  it("rejects malformed implicit callback payloads", () => {
    expect(() => parseImplicitAuthCallbackPayload(null)).toThrow(
      "Authentication callback payload is invalid.",
    );
    expect(() =>
      parseImplicitAuthCallbackPayload({
        accessToken: "",
        refreshToken: "refresh-token",
      }),
    ).toThrow("Authentication callback payload is missing tokens.");
    expect(() =>
      parseImplicitAuthCallbackPayload({
        accessToken: "access-token",
        refreshToken: "x".repeat(8193),
      }),
    ).toThrow("Authentication callback payload is missing tokens.");
  });
});
