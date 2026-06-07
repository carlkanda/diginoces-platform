import { describe, expect, it } from "vitest";
import {
  hasEventPermission,
  hasProjectPermission,
  hasProjectPermissions,
  jsonError,
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
