import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
  getMfaAssuranceLevelForClient,
  normalizeInternalPath,
} from "@/lib/auth/auth-service";
import { getPublicEnvironment } from "@/lib/env/public-env";
import { verifyMfaAction } from "./actions";

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
      <section className="hero">
        <div>
          <h1 className="page-title">MFA verification</h1>
          <p className="page-summary">
            Sensitive Diginoces roles require a verified second factor.
          </p>
        </div>
        <aside className="panel">
          <div className="panel-body">
            <div className="alert">
              Supabase is not configured. Add the public URL and publishable key
              to `.env.local` before verifying MFA.
            </div>
          </div>
        </aside>
      </section>
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
    <section className="hero">
      <div>
        <h1 className="page-title">MFA verification</h1>
        <p className="page-summary">
          Enter the current authenticator code to unlock MFA-required internal
          Diginoces roles for this session.
        </p>
      </div>
      <aside className="panel">
        <div className="panel-body">
          {params.error ? <div className="alert">{params.error}</div> : null}
          {!env.supabaseConfigured ? (
            <div className="alert">
              Supabase is not configured. Add the public URL and publishable key
              to `.env.local` before verifying MFA.
            </div>
          ) : null}
          {assurance.status === "failed" ? (
            <div className="alert">{assurance.message}</div>
          ) : null}
          {canVerifyMfa ? (
            <form className="form" action={verifyMfaAction}>
              <input type="hidden" name="next" value={next} />
              <div className="field">
                <label htmlFor="mfa-code">Authenticator code</label>
                <input
                  id="mfa-code"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  required
                />
              </div>
              <button
                className="button"
                type="submit"
                disabled={!env.supabaseConfigured}
              >
                Verify MFA
              </button>
            </form>
          ) : (
            <div className="empty-state">
              This session does not have a verified TOTP factor waiting for
              verification. Continue with the standard sign-in flow or enroll a
              factor in Supabase Auth before using sensitive roles.
            </div>
          )}
          <Link className="button secondary" href="/platform">
            Back to platform
          </Link>
        </div>
      </aside>
    </section>
  );
}
