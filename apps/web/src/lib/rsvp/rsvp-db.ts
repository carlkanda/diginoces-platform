import type { SupabaseClient } from "@supabase/supabase-js";
import type { RsvpResponseStatus } from "@/lib/rsvp/rsvp-service";
import type { Database } from "@/types/database";

type RpcClient = {
  rpc(
    fn:
      | "create_guest_public_token"
      | "get_project_rsvp_summary"
      | "preview_guest_public_page"
      | "resolve_guest_public_page"
      | "revoke_guest_public_token"
      | "submit_public_rsvp",
    args: Record<string, unknown>,
  ): Promise<{ data: unknown; error: Error | null }>;
};

export type PublicGuestPageRsvp = {
  deadlineState: "manual_review" | "open";
  id: string;
  lastChangedAt: string | null;
  manualReviewRequired: boolean;
  source: string;
  status: "locked" | "manual_review" | "maybe" | "no" | "pending" | "yes";
  submittedAt: string | null;
};

export type PublicGuestPageEvent = {
  assignmentId: string;
  eventDate: string | null;
  eventId: string;
  name: string;
  rsvp: PublicGuestPageRsvp | null;
  rsvpDeadlineAt: string | null;
  startsAt: string | null;
  venueAddress: string | null;
  venueName: string | null;
};

export type PublicGuestPagePayload =
  | {
      preferredLanguage: string | null;
      status: "locked";
    }
  | {
      status: "invalid";
    }
  | {
      events: PublicGuestPageEvent[];
      guest: {
        displayName: string;
        id: string;
        isPrintedOnly: boolean;
        preferredLanguage: string | null;
      };
      invitation: {
        downloadAvailable: boolean;
        placeholderOnly: boolean;
      };
      mode: "preview" | "public";
      project: {
        brideName: string;
        couplePhotoUrl: string | null;
        groomName: string;
        guestPageAccessStatus:
          | "exception_override"
          | "locked"
          | "payment_confirmed";
        id: string;
        preferredLanguage: string | null;
      };
      status: "ok";
      tokenId: string | null;
    };

export type CreateGuestPublicTokenResult = {
  expires_at: string | null;
  guest_id: string;
  project_id: string;
  token: string;
  token_id: string;
  token_preview: string;
};

export type SubmitPublicGuestRsvpResponse =
  | {
      status:
        | "invalid"
        | "invalid_response"
        | "locked_final_response"
        | "manual_printed_only"
        | "not_invited"
        | "payment_gate_locked";
    }
  | {
      deadlineState: "manual_review" | "open";
      manualReviewRequired: boolean;
      rsvpId: string;
      status: "saved";
    };

export type RevokeGuestPublicTokenResponse = null;

export type RsvpSummaryRow = {
  eventId: string;
  eventName: string;
  invitedCount: number;
  manualReviewCount: number;
  maybeCount: number;
  noCount: number;
  pendingCount: number;
  rsvpDeadlineAt: string | null;
  yesCount: number;
};

function rpcClient(supabase: SupabaseClient<Database>) {
  return supabase as unknown as RpcClient;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isPublicGuestPageRsvp(value: unknown): value is PublicGuestPageRsvp {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    ["manual_review", "open"].includes(String(value.deadlineState)) &&
    isNullableString(value.lastChangedAt) &&
    typeof value.manualReviewRequired === "boolean" &&
    typeof value.source === "string" &&
    ["locked", "manual_review", "maybe", "no", "pending", "yes"].includes(
      String(value.status),
    ) &&
    isNullableString(value.submittedAt)
  );
}

function isPublicGuestPageEvent(value: unknown): value is PublicGuestPageEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.assignmentId === "string" &&
    isNullableString(value.eventDate) &&
    typeof value.eventId === "string" &&
    typeof value.name === "string" &&
    (value.rsvp === null || isPublicGuestPageRsvp(value.rsvp)) &&
    isNullableString(value.rsvpDeadlineAt) &&
    isNullableString(value.startsAt) &&
    isNullableString(value.venueAddress) &&
    isNullableString(value.venueName)
  );
}

