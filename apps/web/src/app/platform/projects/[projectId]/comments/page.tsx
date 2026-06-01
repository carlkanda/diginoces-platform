import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { createPartnerCommentAction } from "@/app/platform/partners/actions";
import { serverLogger } from "@/lib/logging";
import { listProjectComments } from "@/lib/partners/partner-db";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireProjectPermission,
} from "@/lib/projects/project-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

async function optionalProjectCommentPermission(
  context: Parameters<typeof hasProjectPermission>[0],
  projectId: string,
  permission: "project_comments.create" | "project_comments.internal.read",
) {
  try {
    return {
      allowed: await hasProjectPermission(context, projectId, permission),
      failed: false,
    };
  } catch (error) {
    serverLogger.error("Optional project comment permission check failed.", {
      error,
      permission,
      projectId,
    });

    return {
      allowed: false,
      failed: true,
    };
  }
}

export default async function ProjectCommentsPage({ params }: PageProps) {
  const { projectId } = await params;
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/comments`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Project comments</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Project comments
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectPermission(context, projectId, "project_comments.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const [details, comments, createCommentAccess, createInternalCommentAccess] =
    await Promise.all([
      getProjectDetails(supabase, projectId),
      listProjectComments(supabase, projectId),
      optionalProjectCommentPermission(
        context,
        projectId,
        "project_comments.create",
      ),
      optionalProjectCommentPermission(
        context,
        projectId,
        "project_comments.internal.read",
      ),
    ]);

  if (!details) {
    notFound();
  }

  const commentAction = createPartnerCommentAction.bind(null, projectId);
  const permissionCheckFailed =
    createCommentAccess.failed || createInternalCommentAccess.failed;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Partner-visible communication</p>
          <h1 className="page-title">Project comments</h1>
          <p className="page-summary">
            Simple project thread for Diginoces/admin, assigned partners, and
            the couple. Internal notes remain separate and are not displayed in
            this partner-visible thread.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}`}
        >
          Project
        </Link>
      </div>

      <section className="section">
        <div className="detail-grid compact">
          <div>
            <span>Project</span>
            <strong>{details.project.project_code}</strong>
          </div>
          <div>
            <span>Couple</span>
            <strong>
              {details.project.bride_name} & {details.project.groom_name}
            </strong>
          </div>
        </div>
      </section>

      {permissionCheckFailed ? (
        <section className="section">
          <div className="alert">
            Comment permissions could not be verified. Try again or contact a
            Diginoces administrator.
          </div>
        </section>
      ) : null}

      {createCommentAccess.allowed ? (
        <section className="section">
          <div className="section-heading">
            <h2>Add comment</h2>
            <span className="meta-list">Partner-visible by default</span>
          </div>
          <form action={commentAction} className="form-panel stacked-form">
            <label>
              Comment
              <textarea name="body" required rows={4} />
            </label>
            <label>
              Visibility
              <select defaultValue="partner_visible" name="visibility">
                <option value="partner_visible">Partner visible</option>
                {createInternalCommentAccess.allowed ? (
                  <option value="internal_only">Internal only</option>
                ) : null}
              </select>
            </label>
            <button className="button" type="submit">
              Post comment
            </button>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Thread</h2>
          <span className="meta-list">{comments.length} comments</span>
        </div>
        {comments.length === 0 ? (
          <div className="empty-state">No project comments yet.</div>
        ) : (
          <div className="record-list">
            {comments.map((comment) => (
              <article className="form-card" key={String(comment.id)}>
                <div className="section-heading">
                  <strong>{String(comment.author_type)}</strong>
                  <span className="tag">{String(comment.visibility)}</span>
                </div>
                <p>{String(comment.body)}</p>
                <small className="meta-list">
                  {new Date(String(comment.created_at)).toLocaleString()}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
