import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DoorOpenIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPublicEnvironment } from "@/lib/env/public-env";

export const dynamic = "force-dynamic";

const workspaceStarts = [
  {
    description:
      "Continue with the weddings, reviews, and event-day tasks available to your role.",
    href: "/platform",
    icon: DoorOpenIcon,
    label: "Open workspace",
  },
  {
    description:
      "Find a wedding, then move into guests, RSVP, files, invitations, messages, and event pages.",
    href: "/platform/projects",
    icon: ClipboardListIcon,
    label: "Find a wedding",
  },
  {
    description:
      "Review operational signals, reports, and activity history across visible weddings.",
    href: "/platform/dashboard",
    icon: LayoutDashboardIcon,
    label: "Operations view",
  },
];

const capabilityRows = [
  {
    area: "Guest list",
    opens: "Guests, imports, duplicates, tags",
    purpose: "Keep names, sides, contacts, and event assignments clean.",
  },
  {
    area: "RSVP",
    opens: "Public guest page, answers, deadlines",
    purpose: "Track attendance per event without exposing staff tools.",
  },
  {
    area: "Invitations",
    opens: "PDF templates, field placement, previews",
    purpose: "Prepare files and guest links before communication starts.",
  },
  {
    area: "Messages",
    opens: "Templates, queue, manual send history",
    purpose: "Prepare French and English wording with traceable outcomes.",
  },
  {
    area: "Event day",
    opens: "Tables, seating map, check-in",
    purpose: "Give the team a fast view for arrival and seating decisions.",
  },
  {
    area: "Oversight",
    opens: "Files, partners, reports, activity trail",
    purpose: "Keep sensitive records permission-aware and reviewable.",
  },
];

const operationsFlow = [
  {
    label: "Wedding record",
    state: "Start",
  },
  {
    label: "Guests",
    state: "Prepare",
  },
  {
    label: "RSVP",
    state: "Confirm",
  },
  {
    label: "Invitations",
    state: "Approve",
  },
  {
    label: "Messages",
    state: "Coordinate",
  },
  {
    label: "Event day",
    state: "Run",
  },
];

