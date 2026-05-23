import { describe, expect, it } from "vitest";
import {
  buildLoginRedirectPath,
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
});
