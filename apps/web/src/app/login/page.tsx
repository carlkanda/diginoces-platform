import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  KeyRoundIcon,
  MailCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { signInWithEmailCode, signInWithMagicLink } from "./actions";
import { LoginSubmitButton } from "./submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedLoginRedirectPath } from "@/lib/auth/auth-navigation";
import { getAuthContext, normalizeInternalPath } from "@/lib/auth/auth-service";
import { getPublicEnvironment } from "@/lib/env/public-env";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    next?: string;
    sent?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, authContext] = await Promise.all([
    searchParams,
    getAuthContext(),
  ]);
  const env = getPublicEnvironment();
  const next = normalizeInternalPath(params.next ?? "/platform");

  if (authContext.status === "authenticated") {
    redirect(getAuthenticatedLoginRedirectPath(next));
  }

  return (
    <div className="auth-route grid min-h-svh items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:px-8">
      <section className="flex max-w-3xl flex-col gap-6">
        <Button className="w-fit" variant="ghost" render={<Link href="/" />}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Diginoces home
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Secure access</Badge>
          <Badge variant="outline">Wedding operations</Badge>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl leading-tight font-semibold tracking-normal text-balance md:text-5xl">
            Sign in to the Diginoces workspace.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
            Use your approved email address to open wedding projects, guest
            lists, RSVP, invitations, messages, seating, check-in, reports,
            files, and partner work.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon aria-hidden="true" />
              Access stays role-aware
            </CardTitle>
            <CardDescription>
              Sensitive areas may request another verification step before
              protected records are shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <strong>Guests</strong>
              <span className="text-sm text-muted-foreground">
                Personal details stay permission limited.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <strong>Payments</strong>
              <span className="text-sm text-muted-foreground">
                Commercial records require approved access.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <strong>Activity</strong>
              <span className="text-sm text-muted-foreground">
                Reviews and changes remain traceable.
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Workspace access</CardTitle>
          <CardDescription>
            Request a secure link or enter the six-digit code from your email.
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
        <CardContent className="flex flex-col gap-5">
          {params.sent ? (
            <Alert>
              <MailCheckIcon aria-hidden="true" />
              <AlertTitle>Check your inbox</AlertTitle>
              <AlertDescription>
                A sign-in link was requested for {params.email}. Open the email
                to continue.
              </AlertDescription>
            </Alert>
          ) : null}

          {params.error ? (
            <Alert variant="destructive">
              <KeyRoundIcon aria-hidden="true" />
              <AlertTitle>Sign-in needs attention</AlertTitle>
              <AlertDescription>{params.error}</AlertDescription>
            </Alert>
          ) : null}

          {!env.supabaseConfigured ? (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>Workspace connection required</AlertTitle>
              <AlertDescription>
                Ask an administrator to finish the workspace connection before
                requesting access links.
              </AlertDescription>
            </Alert>
          ) : null}

          <form action={signInWithMagicLink} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <FieldSet>
              <FieldLegend>Email link</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={params.email ?? ""}
                    placeholder="name@example.com"
                    required
                  />
                  <FieldDescription>
                    Use the email address approved for this workspace.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
            <LoginSubmitButton
              className={buttonVariants({ className: "w-full" })}
              disabled={!env.supabaseConfigured}
              pendingLabel="Sending..."
            >
              Send sign-in link
            </LoginSubmitButton>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form action={signInWithEmailCode} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <FieldSet>
              <FieldLegend>Email code</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="code-email">Email address</FieldLabel>
                  <Input
                    id="code-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={params.email ?? ""}
                    placeholder="name@example.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="token">Six-digit code</FieldLabel>
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    required
                  />
                  <FieldDescription>
                    Enter the latest code sent to your inbox.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
            <LoginSubmitButton
              className={buttonVariants({
                className: "w-full",
                variant: "outline",
              })}
              disabled={!env.supabaseConfigured}
              pendingLabel="Verifying..."
            >
              Verify email code
            </LoginSubmitButton>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Repeated requests may be rate limited. Use the newest email if you
            request more than one link or code.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
