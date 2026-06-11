import { describe, expect, it } from "vitest";
import { applyResponseSecurityHeaders } from "@/proxy";

function expectBaselineHeaders(response: Response) {
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Content-Security-Policy")).toBe(
    "frame-ancestors 'none'",
  );
  expect(response.headers.get("X-Frame-Options")).toBe("DENY");
}

function expectPrivateGuestPageHeaders(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe(
    "private, no-store, max-age=0, must-revalidate",
  );
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
}

function expectNoPrivateGuestPageHeaders(response: Response) {
  expect(response.headers.get("Cache-Control")).toBeNull();
  expect(response.headers.get("X-Robots-Tag")).toBeNull();
}

describe("proxy security headers", () => {
  it("marks tokenized public guest pages as private no-store responses", () => {
    const response = new Response(null);

    applyResponseSecurityHeaders(response, "/g/public-token-value");

    expectBaselineHeaders(response);
    expectPrivateGuestPageHeaders(response);
  });

  it("matches public guest pages with query strings and trailing slashes", () => {
    for (const path of [
      "/g/public-token-value?foo=bar",
      "/g/public-token-value/",
    ]) {
      const response = new Response(null);

      applyResponseSecurityHeaders(response, path);

      expectBaselineHeaders(response);
      expectPrivateGuestPageHeaders(response);
    }
  });

  it("does not apply private guest page headers to invalid or nested guest paths", () => {
    for (const path of ["/g/", "/g//", "/g/public-token-value/extra"]) {
      const response = new Response(null);

      applyResponseSecurityHeaders(response, path);

      expectBaselineHeaders(response);
      expectNoPrivateGuestPageHeaders(response);
    }
  });

  it("adds baseline security headers to unrelated routes without private guest page headers", () => {
    const response = new Response(null);

    applyResponseSecurityHeaders(response, "/platform");

    expectBaselineHeaders(response);
    expectNoPrivateGuestPageHeaders(response);
  });
});
