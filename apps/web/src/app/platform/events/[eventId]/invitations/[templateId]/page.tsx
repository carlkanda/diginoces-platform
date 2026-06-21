import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PencilRulerIcon,
  PlayIcon,
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
  getInvitationTemplateDetails,
  type InvitationGenerationJobRow,
  type InvitationRow,
  type InvitationTemplateFieldRow,
} from "@/lib/invitations/invitation-db";
import {
  hasProjectPermission,
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
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  approveInvitationPreviewAction,
  enqueueInvitationGenerationAction,
  generateInvitationPreviewAction,
  saveInvitationTemplateFieldsAction,
} from "../actions";

export const dynamic = "force-dynamic";

type InvitationTemplateDetailPageProps = {
  params: Promise<{
    eventId: string;
    templateId: string;
  }>;
};

const defaultFields = [
  {
    alignment: "center" as const,
    created_at: "",
    created_by: null,
    event_id: "",
    field_key: "guest.display_name",
    font_family: "Inter",
    font_size: 24,
    id: "default-guest-name",
    label: "Guest display name",
    page_number: 1,
    position: { height: 0.08, width: 0.5, x: 0.25, y: 0.42 },
    project_id: "",
    sort_order: 0,
    template_id: "",
    updated_at: "",
    updated_by: null,
  },
  {
    alignment: "center" as const,
    created_at: "",
    created_by: null,
    event_id: "",
    field_key: "public_guest_page_qr",
    font_family: null,
    font_size: null,
    id: "default-public-guest-page-qr",
    label: "Public guest page QR/link",
    page_number: 1,
    position: { height: 0.16, width: 0.16, x: 0.72, y: 0.72 },
    project_id: "",
    sort_order: 1,
    template_id: "",
    updated_at: "",
    updated_by: null,
  },
] satisfies InvitationTemplateFieldRow[];

type StatusTone = "default" | "destructive" | "outline" | "secondary";

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    active: "Ready for use",
    archived: "Archived",
    configured: "Fields placed",
    draft: "Draft",
    event: "Event invitations",
    failed: "Needs attention",
    generated: "Generated",
    needs_regeneration: "Needs regeneration",
    not_generated: "Not generated",
    preview_generated: "Preview ready",
    queued: "Queued",
    regenerate_selected: "Regenerate selected",
    running: "Running",
    selected_guests: "Selected guests",
    technical_preview: "Preview sample",
    technical_preview_approved: "Preview approved",
    uploaded: "PDF uploaded",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

function getStatusTone(status: string): StatusTone {
  if (
    ["active", "completed", "generated", "technical_preview_approved"].includes(
      status,
    )
  ) {
    return "default";
  }

  if (["failed", "cancelled"].includes(status)) {
    return "destructive";
  }

  if (
    ["configured", "preview_generated", "queued", "running"].includes(status)
  ) {
    return "secondary";
  }

  return "outline";
}

function formatFileType(fileType: string) {
  if (fileType === "canva_pdf") {
    return "Canva PDF";
  }

  return formatStatus(fileType);
}

function formatTemplateName(name: string) {
  if (isInternalProjectDisplayText(name) || /\bqa invitation\b/i.test(name)) {
    return "Invitation design";
  }

  return name;
}

function isInternalTemplateFileReference(value: string) {
  return (
    isInternalProjectDisplayText(value) ||
    /\b(mvp|qa|seed|demo)[-_/]/i.test(value)
  );
}

function formatTemplateSourceFilename(filename: string) {
  if (isInternalTemplateFileReference(filename)) {
    return "Canva PDF export.pdf";
  }

  return filename;
}

function formatTemplateStorageReference(storagePath: string) {
  if (isInternalTemplateFileReference(storagePath)) {
    return "Stored invitation design file";
  }

  return storagePath;
}

