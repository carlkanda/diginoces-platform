import { notFound } from "next/navigation";
import { CalendarHeartIcon, ShieldAlertIcon } from "lucide-react";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { listGuestFileDownloads } from "@/lib/files/file-db";
import { serverLogger } from "@/lib/logging";
import { getGuestPageLabels } from "@/lib/rsvp/rsvp-service";
import { PublicGuestPageView } from "@/lib/rsvp/public-guest-page-view";
import { resolvePublicGuestPage } from "@/lib/rsvp/rsvp-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  submitPublicGuestMessageAction,
  submitPublicRsvpAction,
} from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <PublicGuestUnavailable
        body="Please use the invitation link in the environment shared by Diginoces."
        title="This guest page is not available here"
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const payload = await resolvePublicGuestPage(supabase, guestToken);

  if (payload.status === "invalid") {
    notFound();
  }

  if (payload.status === "locked") {
    const labels = getGuestPageLabels(payload.preferredLanguage);

    return (
      <PublicGuestUnavailable
        body={labels.lockedBody}
        title={labels.lockedTitle}
      />
    );
  }

  let downloadableFiles: Awaited<ReturnType<typeof listGuestFileDownloads>> =
    [];

  try {
    downloadableFiles = await listGuestFileDownloads(supabase, guestToken);
  } catch (error) {
    serverLogger.error("Guest file list failed on public page.", {
      error,
    });
  }

  return (
    <PublicGuestPageView
      formActionFactory={(eventId) =>
        submitPublicRsvpAction.bind(null, guestToken, eventId)
      }
      messageFormAction={submitPublicGuestMessageAction.bind(null, guestToken)}
      messageResult={message}
      payload={payload}
      downloadableFiles={downloadableFiles}
      result={rsvp}
      guestToken={guestToken}
    />
  );
}

function PublicGuestUnavailable({
  body,
  title,
}: {
  body: string;
  title: string;
}) {
  return (
    <section className="public-route min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-3xl place-items-center">
        <Card className="w-full">
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Diginoces RSVP</Badge>
              <Badge variant="outline">Personal invitation</Badge>
            </div>
            <CardTitle>
              <h1 className="flex items-center gap-2 text-3xl leading-tight tracking-normal text-balance">
                <CalendarHeartIcon aria-hidden="true" />
                {title}
              </h1>
            </CardTitle>
            <CardDescription className="text-base">{body}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldAlertIcon aria-hidden="true" />
              <AlertTitle>Invitation link required</AlertTitle>
              <AlertDescription>
                This page opens only from a valid personal guest link shared for
                the celebration.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
