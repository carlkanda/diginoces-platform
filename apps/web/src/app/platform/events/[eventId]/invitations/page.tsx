import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FileTextIcon,
  Layers3Icon,
  PencilRulerIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import {
  listEventInvitationTemplates,
  type InvitationTemplateRow,
} from "@/lib/invitations/invitation-db";
import {
  formatDateTime,
  formatFileSize,
  formatTemplateName,
  formatTemplateSourceFilename,
} from "@/lib/invitations/invitation-format";
import {
  ProjectAccessError,
  hasProjectPermission,
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
import { pluralize } from "@/lib/ui/format-helpers";
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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

type EventInvitationTemplatesPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type TemplateTone = "default" | "destructive" | "outline" | "secondary";

type WorkflowStep = {
  count: number;
  description: string;
  label: string;
};

function formatTemplateStatus(status: string) {
  const labels: Record<string, string> = {
    active: "Ready for use",
    archived: "Archived",
    configured: "Fields placed",
    draft: "Draft",
    failed: "Needs attention",
    not_generated: "Not generated",
    preview_generated: "Placement preview ready",
    technical_preview_approved: "Placement preview approved",
    uploaded: "PDF uploaded",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function getTemplateStatusTone(status: string): TemplateTone {
  if (["active", "technical_preview_approved"].includes(status)) {
    return "default";
  }

  if (status === "failed") {
    return "destructive";
  }

  if (["configured", "preview_generated"].includes(status)) {
    return "secondary";
  }

  return "outline";
}

function getTemplateNextAction(status: string) {
  const labels: Record<string, string> = {
    active: "Generate or review files",
    archived: "Review archived record",
    configured: "Generate placement preview",
    draft: "Finish design setup",
    failed: "Resolve before use",
    not_generated: "Prepare generation",
    preview_generated: "Approve placement preview",
    technical_preview_approved: "Generate invitations",
    uploaded: "Place guest fields",
  };

  return labels[status] ?? "Open design";
}

function getWorkflowSteps(templates: InvitationTemplateRow[]): WorkflowStep[] {
  const uploaded = templates.filter((template) =>
    ["uploaded", "draft"].includes(template.status),
  ).length;
  const configured = templates.filter((template) =>
    ["configured", "preview_generated"].includes(template.status),
  ).length;
  const approved = templates.filter((template) =>
    ["technical_preview_approved", "active"].includes(template.status),
  ).length;

  return [
    {
      count: uploaded,
      description: "PDF designs that still need guest fields placed.",
      label: "Place fields",
    },
    {
      count: configured,
      description: "Designs waiting for preview review or approval.",
      label: "Check preview",
    },
    {
      count: approved,
      description: "Approved designs ready for guest invitation files.",
      label: "Generate files",
    },
  ];
}

export default async function EventInvitationTemplatesPage({
  params,
}: EventInvitationTemplatesPageProps) {
  const authContext = await getAuthContext();
  const { eventId } = await params;
  const invitationHref = `/platform/events/${eventId}/invitations`;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(invitationHref));
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
              <BreadcrumbPage>Invitation designs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-base font-medium leading-snug">
                Invitation designs are waiting for access
              </h1>
            </CardTitle>
            <CardDescription>
              Event invitation tools will appear after the secure workspace
              connection is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Invitation templates, generated files, and guest links stay
                closed until Diginoces can confirm workspace access.
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
    await requireEventPermission(context, eventId, "invitation_templates.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(context, invitationHref, {
        permission: "invitation_templates.read",
        scope: "event",
        scopeId: eventId,
      });
      notFound();
    }

    throw error;
  }

  const [eventDetails, templates] = await Promise.all([
    getEventDetails(supabase, eventId),
    listEventInvitationTemplates(supabase, eventId),
  ]);

  if (!eventDetails) {
    notFound();
  }

  const canCreate = await hasProjectPermission(
    context,
    eventDetails.project.id,
    "invitation_templates.create",
  );
  const approvedTemplates = templates.filter((template) =>
    ["technical_preview_approved", "active"].includes(template.status),
  ).length;
  const failedTemplates = templates.filter(
    (template) => template.status === "failed",
  ).length;
  const needsReviewTemplates = templates.filter((template) =>
    ["configured", "preview_generated"].includes(template.status),
  ).length;
  const projectLabel = formatProjectCoupleDisplayName(eventDetails.project, 0);
  const eventTypeLabel = getEventTypeLabel(
    eventDetails.event.event_type as EventType,
  );
  const fallbackEventName = `${eventTypeLabel} event`;
  const eventName = isInternalProjectDisplayText(eventDetails.event.name)
    ? fallbackEventName
    : formatProjectEventDisplayName(eventDetails.event, 0);
  const eventReference = formatProjectEventDisplayReference(
    eventDetails.event,
    0,
  );
  const eventReferenceValue = eventReference.isCode
    ? eventReference.value
    : fallbackEventName;
  const eventLifecycleLabel = getEventLifecycleLabel(
    eventDetails.event.status as EventLifecycleStatus,
  );
  const venueLabel = formatProjectVenueDisplay(eventDetails.event.venue_name);
  const workflowSteps = getWorkflowSteps(templates);
  const hasTemplates = templates.length > 0;

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
                <Link href={`/platform/projects/${eventDetails.project.id}`} />
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
            <BreadcrumbPage>Invitation designs</BreadcrumbPage>
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
                Invitation designs for {eventName}
              </h1>
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Register the Canva-exported PDF, place guest fields, approve the
              placement preview, then generate guest-ready invitation files for
              this event.
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
              <div className="template-studio__tile">
                <dt className="template-studio__label">Designs</dt>
                <dd className="template-studio__value">
                  {pluralize(templates.length, "registered design")}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended next step</CardTitle>
            <CardDescription>
              Use approved placement previews before generating guest PDFs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              render={<Link href={`/platform/events/${eventId}`} />}
              variant="outline"
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Event workspace
            </Button>
            {canCreate ? (
              <Button
                render={
                  <Link href={`/platform/events/${eventId}/invitations/new`} />
                }
              >
                <FileTextIcon data-icon="inline-start" />
                Register PDF design
              </Button>
            ) : (
              <Alert>
                <ShieldCheckIcon aria-hidden="true" />
                <AlertTitle>Registration is limited</AlertTitle>
                <AlertDescription>
                  You can review invitation designs for this event. A Diginoces
                  teammate with template access can register a new PDF design.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>

      <Alert>
        <QrCodeIcon aria-hidden="true" />
        <AlertTitle>Guest page links stay separate from check-in</AlertTitle>
        <AlertDescription>
          Invitation designs may include a public guest page QR or link. That
          guest link is separate from future event-day check-in tokens.
        </AlertDescription>
      </Alert>

      <section className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Approved designs</CardTitle>
            <CardDescription>
              {approvedTemplates > 0
                ? pluralize(approvedTemplates, "design")
                : "No design is approved yet"}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Preview review</CardTitle>
            <CardDescription>
              {needsReviewTemplates > 0
                ? pluralize(needsReviewTemplates, "design")
                : "No preview is waiting"}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>
              {failedTemplates > 0
                ? pluralize(failedTemplates, "design")
                : "No template errors recorded"}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <Tabs defaultValue="designs">
        <TabsList>
          <TabsTrigger value="designs">Designs</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-2" value="designs">
          <Card>
            <CardHeader>
              <CardTitle>Registered invitation designs</CardTitle>
              <CardDescription>
                Open a design to place fields, review the placement preview, or
                generate invitation files for assigned guests.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {pluralize(templates.length, "design")}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {hasTemplates ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Design</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template, index) => {
                      const templateName = formatTemplateName(
                        template.name,
                        index,
                      );
                      const sourceFilename = formatTemplateSourceFilename(
                        template.source_filename,
                        index,
                      );

                      return (
                        <TableRow key={template.id}>
                          <TableCell className="max-w-[280px] whitespace-normal">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {templateName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Version {template.template_version} -{" "}
                                {getTemplateNextAction(template.status)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getTemplateStatusTone(template.status)}
                            >
                              {formatTemplateStatus(template.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] whitespace-normal">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {sourceFilename}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Canva PDF -{" "}
                                {formatFileSize(template.file_size_bytes)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDateTime(template.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              render={
                                <Link
                                  aria-label={`Open ${templateName}`}
                                  href={`/platform/events/${eventId}/invitations/${template.id}`}
                                />
                              }
                              size="sm"
                              variant="outline"
                            >
                              Open design
                              <ArrowRightIcon data-icon="inline-end" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileTextIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>No invitation design registered</EmptyTitle>
                    <EmptyDescription>
                      Start by registering the event PDF export, then place
                      guest names and public guest page fields before approval.
                    </EmptyDescription>
                  </EmptyHeader>
                  {canCreate ? (
                    <EmptyContent>
                      <Button
                        render={
                          <Link
                            href={`/platform/events/${eventId}/invitations/new`}
                          />
                        }
                      >
                        <FileTextIcon data-icon="inline-start" />
                        Register PDF design
                      </Button>
                    </EmptyContent>
                  ) : null}
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-2" value="readiness">
          <Card>
            <CardHeader>
              <CardTitle>Readiness for guest files</CardTitle>
              <CardDescription>
                The design should move through field placement, placement
                preview approval, and generation without mixing guest page and
                check-in token behavior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="template-studio__grid">
                {workflowSteps.map((step) => (
                  <div className="template-studio__step" key={step.label}>
                    <div className="template-studio__step-body">
                      <p className="template-studio__step-title">
                        {step.label}
                      </p>
                      <p className="template-studio__note">
                        {step.description}
                      </p>
                    </div>
                    <Badge variant={step.count > 0 ? "secondary" : "outline"}>
                      {step.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-2" value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Invitation workflow</CardTitle>
              <CardDescription>
                Keep design changes reviewable before any guest-facing files are
                generated.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
              <div className="flex flex-col gap-4">
                <div className="template-studio__steps">
                  <div className="template-studio__step">
                    <FileTextIcon aria-hidden="true" />
                    <div className="template-studio__step-body">
                      <p className="template-studio__step-title">
                        Register the event PDF
                      </p>
                      <p className="template-studio__note">
                        Use the Canva-exported PDF for this event. Source files
                        remain outside this workflow until a later file-storage
                        step supports them.
                      </p>
                    </div>
                  </div>
                  <div className="template-studio__step">
                    <PencilRulerIcon aria-hidden="true" />
                    <div className="template-studio__step-body">
                      <p className="template-studio__step-title">
                        Place dynamic fields
                      </p>
                      <p className="template-studio__note">
                        Position names, event details, table details, and the
                        public guest page QR or link with enough room for long
                        names.
                      </p>
                    </div>
                  </div>
                  <div className="template-studio__step">
                    <SparklesIcon aria-hidden="true" />
                    <div className="template-studio__step-body">
                      <p className="template-studio__step-title">
                        Approve before generation
                      </p>
                      <p className="template-studio__note">
                        Generate a placement preview first. Guest invitation
                        files should be produced only after that preview is
                        approved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Alert>
                <Layers3Icon aria-hidden="true" />
                <AlertTitle>Design records are event-scoped</AlertTitle>
                <AlertDescription>
                  This page shows designs for {eventName}. Open the event
                  workspace when you need seating, check-in, files, or the event
                  status dashboard.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
