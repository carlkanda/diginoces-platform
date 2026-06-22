import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  FileCheck2Icon,
  FileTextIcon,
  LockKeyholeIcon,
  PackageIcon,
  PercentIcon,
  PlusIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
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
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  getCommercialActionCapabilities,
  requireAnyCommercialReadPermission,
} from "@/lib/contracts/contract-api";
import { getProjectCommercialOverview } from "@/lib/contracts/contract-db";
import { formatUsd } from "@/lib/contracts/contract-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import {
  formatProjectCoupleDisplayName,
  formatProjectDisplayReference,
  formatProjectEventDisplayName,
  isInternalProjectDisplayText,
} from "@/lib/projects/project-foundation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PricingPreview } from "./pricing-preview";
import {
  applyCommercialGestureAction,
  approveContractAction,
  calculatePricingAction,
  confirmPaymentAction,
  createAddendumAction,
  createAddonAction,
  createPackageAction,
  createPaymentExceptionAction,
  generateContractAction,
  recordPaymentAction,
  selectEventPackageAction,
} from "./actions";

export const dynamic = "force-dynamic";

type CommercialPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    commercialError?: string;
    commercialStatus?: string;
  }>;
};

type Notice = {
  description: string;
  title: string;
  tone: "danger" | "success";
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function statusLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const labels: Record<string, string> = {
    active: "Active",
    approved: "Approved",
    archived: "Archived",
    blocked: "Blocked",
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    contract_approved: "Contract approved",
    draft: "Draft",
    exception_override: "Exception approved",
    generated: "Generated",
    guest_list_access: "Guest-list access",
    guest_page_access: "Guest page access",
    guest_public_page: "Guest page",
    invitation_sending: "Invitation sending",
    locked: "Locked",
    open: "Open",
    payment_confirmed: "Payment confirmed",
    pending: "Pending",
    recorded: "Recorded",
    rejected: "Rejected",
    sent_for_approval: "Sent for approval",
    superseded: "Previous version",
  };

  if (labels[value]) {
    return labels[value];
  }

  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bApi\b/g, "App")
    .replace(/\bId\b/g, "ID")
    .replace(/\bUsd\b/g, "USD");
}

function commercialDisplayName(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value || isInternalProjectDisplayText(value)) {
    return fallback;
  }

  return value;
}

function servicePackageName(item: { name: string }, index: number) {
  return commercialDisplayName(item.name, `Service package ${index + 1}`);
}

function servicePackageOptionLabel(
  item: { name: string; package_code: string },
  index: number,
) {
  const name = servicePackageName(item, index);

  if (isInternalProjectDisplayText(item.package_code)) {
    return name;
  }

  return `${item.package_code} - ${name}`;
}

function addonDisplayName(item: { name: string }, index: number) {
  return commercialDisplayName(item.name, `Add-on ${index + 1}`);
}

function noticeFromSearchParams(input: {
  commercialError?: string;
  commercialStatus?: string;
}): Notice | null {
  if (input.commercialError) {
    const messages: Record<string, Notice> = {
      commercial_action_failed: {
        description:
          "The commercial change could not be saved. Review the required fields and your access before trying again.",
        title: "Commercial change failed",
        tone: "danger",
      },
      invalid_commercial_request: {
        description:
          "The request was incomplete or invalid. Check the amounts, selections, and approval confirmations.",
        title: "Commercial request needs attention",
        tone: "danger",
      },
    };

    return (
      messages[input.commercialError] ?? {
        description: "The commercial change could not be saved.",
        title: "Commercial change failed",
        tone: "danger",
      }
    );
  }

  if (!input.commercialStatus) {
    return null;
  }

  const messages: Record<string, Notice> = {
    addendum_created: {
      description:
        "The addendum was recorded and is now visible in the contract change history.",
      title: "Addendum recorded",
      tone: "success",
    },
    addon_created: {
      description: "The add-on is now available for event package selections.",
      title: "Add-on created",
      tone: "success",
    },
    commercial_gesture_applied: {
      description:
        "The price adjustment was saved with its reason for audit review.",
      title: "Price adjustment saved",
      tone: "success",
    },
    contract_approved: {
      description:
        "The contract approval was recorded and guest-list access can follow the approved terms.",
      title: "Contract approved",
      tone: "success",
    },
    contract_generated: {
      description:
        "A project contract was generated from the current package and pricing details.",
      title: "Contract generated",
      tone: "success",
    },
    event_package_selected: {
      description:
        "The event package selection was saved and can be used for pricing.",
      title: "Event selection saved",
      tone: "success",
    },
    package_created: {
      description: "The service package is now available for event selections.",
      title: "Package created",
      tone: "success",
    },
    payment_confirmed: {
      description:
        "The payment was confirmed and the payment gate has been refreshed.",
      title: "Payment confirmed",
      tone: "success",
    },
    payment_exception_created: {
      description:
        "The temporary access exception was approved with its conditions.",
      title: "Exception approved",
      tone: "success",
    },
    payment_recorded: {
      description:
        "The manual payment was recorded and is ready for confirmation when required.",
      title: "Payment recorded",
      tone: "success",
    },
    pricing_calculated: {
      description:
        "The current price estimate was saved from the selected event packages.",
      title: "Pricing calculation saved",
      tone: "success",
    },
  };

  return (
    messages[input.commercialStatus] ?? {
      description: "The commercial change was saved.",
      title: "Change saved",
      tone: "success",
    }
  );
}

