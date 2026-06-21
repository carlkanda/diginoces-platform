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
import { LanguageSwitcher } from "@/components/language-switcher";
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
import {
  getAuthContext,
  LOGIN_AUTH_ERROR_CODES,
  normalizeInternalPath,
  type LoginAuthErrorCode,
} from "@/lib/auth/auth-service";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getLoginCopy, getShellCopy } from "@/lib/i18n/shell-copy";
import { getRequestLanguage } from "@/lib/i18n/server";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    next?: string;
    sent?: string;
  }>;
};

const loginAuthErrorCodes = new Set<string>(
  Object.values(LOGIN_AUTH_ERROR_CODES),
);

function isLoginAuthErrorCode(error: string): error is LoginAuthErrorCode {
  return loginAuthErrorCodes.has(error);
}

function getLocalizedLoginError(
  error: string,
  loginCopy: ReturnType<typeof getLoginCopy>,
) {
  if (error.startsWith("Missing Supabase configuration:")) {
    return loginCopy.workspaceConnectionDescription;
  }

  return isLoginAuthErrorCode(error)
    ? loginCopy.errorMessages[error]
    : loginCopy.errorMessages.AUTH_GENERIC_ERROR;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, authContext, language] = await Promise.all([
    searchParams,
    getAuthContext(),
    getRequestLanguage(),
  ]);
  const shellCopy = getShellCopy(language);
  const loginCopy = getLoginCopy(language);
  const env = getPublicEnvironment();
  const next = normalizeInternalPath(params.next ?? "/platform");
  const loginError = params.error
    ? getLocalizedLoginError(params.error, loginCopy)
    : null;

  if (authContext.status === "authenticated") {
    redirect(getAuthenticatedLoginRedirectPath(next));
  }

  return (
    <div className="auth-route grid min-h-svh items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:px-8">
      <section className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button className="w-fit" variant="ghost" render={<Link href="/" />}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            {shellCopy.homeAria}
          </Button>
          <LanguageSwitcher
            label={shellCopy.languageLabel}
            language={language}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{loginCopy.secureAccess}</Badge>
          <Badge variant="outline">{loginCopy.weddingOperations}</Badge>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl leading-tight font-semibold tracking-normal text-balance md:text-5xl">
            {loginCopy.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
            {loginCopy.description}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon aria-hidden="true" />
              {loginCopy.roleTitle}
            </CardTitle>
            <CardDescription>{loginCopy.roleDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <strong>{loginCopy.guests}</strong>
              <span className="text-sm text-muted-foreground">
                {loginCopy.guestsDescription}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <strong>{loginCopy.payments}</strong>
              <span className="text-sm text-muted-foreground">
                {loginCopy.paymentsDescription}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <strong>{loginCopy.activity}</strong>
              <span className="text-sm text-muted-foreground">
                {loginCopy.activityDescription}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{loginCopy.workspaceAccess}</CardTitle>
          <CardDescription>{loginCopy.workspaceDescription}</CardDescription>
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
              <AlertTitle>{loginCopy.checkInbox}</AlertTitle>
              <AlertDescription>
                {loginCopy.sentEmailPrefix} {params.email}
                {loginCopy.sentEmailSuffix}
              </AlertDescription>
            </Alert>
          ) : null}

          {loginError ? (
            <Alert variant="destructive">
              <KeyRoundIcon aria-hidden="true" />
              <AlertTitle>{loginCopy.signInNeedsAttention}</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          ) : null}

          {!env.supabaseConfigured ? (
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertTitle>{loginCopy.workspaceConnectionRequired}</AlertTitle>
              <AlertDescription>
                {loginCopy.workspaceConnectionDescription}
              </AlertDescription>
            </Alert>
          ) : null}

          <form action={signInWithMagicLink} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <FieldSet>
              <FieldLegend>{loginCopy.emailLink}</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">
                    {loginCopy.emailAddress}
                  </FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    data-no-translate
                    defaultValue={params.email ?? ""}
                    placeholder={loginCopy.emailPlaceholder}
                    required
                  />
                  <FieldDescription>
                    {loginCopy.approvedEmailDescription}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
            <LoginSubmitButton
              className={buttonVariants({ className: "w-full" })}
              disabled={!env.supabaseConfigured}
              pendingLabel={loginCopy.pendingSend}
            >
              {loginCopy.sendSignInLink}
            </LoginSubmitButton>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {loginCopy.divider}
            </span>
            <Separator className="flex-1" />
          </div>

          <form action={signInWithEmailCode} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <FieldSet>
              <FieldLegend>{loginCopy.emailCode}</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="code-email">
                    {loginCopy.emailAddress}
                  </FieldLabel>
                  <Input
                    id="code-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    data-no-translate
                    defaultValue={params.email ?? ""}
                    placeholder={loginCopy.emailPlaceholder}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="token">
                    {loginCopy.sixDigitCode}
                  </FieldLabel>
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    data-no-translate
                    placeholder={loginCopy.tokenPlaceholder}
                    required
                  />
                  <FieldDescription>
                    {loginCopy.latestCodeDescription}
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
              pendingLabel={loginCopy.pendingVerify}
            >
              {loginCopy.verifyEmailCode}
            </LoginSubmitButton>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {loginCopy.rateLimitDescription}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
