import type { SupabaseClient } from "@supabase/supabase-js";
import type { RsvpResponseStatus } from "@/lib/rsvp/rsvp-service";
import type { Database, Json } from "@/types/database";

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

function asPublicGuestPagePayload(data: unknown): PublicGuestPagePayload {
  return data as PublicGuestPagePayload;
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

  return data as Json;
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
