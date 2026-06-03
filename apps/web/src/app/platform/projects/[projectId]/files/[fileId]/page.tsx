import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { formatDateTime } from "@/lib/dates/format-date";
import {
  getProjectFileCapabilities,
  requireProjectFileReadPermission,
} from "@/lib/files/file-api";
import { getProjectFileDetails } from "@/lib/files/file-db";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { archiveProjectFileAction, createFileVersionAction } from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    fileId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    fileStatus?: string;
  }>;
};

export default async function ProjectFileDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const authContext = await getAuthContext();
  const { fileId, projectId } = await params;
  const filters = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/files/${fileId}`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">File details</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. File details will
            load after local credentials are supplied.
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

  const [details, capabilities] = await Promise.all([
    getProjectFileDetails(supabase, fileId),
    getProjectFileCapabilities(context, projectId),
  ]);

  if (!details || details.file.project_id !== projectId) {
    notFound();
  }

  const file = details.file;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{file.category}</p>
          <h1 className="page-title">{file.filename}</h1>
          <p className="page-summary">
            Version {file.version} file registry record with archive, access,
            and download evidence.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/files`}
        >
          Files
        </Link>
        {capabilities.canDownload ? (
          <Link
            className="button"
            href={`/api/projects/${projectId}/files/${file.id}/download`}
          >
            Download
          </Link>
        ) : null}
      </div>

      {filters.fileStatus ? (
        <section className="section">
          <div className="alert">{filters.fileStatus.replaceAll("_", " ")}</div>
        </section>
      ) : null}

      <section className="section">
        <h2>File metadata</h2>
        <div className="detail-grid">
          <div>
            <span>Status</span>
            <strong>{file.status}</strong>
          </div>
          <div>
            <span>Visibility</span>
            <strong>{file.visibility}</strong>
          </div>
          <div>
            <span>Version group</span>
            <strong>{file.version_group_id}</strong>
          </div>
          <div>
            <span>Size</span>
            <strong>{file.file_size_bytes} bytes</strong>
          </div>
          <div>
            <span>Created</span>
            <strong>{formatDateTime(file.created_at)}</strong>
          </div>
          <div>
            <span>Retention status</span>
            <strong>{file.retention_status}</strong>
          </div>
        </div>
      </section>

      {capabilities.canVersion ? (
        <section className="section">
          <div className="section-heading">
            <h2>Create version</h2>
            <span className="meta-list">Preserves old versions</span>
          </div>
          <form
            action={createFileVersionAction.bind(null, projectId, file.id)}
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
              Filename fallback
              <input name="filename" placeholder={file.filename} />
            </label>
            <label>
              MIME fallback
              <input name="mimeType" placeholder={file.mime_type} />
            </label>
            <label>
              Size fallback
              <input min={0} name="fileSizeBytes" type="number" />
            </label>
            <input name="category" type="hidden" value={file.category} />
            <input name="visibility" type="hidden" value={file.visibility} />
            <label className="span-2">
              Reason
              <textarea name="reason" rows={2} />
            </label>
            <button className="button" type="submit">
              Create version
            </button>
          </form>
        </section>
      ) : null}

      {capabilities.canArchive ? (
        <section className="section">
          <div className="section-heading">
            <h2>Archive controls</h2>
            <span className="meta-list">No hard deletion</span>
          </div>
          <form
            action={archiveProjectFileAction.bind(null, projectId, file.id)}
            className="form-grid"
          >
            <label>
              Action
              <select name="action" required>
                <option value="archive">Archive</option>
                {capabilities.canSoftDelete ? (
                  <option value="soft_delete">Soft delete old version</option>
                ) : null}
              </select>
            </label>
            <label className="span-2">
              Reason
              <textarea name="reason" required rows={3} />
            </label>
            <button className="button" type="submit">
              Apply archive action
            </button>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Version history</h2>
          <span className="meta-list">{details.versions.length} versions</span>
        </div>
        <div className="record-list">
          {details.versions.map((version) => (
            <div className="record-row" key={version.id}>
              <span>
                <strong>{version.filename}</strong>
                <small>
                  v{version.version} - {formatDateTime(version.created_at)}
                </small>
              </span>
              <span className="tag">{version.status}</span>
              <span className="meta-list">
                {version.is_latest ? "latest" : "previous"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Access events</h2>
          <span className="meta-list">
            {details.accessEvents.length} recent records
          </span>
        </div>
        {details.accessEvents.length === 0 ? (
          <div className="empty-state">No download/access records yet.</div>
        ) : (
          <div className="task-list">
            {details.accessEvents.map((event) => (
              <div className="task-row" key={event.id}>
                <span>
                  <strong>{event.access_action}</strong>
                  <small>{event.access_context}</small>
                </span>
                <span className="tag">
                  {event.allowed ? "allowed" : "denied"}
                </span>
                <span className="meta-list">
                  {formatDateTime(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Archive events</h2>
          <span className="meta-list">
            {details.archiveEvents.length} recent records
          </span>
        </div>
        {details.archiveEvents.length === 0 ? (
          <div className="empty-state">No file archive records yet.</div>
        ) : (
          <div className="task-list">
            {details.archiveEvents.map((event) => (
              <div className="task-row" key={event.id}>
                <span>
                  <strong>{event.action}</strong>
                  <small>{event.reason}</small>
                </span>
                <span className="tag">{event.next_status}</span>
                <span className="meta-list">
                  {formatDateTime(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
