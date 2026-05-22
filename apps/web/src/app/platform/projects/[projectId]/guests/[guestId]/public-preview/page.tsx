import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import { PublicGuestPageView } from "@/lib/rsvp/public-guest-page-view";
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
      `/login?next=/platform/projects/${projectId}/guests/${guestId}/public-preview`,
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Public page preview</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Preview will load
            after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const payload = await previewPublicGuestPage(
    await createSupabaseServerClient(),
    guestId,
  );

  if (payload.status !== "ok" || payload.project.id !== projectId) {
    notFound();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Admin preview</p>
          <h1 className="page-title">Public guest page</h1>
          <p className="page-summary">
            Permission-gated internal preview before guest-page payment unlock.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/guests/${guestId}`}
        >
          Guest record
        </Link>
      </div>

      <section className="section">
        <PublicGuestPageView payload={payload} />
      </section>
    </>
  );
}
