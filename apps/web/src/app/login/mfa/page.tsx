import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeftIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  buildLoginRedirectPath,
  getAuthContext,
  getMfaAssuranceLevelForClient,
  normalizeInternalPath,
} from "@/lib/auth/auth-service";
import { OTP_DIGITS_INPUT_PATTERN } from "@/lib/auth/otp-input-patterns";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { verifyMfaAction } from "./actions";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

type MfaPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const params = await searchParams;
  const env = getPublicEnvironment();
  const next = normalizeInternalPath(params.next ?? "/platform");
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(next));
  }

  if (authContext.status === "not_configured") {
    return (
      <MfaShell
        next={next}
        footerNote="The workspace connection must be completed before this check can run."
        sessionDescription="Verification details will appear here once the workspace connection is ready."
        notices={
          <Alert>
            <ShieldAlertIcon aria-hidden="true" />
            <AlertTitle>Verification is not connected yet</AlertTitle>
            <AlertDescription>
              Ask an administrator to finish the workspace connection before
              using protected Diginoces areas.
            </AlertDescription>
          </Alert>
        }
      />
    );
  }

  const assurance = await getMfaAssuranceLevelForClient(authContext.supabase);

  if (assurance.status === "ready" && assurance.currentLevel === "aal2") {
    redirect(next);
  }

  const canVerifyMfa =
    assurance.status === "ready" &&
    assurance.currentLevel === "aal1" &&
    assurance.nextLevel === "aal2";

  return (
    <MfaShell
      next={next}
      footerNote={
        canVerifyMfa
          ? "Authenticator codes refresh quickly. Use the newest code shown in your app."
          : "Return to the workspace, then come back only when Diginoces asks for another verification step."
      }
      sessionDescription={
        canVerifyMfa
          ? "Enter the latest code, then continue to your requested page."
          : "This account is signed in, but no additional verification step is available for this session."
      }
      notices={
        <>
          {params.error ? (
            <Alert variant="destructive">
              <KeyRoundIcon aria-hidden="true" />
              <AlertTitle>Code was not accepted</AlertTitle>
              <AlertDescription>{params.error}</AlertDescription>
            </Alert>
          ) : null}

          {!env.supabaseConfigured ? (
            <Alert>
              <ShieldAlertIcon aria-hidden="true" />
              <AlertTitle>Verification is not connected yet</AlertTitle>
              <AlertDescription>
                Ask an administrator to finish the workspace connection before
                using protected Diginoces areas.
              </AlertDescription>
            </Alert>
          ) : null}

          {assurance.status === "failed" ? (
            <Alert variant="destructive">
              <ShieldAlertIcon aria-hidden="true" />
              <AlertTitle>Verification status unavailable</AlertTitle>
              <AlertDescription>{assurance.message}</AlertDescription>
            </Alert>
          ) : null}

          {canVerifyMfa ? (
            <Card>
              <CardHeader>
                <CardTitle>Enter your authenticator code</CardTitle>
                <CardDescription>
                  Use the current six-digit code from your authenticator app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={verifyMfaAction} className="flex flex-col gap-5">
                  <input type="hidden" name="next" value={next} />
                  <FieldSet>
                    <FieldLegend>Session verification</FieldLegend>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="mfa-code">
                          Verification code
                        </FieldLabel>
                        <InputOTP
                          id="mfa-code"
                          name="code"
                          maxLength={6}
                          minLength={6}
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          pattern={OTP_DIGITS_INPUT_PATTERN}
                          required
                        >
                          <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, index) => (
                              <InputOTPSlot key={index} index={index} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                        <FieldDescription>
                          Protected pages open after this session reaches the
                          required verification level.
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                  <Button type="submit" disabled={!env.supabaseConfigured}>
                    Verify session
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShieldAlertIcon aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>Two-step verification is not ready</EmptyTitle>
                    <EmptyDescription>
                      Continue with the normal sign-in flow, then return here
                      when Diginoces asks for another verification step.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          )}
        </>
      }
    />
  );
}

function MfaShell({
  footerNote,
  next,
  notices,
  sessionDescription,
}: {
  footerNote: string;
  next: string;
  notices: ReactNode;
  sessionDescription: string;
}) {
  return (
    <div className="auth-route grid min-h-svh items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.7fr)] lg:px-8">
      <section className="flex max-w-3xl flex-col gap-6">
        <Button
          className="w-fit"
          variant="ghost"
          render={<Link href={buildLoginRedirectPath(next)} />}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Back to sign in
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Protected access</Badge>
          <Badge variant="outline">Two-step verification</Badge>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl leading-tight font-semibold tracking-normal text-balance md:text-5xl">
            Confirm this session before opening protected work.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
            Sensitive guest, payment, partner, file, and activity areas stay
            hidden until Diginoces confirms this is still you.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyholeIcon aria-hidden="true" />
              Why this step appears
            </CardTitle>
            <CardDescription>
              Some roles can reach records that need stronger session proof.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <strong>Guest data</strong>
              <span className="text-sm text-muted-foreground">
                Names, phone numbers, and invitations stay protected.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <strong>Approvals</strong>
              <span className="text-sm text-muted-foreground">
                Reviews remain tied to the right operator.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <strong>Evidence</strong>
              <span className="text-sm text-muted-foreground">
                Activity trails keep sensitive changes traceable.
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Session check</CardTitle>
            <CardDescription>{sessionDescription}</CardDescription>
            <CardAction>
              <ShieldCheckIcon aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{notices}</CardContent>
          <Separator />
          <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{footerNote}</p>
            <Button variant="outline" render={<Link href="/platform" />}>
              Back to workspace
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
