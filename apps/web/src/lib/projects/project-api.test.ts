import { describe, expect, it } from "vitest";
import { jsonError } from "@/lib/projects/project-api";

describe("project API responses", () => {
  it("marks API error responses as non-cacheable", async () => {
    const response = jsonError(
      401,
      "unauthenticated",
      "Authentication is required.",
    );

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthenticated",
        message: "Authentication is required.",
      },
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