function badgeVariant(value: string | null | undefined) {
  if (
    value === "active" ||
    value === "approved" ||
    value === "confirmed" ||
    value === "contract_approved" ||
    value === "payment_confirmed"
  ) {
    return "default" as const;
  }

  if (
    value === "locked" ||
    value === "blocked" ||
    value === "cancelled" ||
    value === "rejected"
  ) {
    return "destructive" as const;
  }

  if (value === "exception_override" || value === "generated") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function InfoTile({
  description,
  label,
  value,
}: {
  description?: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-background p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <strong className="min-w-0 text-sm font-medium break-words">
        {value}
      </strong>
      {description ? (
        <span className="text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      ) : null}
    </div>
  );
}

export default async function ProjectCommercialPage({
  params,
  searchParams,
}: CommercialPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const notices = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/commercial`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/platform" />}>
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Contracts and payments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Commercial controls are unavailable</CardTitle>
            <CardDescription>
              Contract, pricing, and payment records will appear after the
              workspace connection is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LockKeyholeIcon aria-hidden="true" />
              <AlertTitle>Connection required</AlertTitle>
              <AlertDescription>
                This page is secure by default. Ask a Diginoces administrator to
                finish the workspace connection before reviewing commercial
                controls.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireAnyCommercialReadPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const capabilities = await getCommercialActionCapabilities(
    context,
    projectId,
  );
  const overview = await getProjectCommercialOverview(
    supabase,
    projectId,
    capabilities,
  );
  const canReadCommercialGestures =
    capabilities.canManageGestures || capabilities.canReadRevenue;
  const latestContract = overview.contracts[0] ?? null;
  const projectName = formatProjectCoupleDisplayName(overview.project, 0);
  const projectReference = formatProjectDisplayReference(overview.project, 0);
  const activeSelectionByEventId = new Map(
    overview.selections.map((selection) => [selection.event_id, selection]),
  );
  const notice = noticeFromSearchParams(notices);
  const canSelectEventPackage =
    capabilities.canManagePricing &&
    overview.events.length > 0 &&
    overview.packages.length > 0;
  const canRecordPayment =
    capabilities.canRecordPayments && Boolean(latestContract);
  const balance = overview.balance;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
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
              render={<Link href={`/platform/projects/${projectId}`} />}
            >
              {projectReference.value}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Commercial controls</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{projectReference.value}</Badge>
            <Badge variant={badgeVariant(latestContract?.status)}>
              {latestContract
                ? statusLabel(latestContract.status)
                : "No contract yet"}
            </Badge>
            <Badge variant={badgeVariant(balance?.gateStatus)}>
              {statusLabel(balance?.gateStatus ?? "locked")}
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl leading-tight font-semibold tracking-normal text-balance">
              Contracts, pricing, and payments
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground text-pretty">
              Manage service packages, event pricing, contract approval, manual
              payment records, and controlled access exceptions for{" "}
              {projectName}.
            </p>
          </div>
        </div>
        <Link
          aria-label={`Back to project overview for ${projectName}`}
          className={buttonVariants({ variant: "outline" })}
          href={`/platform/projects/${projectId}`}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Project overview
        </Link>
      </section>

      {notice ? (
        <Alert variant={notice.tone === "danger" ? "destructive" : "default"}>
          {notice.tone === "danger" ? (
            <TriangleAlertIcon aria-hidden="true" />
          ) : (
            <CheckCircle2Icon aria-hidden="true" />
          )}
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.description}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Access readiness</CardTitle>
              <CardDescription>
                The current commercial state that controls guest-list access,
                guest pages, and invitation sending.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoTile
                  label="Guest list"
                  value={statusLabel(overview.project.guest_list_access_status)}
                />
                <InfoTile
                  label="Guest page and invitations"
                  value={statusLabel(overview.project.guest_page_access_status)}
                />
                <InfoTile
                  label="Expected project total"
                  value={formatUsd(balance?.expectedAmountCents ?? 0)}
                />
                <InfoTile
                  label="Balance due"
                  value={formatUsd(balance?.balanceDueCents ?? 0)}
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pricing">
            <TabsList className="h-auto! w-full flex-wrap justify-start gap-1">
              <TabsTrigger className="flex-none" value="pricing">
                <CircleDollarSignIcon
                  aria-hidden="true"
                  data-icon="inline-start"
                />
                Pricing
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="contract">
                <FileCheck2Icon aria-hidden="true" data-icon="inline-start" />
                Contract
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="payments">
                <BanknoteIcon aria-hidden="true" data-icon="inline-start" />
                Payments
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="catalog">
                <PackageIcon aria-hidden="true" data-icon="inline-start" />
                Services
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="access">
                <ShieldCheckIcon aria-hidden="true" data-icon="inline-start" />
                Access
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pricing">
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event package selection</CardTitle>
                    <CardDescription>
                      Choose the service package and planned guest count that
                      should shape the current price estimate.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    {canSelectEventPackage ? (
                      <form
                        action={selectEventPackageAction.bind(null, projectId)}
                        className="flex flex-col gap-5"
                      >
                        <FieldSet>
                          <FieldLegend>Package selection</FieldLegend>
                          <FieldGroup className="grid gap-4 lg:grid-cols-3">
                            <Field>
                              <FieldLabel htmlFor="eventId">Event</FieldLabel>
                              <NativeSelect
                                className="w-full"
                                id="eventId"
                                name="eventId"
                                required
                              >
                                {overview.events.map((event, eventIndex) => (
                                  <NativeSelectOption
                                    key={event.id}
                                    value={event.id}
                                  >
                                    {formatProjectEventDisplayName(
                                      event,
                                      eventIndex,
                                    )}
                                  </NativeSelectOption>
                                ))}
                              </NativeSelect>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="servicePackageId">
                                Package
                              </FieldLabel>
                              <NativeSelect
                                className="w-full"
                                id="servicePackageId"
                                name="servicePackageId"
                                required
                              >
                                {overview.packages.map((item, packageIndex) => (
                                  <NativeSelectOption
                                    key={item.id}
                                    value={item.id}
                                  >
                                    {servicePackageOptionLabel(
                                      item,
                                      packageIndex,
                                    )}
                                  </NativeSelectOption>
                                ))}
                              </NativeSelect>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="plannedGuestCount">
                                Planned guests
                              </FieldLabel>
                              <Input
                                id="plannedGuestCount"
                                min="0"
                                name="plannedGuestCount"
                                required
                                type="number"
                              />
                            </Field>
                          </FieldGroup>
                        </FieldSet>

                        {overview.addons.length > 0 ? (
                          <FieldSet>
                            <FieldLegend>Optional add-ons</FieldLegend>
                            <FieldGroup
                              className="grid gap-3 sm:grid-cols-2"
                              data-slot="checkbox-group"
                            >
                              {overview.addons.map((addon, addonIndex) => (
                                <Field
                                  className="rounded-lg border bg-background p-3"
                                  key={addon.id}
                                  orientation="horizontal"
                                >
                                  <input
                                    className="mt-0.5 size-4 shrink-0"
                                    id={`addon-${addon.id}`}
                                    name="addonIds"
                                    type="checkbox"
                                    value={addon.id}
                                  />
                                  <div className="flex flex-col gap-1">
                                    <FieldLabel htmlFor={`addon-${addon.id}`}>
                                      {addonDisplayName(addon, addonIndex)}
                                    </FieldLabel>
                                    <FieldDescription>
                                      {formatUsd(addon.price_cents)} -{" "}
                                      {statusLabel(addon.pricing_mode)}
                                    </FieldDescription>
                                  </div>
                                </Field>
                              ))}
                            </FieldGroup>
                          </FieldSet>
                        ) : null}

                        <div className="flex justify-end">
                          <Button
                            aria-label={`Save event package selections for ${projectName}`}
                            type="submit"
                          >
                            <CheckCircle2Icon
                              aria-hidden="true"
                              data-icon="inline-start"
                            />
                            Save selection
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Alert>
                        <PackageIcon aria-hidden="true" />
                        <AlertTitle>Package selection is not ready</AlertTitle>
                        <AlertDescription>
                          Add at least one event and one active service package,
                          or ask an authorized Diginoces user to manage pricing.
                        </AlertDescription>
                      </Alert>
                    )}

                    {overview.events.length === 0 ? (
                      <Empty className="border">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <PackageIcon aria-hidden="true" />
                          </EmptyMedia>
                          <EmptyTitle>No events available</EmptyTitle>
                          <EmptyDescription>
                            Event package selections will appear after events
                            are added to the wedding.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <>
                        <div className="grid gap-3 md:hidden">
                          {overview.events.map((event, eventIndex) => {
                            const selection = activeSelectionByEventId.get(
                              event.id,
                            );
                            const servicePackage = overview.packages.find(
                              (item) =>
                                item.id === selection?.service_package_id,
                            );
                            const servicePackageIndex = servicePackage
                              ? overview.packages.findIndex(
                                  (item) => item.id === servicePackage.id,
                                )
                              : -1;
                            const servicePackageLabel =
                              servicePackage && servicePackageIndex >= 0
                                ? servicePackageName(
                                    servicePackage,
                                    servicePackageIndex,
                                  )
                                : "Unassigned";

                            return (
                              <div className="workflow-record" key={event.id}>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-medium">
                                      {formatProjectEventDisplayName(
                                        event,
                                        eventIndex,
                                      )}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {event.event_date
                                        ? formatDate(event.event_date)
                                        : "Date not set"}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={selection ? "default" : "outline"}
                                  >
                                    {selection
                                      ? formatUsd(
                                          selection.calculated_amount_cents,
                                        )
                                      : "Pending"}
                                  </Badge>
                                </div>
                                <Separator />
                                <div className="grid gap-2 text-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">
                                      Package
                                    </span>
                                    <span className="text-right">
                                      {servicePackageLabel}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-muted-foreground">
                                      Planned guests
                                    </span>
                                    <span>
                                      {selection
                                        ? selection.planned_guest_count
                                        : "Not set"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Package</TableHead>
                                <TableHead>Planned guests</TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {overview.events.map((event, eventIndex) => {
                                const selection = activeSelectionByEventId.get(
                                  event.id,
                                );
                                const servicePackage = overview.packages.find(
                                  (item) =>
                                    item.id === selection?.service_package_id,
                                );
                                const servicePackageIndex = servicePackage
                                  ? overview.packages.findIndex(
                                      (item) => item.id === servicePackage.id,
                                    )
                                  : -1;
                                const servicePackageLabel =
                                  servicePackage && servicePackageIndex >= 0
                                    ? servicePackageName(
                                        servicePackage,
                                        servicePackageIndex,
                                      )
                                    : "Unassigned";

                                return (
                                  <TableRow key={event.id}>
                                    <TableCell className="min-w-56 whitespace-normal">
                                      <div className="flex flex-col gap-1">
                                        <strong className="text-sm font-medium">
                                          {formatProjectEventDisplayName(
                                            event,
                                            eventIndex,
                                          )}
                                        </strong>
                                        <span className="text-xs text-muted-foreground">
                                          {event.event_date
                                            ? formatDate(event.event_date)
                                            : "Date not set"}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{servicePackageLabel}</TableCell>
                                    <TableCell>
                                      {selection
                                        ? selection.planned_guest_count
                                        : "Not set"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          selection ? "default" : "outline"
                                        }
                                      >
                                        {selection
                                          ? formatUsd(
                                              selection.calculated_amount_cents,
                                            )
                                          : "Pending"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Price estimate</CardTitle>
                    <CardDescription>
                      Current project pricing from selected event packages and
                      approved adjustments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <PricingPreview
                      canReadCommercialGestures={canReadCommercialGestures}
                      pricing={overview.pricing}
                    />

                    <div className="flex flex-col gap-4">
                      {capabilities.canCalculatePricing ? (
                        <form
                          action={calculatePricingAction.bind(null, projectId)}
                        >
                          <Button
                            aria-label={`Save the current price estimate for ${projectName}`}
                            type="submit"
                            variant="secondary"
                          >
                            <CircleDollarSignIcon
                              aria-hidden="true"
                              data-icon="inline-start"
                            />
                            Save pricing calculation
                          </Button>
                        </form>
                      ) : null}

                      {capabilities.canManageGestures ? (
                        <>
                          <Separator />
                          <form
                            action={applyCommercialGestureAction.bind(
                              null,
                              projectId,
                            )}
                            className="flex flex-col gap-5"
                          >
                            <FieldSet>
                              <FieldLegend>Approved adjustment</FieldLegend>
                              <FieldDescription>
                                Record only authorized price adjustments with a
                                clear reason.
                              </FieldDescription>
                              <FieldGroup className="grid gap-4 lg:grid-cols-4">
                                <Field>
                                  <FieldLabel htmlFor="gestureType">
                                    Type
                                  </FieldLabel>
                                  <NativeSelect
                                    className="w-full"
                                    defaultValue="fixed_amount"
                                    id="gestureType"
                                    name="gestureType"
                                  >
                                    <NativeSelectOption value="fixed_amount">
                                      Fixed amount
                                    </NativeSelectOption>
                                    <NativeSelectOption value="percentage">
                                      Percentage
                                    </NativeSelectOption>
                                  </NativeSelect>
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor="amountCents">
                                    Fixed amount in cents
                                  </FieldLabel>
                                  <Input
                                    id="amountCents"
                                    min="1"
                                    name="amountCents"
                                    type="number"
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor="percentageBps">
                                    Percentage basis points
                                  </FieldLabel>
                                  <Input
                                    id="percentageBps"
                                    min="1"
                                    name="percentageBps"
                                    type="number"
                                  />
                                </Field>
                                <Field>
                                  <FieldLabel htmlFor="gestureReason">
                                    Reason
                                  </FieldLabel>
                                  <Input
                                    id="gestureReason"
                                    name="reason"
                                    required
                                  />
                                </Field>
                              </FieldGroup>
                            </FieldSet>
                            <div className="flex justify-end">
                              <Button
                                aria-label={`Apply a price adjustment for ${projectName}`}
                                type="submit"
                                variant="secondary"
                              >
                                <PercentIcon
                                  aria-hidden="true"
                                  data-icon="inline-start"
                                />
                                Apply adjustment
                              </Button>
                            </div>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contract">
              <Card>
                <CardHeader>
                  <CardTitle>Project contract</CardTitle>
                  <CardDescription>
                    Generate and approve the project-level contract for the
                    selected wedding services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {capabilities.canGenerateContracts ? (
                    <form action={generateContractAction.bind(null, projectId)}>
                      <Button
                        aria-label={`Generate a project contract for ${projectName}`}
                        type="submit"
                      >
                        <FileTextIcon
                          aria-hidden="true"
                          data-icon="inline-start"
                        />
                        Generate project contract
                      </Button>
                    </form>
                  ) : null}

                  {latestContract ? (
                    <div className="flex flex-col gap-5">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoTile
                          label="Contract"
                          value={latestContract.contract_number}
                        />
                        <InfoTile
                          label="Status"
                          value={statusLabel(latestContract.status)}
                        />
                        <InfoTile
                          label="Version"
                          value={`Version ${latestContract.version}`}
                        />
                        <InfoTile
                          label="Total"
                          value={formatUsd(latestContract.final_amount_cents)}
                        />
                      </div>

                      <div className="workflow-callout">
                        <pre className="max-h-96 overflow-auto text-xs leading-6 whitespace-pre-wrap text-foreground">
                          {latestContract.rendered_contract}
                        </pre>
                      </div>

                      {capabilities.canApproveContracts &&
                      latestContract.status !== "approved" ? (
                        <form
                          action={approveContractAction.bind(
                            null,
                            projectId,
                            latestContract.id,
                          )}
                          className="flex flex-col gap-5"
                        >
                          <FieldSet>
                            <FieldLegend>Approval</FieldLegend>
                            <FieldDescription>
                              Approval is recorded in the audit trail and opens
                              the commercial path for guest-list access.
                            </FieldDescription>
                            <FieldGroup>
                              <Field
                                className="rounded-lg border bg-background p-3"
                                orientation="horizontal"
                              >
                                <input
                                  className="mt-0.5 size-4 shrink-0"
                                  id="approvalChecked"
                                  name="approvalChecked"
                                  required
                                  type="checkbox"
                                />
                                <FieldLabel htmlFor="approvalChecked">
                                  I have reviewed this contract and approve it
                                  in Diginoces.
                                </FieldLabel>
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="confirmationText">
                                  Approval confirmation
                                </FieldLabel>
                                <Input
                                  id="confirmationText"
                                  name="confirmationText"
                                  required
                                />
                              </Field>
                            </FieldGroup>
                          </FieldSet>
                          <div className="flex justify-end">
                            <Button
                              aria-label={`Approve contract ${latestContract.contract_number} for ${projectName}`}
                              type="submit"
                            >
                              <FileCheck2Icon
                                aria-hidden="true"
                                data-icon="inline-start"
                              />
                              Approve contract
                            </Button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileTextIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>No contract generated yet</EmptyTitle>
                        <EmptyDescription>
                          Generate a contract when the package selections,
                          pricing estimate, and access decision are ready for
                          review.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Manual payments</CardTitle>
                  <CardDescription>
                    Record and confirm payments that control guest-facing
                    access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {canRecordPayment && latestContract ? (
                    <form
                      action={recordPaymentAction.bind(null, projectId)}
                      className="flex flex-col gap-5"
                    >
                      <input
                        name="contractId"
                        type="hidden"
                        value={latestContract.id}
                      />
                      <input
                        name="expectedAmountCents"
                        type="hidden"
                        value={balance?.expectedAmountCents ?? 0}
                      />
                      <FieldSet>
                        <FieldLegend>Payment record</FieldLegend>
                        <FieldGroup className="grid gap-4 lg:grid-cols-3">
                          <Field>
                            <FieldLabel htmlFor="paidAmountCents">
                              Paid amount in cents
                            </FieldLabel>
                            <Input
                              id="paidAmountCents"
                              min="1"
                              name="paidAmountCents"
                              required
                              type="number"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="paymentMethod">
                              Method
                            </FieldLabel>
                            <Input
                              id="paymentMethod"
                              name="paymentMethod"
                              placeholder="Bank transfer"
                              required
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="paymentDate">
                              Payment date
                            </FieldLabel>
                            <Input
                              id="paymentDate"
                              name="paymentDate"
                              type="date"
                            />
                          </Field>
                          <Field className="lg:col-span-3">
                            <FieldLabel htmlFor="referenceNote">
                              Reference note
                            </FieldLabel>
                            <Input id="referenceNote" name="referenceNote" />
                          </Field>
                          {capabilities.canConfirmPayments ? (
                            <Field
                              className="rounded-lg border bg-background p-3 lg:col-span-3"
                              orientation="horizontal"
                            >
                              <input
                                className="mt-0.5 size-4 shrink-0"
                                id="confirmNow"
                                name="confirmNow"
                                type="checkbox"
                              />
                              <FieldLabel htmlFor="confirmNow">
                                Confirm this payment immediately
                              </FieldLabel>
                            </Field>
                          ) : null}
                        </FieldGroup>
                      </FieldSet>
                      <div className="flex justify-end">
                        <Button
                          aria-label={`Record a manual payment for ${projectName}`}
                          type="submit"
                        >
                          <BanknoteIcon
                            aria-hidden="true"
                            data-icon="inline-start"
                          />
                          Record payment
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {overview.payments.length === 0 ? (
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <BanknoteIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>No manual payments yet</EmptyTitle>
                        <EmptyDescription>
                          Recorded payments will appear here with confirmation
                          status and payment date.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      <div className="grid gap-3 md:hidden">
                        {overview.payments.map((payment) => (
                          <div className="workflow-record" key={payment.id}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium">
                                  {formatUsd(payment.paid_amount_cents)}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {formatDate(payment.payment_date)}
                                </p>
                              </div>
                              <Badge variant={badgeVariant(payment.status)}>
                                {statusLabel(payment.status)}
                              </Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-muted-foreground">
                                Method
                              </span>
                              <span>{payment.payment_method}</span>
                            </div>
                            {capabilities.canConfirmPayments &&
                            payment.status === "recorded" ? (
                              <form
                                action={confirmPaymentAction.bind(
                                  null,
                                  projectId,
                                  payment.id,
                                )}
                              >
                                <Button
                                  aria-label={`Confirm payment ${formatUsd(
                                    payment.paid_amount_cents,
                                  )} for ${projectName}`}
                                  className="w-full"
                                  type="submit"
                                  variant="secondary"
                                >
                                  Confirm
                                </Button>
                              </form>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No action
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Payment</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {overview.payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="min-w-48 whitespace-normal">
                                  <div className="flex flex-col gap-1">
                                    <strong className="text-sm font-medium">
                                      {formatUsd(payment.paid_amount_cents)}
                                    </strong>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(payment.payment_date)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{payment.payment_method}</TableCell>
                                <TableCell>
                                  <Badge variant={badgeVariant(payment.status)}>
                                    {statusLabel(payment.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {capabilities.canConfirmPayments &&
                                  payment.status === "recorded" ? (
                                    <form
                                      action={confirmPaymentAction.bind(
                                        null,
                                        projectId,
                                        payment.id,
                                      )}
                                    >
                                      <Button
                                        aria-label={`Confirm payment ${formatUsd(
                                          payment.paid_amount_cents,
                                        )} for ${projectName}`}
                                        type="submit"
                                        variant="secondary"
                                      >
                                        Confirm
                                      </Button>
                                    </form>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      No action
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog">
              <div className="flex flex-col gap-6">
                {capabilities.canManagePackages ? (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Create service package</CardTitle>
                        <CardDescription>
                          Add a reusable package for event pricing.
                        </CardDescription>
                      </CardHeader>
                      <form action={createPackageAction.bind(null, projectId)}>
                        <CardContent>
                          <FieldSet>
                            <FieldLegend>Package details</FieldLegend>
                            <FieldGroup>
                              <Field>
                                <FieldLabel htmlFor="packageCode">
                                  Package reference
                                </FieldLabel>
                                <Input
                                  id="packageCode"
                                  name="packageCode"
                                  placeholder="full-service"
                                  required
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="packageName">
                                  Package name
                                </FieldLabel>
                                <Input
                                  id="packageName"
                                  name="name"
                                  placeholder="Full service"
                                  required
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="packagePricingMode">
                                  Pricing mode
                                </FieldLabel>
                                <NativeSelect
                                  className="w-full"
                                  defaultValue="base_plus_per_guest"
                                  id="packagePricingMode"
                                  name="pricingMode"
                                >
                                  <NativeSelectOption value="flat">
                                    Flat
                                  </NativeSelectOption>
                                  <NativeSelectOption value="per_guest">
                                    Per guest
                                  </NativeSelectOption>
                                  <NativeSelectOption value="base_plus_per_guest">
                                    Base plus guests
                                  </NativeSelectOption>
                                </NativeSelect>
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="basePriceCents">
                                  Base price in cents
                                </FieldLabel>
                                <Input
                                  id="basePriceCents"
                                  min="0"
                                  name="basePriceCents"
                                  required
                                  type="number"
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="includedGuestCount">
                                  Included guests
                                </FieldLabel>
                                <Input
                                  id="includedGuestCount"
                                  min="0"
                                  name="includedGuestCount"
                                  type="number"
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="pricePerAdditionalGuestCents">
                                  Extra guest price in cents
                                </FieldLabel>
                                <Input
                                  id="pricePerAdditionalGuestCents"
                                  min="0"
                                  name="pricePerAdditionalGuestCents"
                                  type="number"
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="packageDescription">
                                  Package description
                                </FieldLabel>
                                <Textarea
                                  id="packageDescription"
                                  name="description"
                                  rows={3}
                                />
                              </Field>
                            </FieldGroup>
                          </FieldSet>
                        </CardContent>
                        <CardFooter className="justify-end">
                          <Button
                            aria-label={`Create a service package for ${projectName}`}
                            type="submit"
                          >
                            <PlusIcon
                              aria-hidden="true"
                              data-icon="inline-start"
                            />
                            Create package
                          </Button>
                        </CardFooter>
                      </form>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Create add-on</CardTitle>
                        <CardDescription>
                          Add optional services that can be selected for events.
                        </CardDescription>
                      </CardHeader>
                      <form action={createAddonAction.bind(null, projectId)}>
                        <CardContent>
                          <FieldSet>
                            <FieldLegend>Add-on details</FieldLegend>
                            <FieldGroup>
                              <Field>
                                <FieldLabel htmlFor="addonCode">
                                  Add-on reference
                                </FieldLabel>
                                <Input
                                  id="addonCode"
                                  name="addonCode"
                                  placeholder="vip-table-cards"
                                  required
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="addonName">
                                  Add-on name
                                </FieldLabel>
                                <Input
                                  id="addonName"
                                  name="name"
                                  placeholder="VIP table cards"
                                  required
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="addonPricingMode">
                                  Pricing mode
                                </FieldLabel>
                                <NativeSelect
                                  className="w-full"
                                  defaultValue="flat"
                                  id="addonPricingMode"
                                  name="pricingMode"
                                >
                                  <NativeSelectOption value="flat">
                                    Flat
                                  </NativeSelectOption>
                                  <NativeSelectOption value="per_guest">
                                    Per guest
                                  </NativeSelectOption>
                                </NativeSelect>
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="priceCents">
                                  Price in cents
                                </FieldLabel>
                                <Input
                                  id="priceCents"
                                  min="1"
                                  name="priceCents"
                                  required
                                  type="number"
                                />
                              </Field>
                              <Field>
                                <FieldLabel htmlFor="addonDescription">
                                  Add-on description
                                </FieldLabel>
                                <Textarea
                                  id="addonDescription"
                                  name="description"
                                  rows={3}
                                />
                              </Field>
                            </FieldGroup>
                          </FieldSet>
                        </CardContent>
                        <CardFooter className="justify-end">
                          <Button
                            aria-label={`Create an add-on for ${projectName}`}
                            type="submit"
                          >
                            <PlusIcon
                              aria-hidden="true"
                              data-icon="inline-start"
                            />
                            Create add-on
                          </Button>
                        </CardFooter>
                      </form>
                    </Card>
                  </div>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle>Service catalog</CardTitle>
                    <CardDescription>
                      Active packages and add-ons available to the wedding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {overview.packages.length + overview.addons.length === 0 ? (
                      <Empty className="border">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <PackageIcon aria-hidden="true" />
                          </EmptyMedia>
                          <EmptyTitle>No catalog items yet</EmptyTitle>
                          <EmptyDescription>
                            Packages and add-ons will appear here after they are
                            created for this wedding.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <>
                        <div className="grid gap-3 md:hidden">
                          {overview.packages.map((item, index) => (
                            <div className="workflow-record" key={item.id}>
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-medium">
                                    {servicePackageName(item, index)}
                                  </h3>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {item.package_code}
                                  </p>
                                </div>
                                <Badge variant={badgeVariant(item.status)}>
                                  {statusLabel(item.status)}
                                </Badge>
                              </div>
                              <Separator />
                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Mode
                                  </span>
                                  <span>{statusLabel(item.pricing_mode)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Amount
                                  </span>
                                  <span>
                                    {formatUsd(item.base_price_cents)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {overview.addons.map((addon, index) => (
                            <div className="workflow-record" key={addon.id}>
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-medium">
                                    {addonDisplayName(addon, index)}
                                  </h3>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {addon.addon_code}
                                  </p>
                                </div>
                                <Badge variant={badgeVariant(addon.status)}>
                                  {statusLabel(addon.status)}
                                </Badge>
                              </div>
                              <Separator />
                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Mode
                                  </span>
                                  <span>{statusLabel(addon.pricing_mode)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    Amount
                                  </span>
                                  <span>{formatUsd(addon.price_cents)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {overview.packages.map((item, index) => (
                                <TableRow key={item.id}>
                                  <TableCell className="min-w-56 whitespace-normal">
                                    <div className="flex flex-col gap-1">
                                      <strong className="text-sm font-medium">
                                        {servicePackageName(item, index)}
                                      </strong>
                                      <span className="text-xs text-muted-foreground">
                                        {item.package_code}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {statusLabel(item.pricing_mode)}
                                  </TableCell>
                                  <TableCell>
                                    {formatUsd(item.base_price_cents)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={badgeVariant(item.status)}>
                                      {statusLabel(item.status)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {overview.addons.map((addon, index) => (
                                <TableRow key={addon.id}>
                                  <TableCell className="min-w-56 whitespace-normal">
                                    <div className="flex flex-col gap-1">
                                      <strong className="text-sm font-medium">
                                        {addonDisplayName(addon, index)}
                                      </strong>
                                      <span className="text-xs text-muted-foreground">
                                        {addon.addon_code}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {statusLabel(addon.pricing_mode)}
                                  </TableCell>
                                  <TableCell>
                                    {formatUsd(addon.price_cents)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={badgeVariant(addon.status)}>
                                      {statusLabel(addon.status)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="access">
              <div className="flex flex-col gap-6">
                {capabilities.canManageExceptions ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Access exception</CardTitle>
                      <CardDescription>
                        Approve temporary guest-facing access before payment is
                        complete.
                      </CardDescription>
                    </CardHeader>
                    <form
                      action={createPaymentExceptionAction.bind(
                        null,
                        projectId,
                      )}
                    >
                      <CardContent>
                        <FieldSet>
                          <FieldLegend>Exception terms</FieldLegend>
                          <FieldGroup>
                            <Field>
                              <FieldLabel htmlFor="exceptionReason">
                                Exception reason
                              </FieldLabel>
                              <Input
                                id="exceptionReason"
                                name="reason"
                                placeholder="Payment confirmation is expected today"
                                required
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="conditions">
                                Access conditions
                              </FieldLabel>
                              <Input
                                id="conditions"
                                name="conditions"
                                placeholder="Access remains open until the agreed date"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="expiresAt">
                                Access end date
                              </FieldLabel>
                              <Input
                                id="expiresAt"
                                name="expiresAt"
                                type="datetime-local"
                              />
                            </Field>
                          </FieldGroup>
                        </FieldSet>
                      </CardContent>
                      <CardFooter className="justify-end">
                        <Button
                          aria-label={`Approve a temporary access exception for ${projectName}`}
                          type="submit"
                        >
                          <ShieldCheckIcon
                            aria-hidden="true"
                            data-icon="inline-start"
                          />
                          Approve exception
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                ) : null}

                {capabilities.canManageAddendums && latestContract ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Addendums</CardTitle>
                      <CardDescription>
                        Record contract changes when paid scope increases after
                        approval.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                      <form
                        action={createAddendumAction.bind(null, projectId)}
                        className="flex flex-col gap-5"
                      >
                        <input
                          name="contractId"
                          type="hidden"
                          value={latestContract.id}
                        />
                        <input
                          name="projectCode"
                          type="hidden"
                          value={overview.project.project_code}
                        />
                        <FieldSet>
                          <FieldLegend>Addendum details</FieldLegend>
                          <FieldGroup className="grid gap-4 lg:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor="additionalAmountCents">
                                Additional amount in cents
                              </FieldLabel>
                              <Input
                                id="additionalAmountCents"
                                min="1"
                                name="additionalAmountCents"
                                required
                                type="number"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="addendumReason">
                                Reason
                              </FieldLabel>
                              <Input
                                id="addendumReason"
                                name="reason"
                                required
                              />
                            </Field>
                          </FieldGroup>
                        </FieldSet>
                        <div className="flex justify-end">
                          <Button
                            aria-label={`Create a contract addendum for ${projectName}`}
                            type="submit"
                            variant="secondary"
                          >
                            Create addendum
                          </Button>
                        </div>
                      </form>

                      {overview.addendums.length === 0 ? (
                        <Empty className="border">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <FileCheck2Icon aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>No addendums yet</EmptyTitle>
                            <EmptyDescription>
                              Contract changes will appear here after they are
                              recorded.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <>
                          <div className="grid gap-3 md:hidden">
                            {overview.addendums.map((addendum) => (
                              <div
                                className="workflow-record"
                                key={addendum.id}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-medium">
                                      {addendum.addendum_number}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {addendum.reason}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={badgeVariant(addendum.status)}
                                  >
                                    {statusLabel(addendum.status)}
                                  </Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="text-muted-foreground">
                                    Amount
                                  </span>
                                  <span>
                                    {formatUsd(
                                      addendum.additional_amount_cents,
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Addendum</TableHead>
                                  <TableHead>Reason</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {overview.addendums.map((addendum) => (
                                  <TableRow key={addendum.id}>
                                    <TableCell>
                                      {addendum.addendum_number}
                                    </TableCell>
                                    <TableCell className="min-w-64 whitespace-normal">
                                      {addendum.reason}
                                    </TableCell>
                                    <TableCell>
                                      {formatUsd(
                                        addendum.additional_amount_cents,
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={badgeVariant(addendum.status)}
                                      >
                                        {statusLabel(addendum.status)}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {capabilities.canReadPayments ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Access history</CardTitle>
                      <CardDescription>
                        Recent payment-gate decisions for guest pages and
                        invitation sending.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {overview.gateEvents.length === 0 ? (
                        <Empty className="border">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <ShieldCheckIcon aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>No access decisions yet</EmptyTitle>
                            <EmptyDescription>
                              Payment-gate decisions will appear after payment
                              confirmation or an approved exception.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <>
                          <div className="grid gap-3 md:hidden">
                            {overview.gateEvents.map((event) => (
                              <div className="workflow-record" key={event.id}>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-medium">
                                      {statusLabel(event.gate_type)}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {event.reason}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={badgeVariant(event.new_status)}
                                  >
                                    {statusLabel(event.new_status)}
                                  </Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="text-muted-foreground">
                                    Date
                                  </span>
                                  <span>{formatDate(event.created_at)}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Gate</TableHead>
                                  <TableHead>Reason</TableHead>
                                  <TableHead>State</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {overview.gateEvents.map((event) => (
                                  <TableRow key={event.id}>
                                    <TableCell>
                                      {statusLabel(event.gate_type)}
                                    </TableCell>
                                    <TableCell className="min-w-64 whitespace-normal">
                                      {event.reason}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={badgeVariant(event.new_status)}
                                      >
                                        {statusLabel(event.new_status)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(event.created_at)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Wedding context</CardTitle>
              <CardDescription>
                Confirm the project before changing commercial records.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <InfoTile
                label={projectReference.label}
                value={projectReference.value}
              />
              <InfoTile label="Couple" value={projectName} />
              <Separator />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Events</span>
                <Badge>{pluralize(overview.events.length, "event")}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Payments</span>
                <Badge>{pluralize(overview.payments.length, "payment")}</Badge>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon aria-hidden="true" />
            <AlertTitle>Commercial access is role-protected</AlertTitle>
            <AlertDescription>
              Package, contract, payment, exception, and revenue details are
              shown only when the current role has the matching server-side
              permission.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Current balance</CardTitle>
              <CardDescription>
                Payment gate summary for guest-facing access.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <InfoTile
                label="Confirmed paid"
                value={formatUsd(balance?.confirmedPaidAmountCents ?? 0)}
              />
              <InfoTile
                label="Expected amount"
                value={formatUsd(balance?.expectedAmountCents ?? 0)}
              />
              <InfoTile
                description={balance?.gateReason}
                label="Gate state"
                value={statusLabel(balance?.gateStatus ?? "locked")}
              />
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
