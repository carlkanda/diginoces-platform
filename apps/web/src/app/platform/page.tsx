import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ClipboardListIcon,
  CompassIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoHint } from "@/components/info-hint";
import { OperationalEmptyState } from "@/components/operational-empty-state";
import { Badge } from "@/components/ui/badge";
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
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { serverLogger } from "@/lib/logging";
import { getPlatformEntryActionVisibility } from "@/lib/platform/foundation";
import { listPartners } from "@/lib/partners/partner-db";
import { getReportingPermissionSet } from "@/lib/reports/report-api";
import { getDashboardVisibility } from "@/lib/reports/report-service";
import type { PermissionSlug } from "@/lib/security/permissions";

export const dynamic = "force-dynamic";

function partnerRowId(partner: { id?: unknown }) {
  if (typeof partner.id !== "string" || partner.id.length === 0) {
    throw new Error("Partner row is missing a valid id.");
  }

  return partner.id;
}

type AuthenticatedAuthContext = Extract<
  Awaited<ReturnType<typeof getAuthContext>>,
  { status: "authenticated" }
>;

type PlatformPageProps = {
  searchParams?: Promise<{
    signOut?: string;
  }>;
};

const emptyPlatformSearchParams: Promise<{ signOut?: string }> =
  Promise.resolve({});

type WorkspaceEntry = {
  description: string;
  href: string;
  label: string;
  meta: string;
  show: boolean;
};

type WorkspaceMapItem = {
  description: string;
  href?: string;
  label: string;
  status: string;
};

type WorkspaceMapGroup = {
  items: WorkspaceMapItem[];
  label: string;
};

async function getAuthenticatedPlatformActionVisibility(
  authContext: AuthenticatedAuthContext,
) {
  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };

  const permissions = await getReportingPermissionSet(context).catch(
    (error: unknown) => {
      serverLogger.error("Platform reporting permission check failed.", {
        error,
      });

      return new Set<PermissionSlug>();
    },
  );
  const dashboardVisibility = getDashboardVisibility(permissions);

  if (dashboardVisibility.canReadPartnerDashboard) {
    return getPlatformEntryActionVisibility({
      canOpenPartnerDashboard: true,
      canReadGlobalDashboard: dashboardVisibility.canReadGlobalDashboard,
      canReadReports: dashboardVisibility.canReadReports,
    });
  }

  const partners = await listPartners(supabase).catch((error: unknown) => {
    serverLogger.error("Platform partner list check failed.", { error });

    return [];
  });
  const partnerDashboardAccess = await Promise.all(
    partners.map(async (partner) => {
      try {
        const partnerId = partnerRowId(partner);
        const partnerPermissions = await getReportingPermissionSet(context, {
          customScopeId: partnerId,
          includeCustom: true,
        });

        return partnerPermissions.has("dashboards.partner.read");
      } catch (error) {
        serverLogger.error("Platform partner dashboard check failed.", {
          error,
        });

        return false;
      }
    }),
  );

  return getPlatformEntryActionVisibility({
    canOpenPartnerDashboard:
      dashboardVisibility.canReadPartnerDashboard ||
      partnerDashboardAccess.some(Boolean),
    canReadGlobalDashboard: dashboardVisibility.canReadGlobalDashboard,
    canReadReports: dashboardVisibility.canReadReports,
  });
}