function isPublicGuestPagePayload(
  data: unknown,
): data is PublicGuestPagePayload {
  if (!isRecord(data)) {
    return false;
  }

  if (data.status === "invalid") {
    return true;
  }

  if (data.status === "locked") {
    return isNullableString(data.preferredLanguage);
  }

  if (data.status !== "ok") {
    return false;
  }

  const guest = data.guest;
  const invitation = data.invitation;
  const project = data.project;

  if (!isRecord(guest) || !isRecord(invitation) || !isRecord(project)) {
    return false;
  }

  return (
    Array.isArray(data.events) &&
    data.events.every(isPublicGuestPageEvent) &&
    typeof guest.displayName === "string" &&
    typeof guest.id === "string" &&
    typeof guest.isPrintedOnly === "boolean" &&
    isNullableString(guest.preferredLanguage) &&
    typeof invitation.downloadAvailable === "boolean" &&
    typeof invitation.placeholderOnly === "boolean" &&
    (data.mode === "preview" || data.mode === "public") &&
    typeof project.brideName === "string" &&
    isNullableString(project.couplePhotoUrl) &&
    typeof project.groomName === "string" &&
    ["exception_override", "locked", "payment_confirmed"].includes(
      String(project.guestPageAccessStatus),
    ) &&
    typeof project.id === "string" &&
    isNullableString(project.preferredLanguage) &&
    isNullableString(data.tokenId)
  );
}

function asPublicGuestPagePayload(data: unknown): PublicGuestPagePayload {
  if (!isPublicGuestPagePayload(data)) {
    throw new Error("Invalid public guest page payload returned by Supabase.");
  }

  return data;
}

export async function resolvePublicGuestPage(
  supabase: SupabaseClient<Database>,
  token: string,
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "resolve_guest_public_page",
    {
      p_token: token,
    },
  );

  if (error) {
    throw error;
  }

  return asPublicGuestPagePayload(data);
}

export async function previewPublicGuestPage(
  supabase: SupabaseClient<Database>,
  guestId: string,
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "preview_guest_public_page",
    {
      p_guest_id: guestId,
    },
  );

  if (error) {
    throw error;
  }

  return asPublicGuestPagePayload(data);
}

export async function submitPublicGuestRsvp(
  supabase: SupabaseClient<Database>,
  token: string,
  eventId: string,
  response: RsvpResponseStatus,
  preferredLanguage: string | null,
) {
  const { data, error } = await rpcClient(supabase).rpc("submit_public_rsvp", {
    p_event_id: eventId,
    p_preferred_language: preferredLanguage,
    p_response: response,
    p_token: token,
  });

  if (error) {
    throw error;
  }

  return data as SubmitPublicGuestRsvpResponse;
}

export async function createGuestPublicToken(
  supabase: SupabaseClient<Database>,
  guestId: string,
  expiresAt: string | null = null,
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "create_guest_public_token",
    {
      p_expires_at: expiresAt,
      p_guest_id: guestId,
    },
  );

  if (error) {
    throw error;
  }

  const rows = data as CreateGuestPublicTokenResult[];
  return rows[0] ?? null;
}

export async function revokeGuestPublicToken(
  supabase: SupabaseClient<Database>,
  tokenId: string,
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "revoke_guest_public_token",
    {
      p_token_id: tokenId,
    },
  );

  if (error) {
    throw error;
  }

  return data as RevokeGuestPublicTokenResponse;
}

export async function getProjectRsvpSummary(
  supabase: SupabaseClient<Database>,
  projectId: string,
) {
  const { data, error } = await rpcClient(supabase).rpc(
    "get_project_rsvp_summary",
    {
      p_project_id: projectId,
    },
  );

  if (error) {
    throw error;
  }

  return data as RsvpSummaryRow[];
}
