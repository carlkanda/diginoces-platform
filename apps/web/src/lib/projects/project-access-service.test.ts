import { describe, expect, it, vi } from "vitest";
import {
  listGlobalRoleAssignmentsForAdmin,
  listProjectMembersForAdmin,
  parseAssignGlobalRolePayload,
  parseAssignMemberPayload,
  parseMemberStatusPayload,
} from "@/lib/projects/project-access-service";
import { ProjectValidationError } from "@/lib/projects/project-service";

describe("project access management service", () => {
  it("normalizes email-based membership assignment payloads", () => {
    expect(
      parseAssignMemberPayload({
        email: " Bride@Example.COM ",
        roleSlug: "bride",
        status: "active",
      }),
    ).toStrictEqual({
      email: "bride@example.com",
      roleSlug: "bride",
      status: "active",
    });
  });

  it("rejects unsupported membership statuses before server actions run", () => {
    expect(() =>
      parseMemberStatusPayload({
        status: "owner",
      }),
    ).toThrow(ProjectValidationError);
  });

  it("normalizes email-based global role assignment payloads", () => {
    expect(
      parseAssignGlobalRolePayload({
        email: " Admin@Example.COM ",
        roleSlug: "operations_manager",
      }),
    ).toStrictEqual({
      email: "admin@example.com",
      roleSlug: "operations_manager",
    });
  });

  it("rejects missing global role assignment fields", () => {
    expect(() =>
      parseAssignGlobalRolePayload({
        email: "admin@example.com",
      }),
    ).toThrow(ProjectValidationError);
  });

  it("fails closed when member listing RPC payloads are malformed", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            assigned_at: "2026-06-26T10:00:00.000Z",
            display_name: null,
            email: "member@example.com",
            member_id: 123,
            role_id: "role-id",
            role_name: "Planner",
            role_scope: "project",
            role_slug: "planner",
            status: "active",
            user_id: "user-id",
          },
        ],
        error: null,
      }),
    };

    await expect(
      listProjectMembersForAdmin(supabase as never, "project-id"),
    ).rejects.toThrow("Unexpected member listing RPC response: member_id.");
  });

  it("fails closed when member listing timestamps are not strict ISO values", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            assigned_at: "June 26, 2026",
            display_name: null,
            email: "member@example.com",
            member_id: "member-id",
            role_id: "role-id",
            role_name: "Planner",
            role_scope: "project",
            role_slug: "planner",
            status: "active",
            user_id: "user-id",
          },
        ],
        error: null,
      }),
    };

    await expect(
      listProjectMembersForAdmin(supabase as never, "project-id"),
    ).rejects.toThrow("Unexpected member listing RPC response: assigned_at.");
  });

  it("fails closed when global role assignment RPC rows are incomplete", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            assigned_at: "2026-06-26T10:00:00.000Z",
            assignment_id: "assignment-id",
            display_name: null,
            email: "admin@example.com",
            expires_at: null,
            requires_mfa: true,
            role_id: "role-id",
            role_name: "Role Manager",
            role_scope: "global",
            role_slug: "role_manager",
          },
        ],
        error: null,
      }),
    };

    await expect(
      listGlobalRoleAssignmentsForAdmin(supabase as never),
    ).rejects.toThrow(
      "Unexpected global role assignment listing RPC response: user_id.",
    );
  });

  it("fails closed when global role assignment RPC rows are not global scoped", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            assigned_at: "2026-06-26T10:00:00.000Z",
            assignment_id: "assignment-id",
            display_name: null,
            email: "admin@example.com",
            expires_at: null,
            requires_mfa: true,
            role_id: "role-id",
            role_name: "Planner",
            role_scope: "project",
            role_slug: "planner",
            user_id: "user-id",
          },
        ],
        error: null,
      }),
    };

    await expect(
      listGlobalRoleAssignmentsForAdmin(supabase as never),
    ).rejects.toThrow(
      "Unexpected global role assignment listing RPC response: role_scope.",
    );
  });

  it("fails closed when global role assignment timestamps overflow calendar dates", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            assigned_at: "2026-02-30T10:00:00.000Z",
            assignment_id: "assignment-id",
            display_name: null,
            email: "admin@example.com",
            expires_at: null,
            requires_mfa: true,
            role_id: "role-id",
            role_name: "Role Manager",
            role_scope: "global",
            role_slug: "role_manager",
            user_id: "user-id",
          },
        ],
        error: null,
      }),
    };

    await expect(
      listGlobalRoleAssignmentsForAdmin(supabase as never),
    ).rejects.toThrow(
      "Unexpected global role assignment listing RPC response: assigned_at.",
    );
  });
});
