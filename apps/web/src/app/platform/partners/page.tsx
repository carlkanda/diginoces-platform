import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  Building2Icon,
  ClipboardCheckIcon,
  PlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import { createPartnerAction } from "@/app/platform/partners/actions";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { serverLogger } from "@/lib/logging";
import { hasGlobalPartnerPermission } from "@/lib/partners/partner-api";
import { listPartners } from "@/lib/partners/partner-db";
import {
  formatPartnerContactDisplay,
  formatPartnerOrganizationDisplay,
  getPartnerIndexActionVisibility,
} from "@/lib/partners/partner-service";
import { getReportingPermissionSet } from "@/lib/reports/report-api";

export const dynamic = "force-dynamic";

function partnerRowId(partner: { id?: unknown }) {
  if (typeof partner.id !== "string" || partner.id.length === 0) {
    throw new Error("Partner row is missing a valid id.");
  }

  return partner.id;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLabel(value: unknown) {
  const text = typeof value === "string" ? value : String(value ?? "");

  if (!text) {
    return "Not set";
  }

  return text
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function partnerStatusCounts(
  partners: Awaited<ReturnType<typeof listPartners>>,
) {
  return partners.reduce((counts, partner) => {
    const status =
      typeof partner.status === "string" && partner.status.length > 0
        ? partner.status
        : "unknown";

    counts.set(status, (counts.get(status) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

export default async function PartnersPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/partners"));
  }

  if (authContext.status === "not_configured") {
    return (
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/platform" />}>
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Partners</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Partners</CardTitle>
            <CardDescription>
              Connect the workspace before loading partner records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Building2Icon aria-hidden="true" />
              <AlertTitle>Partner records are not connected</AlertTitle>
              <AlertDescription>
                Approved profiles will appear here after secure workspace access
                is ready.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = authContext.supabase;
  const [partners, canManagePartners, canReviewPartnerProjects] =
    await Promise.all([
      listPartners(supabase),
      hasGlobalPartnerPermission(supabase, "partners.manage").catch(
        (error: unknown) => {
          serverLogger.error("Partner manage permission check failed.", {
            error,
          });

          return false;
        },
      ),
      hasGlobalPartnerPermission(supabase, "partner_projects.review").catch(
        (error: unknown) => {
          serverLogger.error("Partner review permission check failed.", {
            error,
          });

          return false;
        },
      ),
    ]);
  const context = { supabase, user: authContext.user };
  const partnerDashboardAccess = await Promise.all(
    partners.map(async (partner) => {
      const partnerId = partnerRowId(partner);

      try {
        const permissions = await getReportingPermissionSet(context, {
          customScopeId: partnerId,
          includeCustom: true,
        });

        return permissions.has("dashboards.partner.read");
      } catch (error) {
        serverLogger.error("Partner dashboard permission check failed.", {
          error,
          partnerId,
        });

        return false;
      }
    }),
  );
  const actionVisibility = getPartnerIndexActionVisibility({
    canManagePartners,
    canOpenPartnerDashboard: partnerDashboardAccess.some(Boolean),
    canReviewPartnerProjects,
  });
  const statusCounts = partnerStatusCounts(partners);
  const activeCount = statusCounts.get("active") ?? 0;
  const pendingCount = statusCounts.get("pending") ?? 0;
  const visibleActions = [
    actionVisibility.showReviewQueue ? "Review queue" : null,
    actionVisibility.showPartnerDashboard ? "Partner dashboard" : null,
    actionVisibility.showCreatePartner ? "Create partner" : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/platform" />}>
              Workspace
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Partners</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Partner network</Badge>
                <Badge variant="outline">
                  {pluralize(partners.length, "profile")}
                </Badge>
                <Badge variant={canManagePartners ? "secondary" : "outline"}>
                  {canManagePartners ? "Manager access" : "Read access"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-balance">
                  Partners
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground text-pretty">
                  Manage trusted partner profiles, review partner-submitted
                  wedding work, and keep Diginoces in control of final client
                  access.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {actionVisibility.showReviewQueue ? (
                <Button
                  render={<Link href="/platform/partners/review" />}
                  variant="outline"
                >
                  <ClipboardCheckIcon data-icon="inline-start" />
                  Review queue
                </Button>
              ) : null}
              {actionVisibility.showPartnerDashboard ? (
                <Button
                  render={<Link href="/platform/partner-dashboard" />}
                  variant="outline"
                >
                  <UsersRoundIcon data-icon="inline-start" />
                  Partner dashboard
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="partner-network__metrics">
            <div className="partner-network__metric">
              <span className="partner-network__metric-label">
                Active profiles
              </span>
              <strong className="partner-network__metric-value">
                {activeCount}
              </strong>
              <span className="partner-network__metric-note">
                Partners ready for assigned or submitted work.
              </span>
            </div>
            <div className="partner-network__metric">
              <span className="partner-network__metric-label">
                Pending profiles
              </span>
              <strong className="partner-network__metric-value">
                {pendingCount}
              </strong>
              <span className="partner-network__metric-note">
                Profiles waiting for profile or access decisions.
              </span>
            </div>
            <div className="partner-network__metric">
              <span className="partner-network__metric-label">
                Available actions
              </span>
              <strong className="partner-network__metric-value">
                {visibleActions.length}
              </strong>
              <span className="partner-network__metric-note">
                {visibleActions.length > 0
                  ? visibleActions.join(", ")
                  : "No partner actions for this account."}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {actionVisibility.showCreatePartner ? (
        <Card>
          <CardHeader>
            <CardTitle>Create partner profile</CardTitle>
            <CardDescription>
              Add the organization first. Account access and project work stay
              controlled separately.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">Access added later</Badge>
            </CardAction>
          </CardHeader>
          <form action={createPartnerAction}>
            <CardContent>
              <FieldSet>
                <FieldLegend>Partner details</FieldLegend>
                <FieldGroup className="md:grid md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="organizationName">
                      Organization
                    </FieldLabel>
                    <Input
                      id="organizationName"
                      name="organizationName"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="partnerType">Partner type</FieldLabel>
                    <Input
                      defaultValue="Planner"
                      id="partnerType"
                      name="partnerType"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="primaryContactName">
                      Primary contact
                    </FieldLabel>
                    <Input id="primaryContactName" name="primaryContactName" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contactEmail">
                      Contact email
                    </FieldLabel>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      required
                      type="email"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contactPhone">
                      Contact phone
                    </FieldLabel>
                    <Input id="contactPhone" name="contactPhone" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="whatsappPhone">
                      WhatsApp phone
                    </FieldLabel>
                    <Input id="whatsappPhone" name="whatsappPhone" />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="internalNotes">
                      Private team notes
                    </FieldLabel>
                    <Textarea
                      id="internalNotes"
                      name="internalNotes"
                      rows={3}
                    />
                    <FieldDescription>
                      Visible to authorized Diginoces users only.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit">
                <PlusIcon data-icon="inline-start" />
                Create partner
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Visible partner profiles</CardTitle>
          <CardDescription>
            Open a partner profile to review contacts, assigned work, linked
            accounts, and submission history.
          </CardDescription>
          <CardAction>
            <Badge variant="outline">
              {pluralize(partners.length, "profile")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2Icon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No partner profiles visible</EmptyTitle>
                <EmptyDescription>
                  Partner profiles will appear here when this account has access
                  to them.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {partners.map((partner, index) => {
                  const partnerId = partnerRowId(partner);
                  const partnerName = formatPartnerOrganizationDisplay(
                    partner.organization_name,
                    index,
                  );

                  return (
                    <div className="workflow-record" key={partnerId}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{partnerName}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatPartnerContactDisplay(partner.contact_email)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {formatLabel(partner.status)}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <span>{formatLabel(partner.partner_type)}</span>
                      </div>
                      <Button
                        aria-label={`Open partner profile: ${partnerName}`}
                        className="w-full"
                        render={
                          <Link href={`/platform/partners/${partnerId}`} />
                        }
                        size="sm"
                        variant="outline"
                      >
                        Open profile
                        <ArrowRightIcon data-icon="inline-end" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner, index) => {
                      const partnerId = partnerRowId(partner);
                      const partnerName = formatPartnerOrganizationDisplay(
                        partner.organization_name,
                        index,
                      );

                      return (
                        <TableRow key={partnerId}>
                          <TableCell className="whitespace-normal font-medium">
                            {partnerName}
                          </TableCell>
                          <TableCell className="whitespace-normal text-muted-foreground">
                            {formatPartnerContactDisplay(partner.contact_email)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatLabel(partner.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatLabel(partner.partner_type)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              aria-label={`Open partner profile: ${partnerName}`}
                              render={
                                <Link
                                  href={`/platform/partners/${partnerId}`}
                                />
                              }
                              size="sm"
                              variant="outline"
                            >
                              Open
                              <ArrowRightIcon data-icon="inline-end" />
                            </Button>
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

      <Alert>
        <Building2Icon aria-hidden="true" />
        <AlertTitle>Partner work stays under Diginoces control</AlertTitle>
        <AlertDescription>
          Partner profiles can prepare or receive work, but final project
          access, review decisions, and client-facing controls stay permission
          gated.
        </AlertDescription>
      </Alert>

      <Separator />
    </div>
  );
}
