import { describe, expect, it } from "vitest";
import {
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
});
