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

  it("allows current Supabase secret keys for backend storage signing", () => {
    expect(
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "  sb_secret_backend_only  ",
      }),
    ).toBe("sb_secret_backend_only");
  });

  it("rejects unrecognized opaque storage signing secrets", () => {
    expect(() =>
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "opaque_backend_key",
      }),
    ).toThrow(
      "requires a Supabase secret key or JWT storage signing credential",
    );
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