function fieldValue(position: Record<string, number>, key: string) {
  return String(position[key] ?? 0);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Size not recorded";
  }

  const units = ["bytes", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted =
    unitIndex === 0 ? Math.round(value).toString() : value.toFixed(1);

  return `${formatted} ${units[unitIndex]}`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getPreviewState(previewGenerated: boolean, previewApproved: boolean) {
  if (previewApproved) {
    return {
      description: "Placement is approved and ready for guest file generation.",
      label: "Approved",
      tone: "default" as const,
    };
  }

  if (previewGenerated) {
    return {
      description: "A sample is ready. Review placement before approval.",
      label: "Review needed",
      tone: "secondary" as const,
    };
  }

  return {
    description: "Save fields, then generate a placement preview.",
    label: "Preview needed",
    tone: "outline" as const,
  };
}

function getFieldOptions() {
  return [
    ["guest.display_name", "Guest name"],
    ["guest.title", "Guest title"],
    ["guest.full_invitation_name", "Full invitation name"],
    ["event.name", "Event name"],
    ["event.date", "Event date"],
    ["event.venue", "Event venue"],
    ["couple.names", "Couple names"],
    ["table.name", "Table name"],
    ["table.code", "Table code"],
    ["public_guest_page_qr", "Public guest page QR"],
    ["public_guest_page_url", "Public guest page URL"],
    ["invitation.id", "Invitation ID"],
  ] as const;
}

function JobRows({ jobs }: { jobs: InvitationGenerationJobRow[] }) {
  if (jobs.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SparklesIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No file runs yet</EmptyTitle>
          <EmptyDescription>
            Preview and generation activity will appear here after the team
            starts preparing invitation files.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Run</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Guests</TableHead>
          <TableHead>Files</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="max-w-[260px] whitespace-normal">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{formatStatus(job.mode)}</span>
                <span className="text-sm text-muted-foreground">
                  {job.error_message ?? "Invitation generation activity"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusTone(job.status)}>
                {formatStatus(job.status)}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-normal">
              {job.ready_count} ready / {job.blocked_count} blocked
            </TableCell>
            <TableCell className="whitespace-normal">
              {job.generated_count} generated / {job.failed_count} failed
            </TableCell>
            <TableCell>{formatDateTime(job.updated_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function InvitationRows({ invitations }: { invitations: InvitationRow[] }) {
  if (invitations.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No guest files generated</EmptyTitle>
          <EmptyDescription>
            Generated guest invitation records will appear here after an
            approved preview is used for this event.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invitation</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last generated</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation, index) => (
          <TableRow key={invitation.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-medium">Guest file {index + 1}</span>
                <span className="text-sm text-muted-foreground">
                  Guest record {invitation.guest_id}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusTone(invitation.status)}>
                {formatStatus(invitation.status)}
              </Badge>
            </TableCell>
            <TableCell>
              {formatDateTime(invitation.last_generated_at)}
            </TableCell>
            <TableCell>{formatDateTime(invitation.updated_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function InvitationTemplateDetailPage({
  params,
}: InvitationTemplateDetailPageProps) {
  const authContext = await getAuthContext();
  const { eventId, templateId } = await params;
  const templateHref = `/platform/events/${eventId}/invitations/${templateId}`;
  const invitationsHref = `/platform/events/${eventId}/invitations`;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(templateHref));
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
              <BreadcrumbLink render={<Link href={invitationsHref} />}>
                Invitation designs
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Design workspace</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-base font-medium leading-snug">
                Invitation design is waiting for access
              </h1>
            </CardTitle>
            <CardDescription>
              Template details will appear after the secure workspace connection
              is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                Field placement, preview approval, and generated invitation
                files stay closed until Diginoces can confirm workspace access.
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
      await redirectToMfaIfStepUpRequired(context, templateHref, {
        permission: "invitation_templates.read",
        scope: "event",
        scopeId: eventId,
      });
      notFound();
    }

    throw error;
  }

  const [eventDetails, templateDetails] = await Promise.all([
    getEventDetails(supabase, eventId),
    getInvitationTemplateDetails(supabase, templateId),
  ]);

  if (
    !eventDetails ||
    !templateDetails ||
    templateDetails.template.event_id !== eventId
  ) {
    notFound();
  }

  const [canUpdate, canApprove, canGenerate] = await Promise.all([
    hasProjectPermission(
      context,
      eventDetails.project.id,
      "invitation_templates.update",
    ),
    hasProjectPermission(
      context,
      eventDetails.project.id,
      "invitation_templates.approve",
    ),
    hasProjectPermission(
      context,
      eventDetails.project.id,
      "invitations.generate",
    ),
  ]);

  const fields =
    templateDetails.fields.length > 0 ? templateDetails.fields : defaultFields;
  const saveFields = saveInvitationTemplateFieldsAction.bind(
    null,
    eventId,
    templateId,
  );
  const generatePreview = generateInvitationPreviewAction.bind(
    null,
    eventId,
    templateId,
  );
  const approvePreview = approveInvitationPreviewAction.bind(
    null,
    eventId,
    templateId,
  );
  const enqueueGeneration = enqueueInvitationGenerationAction.bind(
    null,
    eventId,
    templateId,
  );
  const previewGenerated =
    templateDetails.template.technical_preview_generated_at !== null;
  const previewApproved =
    templateDetails.template.technical_preview_approved_at !== null;
  const previewState = getPreviewState(previewGenerated, previewApproved);
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
  const templateName = formatTemplateName(templateDetails.template.name);
  const sourceFilename = formatTemplateSourceFilename(
    templateDetails.template.source_filename,
  );
  const storageReference = formatTemplateStorageReference(
    templateDetails.template.storage_path,
  );
  const venueLabel = formatProjectVenueDisplay(eventDetails.event.venue_name);

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
            <BreadcrumbLink render={<Link href={invitationsHref} />}>
              Invitation designs
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{templateName}</BreadcrumbPage>
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
              <Badge variant={getStatusTone(templateDetails.template.status)}>
                {formatStatus(templateDetails.template.status)}
              </Badge>
            </div>
            <CardTitle>
              <h1 className="text-2xl font-medium leading-snug">
                {templateName}
              </h1>
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Place dynamic fields on the PDF, generate a technical preview,
              approve the placement, then prepare guest invitation files for{" "}
              {eventName}.
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
                <dt className="template-studio__label">Source</dt>
                <dd className="template-studio__value">
                  {formatFileType(templateDetails.template.file_type)} -{" "}
                  {formatFileSize(templateDetails.template.file_size_bytes)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended next step</CardTitle>
            <CardDescription>{previewState.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Badge className="w-fit" variant={previewState.tone}>
              {previewState.label}
            </Badge>
            <Button render={<Link href={invitationsHref} />} variant="outline">
              <ArrowLeftIcon data-icon="inline-start" />
              Invitation designs
            </Button>
            <Button
              render={<Link href={`/platform/events/${eventId}`} />}
              variant="outline"
            >
              Event workspace
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Fields</CardTitle>
            <CardDescription>
              {pluralize(fields.length, "field")}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {previewGenerated ? "Generated" : "Not generated"}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Approval</CardTitle>
            <CardDescription>
              {previewApproved ? "Approved" : "Not approved"}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Runs</CardTitle>
            <CardDescription>
              {pluralize(templateDetails.jobs.length, "recent run")}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Guest files</CardTitle>
            <CardDescription>
              {pluralize(templateDetails.invitations.length, "record")}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <Alert>
        <QrCodeIcon aria-hidden="true" />
        <AlertTitle>Guest page fields are not check-in credentials</AlertTitle>
        <AlertDescription>
          Public guest page QR and URL fields point guests to their invitation
          and RSVP page. They remain separate from future event-day check-in
          tokens.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="fields">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="preview">Preview approval</TabsTrigger>
          <TabsTrigger value="files">Generated files</TabsTrigger>
          <TabsTrigger value="details">Design details</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-2" value="fields">
          <form action={saveFields}>
            <Card>
              <CardHeader>
                <CardTitle>Dynamic field placement</CardTitle>
                <CardDescription>
                  Use values from 0 to 1 for left-to-right and top-to-bottom
                  placement. Save fields before generating a preview.
                </CardDescription>
                <CardAction>
                  <Badge variant={canUpdate ? "secondary" : "outline"}>
                    {canUpdate ? "Editable" : "Read only"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {fields.map((field, index) => {
                  const fieldId = `${field.field_key}-${index}`;

                  return (
                    <FieldSet className="rounded-lg border p-4" key={fieldId}>
                      <FieldLegend>
                        Field {index + 1}: {field.label}
                      </FieldLegend>
                      <FieldGroup>
                        <div className="grid gap-4 md:grid-cols-3">
                          <Field>
                            <FieldLabel htmlFor={`fieldKey-${index}`}>
                              Field
                            </FieldLabel>
                            <NativeSelect
                              className="w-full"
                              defaultValue={field.field_key}
                              disabled={!canUpdate}
                              id={`fieldKey-${index}`}
                              name="fieldKey"
                            >
                              {getFieldOptions().map(([value, label]) => (
                                <NativeSelectOption key={value} value={value}>
                                  {label}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`label-${index}`}>
                              Label
                            </FieldLabel>
                            <Input
                              defaultValue={field.label}
                              disabled={!canUpdate}
                              id={`label-${index}`}
                              name={`label:${index}`}
                              required
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`pageNumber-${index}`}>
                              Page
                            </FieldLabel>
                            <Input
                              defaultValue={field.page_number}
                              disabled={!canUpdate}
                              id={`pageNumber-${index}`}
                              min="1"
                              name={`pageNumber:${index}`}
                              required
                              type="number"
                            />
                          </Field>
                        </div>

                        <Separator />

                        <div className="grid gap-4 md:grid-cols-4">
                          <Field>
                            <FieldLabel htmlFor={`x-${index}`}>
                              Horizontal
                            </FieldLabel>
                            <Input
                              defaultValue={fieldValue(field.position, "x")}
                              disabled={!canUpdate}
                              id={`x-${index}`}
                              max="1"
                              min="0"
                              name={`x:${index}`}
                              required
                              step="0.01"
                              type="number"
                            />
                            <FieldDescription>
                              0 is left, 1 is right.
                            </FieldDescription>
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`y-${index}`}>
                              Vertical
                            </FieldLabel>
                            <Input
                              defaultValue={fieldValue(field.position, "y")}
                              disabled={!canUpdate}
                              id={`y-${index}`}
                              max="1"
                              min="0"
                              name={`y:${index}`}
                              required
                              step="0.01"
                              type="number"
                            />
                            <FieldDescription>
                              0 is top, 1 is bottom.
                            </FieldDescription>
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`width-${index}`}>
                              Width
                            </FieldLabel>
                            <Input
                              defaultValue={fieldValue(field.position, "width")}
                              disabled={!canUpdate}
                              id={`width-${index}`}
                              max="1"
                              min="0.01"
                              name={`width:${index}`}
                              required
                              step="0.01"
                              type="number"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`height-${index}`}>
                              Height
                            </FieldLabel>
                            <Input
                              defaultValue={fieldValue(
                                field.position,
                                "height",
                              )}
                              disabled={!canUpdate}
                              id={`height-${index}`}
                              max="1"
                              min="0.01"
                              name={`height:${index}`}
                              required
                              step="0.01"
                              type="number"
                            />
                          </Field>
                        </div>

                        <Separator />

                        <div className="grid gap-4 md:grid-cols-3">
                          <Field>
                            <FieldLabel htmlFor={`fontSize-${index}`}>
                              Font size
                            </FieldLabel>
                            <Input
                              defaultValue={field.font_size ?? ""}
                              disabled={!canUpdate}
                              id={`fontSize-${index}`}
                              min="1"
                              name={`fontSize:${index}`}
                              step="1"
                              type="number"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`fontFamily-${index}`}>
                              Font family
                            </FieldLabel>
                            <Input
                              defaultValue={field.font_family ?? ""}
                              disabled={!canUpdate}
                              id={`fontFamily-${index}`}
                              name={`fontFamily:${index}`}
                              placeholder="Inter"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`alignment-${index}`}>
                              Alignment
                            </FieldLabel>
                            <NativeSelect
                              className="w-full"
                              defaultValue={field.alignment ?? "center"}
                              disabled={!canUpdate}
                              id={`alignment-${index}`}
                              name={`alignment:${index}`}
                            >
                              <NativeSelectOption value="left">
                                Left
                              </NativeSelectOption>
                              <NativeSelectOption value="center">
                                Center
                              </NativeSelectOption>
                              <NativeSelectOption value="right">
                                Right
                              </NativeSelectOption>
                            </NativeSelect>
                          </Field>
                        </div>
                      </FieldGroup>
                    </FieldSet>
                  );
                })}
              </CardContent>
              <CardFooter className="flex flex-wrap justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Long names need enough width and height before preview
                  approval.
                </p>
                {canUpdate ? (
                  <Button
                    aria-label={`Save field positions for ${templateName}`}
                    type="submit"
                  >
                    <PencilRulerIcon data-icon="inline-start" />
                    Save field positions
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent className="mt-2" value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview approval</CardTitle>
              <CardDescription>
                Generate a technical preview, inspect field placement, then
                approve the design before preparing guest files.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
              <div className="template-studio__steps">
                <div className="template-studio__step">
                  <PencilRulerIcon aria-hidden="true" />
                  <div className="template-studio__step-body">
                    <p className="template-studio__step-title">Fields placed</p>
                    <p className="template-studio__note">
                      {pluralize(fields.length, "field")} configured for this
                      design.
                    </p>
                  </div>
                </div>
                <div className="template-studio__step">
                  <SparklesIcon aria-hidden="true" />
                  <div className="template-studio__step-body">
                    <p className="template-studio__step-title">
                      Preview generated
                    </p>
                    <p className="template-studio__note">
                      {previewGenerated
                        ? formatDateTime(
                            templateDetails.template
                              .technical_preview_generated_at,
                          )
                        : "Generate a sample before approval."}
                    </p>
                  </div>
                </div>
                <div className="template-studio__step">
                  <CheckCircle2Icon aria-hidden="true" />
                  <div className="template-studio__step-body">
                    <p className="template-studio__step-title">
                      Preview approved
                    </p>
                    <p className="template-studio__note">
                      {previewApproved
                        ? formatDateTime(
                            templateDetails.template
                              .technical_preview_approved_at,
                          )
                        : "Approval is required before event generation."}
                    </p>
                  </div>
                </div>
              </div>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Preview actions</CardTitle>
                  <CardDescription>
                    Actions appear only when your role can perform them.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {canUpdate ? (
                    <form action={generatePreview}>
                      <Button
                        aria-label={`Generate preview for ${templateName}`}
                        className="w-full"
                        type="submit"
                        variant="outline"
                      >
                        <SparklesIcon data-icon="inline-start" />
                        Generate preview
                      </Button>
                    </form>
                  ) : null}
                  {canApprove ? (
                    <form action={approvePreview}>
                      <Button
                        aria-label={`Approve preview for ${templateName}`}
                        className="w-full"
                        type="submit"
                        variant="outline"
                      >
                        <CheckCircle2Icon data-icon="inline-start" />
                        Approve preview
                      </Button>
                    </form>
                  ) : null}
                  {canGenerate ? (
                    <form action={enqueueGeneration}>
                      <Button
                        aria-label={`Generate invitations from ${templateName}`}
                        className="w-full"
                        type="submit"
                      >
                        <PlayIcon data-icon="inline-start" />
                        Generate event invitations
                      </Button>
                    </form>
                  ) : null}
                  {!canUpdate && !canApprove && !canGenerate ? (
                    <Alert>
                      <ShieldCheckIcon aria-hidden="true" />
                      <AlertTitle>Review access only</AlertTitle>
                      <AlertDescription>
                        You can view this design, but preview and generation
                        actions require invitation template permissions.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-2" value="files">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Generation runs</CardTitle>
                <CardDescription>
                  Recent preview and event file activity for this design.
                </CardDescription>
                <CardAction>
                  <Badge variant="outline">
                    {pluralize(templateDetails.jobs.length, "run")}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <JobRows jobs={templateDetails.jobs} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest invitation records</CardTitle>
                <CardDescription>
                  Guest files linked to this design after generation.
                </CardDescription>
                <CardAction>
                  <Badge variant="outline">
                    {pluralize(templateDetails.invitations.length, "record")}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <InvitationRows invitations={templateDetails.invitations} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="mt-2" value="details">
          <Card>
            <CardHeader>
              <CardTitle>Design record</CardTitle>
              <CardDescription>
                Source, version, and approval evidence for the invitation
                design.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Source file</TableCell>
                    <TableCell className="whitespace-normal">
                      {sourceFilename}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">File type</TableCell>
                    <TableCell>
                      {formatFileType(templateDetails.template.file_type)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">File size</TableCell>
                    <TableCell>
                      {formatFileSize(templateDetails.template.file_size_bytes)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Template version
                    </TableCell>
                    <TableCell>
                      {templateDetails.template.template_version}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Created</TableCell>
                    <TableCell>
                      {formatDateTime(templateDetails.template.created_at)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Updated</TableCell>
                    <TableCell>
                      {formatDateTime(templateDetails.template.updated_at)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Secure file reference
                    </TableCell>
                    <TableCell className="whitespace-normal font-mono text-xs">
                      {storageReference}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
