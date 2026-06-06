import { describe, expect, it } from "vitest";
import { applyPublicGuestPageSecurityHeaders } from "@/proxy";

describe("proxy security headers", () => {
  it("marks tokenized public guest pages as private no-store responses", () => {
    const response = new Response(null);

    applyPublicGuestPageSecurityHeaders(response, "/g/public-token-value");

    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, max-age=0, must-revalidate",
    );
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("does not add public guest page headers to unrelated routes", () => {
    const response = new Response(null);

    applyPublicGuestPageSecurityHeaders(response, "/platform");

    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(response.headers.get("Referrer-Policy")).toBeNull();
    expect(response.headers.get("X-Content-Type-Options")).toBeNull();
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });
});
