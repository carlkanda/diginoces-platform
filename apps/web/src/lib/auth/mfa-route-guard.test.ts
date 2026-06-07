import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";

const { buildMfaStepUpRedirectPathForClientMock, redirectMock } = vi.hoisted(
  () => {
    return {
      buildMfaStepUpRedirectPathForClientMock: vi.fn(),
      redirectMock: vi.fn((path: string) => {
        throw new Error(`redirect:${path}`);
      }),
    };
  },
);

vi.mock("@/lib/auth/auth-service", () => ({
  buildMfaStepUpRedirectPathForClient: buildMfaStepUpRedirectPathForClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

function createSupabaseMock({
  assignmentError,
  assignments,
  grantError,
  grants,
}: {
  assignmentError?: Error;
  assignments: Array<{
    expires_at?: string | null;
    role_id: string;
    scope: string;
    scope_id: string | null;
  }>;
  grantError?: Error;
  grants: Array<{
    permission_slug?: string;
    role_id: string;
  }>;
}) {
  return {
    from(table: string) {
      if (table === "role_assignments") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          or() {
            if (assignmentError) {
              return Promise.resolve({
                data: null,
                error: assignmentError,
              });
            }

            const now = Date.now();

            return Promise.resolve({
              data: assignments.filter(
                (assignment) =>
                  !assignment.expires_at ||
                  Date.parse(assignment.expires_at) > now,
              ),
              error: null,
            });
          },
        };
      }

      if (table === "role_permissions") {
        let permissionSlug: string | undefined;
        let roleIds: string[] = [];

        return {
          select() {
            return this;
          },
          eq(column: string, value: string) {
            if (column === "permission_slug") {
              permissionSlug = value;
            }

            return this;
          },
          in(column: string, value: string[]) {
            if (column === "role_id") {
              roleIds = value;
            }

            return this;
          },
          limit() {
            if (grantError) {
              return Promise.resolve({
                data: null,
                error: grantError,
              });
            }

            return Promise.resolve({
              data: grants.filter(
                (grant) =>
                  roleIds.includes(grant.role_id) &&
                  grant.permission_slug === permissionSlug,
              ),
              error: null,
            });
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe("redirectToMfaIfStepUpRequired", () => {
  let consoleErrorMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    buildMfaStepUpRedirectPathForClientMock.mockReset();
    redirectMock.mockClear();
    consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it("redirects to MFA when an active matching permission can be unlocked by AAL2", async () => {
    buildMfaStepUpRedirectPathForClientMock.mockResolvedValue(
      "/login/mfa?next=%2Fplatform%2Fdashboard",
    );

    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                role_id: "role-admin",
                scope: "global",
                scope_id: null,
              },
            ],
            grants: [
              {
                permission_slug: "dashboards.global.read",
                role_id: "role-admin",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/dashboard",
        {
          permission: "dashboards.global.read",
          scope: "global",
        },
      ),
    ).rejects.toThrow("redirect:/login/mfa?next=%2Fplatform%2Fdashboard");

    expect(buildMfaStepUpRedirectPathForClientMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith(
      "/login/mfa?next=%2Fplatform%2Fdashboard",
    );
  });

  it("does not redirect unrelated AAL1 users who lack the requested permission", async () => {
    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                expires_at: null,
                role_id: "role-other-project",
                scope: "project",
                scope_id: "project-b",
              },
            ],
            grants: [
              {
                permission_slug: "files.read",
                role_id: "role-other-project",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/projects/project-a/files",
        {
          permission: "files.read",
          scope: "project",
          scopeId: "project-a",
        },
      ),
    ).resolves.toBeUndefined();

    expect(buildMfaStepUpRedirectPathForClientMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("ignores expired role assignments before deciding whether MFA can unlock access", async () => {
    const expiredAt = new Date(Date.now() - 60_000).toISOString();

    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                expires_at: expiredAt,
                role_id: "role-expired",
                scope: "global",
                scope_id: null,
              },
            ],
            grants: [
              {
                permission_slug: "audit.read",
                role_id: "role-expired",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/audit-logs",
        {
          permission: "audit.read",
          scope: "global",
        },
      ),
    ).resolves.toBeUndefined();

    expect(buildMfaStepUpRedirectPathForClientMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects when any one of multiple capability checks matches", async () => {
    buildMfaStepUpRedirectPathForClientMock.mockResolvedValue(
      "/login/mfa?next=%2Fplatform%2Fprojects%2Fproject-a%2Ffiles",
    );

    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                role_id: "role-files",
                scope: "project",
                scope_id: "project-a",
              },
            ],
            grants: [
              {
                permission_slug: "files.download",
                role_id: "role-files",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/projects/project-a/files",
        [
          {
            permission: "files.read",
            scope: "project",
            scopeId: "project-a",
          },
          {
            permission: "files.download",
            scope: "project",
            scopeId: "project-a",
          },
        ],
      ),
    ).rejects.toThrow(
      "redirect:/login/mfa?next=%2Fplatform%2Fprojects%2Fproject-a%2Ffiles",
    );

    expect(buildMfaStepUpRedirectPathForClientMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith(
      "/login/mfa?next=%2Fplatform%2Fprojects%2Fproject-a%2Ffiles",
    );
  });

  it("does not redirect when none of multiple capability checks matches", async () => {
    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                role_id: "role-files",
                scope: "project",
                scope_id: "project-a",
              },
            ],
            grants: [
              {
                permission_slug: "files.archive",
                role_id: "role-files",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/projects/project-a/files",
        [
          {
            permission: "files.read",
            scope: "project",
            scopeId: "project-a",
          },
          {
            permission: "files.download",
            scope: "project",
            scopeId: "project-a",
          },
        ],
      ),
    ).resolves.toBeUndefined();

    expect(buildMfaStepUpRedirectPathForClientMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed when assignment or grant lookup fails", async () => {
    const assignmentError = new Error("assignment lookup failed");
    const grantError = new Error("grant lookup failed");

    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignmentError,
            assignments: [],
            grants: [],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/dashboard",
        {
          permission: "dashboards.global.read",
          scope: "global",
        },
      ),
    ).resolves.toBeUndefined();

    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                role_id: "role-admin",
                scope: "global",
                scope_id: null,
              },
            ],
            grantError,
            grants: [],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/dashboard",
        {
          permission: "dashboards.global.read",
          scope: "global",
        },
      ),
    ).resolves.toBeUndefined();

    expect(buildMfaStepUpRedirectPathForClientMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(consoleErrorMock).toHaveBeenCalledTimes(2);
  });

  it("redirects when multiple grants are returned and at least one matches", async () => {
    buildMfaStepUpRedirectPathForClientMock.mockResolvedValue(
      "/login/mfa?next=%2Fplatform%2Fpartners%2Freview",
    );

    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                role_id: "role-partner-review",
                scope: "global",
                scope_id: null,
              },
            ],
            grants: [
              {
                permission_slug: "partners.read",
                role_id: "role-partner-review",
              },
              {
                permission_slug: "partner_projects.review",
                role_id: "role-partner-review",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/partners/review",
        {
          permission: "partner_projects.review",
          scope: "global",
        },
      ),
    ).rejects.toThrow(
      "redirect:/login/mfa?next=%2Fplatform%2Fpartners%2Freview",
    );

    expect(buildMfaStepUpRedirectPathForClientMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith(
      "/login/mfa?next=%2Fplatform%2Fpartners%2Freview",
    );
  });

  it("does not redirect when a matching permission exists but MFA step-up is unavailable", async () => {
    buildMfaStepUpRedirectPathForClientMock.mockResolvedValue(null);

    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                role_id: "role-admin",
                scope: "global",
                scope_id: null,
              },
            ],
            grants: [
              {
                permission_slug: "dashboards.global.read",
                role_id: "role-admin",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/dashboard",
        {
          permission: "dashboards.global.read",
          scope: "global",
        },
      ),
    ).resolves.toBeUndefined();

    expect(buildMfaStepUpRedirectPathForClientMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("does not redirect when the capability list is empty", async () => {
    await expect(
      redirectToMfaIfStepUpRequired(
        {
          supabase: createSupabaseMock({
            assignments: [
              {
                role_id: "role-admin",
                scope: "global",
                scope_id: null,
              },
            ],
            grants: [
              {
                permission_slug: "dashboards.global.read",
                role_id: "role-admin",
              },
            ],
          }) as never,
          user: { id: "user-1" },
        },
        "/platform/dashboard",
        [],
      ),
    ).resolves.toBeUndefined();

    expect(buildMfaStepUpRedirectPathForClientMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed on malformed scoped capabilities", async () => {
    for (const capability of [
      {
        permission: "files.read" as const,
        scope: "project" as const,
        scopeId: "",
      },
      {
        permission: "files.read" as const,
        scope: "project" as const,
      },
    ]) {
      await expect(
        redirectToMfaIfStepUpRequired(
          {
            supabase: createSupabaseMock({
              assignments: [
                {
                  role_id: "role-files",
                  scope: "project",
                  scope_id: "project-a",
                },
              ],
              grants: [
                {
                  permission_slug: "files.read",
                  role_id: "role-files",
                },
              ],
            }) as never,
            user: { id: "user-1" },
          },
          "/platform/projects/project-a/files",
          capability,
        ),
      ).resolves.toBeUndefined();
    }

    expect(buildMfaStepUpRedirectPathForClientMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(consoleErrorMock).toHaveBeenCalledTimes(2);
  });
});
