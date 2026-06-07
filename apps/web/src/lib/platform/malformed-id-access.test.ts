import { describe, expect, it } from "vitest";
import {
  getCommercialActionCapabilities,
  hasAnyCommercialReadPermission,
  requireAnyCommercialReadPermission,
} from "@/lib/contracts/contract-api";
import {
  getGuestImportActionCapabilities,
  requireGuestImportReadPermission,
} from "@/lib/guest-imports/guest-import-api";
import { requireAnyGuestCreatePermission } from "@/lib/guests/guest-api";
import { getGuestDetails } from "@/lib/guests/guest-service";
import {
  hasPartnerPermission,
  requirePartnerPermission,
} from "@/lib/partners/partner-api";
import type { ProjectApiContext } from "@/lib/projects/project-api";
import { isUuid } from "@/lib/validation/uuid";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type RpcCall = {
  args?: Record<string, unknown>;
  fn: string;
};

function createContext() {
  const calls: RpcCall[] = [];
  const context = {
    supabase: {
      rpc: async (fn: string, args?: Record<string, unknown>) => {
        calls.push({ args, fn });

        return { data: false, error: null };
      },
    } as unknown as ProjectApiContext["supabase"],
    user: { id: "user-1" } as ProjectApiContext["user"],
  };

  return { calls, context };
}

describe("malformed dynamic route access guards", () => {
  it("rejects non-string UUID inputs without coercion", () => {
    expect(isUuid(null)).toBe(false);
    expect(isUuid(123)).toBe(false);
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("fails closed for malformed guest project ids before guest permission RPCs", async () => {
    const { calls, context } = createContext();

    await expect(
      requireAnyGuestCreatePermission(context, "not-a-uuid"),
    ).rejects.toMatchObject({ name: "ProjectAccessError", status: 403 });
    expect(calls).toEqual([]);
  });

  it("fails closed for malformed guest import project ids before import permission RPCs", async () => {
    const { calls, context } = createContext();

    await expect(
      requireGuestImportReadPermission(context, "not-a-uuid"),
    ).rejects.toMatchObject({ name: "ProjectAccessError", status: 403 });
    await expect(
      getGuestImportActionCapabilities(context, "not-a-uuid", "bride"),
    ).resolves.toEqual({
      canApply: false,
      canEditMapping: false,
      canRead: false,
      canReview: false,
      canSubmit: false,
    });
    expect(calls).toEqual([]);
  });

  it("fails closed for malformed commercial project ids before project-scoped commercial RPCs", async () => {
    const { calls, context } = createContext();

    await expect(
      hasAnyCommercialReadPermission(context, "not-a-uuid"),
    ).resolves.toBe(false);
    await expect(
      requireAnyCommercialReadPermission(context, "not-a-uuid"),
    ).rejects.toMatchObject({ name: "ProjectAccessError", status: 403 });
    await expect(
      getCommercialActionCapabilities(context, "not-a-uuid"),
    ).resolves.toEqual({
      canApproveContracts: false,
      canCalculatePricing: false,
      canConfirmPayments: false,
      canGenerateContracts: false,
      canManageAddendums: false,
      canManageExceptions: false,
      canManageGestures: false,
      canManagePackages: false,
      canManagePricing: false,
      canReadContracts: false,
      canReadPackages: false,
      canReadPayments: false,
      canReadPaymentSummary: false,
      canReadPricing: false,
      canReadRevenue: false,
      canRecordPayments: false,
    });
    expect(calls).toEqual([]);
  });

  it("fails closed for malformed partner ids before partner permission RPCs", async () => {
    const { calls, context } = createContext();

    await expect(
      hasPartnerPermission(context, "not-a-uuid", "partners.read"),
    ).resolves.toBe(false);
    await expect(
      requirePartnerPermission(context, "not-a-uuid", "partners.read"),
    ).rejects.toMatchObject({ name: "ProjectAccessError", status: 403 });
    expect(calls).toEqual([]);
  });

  it("returns no guest details for malformed guest ids before guest table queries", async () => {
    let fromCalls = 0;
    const supabase = {
      from: () => {
        fromCalls += 1;
        throw new Error("guest table should not be queried");
      },
    };

    await expect(
      getGuestDetails(
        supabase as unknown as SupabaseClient<Database>,
        "not-a-uuid",
      ),
    ).resolves.toBe(null);
    expect(fromCalls).toBe(0);
  });
});