export default async function PlatformPage({
  searchParams,
}: PlatformPageProps) {
  const [authContext, params] = await Promise.all([
    getAuthContext(),
    searchParams ?? emptyPlatformSearchParams,
  ]);

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform"));
  }

  const actionVisibility =
    authContext.status === "not_configured"
      ? getPlatformEntryActionVisibility({
          canOpenPartnerDashboard: true,
          canReadGlobalDashboard: true,
          canReadReports: true,
        })
      : await getAuthenticatedPlatformActionVisibility(authContext);

  const workspaceEntries: WorkspaceEntry[] = [
    {
      description:
        "Open a wedding workspace, then move into events, guests, invitations, messages, seating, files, and event-day work.",
      href: "/platform/projects",
      label: "Open wedding projects",
      meta: "Best place to start",
      show: actionVisibility.showProjects,
    },
    {
      description:
        "Review portfolio-wide progress, operational attention areas, and summary activity when your role allows it.",
      href: "/platform/dashboard",
      label: "View operations dashboard",
      meta: "Approved roles",
      show: actionVisibility.showGlobalDashboard,
    },
    {
      description:
        "Check operational reports and exports used for planning, oversight, and delivery reviews.",
      href: "/platform/reports",
      label: "Review reports",
      meta: "Controlled access",
      show: actionVisibility.showReports,
    },
    {
      description:
        "Manage partner records and the partner work areas connected to Diginoces delivery.",
      href: "/platform/partners",
      label: "Manage partners",
      meta: "Operations area",
      show: actionVisibility.showPartners,
    },
    {
      description:
        "Open the partner-facing view for work assigned to an external delivery partner.",
      href: "/platform/partner-dashboard",
      label: "Open partner dashboard",
      meta: "Partner workspace",
      show: actionVisibility.showPartnerDashboard,
    },
  ];
  const visibleWorkspaceEntries = workspaceEntries.filter(
    (entry) => entry.show,
  );

  const workspaceMap: WorkspaceMapGroup[] = [
    {
      label: "Plan the wedding",
      items: [
        {
          description:
            "Create and open each couple's main workspace with dates, codes, status, and team access.",
          href: "/platform/projects",
          label: "Wedding records",
          status: "Open directly",
        },
        {
          description:
            "Track ceremonies, receptions, brunches, and other events inside the selected wedding.",
          label: "Events",
          status: "Inside a wedding",
        },
        {
          description:
            "Keep staff, partners, couple users, and event teams scoped to the right work.",
          label: "Team access",
          status: "Inside a wedding",
        },
      ],
    },
    {
      label: "Prepare the guest journey",
      items: [
        {
          description:
            "Create, edit, filter, and organize guests by side, title, tag, and event assignment.",
          label: "Guest list",
          status: "Inside a wedding",
        },
        {
          description:
            "Stage CSV uploads, map columns, preview warnings, and review rows before guests are created.",
          label: "Guest imports",
          status: "Inside a wedding",
        },
        {
          description:
            "Collect event-level responses through each guest's secure public page.",
          label: "RSVP",
          status: "Inside a wedding",
        },
      ],
    },
    {
      label: "Send the right message",
      items: [
        {
          description:
            "Register event invitation designs, configure guest fields, approve previews, and generate files.",
          label: "Invitations",
          status: "Inside an event",
        },
        {
          description:
            "Prepare French and English WhatsApp text, guided manual sends, follow-ups, and communication history.",
          label: "Messages",
          status: "Inside a wedding",
        },
        {
          description:
            "Open a guest's secure page preview without mixing it with staff-only access.",
          label: "Guest page preview",
          status: "Inside a guest record",
        },
      ],
    },
    {
      label: "Run the event day",
      items: [
        {
          description:
            "Assign tables, review seating maps, and prepare printable event materials.",
          label: "Seating",
          status: "Inside an event",
        },
        {
          description:
            "Use check-in controls and scan flows from the event workspace when the guest list is ready.",
          label: "Check-in",
          status: "Inside an event",
        },
        {
          description:
            "Keep project and event files organized with retention and access controls.",
          label: "Files",
          status: "Inside project or event",
        },
      ],
    },
    {
      label: "Review and control",
      items: [
        {
          description:
            "Review commercial controls, pricing exceptions, approvals, and project delivery evidence.",
          label: "Commercial work",
          status: "Inside a project",
        },
        {
          description:
            "Use dashboards and reports when your role includes operational or management visibility.",
          href: actionVisibility.showReports ? "/platform/reports" : undefined,
          label: "Reports",
          status: actionVisibility.showReports
            ? "Open directly"
            : "For approved roles",
        },
        {
          description:
            "Trace sensitive actions through protected logs when your role includes audit access.",
          label: "Audit trail",
          status: "Protected area",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <Card className="overflow-hidden border-primary/15 bg-card shadow-none">
          <CardHeader className="gap-4 p-6 sm:p-8">
            <Badge className="w-fit" variant="secondary">
              Diginoces workspace
            </Badge>
            <div className="grid max-w-3xl gap-3">
              <CardTitle>
                <h1 className="text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
                  Start the wedding operation from one accountable place.
                </h1>
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-muted-foreground">
                Start with the wedding or work area available to this account.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Role-aware navigation</Badge>
              <Badge variant="outline">Protected actions</Badge>
              <Badge variant="outline">Wedding workstreams</Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                className="bg-primary! text-primary-foreground! hover:bg-primary/80! hover:text-primary-foreground!"
                render={<Link href="/platform/projects" />}
              >
                Open wedding projects
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Button>
              {actionVisibility.showReports ? (
                <Button
                  variant="outline"
                  render={<Link href="/platform/reports" />}
                >
                  Review reports
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/15 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon aria-hidden="true" data-icon="inline-start" />
              <h2>Current access</h2>
              <InfoHint
                label="How access works"
                text="The app only opens areas available to this account. If a destination is missing, the role or project membership needs review."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="launchpad-access">
            <div className="launchpad-access__identity">
              <p className="launchpad-access__label">Signed in as</p>
              <p className="launchpad-access__value">
                {authContext.status === "not_configured"
                  ? "Connection pending"
                  : authContext.email}
              </p>
            </div>
            <div className="launchpad-access__metrics">
              <div className="launchpad-access__metric">
                <strong className="launchpad-access__metric-value">
                  {visibleWorkspaceEntries.length}
                </strong>
                <span className="launchpad-access__metric-label">
                  entry points
                </span>
              </div>
              <div className="launchpad-access__metric">
                <strong className="launchpad-access__metric-value">
                  {workspaceMap.length}
                </strong>
                <span className="launchpad-access__metric-label">
                  work areas
                </span>
              </div>
              <div className="launchpad-access__metric">
                <strong className="launchpad-access__metric-value">Role</strong>
                <span className="launchpad-access__metric-label">
                  protected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {params.signOut === "failed" ? (
        <Alert variant="destructive">
          <LockKeyholeIcon aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Sign-out did not finish</AlertTitle>
          <AlertDescription>
            Try again before leaving this device.
          </AlertDescription>
        </Alert>
      ) : null}
      {authContext.status === "not_configured" ? (
        <Alert>
          <CompassIcon aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Workspace connection pending</AlertTitle>
          <AlertDescription>
            Project data will appear after the workspace connection is ready.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-[color:var(--success-border)] bg-[color:var(--success-bg)] text-[color:var(--success-text)]">
          <BadgeCheckIcon aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Workspace ready</AlertTitle>
          <AlertDescription className="text-[color:var(--success-text)]/90">
            Signed in as {authContext.email}.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-normal">
                Start with the next action
              </h2>
              <InfoHint
                label="Entry point guidance"
                text="These are the direct entry points available to the current account. Each one leads into a controlled work area."
              />
            </div>
          </div>
        </div>

        {visibleWorkspaceEntries.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleWorkspaceEntries.map((entry) => (
              <Card className="shadow-none" key={entry.href}>
                <CardHeader>
                  <CardAction>
                    <Badge variant="secondary">{entry.meta}</Badge>
                  </CardAction>
                  <CardTitle>
                    <h3>{entry.label}</h3>
                  </CardTitle>
                  <CardDescription>{entry.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full justify-between"
                    variant="outline"
                    render={<Link href={entry.href} />}
                  >
                    Open
                    <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <OperationalEmptyState
            action={
              <Button variant="outline" render={<Link href="/platform" />}>
                Refresh workspace
              </Button>
            }
            description="This account does not have an assigned workspace area yet."
            icon={LockKeyholeIcon}
            nextStep="Ask an administrator to add the right role or project membership, then refresh the workspace."
            title="No workspace areas yet"
          />
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-normal">
              Wedding operating map
            </h2>
            <InfoHint
              label="Wedding map guidance"
              text="Open a wedding first for wedding-specific work. Diginoces separates planning, guest preparation, communication, event-day execution, and controlled review."
            />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {workspaceMap.map((group) => (
            <Card className="shadow-none" key={group.label}>
              <CardHeader>
                <Badge className="w-fit" variant="outline">
                  Work area
                </Badge>
                <CardTitle>
                  <h3>{group.label}</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="launchpad-map">
                {group.items.map((item) => {
                  const content = (
                    <>
                      <div className="launchpad-map__content">
                        <div className="launchpad-map__title-row">
                          <strong className="launchpad-map__title">
                            {item.label}
                          </strong>
                          <Badge variant="secondary">{item.status}</Badge>
                        </div>
                        <p className="launchpad-map__copy">
                          {item.description}
                        </p>
                      </div>
                      {item.href ? (
                        <ArrowRightIcon
                          aria-hidden="true"
                          data-icon="inline-end"
                        />
                      ) : null}
                    </>
                  );

                  return item.href ? (
                    <Link
                      className="launchpad-map__item launchpad-map__item--link"
                      href={item.href}
                      key={item.label}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="launchpad-map__item" key={item.label}>
                      {content}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-primary/15 bg-primary text-primary-foreground shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardListIcon aria-hidden="true" data-icon="inline-start" />
            <h2>Ready for the next wedding task</h2>
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Start with wedding projects when you need the full context, or use
            the available work areas above when the next action is already
            clear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="bg-primary-foreground! text-primary! hover:bg-primary-foreground/90! hover:text-primary!"
            render={<Link href="/platform/projects" />}
          >
            Open wedding projects
            <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
