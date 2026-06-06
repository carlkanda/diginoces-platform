import { describe, expect, it } from "vitest";
import {
  getSupabaseStorageSigningKey,
  StorageNotConfiguredError,
} from "@/lib/storage/storage-provider";

describe("storage provider configuration", () => {
  it("uses a server-only Supabase secret key for private storage signing", () => {
    expect(
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "  sb_secret_short  ",
      }),
    ).toBe("sb_secret_short");
  });

  it("fails closed when no storage signing secret is configured", () => {
    expect(() =>
      getSupabaseStorageSigningKey({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_safe",
        SUPABASE_SECRET_KEY: "   ",
      }),
    ).toThrow(StorageNotConfiguredError);
  });
});
