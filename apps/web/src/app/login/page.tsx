import { signInWithMagicLink } from "./actions";
import { normalizeInternalPath } from "@/lib/auth/auth-service";
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
  const params = await searchParams;
  const env = getPublicEnvironment();
  const next = normalizeInternalPath(params.next ?? "/platform");

  return (
    <section className="hero">
      <div>
        <h1 className="page-title">Staff access</h1>
        <p className="page-summary">
          Email magic-link authentication is the Sprint 1 foundation for secure
          Diginoces user access.
        </p>
      </div>
      <aside className="panel">
        <div className="panel-body">
          {params.sent ? (
            <div className="alert success">
              Magic link requested for {params.email}. Check the configured
              mailbox to continue.
            </div>
          ) : null}
          {params.error ? <div className="alert">{params.error}</div> : null}
          {!env.supabaseConfigured ? (
            <div className="alert">
              Supabase is not configured. Add the public URL and publishable key
              to `.env.local` before requesting sign-in links.
            </div>
          ) : null}
          <form className="form" action={signInWithMagicLink}>
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
            </div>
            <button
              className="button"
              type="submit"
              disabled={!env.supabaseConfigured}
            >
              Send magic link
            </button>
            <p className="form-note">
              Sensitive roles are designed to require MFA once Supabase MFA
              policy is configured.
            </p>
          </form>
        </div>
      </aside>
    </section>
  );
}
