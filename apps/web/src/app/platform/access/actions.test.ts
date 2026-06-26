import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectValidationError } from "@/lib/projects/project-service";

const mocks = vi.hoisted(() => {
  const redirect = vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });

  return {
    assignGlobalRoleByEmail: vi.fn(),
    getAuthContext: vi.fn(),
    parseAssignGlobalRolePayload: vi.fn(),
    redirect,
    requireGlobalPermission: vi.fn(),
    revokeGlobalRoleAssignment: vi.fn(),
    serverLoggerError: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/auth-service", () => ({
  buildLoginRedirectPath: (next: string) =>
    `/login?next=${encodeURIComponent(next)}`,
  getAuthContext: mocks.getAuthContext,
}));

vi.mock("@/lib/logging", () => ({
  serverLogger: {
    error: mocks.serverLoggerError,
  },
}));

vi.mock("@/lib/projects/project-access-service", () => ({
  assignGlobalRoleByEmail: mocks.assignGlobalRoleByEmail,
  parseAssignGlobalRolePayload: mocks.parseAssignGlobalRolePayload,
  revokeGlobalRoleAssignment: mocks.revokeGlobalRoleAssignment,
}));

vi.mock("@/lib/projects/project-api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/projects/project-api")>();

  return {
    ...actual,
    requireGlobalPermission: mocks.requireGlobalPermission,
  };
});

function formData(values: Record<string, string>) {
  const form = new FormData();

  Object.entries(values).forEach(([key, value]) => form.set(key, value));

  return form;
}

