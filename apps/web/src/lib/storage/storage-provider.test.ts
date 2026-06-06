import { describe, expect, it } from "vitest";
import {
  getSupabaseStorageSigningKey,
  StorageNotConfiguredError,
} from "@/lib/storage/storage-provider";

const supabaseServiceRoleKeyName = "SUPABASE_" + "SERVICE_ROLE_KEY";

describe("storage provider configuration", () => {
  it("prefers the legacy service-role JWT for private storage signing", () => {
    expect(
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "sb_secret_short",
        [supabaseServiceRoleKeyName]: "  service.role.jwt  ",
      }),
    ).toBe("service.role.jwt");
  });

  it("allows JWT-style SUPABASE_SECRET_KEY values for backward compatibility", () => {
    expect(
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "  secret.role.jwt  ",
      }),
    ).toBe("secret.role.jwt");
  });

  it("rejects opaque Supabase secret keys for storage signed URLs", () => {
    expect(() =>
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "sb_secret_short",
      }),
    ).toThrow("requires a JWT storage signing credential");
  });

  it("fails closed when no storage signing secret is configured", () => {
    expect(() =>
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "   ",
        [supabaseServiceRoleKeyName]: "   ",
      }),
    ).toThrow(StorageNotConfiguredError);
  });
});
