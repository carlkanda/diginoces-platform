import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  EyeIcon,
  LinkIcon,
  ShieldCheckIcon,
  UserRoundIcon,
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
import { buttonVariants } from "@/components/ui/button";
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
import {
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import {
  formatPublicCoupleDisplayName,
  formatPublicGuestDisplayName,
  PublicGuestPageView,
} from "@/lib/rsvp/public-guest-page-view";
import { previewPublicGuestPage } from "@/lib/rsvp/rsvp-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GuestPublicPreviewPageProps = {
  params: Promise<{
    guestId: string;
    projectId: string;
  }>;
};

export default async function GuestPublicPreviewPage({
  params,
}: GuestPublicPreviewPageProps) {
  const authContext = await getAuthContext();
  const { guestId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/projects/${projectId}/guests/${guestId}/public-preview`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Staff preview
          </Badge>
          <h1 className="text-2xl font-semibold tracking-normal text-balance">
            Public guest page preview
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            The invitation preview will appear here after the workspace is
            connected to Diginoces access services.
          </p>
        </div>
        <Alert>
          <ShieldCheckIcon data-icon="inline-start" />
          <AlertTitle>Access setup needed</AlertTitle>
          <AlertDescription>
            Supabase is not configured for this environment, so the page cannot
            resolve this guest preview yet.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    await requireProjectPermission(
      {
        supabase,
        user: authContext.user,
      },
      projectId,
      "guest_public_pages.preview",
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const payload = await previewPublicGuestPage(supabase, guestId);

  if (payload.status !== "ok" || payload.project.id !== projectId) {
    notFound();
  }

  const coupleDisplayName = formatPublicCoupleDisplayName(payload.project);
  const guestDisplayName = formatPublicGuestDisplayName(
    payload.guest.displayName,
  );

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
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
              {coupleDisplayName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/platform/projects/${projectId}/guests`} />}
            >
              Guest list
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link
                  href={`/platform/projects/${projectId}/guests/${guestId}`}
                />
              }
            >
              {guestDisplayName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Preview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
              <div className="flex max-w-3xl flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Staff preview</Badge>
                  <Badge variant="secondary">
                    {payload.events.length} invited{" "}
                    {payload.events.length === 1 ? "event" : "events"}
                  </Badge>
                </div>
                <CardTitle>
                  <p className="text-2xl font-semibold tracking-normal text-balance">
                    Public guest page preview
                  </p>
                </CardTitle>
                <CardDescription className="max-w-3xl text-pretty">
                  Review the exact guest-facing invitation and RSVP experience
                  before the personal page link is shared.
                </CardDescription>
              </div>
              <CardAction className="col-start-1 row-start-auto mt-3 flex flex-wrap gap-2 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
                <Link
                  aria-label={`Back to guest profile for ${guestDisplayName}`}
                  className={buttonVariants({ variant: "outline" })}
                  href={`/platform/projects/${projectId}/guests/${guestId}`}
                >
                  <ArrowLeftIcon data-icon="inline-start" />
                  Guest profile
                </Link>
                <Link
                  aria-label={`Back to guest list for ${coupleDisplayName}`}
                  className={buttonVariants({ variant: "ghost" })}
                  href={`/platform/projects/${projectId}/guests`}
                >
                  Guest list
                </Link>
              </CardAction>
            </CardHeader>
          </Card>

          <Alert>
            <EyeIcon data-icon="inline-start" />
            <AlertTitle>Preview mode</AlertTitle>
            <AlertDescription>
              This authenticated staff view does not replace the secure public
              link for this guest. Use it to check content, events, language,
              and RSVP controls before sharing.
            </AlertDescription>
          </Alert>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-semibold">Guest-facing page</h2>
              </CardTitle>
              <CardDescription>
                The framed area below uses the same public guest page component
                guests will see.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="public-preview-frame sm:p-4">
                <div className="public-preview-frame__shell">
                  <PublicGuestPageView payload={payload} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base font-semibold">Preview context</h2>
              </CardTitle>
              <CardAction>
                <ShieldCheckIcon
                  data-icon="inline-start"
                  className="text-primary"
                />
              </CardAction>
              <CardDescription>
                This preview is available only to authorized users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <UserRoundIcon data-icon="inline-start" />
                    Guest
                  </dt>
                  <dd className="font-medium text-right">{guestDisplayName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <LinkIcon data-icon="inline-start" />
                    Wedding
                  </dt>
                  <dd className="font-medium text-right">
                    {coupleDisplayName}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDaysIcon data-icon="inline-start" />
                    Invited events
                  </dt>
                  <dd className="font-medium">{payload.events.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheckIcon data-icon="inline-start" />
            <AlertTitle>Token separation</AlertTitle>
            <AlertDescription>
              Staff preview access is permission-based. The guest still needs a
              separate secure public page token to open their own page.
            </AlertDescription>
          </Alert>
        </aside>
      </section>
    </main>
  );
}
