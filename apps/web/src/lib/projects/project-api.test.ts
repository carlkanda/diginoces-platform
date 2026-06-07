import { describe, expect, it } from "vitest";
import {
  hasEventPermission,
  hasProjectPermission,
  hasProjectPermissions,
  jsonError,
  methodNotAllowed,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import type { ProjectApiContext } from "@/lib/projects/project-api";

type TestRpc = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{
  data: unknown;
  error: Error | null;
}>;

function createProjectApiContext(rpc: TestRpc): ProjectApiContext {
  return {
    supabase: {
      rpc,
    } as unknown as ProjectApiContext["supabase"],
    user: { id: "user-1" } as ProjectApiContext["user"],
  };
}

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

  it("marks method-not-allowed responses as non-cacheable and declares allowed methods", async () => {
    const response = methodNotAllowed(["POST", "PATCH"]);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "method_not_allowed",
        message: "Method is not allowed.",
      },
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST, PATCH");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("marks single-method method-not-allowed responses with the exact allowed method", async () => {
    const response = methodNotAllowed("POST");

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "method_not_allowed",
        message: "Method is not allowed.",
      },
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("fails closed before project permission RPCs receive malformed UUIDs", async () => {
    let rpcCalls = 0;
    const context = createProjectApiContext(async () => {
      rpcCalls += 1;

      return { data: true, error: null };
    });

    await expect(
      hasProjectPermission(context, "new", "projects.read"),
    ).resolves.toBe(false);
    await expect(
      hasProjectPermissions(context, "new", ["projects.read", "guests.read"]),
    ).resolves.toEqual(
      new Map([
        ["projects.read", false],
        ["guests.read", false],
      ]),
    );
    await expect(
      requireProjectPermission(context, "new", "projects.read"),
    ).rejects.toMatchObject({
      name: "ProjectAccessError",
      status: 403,
    } satisfies Partial<ProjectAccessError>);
    expect(rpcCalls).toBe(0);
  });

  it("fails closed before event permission RPCs receive malformed UUIDs", async () => {
    let rpcCalls = 0;
    const context = createProjectApiContext(async () => {
      rpcCalls += 1;

      return { data: true, error: null };
    });

    await expect(
      hasEventPermission(context, "scan", "events.read"),
    ).resolves.toBe(false);
    expect(rpcCalls).toBe(0);
  });
});