describe("access role-management actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthContext.mockResolvedValue({
      status: "authenticated",
      supabase: { from: vi.fn() },
      user: { id: "user_123" },
    });
    mocks.parseAssignGlobalRolePayload.mockReturnValue({
      email: "admin@example.com",
      roleSlug: "operations_manager",
    });
    mocks.requireGlobalPermission.mockResolvedValue(undefined);
    mocks.assignGlobalRoleByEmail.mockResolvedValue(undefined);
    mocks.revokeGlobalRoleAssignment.mockResolvedValue(undefined);
  });

  it("redirects to the assignment section after a successful global role assignment", async () => {
    const { assignGlobalRoleAction } =
      await import("@/app/platform/access/actions");

    await expect(
      assignGlobalRoleAction(
        formData({
          email: "admin@example.com",
          roleSlug: "operations_manager",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessStatus=global_role_assigned#assign-global-role",
    );

    expect(mocks.requireGlobalPermission).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: "user_123" } }),
      "roles.manage",
    );
    expect(mocks.assignGlobalRoleByEmail).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      {
        email: "admin@example.com",
        roleSlug: "operations_manager",
      },
    );
    expect(mocks.serverLoggerError).not.toHaveBeenCalled();
  });

  it("redirects invalid assignment payloads with an access error and logs the failure", async () => {
    const { assignGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    mocks.parseAssignGlobalRolePayload.mockImplementation(() => {
      throw new ProjectValidationError("Missing role.");
    });

    await expect(
      assignGlobalRoleAction(formData({ email: "admin@example.com" })),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessError=invalid_access_request#assign-global-role",
    );

    expect(mocks.assignGlobalRoleByEmail).not.toHaveBeenCalled();
    expect(mocks.serverLoggerError).toHaveBeenCalledWith(
      "Global role assignment action failed.",
      expect.objectContaining({
        action: "assign_global_role",
        errorCode: "invalid_access_request",
        userId: "user_123",
      }),
    );
  });

  it("redirects unexpected assignment failures with a generic access error and logs the failure", async () => {
    const { assignGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    mocks.assignGlobalRoleByEmail.mockRejectedValue(
      new Error("Database unavailable."),
    );

    await expect(
      assignGlobalRoleAction(
        formData({
          email: "admin@example.com",
          roleSlug: "operations_manager",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessError=access_action_failed#assign-global-role",
    );

    expect(mocks.serverLoggerError).toHaveBeenCalledWith(
      "Global role assignment action failed.",
      expect.objectContaining({
        action: "assign_global_role",
        errorCode: "access_action_failed",
        userId: "user_123",
      }),
    );
  });

  it("redirects permission failures without running the assignment mutation", async () => {
    const { assignGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    const { ProjectAccessError } = await import("@/lib/projects/project-api");
    mocks.requireGlobalPermission.mockRejectedValue(
      new ProjectAccessError("No access.", 403),
    );

    await expect(
      assignGlobalRoleAction(
        formData({
          email: "admin@example.com",
          roleSlug: "operations_manager",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessError=permission_denied#assign-global-role",
    );

    expect(mocks.parseAssignGlobalRolePayload).not.toHaveBeenCalled();
    expect(mocks.assignGlobalRoleByEmail).not.toHaveBeenCalled();
  });

  it("short-circuits assignment when the user is anonymous", async () => {
    const { assignGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    mocks.getAuthContext.mockResolvedValue({ status: "anonymous" });

    await expect(
      assignGlobalRoleAction(
        formData({
          email: "admin@example.com",
          roleSlug: "operations_manager",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fplatform%2Faccess");

    expect(mocks.requireGlobalPermission).not.toHaveBeenCalled();
    expect(mocks.parseAssignGlobalRolePayload).not.toHaveBeenCalled();
    expect(mocks.assignGlobalRoleByEmail).not.toHaveBeenCalled();
  });

  it("short-circuits assignment when the workspace is not configured", async () => {
    const { assignGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    mocks.getAuthContext.mockResolvedValue({ status: "not_configured" });

    await expect(
      assignGlobalRoleAction(
        formData({
          email: "admin@example.com",
          roleSlug: "operations_manager",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessError=supabase_not_configured",
    );

    expect(mocks.requireGlobalPermission).not.toHaveBeenCalled();
    expect(mocks.parseAssignGlobalRolePayload).not.toHaveBeenCalled();
    expect(mocks.assignGlobalRoleByEmail).not.toHaveBeenCalled();
  });

  it("redirects to the assignments table after a successful global role revoke", async () => {
    const { revokeGlobalRoleAction } =
      await import("@/app/platform/access/actions");

    await expect(revokeGlobalRoleAction("assignment_123")).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessStatus=global_role_revoked#global-role-assignments",
    );

    expect(mocks.requireGlobalPermission).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: "user_123" } }),
      "roles.manage",
    );
    expect(mocks.revokeGlobalRoleAssignment).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      "assignment_123",
    );
    expect(mocks.serverLoggerError).not.toHaveBeenCalled();
  });

  it("redirects revoke permission failures with an access error and logs the failure", async () => {
    const { revokeGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    const { ProjectAccessError } = await import("@/lib/projects/project-api");
    mocks.requireGlobalPermission.mockRejectedValue(
      new ProjectAccessError("No access.", 403),
    );

    await expect(revokeGlobalRoleAction("assignment_123")).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessError=permission_denied#global-role-assignments",
    );

    expect(mocks.revokeGlobalRoleAssignment).not.toHaveBeenCalled();
    expect(mocks.serverLoggerError).toHaveBeenCalledWith(
      "Global role revoke action failed.",
      expect.objectContaining({
        action: "revoke_global_role",
        assignmentId: "assignment_123",
        errorCode: "permission_denied",
        userId: "user_123",
      }),
    );
  });

  it("short-circuits revoke when the user is anonymous", async () => {
    const { revokeGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    mocks.getAuthContext.mockResolvedValue({ status: "anonymous" });

    await expect(revokeGlobalRoleAction("assignment_123")).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fplatform%2Faccess",
    );

    expect(mocks.requireGlobalPermission).not.toHaveBeenCalled();
    expect(mocks.revokeGlobalRoleAssignment).not.toHaveBeenCalled();
  });

  it("short-circuits revoke when the workspace is not configured", async () => {
    const { revokeGlobalRoleAction } =
      await import("@/app/platform/access/actions");
    mocks.getAuthContext.mockResolvedValue({ status: "not_configured" });

    await expect(revokeGlobalRoleAction("assignment_123")).rejects.toThrow(
      "NEXT_REDIRECT:/platform/access?accessError=supabase_not_configured",
    );

    expect(mocks.requireGlobalPermission).not.toHaveBeenCalled();
    expect(mocks.revokeGlobalRoleAssignment).not.toHaveBeenCalled();
  });
});
