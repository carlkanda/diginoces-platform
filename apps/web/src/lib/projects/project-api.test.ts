import { describe, expect, it } from "vitest";
import {
  hasEventPermission,
  hasGlobalPermission,
  hasProjectPermission,
  hasProjectPermissions,
  jsonError,
  methodNotAllowed,
  ProjectAccessError,
  redactEventDetailsForApi,
  redactProjectDetailsForApi,
  redactProjectForApi,
  requireGlobalPermission,
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
  // GH #58; QA-027/QA-028 - internal API field redaction coverage.
  it("redacts internal project, event, and workflow fields from API payloads", () => {
    const project = {
      bride_name: "QA Demo Bride",
      created_by: "actor-1",
      groom_name: "QA Demo Groom",
      guest_list_access_unlocked_by: "actor-2",
      guest_page_access_unlocked_by: "actor-3",
      guest_page_payment_exception_reason: "internal exception note",
      id: "project-1",
      internal_notes: "internal project note",
      latest_contract_id: "contract-1",
      project_code: "QA-001",
      status: "active",
      updated_by: "actor-4",
    } as never;
    const event = {
      created_by: "actor-1",
      event_code: "QA-001-CIV",
      id: "event-1",
      name: "Civil",
      project_id: "project-1",
      updated_by: "actor-2",
    } as never;
    const workflowTask = {
      created_by: "actor-1",
      id: "task-1",
      project_id: "project-1",
      title: "Confirm foundation",
      updated_by: "actor-2",
    } as never;

    const apiProject = redactProjectForApi(project);
    const projectDetails = redactProjectDetailsForApi({
      events: [event],
      project,
      workflowTasks: [workflowTask],
    });
    const eventDetails = redactEventDetailsForApi({
      event,
      project,
      workflowTasks: [workflowTask],
    });

    expect(apiProject).toMatchObject({
      bride_name: "QA Demo Bride",
      groom_name: "QA Demo Groom",
      project_code: "QA-001",
    });
    expect(apiProject).not.toHaveProperty("internal_notes");
    expect(apiProject).not.toHaveProperty("created_by");
    expect(apiProject).not.toHaveProperty("updated_by");
    expect(apiProject).not.toHaveProperty("guest_list_access_unlocked_by");
    expect(apiProject).not.toHaveProperty("guest_page_access_unlocked_by");
    expect(apiProject).not.toHaveProperty("latest_contract_id");
    expect(apiProject).not.toHaveProperty(
      "guest_page_payment_exception_reason",
    );
    expect(projectDetails.project).toHaveProperty("id", "project-1");
    expect(projectDetails.project).toHaveProperty("project_code", "QA-001");
    expect(projectDetails.project).not.toHaveProperty("internal_notes");
    expect(projectDetails.project).not.toHaveProperty("created_by");
    expect(projectDetails.project).not.toHaveProperty("updated_by");
    expect(projectDetails.project).not.toHaveProperty(
      "guest_list_access_unlocked_by",
    );
    expect(projectDetails.project).not.toHaveProperty(
      "guest_page_access_unlocked_by",
    );
    expect(projectDetails.events[0]).toHaveProperty("event_code", "QA-001-CIV");
    expect(projectDetails.events[0]).toHaveProperty("name", "Civil");
    expect(projectDetails.events[0]).not.toHaveProperty("created_by");
    expect(projectDetails.events[0]).not.toHaveProperty("updated_by");
    expect(projectDetails.workflowTasks[0]).toHaveProperty(
      "title",
      "Confirm foundation",
    );
    expect(projectDetails.workflowTasks[0]).not.toHaveProperty("created_by");
    expect(projectDetails.workflowTasks[0]).not.toHaveProperty("updated_by");
    expect(eventDetails.event).toHaveProperty("id", "event-1");
    expect(eventDetails.event).toHaveProperty("name", "Civil");
    expect(eventDetails.event).not.toHaveProperty("created_by");
    expect(eventDetails.event).not.toHaveProperty("updated_by");
    expect(eventDetails.project).toHaveProperty("id", "project-1");
    expect(eventDetails.project).toHaveProperty("project_code", "QA-001");
    expect(eventDetails.project).not.toHaveProperty("internal_notes");
    expect(eventDetails.project).not.toHaveProperty("created_by");
    expect(eventDetails.project).not.toHaveProperty("updated_by");
  });

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

  it("checks global permissions through the shared permission RPC", async () => {
    const calls: { args?: Record<string, unknown>; fn: string }[] = [];
    const context = createProjectApiContext(async (fn, args) => {
      calls.push({ args, fn });

      return {
        data: args?.p_permission === "projects.create",
        error: null,
      };
    });

    await expect(hasGlobalPermission(context, "projects.create")).resolves.toBe(
      true,
    );
    await expect(
      requireGlobalPermission(context, "projects.read"),
    ).rejects.toMatchObject({
      name: "ProjectAccessError",
      status: 403,
    } satisfies Partial<ProjectAccessError>);
    expect(calls).toEqual([
      {
        args: {
          p_permission: "projects.create",
          p_scope: "global",
        },
        fn: "current_user_has_permission",
      },
      {
        args: {
          p_permission: "projects.read",
          p_scope: "global",
        },
        fn: "current_user_has_permission",
      },
    ]);
  });
});