export default function HomePage() {
  const env = getPublicEnvironment();

  return (
    <div className="public-route min-h-svh bg-background text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/"
          >
            <Image
              aria-hidden="true"
              className="size-10 rounded-lg bg-card"
              src="/diginoces-logo.png"
              alt=""
              width={40}
              height={40}
              priority
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <strong className="truncate text-sm font-semibold">
                Diginoces
              </strong>
              <span className="truncate text-xs text-muted-foreground">
                Event guest management
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2" aria-label="Public actions">
            <Button variant="ghost" render={<Link href="/platform/projects" />}>
              Find a wedding
            </Button>
            <Button variant="outline" render={<Link href="/login" />}>
              Sign in
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.82fr)]">
          <div className="flex max-w-3xl flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Diginoces</Badge>
              <Badge variant="outline">Wedding operations desk</Badge>
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-normal text-balance md:text-5xl">
                Bring every guest detail into one calm event workspace.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
                Diginoces helps authorized teams move from a wedding record to
                guest lists, RSVP, invitations, messages, tables, check-in,
                files, partners, reports, and activity history without losing
                the next safe action.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/platform" />}>
                Open workspace
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/platform/projects" />}
              >
                Find a wedding
              </Button>
            </div>

            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Built for sensitive wedding operations</AlertTitle>
              <AlertDescription>
                Guest details, partner access, commercial records, and activity
                history stay behind role-aware navigation and server-side
                checks.
              </AlertDescription>
            </Alert>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Wedding desk preview</CardTitle>
              <CardDescription>
                One record can move through planning, guest readiness, guest
                communication, and event-day handoff without changing the access
                rules underneath it.
              </CardDescription>
              <CardAction>
                <Image
                  aria-hidden="true"
                  className="rounded-lg bg-background"
                  src="/diginoces-logo.png"
                  alt=""
                  width={44}
                  height={44}
                  priority
                />
              </CardAction>
            </CardHeader>
            <CardContent className="entry-desk">
              <dl className="entry-desk__signals">
                <div className="entry-desk__signal">
                  <dt className="entry-desk__signal-label">Current focus</dt>
                  <dd className="entry-desk__signal-value">Guest readiness</dd>
                  <dd className="entry-desk__signal-note">
                    Import review, RSVP, seating, and files
                  </dd>
                </div>
                <div className="entry-desk__signal">
                  <dt className="entry-desk__signal-label">Event-day desk</dt>
                  <dd className="entry-desk__signal-value">Arrival control</dd>
                  <dd className="entry-desk__signal-note">
                    Tables, check-in, and live exceptions
                  </dd>
                </div>
              </dl>

              <Separator />

              <div className="entry-desk__flow">
                {operationsFlow.map((step, index) => (
                  <div className="entry-desk__flow-step" key={step.label}>
                    <span className="entry-desk__flow-index">{index + 1}</span>
                    <span className="entry-desk__flow-label">{step.label}</span>
                    <Badge variant={index < 3 ? "secondary" : "outline"}>
                      {step.state}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {env.supabaseConfigured
                    ? "Workspace data can load from the connected project."
                    : "Workspace data appears after the project connection is configured."}
                </p>
                <Button
                  variant="outline"
                  render={<Link href="/platform/dashboard" />}
                >
                  Operations view
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(260px,0.42fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl leading-tight font-semibold tracking-normal">
              Choose the next piece of work.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground text-pretty">
              Start from the workspace if you already know what needs attention,
              or open the wedding list when you need the project context first.
            </p>
          </div>

          <div className="grid gap-3">
            {workspaceStarts.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.href}>
                  <CardHeader className="sm:grid-cols-[1fr_auto]">
                    <div className="flex min-w-0 items-start gap-3">
                      <Icon aria-hidden="true" />
                      <div className="flex min-w-0 flex-col gap-1">
                        <CardTitle>{item.label}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                    <CardAction>
                      <Button
                        variant="outline"
                        render={<Link href={item.href} />}
                      >
                        Continue
                        <ArrowRightIcon
                          data-icon="inline-end"
                          aria-hidden="true"
                        />
                      </Button>
                    </CardAction>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(260px,0.35fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl leading-tight font-semibold tracking-normal">
              See the guest journey as connected work.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground text-pretty">
              The product is organized around the way a wedding moves: prepare
              people, confirm attendance, create guest-facing materials, then
              hand the event team a usable day-of view.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workspace map</CardTitle>
              <CardDescription>
                Each area has its own state, permission boundary, and safe next
                action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:hidden">
                {capabilityRows.map((row) => (
                  <div
                    className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0"
                    key={row.area}
                  >
                    <strong>{row.area}</strong>
                    <span className="text-sm">{row.purpose}</span>
                    <span className="text-sm text-muted-foreground">
                      Opens: {row.opens}
                    </span>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Area</TableHead>
                      <TableHead>What it controls</TableHead>
                      <TableHead>Opens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capabilityRows.map((row) => (
                      <TableRow key={row.area}>
                        <TableCell className="font-medium">
                          {row.area}
                        </TableCell>
                        <TableCell>{row.purpose}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.opens}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>
              A calm workspace for high-pressure wedding days
            </CardTitle>
            <CardDescription>
              The same product supports careful preparation before the event and
              fast confirmation on the event day.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <CheckCircle2Icon aria-hidden="true" />
              <strong>Clear ownership</strong>
              <p className="text-sm text-muted-foreground">
                Couples, staff, partners, and administrators see only the work
                their role is allowed to handle.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <CheckCircle2Icon aria-hidden="true" />
              <strong>Practical handoffs</strong>
              <p className="text-sm text-muted-foreground">
                Guest lists, files, invitations, messages, tables, and check-in
                pages keep next steps visible.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <CheckCircle2Icon aria-hidden="true" />
              <strong>Traceable decisions</strong>
              <p className="text-sm text-muted-foreground">
                Reviews, approvals, exports, and sensitive updates keep an
                activity trail for Diginoces operations.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
