import { notFound } from "next/navigation";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getGuestPageLabels } from "@/lib/rsvp/rsvp-service";
import { PublicGuestPageView } from "@/lib/rsvp/public-guest-page-view";
import { resolvePublicGuestPage } from "@/lib/rsvp/rsvp-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  submitPublicGuestMessageAction,
  submitPublicRsvpAction,
} from "./actions";

export const dynamic = "force-dynamic";

type PublicGuestPageProps = {
  params: Promise<{
    guestToken: string;
  }>;
  searchParams: Promise<{
    message?: string;
    rsvp?: string;
  }>;
};

export default async function PublicGuestPage({
  params,
  searchParams,
}: PublicGuestPageProps) {
  const { guestToken } = await params;
  const { message, rsvp } = await searchParams;
  const env = getPublicEnvironment();

  if (!env.supabaseConfigured) {
    return (
      <section className="public-locked">
        <p className="eyebrow">Diginoces RSVP</p>
        <h1>Public RSVP is not configured locally</h1>
        <p>
          Supabase public environment variables are required before a guest
          token can be resolved.
        </p>
      </section>
    );
  }

  const payload = await resolvePublicGuestPage(
    await createSupabaseServerClient(),
    guestToken,
  );

  if (payload.status === "invalid") {
    notFound();
  }

  if (payload.status === "locked") {
    const labels = getGuestPageLabels(payload.preferredLanguage);

    return (
      <section className="public-locked">
        <p className="eyebrow">Diginoces RSVP</p>
        <h1>{labels.lockedTitle}</h1>
        <p>{labels.lockedBody}</p>
      </section>
    );
  }

  return (
    <PublicGuestPageView
      formActionFactory={(eventId) =>
        submitPublicRsvpAction.bind(null, guestToken, eventId)
      }
      messageFormAction={submitPublicGuestMessageAction.bind(null, guestToken)}
      messageResult={message}
      payload={payload}
      result={rsvp}
    />
  );
}
