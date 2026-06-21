import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  FileTextIcon,
  PencilRulerIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
} from "lucide-react";

import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { MAX_INVITATION_TEMPLATE_PDF_BYTES } from "@/lib/invitations/invitation-service";
import {
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectEventDisplayName,
  formatProjectEventDisplayReference,
  formatProjectVenueDisplay,
  getEventLifecycleLabel,
  getEventTypeLabel,
  isInternalProjectDisplayText,
  type EventLifecycleStatus,
  type EventType,
} from "@/lib/projects/project-foundation";
import { getEventDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { registerInvitationTemplateAction } from "../actions";

export const dynamic = "force-dynamic";

type NewInvitationTemplatePageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function formatMaxFileSize(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export default async function NewInvitationTemplatePage({
  params,
}: NewInvitationTemplatePageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const newInvitationHref = `/platform/events/${eventId}/invitations/new`;
  const invitationsHref = `/platform/events/${eventId}/invitations`;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(newInvitationHref));
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/platform" />}>
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Register invitation design</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-base font-medium leading-snug">
                Invitation registration is waiting for access
              </h1>
            </CardTitle>
            <CardDescription>
              The PDF registration form will appear after the secure workspace
              connection is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Diginoces keeps invitation design records closed until it can
                confirm workspace access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireEventPermission(
      context,
      eventId,
      "invitation_templates.create",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(context, newInvitationHref, {
        permission: "invitation_templates.create",
        scope: "event",
        scopeId: eventId,
      });
      notFound();
    }

    throw error;
  }

  const details = await getEventDetails(supabase, eventId);

  if (!details) {
    notFound();
  }

  const action = registerInvitationTemplateAction.bind(null, eventId);
  const projectLabel = formatProjectCoupleDisplayName(details.project, 0);
  const eventTypeLabel = getEventTypeLabel(
    details.event.event_type as EventType,
  );
  const fallbackEventName = `${eventTypeLabel} event`;
  const eventName = isInternalProjectDisplayText(details.event.name)
    ? fallbackEventName
    : formatProjectEventDisplayName(details.event, 0);
  const eventReference = formatProjectEventDisplayReference(details.event, 0);
  const eventReferenceValue = eventReference.isCode
    ? eventReference.value
    : fallbackEventName;
  const eventLifecycleLabel = getEventLifecycleLabel(
    details.event.status as EventLifecycleStatus,
  );
  const venueLabel = formatProjectVenueDisplay(details.event.venue_name);

  return (
    <main className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform" />}>
              Workspace
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform/projects" />}>
              Weddings
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link href={`/platform/projects/${details.project.id}`} />
              }
            >
              {projectLabel}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/events/${eventId}`} />}
            >
              {eventName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={invitationsHref} />}>
              Invitation designs
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Register PDF</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{eventTypeLabel}</Badge>
              <Badge variant="outline">{eventLifecycleLabel}</Badge>
              <Badge variant="outline">
                {eventReference.label}: {eventReferenceValue}
              </Badge>
            </div>
            <CardTitle>
              <h1 className="text-2xl font-medium leading-snug">
                Register a PDF design for {eventName}
              </h1>
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Add the Canva-exported PDF that will receive guest names, event
              details, and public guest page QR or link fields before invitation
              files are generated.
            </CardDescription>
          </CardHeader>
          <CardContent className="template-studio">
            <dl className="template-studio__grid">
              <div className="template-studio__tile">
                <dt className="template-studio__label">Wedding</dt>
                <dd className="template-studio__value">{projectLabel}</dd>
              </div>
              <div className="template-studio__tile">
                <dt className="template-studio__label">Venue</dt>
                <dd className="template-studio__value">{venueLabel}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>After registration</CardTitle>
            <CardDescription>
              The next screen opens the field placement workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <UploadCloudIcon aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Confirm the PDF is the final event design before registering it.
              </p>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <PencilRulerIcon aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Place dynamic fields for names, event details, and guest links.
              </p>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <QrCodeIcon aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Public guest page QR fields stay separate from future check-in
                tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Alert>
        <FileTextIcon aria-hidden="true" />
        <AlertTitle>PDF-only registration</AlertTitle>
        <AlertDescription>
          Register the exported PDF for this event. Keep editable Canva source
          files in your normal design handoff location.
        </AlertDescription>
      </Alert>

      <form action={action} encType="multipart/form-data">
        <Card>
          <CardHeader>
            <CardTitle>Design details</CardTitle>
            <CardDescription>
              Name the design so the team can recognize it later, then attach a
              PDF export no larger than{" "}
              {formatMaxFileSize(MAX_INVITATION_TEMPLATE_PDF_BYTES)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldLegend>PDF registration</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="templateName">Design name</FieldLabel>
                  <Input
                    id="templateName"
                    name="templateName"
                    placeholder="Reception invitation"
                    required
                  />
                  <FieldDescription>
                    Use a name that matches the event and design version your
                    team expects to review.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="templateFile">
                    Canva PDF export
                  </FieldLabel>
                  <Input
                    accept="application/pdf,.pdf"
                    id="templateFile"
                    name="templateFile"
                    required
                    type="file"
                  />
                  <FieldDescription>
                    PDF files are checked again when the form is submitted.
                    Other formats are rejected.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between gap-3">
            <Button render={<Link href={invitationsHref} />} variant="outline">
              <ArrowLeftIcon data-icon="inline-start" />
              Cancel
            </Button>
            <Button
              aria-label={`Register invitation design for ${eventName}`}
              type="submit"
            >
              <UploadCloudIcon data-icon="inline-start" />
              Register PDF design
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}
