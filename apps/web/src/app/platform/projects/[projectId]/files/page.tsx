import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { formatDate } from "@/lib/dates/format-date";
import {
  getProjectFileCapabilities,
  requireProjectFileReadPermission,
} from "@/lib/files/file-api";
import {
  listFileCategories,
  listProjectArchiveEvents,
  listProjectFiles,
  listProjectRetentionPolicies,
} from "@/lib/files/file-db";
import { fileCategories, type FileCategory } from "@/lib/files/file-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { getProjectDetails } from "@/lib/projects/project-service";
import {
  registerProjectFileAction,
  updateProjectArchiveLifecycleAction,
} from "./actions";
import { RetentionActionFields } from "./retention-action-fields";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    category?: string;
    fileStatus?: string;
    latestOnly?: string;
  }>;
};

function isSupportedCategory(
  value: string | undefined,
): FileCategory | undefined {
  return fileCategories.some((category) => category === value)
    ? (value as FileCategory)
    : undefined;
}

export default async function ProjectFilesPage({
  params,
  searchParams,
}: PageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const filters = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(`/platform/projects/${projectId}/files`));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Project file library</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. File library
            controls will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };

  try {
    await requireProjectFileReadPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const category = isSupportedCategory(filters.category);
  const [projectDetails, capabilities, categories, files, policies, events] =
    await Promise.all([
      getProjectDetails(supabase, projectId),
      getProjectFileCapabilities(context, projectId),
      listFileCategories(supabase),
      listProjectFiles(supabase, projectId, {
        category,
        latestOnly: filters.latestOnly !== "false",
      }),
      listProjectRetentionPolicies(supabase, projectId),
      listProjectArchiveEvents(supabase, projectId),
    ]);

  if (!projectDetails) {
    notFound();
  }

  // Sprint 14 expects one retention policy per project; pick the first row if legacy data ever duplicates it.
  const retentionPolicy = policies[0] ?? null;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{projectDetails.project.project_code}</p>
          <h1 className="page-title">Project file library</h1>
          <p className="page-summary">
            App-owned storage registry, secure download, version history,
            retention, and archive controls for the project.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}`}
        >
          Project
        </Link>
      </div>

      {filters.fileStatus ? (
        <section className="section">
          <div className="alert">{filters.fileStatus.replaceAll("_", " ")}</div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Retention review</h2>
          <span className="meta-list">Sprint 14 foundation</span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Project retention status</span>
            <strong>
              {retentionPolicy?.status ??
                projectDetails.project.status ??
                "active"}
            </strong>
          </div>
          <div>
            <span>Retention starts</span>
            <strong>{formatDate(retentionPolicy?.retention_start_at)}</strong>
          </div>
          <div>
            <span>Retention ends</span>
            <strong>{formatDate(retentionPolicy?.retention_end_at)}</strong>
          </div>
          <div>
            <span>Notice status</span>
            <strong>{retentionPolicy?.notice_status ?? "not_required"}</strong>
          </div>
        </div>
        {capabilities.canManageRetention ? (
          <form
            action={updateProjectArchiveLifecycleAction.bind(null, projectId)}
            className="form-grid"
          >
            <RetentionActionFields />
            <label className="span-2">
              Reason
              <textarea name="reason" required rows={3} />
            </label>
            <button className="button" type="submit">
              Update lifecycle
            </button>
          </form>
        ) : null}
      </section>

      {capabilities.canRegister ? (
        <section className="section">
          <div className="section-heading">
            <h2>Register file</h2>
            <span className="meta-list">
              Register metadata for a private storage object
            </span>
          </div>
          <form
            action={registerProjectFileAction.bind(null, projectId)}
            className="form-grid"
          >
            <label>
              Source file metadata
              <input name="file" type="file" />
              <small>
                Reads name, MIME type, and size; object upload remains
                provider-backed.
              </small>
            </label>
            <label>
              Category
              <select name="category" required>
                {categories.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Visibility
              <select name="visibility" required>
                <option value="internal">Internal</option>
                <option value="couple_visible">Couple visible</option>
                <option value="partner_visible">Partner visible</option>
                <option value="guest_visible">Guest visible</option>
              </select>
            </label>
            <label>
              Event
              <select name="eventId">
                <option value="">Project-level</option>
                {projectDetails.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Filename fallback
              <input name="filename" placeholder="report.csv" />
            </label>
            <label>
              MIME fallback
              <input name="mimeType" placeholder="text/csv" />
            </label>
            <label>
              Size fallback
              <input min={0} name="fileSizeBytes" type="number" />
            </label>
            <button className="button" type="submit">
              Register file
            </button>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Files</h2>
          <span className="meta-list">{files.length} records</span>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/files`}
          >
            All
          </Link>
          {categories.map((entry) => (
            <Link
              className="button secondary"
              href={`/platform/projects/${projectId}/files?category=${entry.slug}`}
              key={entry.slug}
            >
              {entry.name}
            </Link>
          ))}
        </div>
        {files.length === 0 ? (
          <div className="empty-state">No files registered yet.</div>
        ) : (
          <div className="record-list">
            {files.map((file) => (
              <Link
                className="record-row"
                href={`/platform/projects/${projectId}/files/${file.id}`}
                key={file.id}
              >
                <span>
                  <strong>{file.filename}</strong>
                  <small>
                    {file.category} - v{file.version} - {file.mime_type}
                  </small>
                </span>
                <span className="tag">{file.status}</span>
                <span className="tag">{file.visibility}</span>
                <span className="meta-list">
                  {file.is_latest ? "latest" : "old version"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Archive events</h2>
          <span className="meta-list">{events.length} recent records</span>
        </div>
        {events.length === 0 ? (
          <div className="empty-state">No archive lifecycle events yet.</div>
        ) : (
          <div className="task-list">
            {events.map((event) => (
              <div className="task-row" key={event.id}>
                <span>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <small>{event.reason}</small>
                </span>
                <span className="meta-list">
                  {formatDate(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
