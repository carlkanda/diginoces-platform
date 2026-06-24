import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  KeyRoundIcon,
  MailCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { requestEmailCode, signInWithEmailCode } from "./actions";
import {
  LOGIN_EMAIL_COOKIE_NAME,
  LOGIN_EMAIL_DRAFT_COOKIE_NAME,
} from "./login-email-cookie";
import {
  getLoginSearchParamValue,
  getRequestedLoginEmail,
  maskLoginEmail,
  shouldShowEmailCodeVerificationStep,
} from "./login-flow";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginSubmitButton } from "./submit-button";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { getAuthenticatedLoginRedirectPath } from "@/lib/auth/auth-navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
  LOGIN_AUTH_ERROR_CODES,
  normalizeInternalPath,
  type LoginAuthErrorCode,
} from "@/lib/auth/auth-service";
import { OTP_DIGITS_INPUT_PATTERN } from "@/lib/auth/otp-input-patterns";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { getLoginCopy, getShellCopy } from "@/lib/i18n/shell-copy";
import { getRequestLanguage } from "@/lib/i18n/server";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    error?: string | string[];
    next?: string | string[];
    sent?: string | string[];
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
  const cookieStore = await cookies();
  const shellCopy = getShellCopy(language);
  const loginCopy = getLoginCopy(language);
  const env = getPublicEnvironment();
  const emailParam = getLoginSearchParamValue(params.email);
  const errorParam = getLoginSearchParamValue(params.error);
  const nextParam = getLoginSearchParamValue(params.next);
  const sentParam = getLoginSearchParamValue(params.sent);
  const next = normalizeInternalPath(nextParam || "/platform");
  const storedEmail =
    cookieStore.get(LOGIN_EMAIL_COOKIE_NAME)?.value.trim() ?? "";
  const draftEmail =
    cookieStore.get(LOGIN_EMAIL_DRAFT_COOKIE_NAME)?.value.trim() ?? "";
  const showEmailCodeStep = shouldShowEmailCodeVerificationStep({
    email: storedEmail,
    sent: sentParam,
  });
  const requestedEmail = getRequestedLoginEmail({
    draftEmail,
    queryEmail: emailParam,
    sentEmail: showEmailCodeStep ? storedEmail : "",
  });
  const maskedRequestedEmail = maskLoginEmail(requestedEmail);
  const loginError = errorParam
    ? getLocalizedLoginError(errorParam, loginCopy)
    : null;

  if (authContext.status === "authenticated") {
    redirect(getAuthenticatedLoginRedirectPath(next));
  }

  return (
    <div className="auth-route grid min-h-svh items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:px-8">
      <Card className="auth-access-card lg:col-start-2 lg:row-start-1">
        <CardHeader className="auth-access-card__header">
          <div className="auth-access-card__heading">
            <span className="auth-access-card__mark" aria-hidden="true">
              <ShieldCheckIcon />
            </span>
            <div className="auth-access-card__heading-copy">
              <CardTitle
                aria-level={2}
                className="auth-access-card__title"
                role="heading"
              >
                {loginCopy.workspaceAccess}
              </CardTitle>
              <CardDescription className="auth-access-card__description">
                {loginCopy.workspaceDescription}
              </CardDescription>
            </div>
          </div>
          <CardAction className="auth-access-card__action">
            <Badge variant={showEmailCodeStep ? "default" : "secondary"}>
              {showEmailCodeStep ? loginCopy.emailCode : loginCopy.emailRequest}
            </Badge>
            <Image
              aria-hidden="true"
              className="auth-access-card__logo"
              src="/diginoces-logo.png"
              alt=""
              width={44}
              height={44}
              priority
            />
          </CardAction>
        </CardHeader>
        <CardContent className="auth-access-card__content">
          {showEmailCodeStep ? (
            <Alert className="auth-access-card__notice" role="status">
              <MailCheckIcon aria-hidden="true" />
              <AlertTitle>{loginCopy.codeSentTitle}</AlertTitle>
              <AlertDescription>
                {loginCopy.sentCodePrefix}{" "}
                <span className="font-medium text-foreground" data-no-translate>
                  {maskedRequestedEmail}
                </span>
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

          {showEmailCodeStep ? (
            <form
              action={signInWithEmailCode}
              className="auth-access-card__form"
            >
              <input type="hidden" name="next" value={next} />
              <FieldSet className="auth-access-card__fieldset">
                <FieldLegend className="auth-access-card__legend">
                  {loginCopy.emailCode}
                </FieldLegend>
                <FieldGroup className="auth-access-card__field-group">
                  <Field className="auth-access-card__field">
                    <FieldLabel htmlFor="token">
                      {loginCopy.sixDigitCode}
                    </FieldLabel>
                    <InputOTP
                      id="token"
                      name="token"
                      maxLength={6}
                      minLength={6}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern={OTP_DIGITS_INPUT_PATTERN}
                      data-no-translate
                      required
                      containerClassName="auth-access-card__otp"
                    >
                      <InputOTPGroup className="auth-access-card__otp-group">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                      <InputOTPSeparator className="auth-access-card__otp-separator" />
                      <InputOTPGroup className="auth-access-card__otp-group">
                        {Array.from({ length: 3 }).map((_, index) => {
                          const slotIndex = index + 3;

                          return (
                            <InputOTPSlot key={slotIndex} index={slotIndex} />
                          );
                        })}
                      </InputOTPGroup>
                    </InputOTP>
                    <FieldDescription>
                      {loginCopy.latestCodeDescription}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>
              <div className="auth-access-card__actions">
                <LoginSubmitButton
                  className="auth-access-card__primary-action"
                  disabled={!env.supabaseConfigured}
                  pendingLabel={loginCopy.pendingVerify}
                >
                  {loginCopy.verifyEmailCode}
                </LoginSubmitButton>
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  render={<Link href={buildLoginRedirectPath(next)} />}
                >
                  {loginCopy.changeEmailAddress}
                </Button>
              </div>
            </form>
          ) : (
            <form action={requestEmailCode} className="auth-access-card__form">
              <input type="hidden" name="next" value={next} />
              <FieldSet className="auth-access-card__fieldset">
                <FieldLegend className="auth-access-card__legend">
                  {loginCopy.emailRequest}
                </FieldLegend>
                <FieldGroup className="auth-access-card__field-group">
                  <Field className="auth-access-card__field">
                    <FieldLabel htmlFor="email">
                      {loginCopy.emailAddress}
                    </FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      data-no-translate
                      defaultValue={requestedEmail}
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
                className="auth-access-card__primary-action"
                disabled={!env.supabaseConfigured}
                pendingLabel={loginCopy.pendingSend}
              >
                {loginCopy.sendEmailCode}
              </LoginSubmitButton>
            </form>
          )}
        </CardContent>
        <CardFooter className="auth-access-card__footer">
          <p>{loginCopy.rateLimitDescription}</p>
        </CardFooter>
      </Card>

      <section className="flex max-w-3xl flex-col gap-6 lg:col-start-1 lg:row-start-1">
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
    </div>
  );
}
