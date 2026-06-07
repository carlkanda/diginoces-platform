import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { getInvitationTemplateDetails } from "@/lib/invitations/invitation-db";
import {
  hasProjectPermission,
  ProjectAccessError,
  requireEventPermission,
} from "@/lib/projects/project-api";
import { getEventDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  approveInvitationPreviewAction,
  enqueueInvitationGenerationAction,
  generateInvitationPreviewAction,
  saveInvitationTemplateFieldsAction,
} from "../actions";

export const dynamic = "force-dynamic";

type InvitationTemplateDetailPageProps = {
  params: Promise<{
    eventId: string;
    templateId: string;
  }>;
};

const defaultFields = [
  {
    alignment: "center" as const,
    field_key: "guest.display_name",
    font_family: "Inter",
    font_size: 24,
    label: "Guest display name",
    page_number: 1,
    position: { height: 0.08, width: 0.5, x: 0.25, y: 0.42 },
  },
  {
    alignment: "center" as const,
    field_key: "public_guest_page_qr",
    font_family: null,
    font_size: null,
    label: "Public guest page QR/link",
    page_number: 1,
    position: { height: 0.16, width: 0.16, x: 0.72, y: 0.72 },
  },
];

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function fieldValue(position: Record<string, number>, key: string) {
  return String(position[key] ?? 0);
}

export default async function InvitationTemplateDetailPage({
  params,
}: InvitationTemplateDetailPageProps) {
  const authContext = await getAuthContext();
  const { eventId, templateId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(
        `/platform/events/${eventId}/invitations/${templateId}`,
      ),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Invitation template</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Invitation
            template details will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = { supabase, user: authContext.user };

  try {
    await requireEventPermission(context, eventId, "invitation_templates.read");
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        context,
        `/platform/events/${eventId}/invitations/${templateId}`,
        {
          permission: "invitation_templates.read",
          scope: "event",
          scopeId: eventId,
        },
      );
      notFound();
    }

    throw error;
  }

  const [eventDetails, templateDetails] = await Promise.all([
    getEventDetails(supabase, eventId),
    getInvitationTemplateDetails(supabase, templateId),
  ]);

  if (
    !eventDetails ||
    !templateDetails ||
    templateDetails.template.event_id !== eventId
  ) {
    notFound();
  }

  const [canUpdate, canApprove, canGenerate] = await Promise.all([
    hasProjectPermission(
      context,
      eventDetails.project.id,
      "invitation_templates.update",
    ),
    hasProjectPermission(
      context,
      eventDetails.project.id,
      "invitation_templates.approve",
    ),
    hasProjectPermission(
      context,
      eventDetails.project.id,
      "invitations.generate",
    ),
  ]);

  const fields =
    templateDetails.fields.length > 0 ? templateDetails.fields : defaultFields;
  const saveFields = saveInvitationTemplateFieldsAction.bind(
    null,
    eventId,
    templateId,
  );
  const generatePreview = generateInvitationPreviewAction.bind(
    null,
    eventId,
    templateId,
  );
  const approvePreview = approveInvitationPreviewAction.bind(
    null,
    eventId,
    templateId,
  );
  const enqueueGeneration = enqueueInvitationGenerationAction.bind(
    null,
    eventId,
    templateId,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 6 foundation</p>
          <h1 className="page-title">{templateDetails.template.name}</h1>
          <p className="page-summary">
            {eventDetails.event.name} ·{" "}
            {formatStatus(templateDetails.template.status)} ·{" "}
            {templateDetails.template.source_filename}
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}/invitations`}
          >
            Templates
          </Link>
          <Link
            className="button secondary"
            href={`/platform/events/${eventId}`}
          >
            Event
          </Link>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <h2>Template registration</h2>
          <span className="tag">
            {formatStatus(templateDetails.template.status)}
          </span>
        </div>
        <div className="detail-grid">
          <div>
            <span>File type</span>
            <strong>{templateDetails.template.file_type}</strong>
          </div>
          <div>
            <span>Storage path</span>
            <strong>registered metadata</strong>
          </div>
          <div>
            <span>Preview generated</span>
            <strong>
              {templateDetails.template.technical_preview_generated_at
                ? "Yes"
                : "No"}
            </strong>
          </div>
          <div>
            <span>Preview approved</span>
            <strong>
              {templateDetails.template.technical_preview_approved_at
                ? "Yes"
                : "No"}
            </strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Coordinate field editor</h2>
          <span className="meta-list">{fields.length} fields</span>
        </div>
        <form action={saveFields} className="stacked-form">
          {fields.map((field, index) => (
            <article className="form-panel" key={`${field.field_key}-${index}`}>
              <div className="form-grid compact">
                <label>
                  Field
                  <select
                    defaultValue={field.field_key}
                    disabled={!canUpdate}
                    name="fieldKey"
                  >
                    <option value="guest.display_name">Guest name</option>
                    <option value="guest.title">Guest title</option>
                    <option value="guest.full_invitation_name">
                      Full invitation name
                    </option>
                    <option value="event.name">Event name</option>
                    <option value="event.date">Event date</option>
                    <option value="event.venue">Event venue</option>
                    <option value="couple.names">Couple names</option>
                    <option value="public_guest_page_qr">
                      Public guest page QR
                    </option>
                    <option value="public_guest_page_url">
                      Public guest page URL
                    </option>
                    <option value="invitation.id">Invitation id</option>
                  </select>
                </label>
                <label>
                  Label
                  <input
                    defaultValue={field.label}
                    disabled={!canUpdate}
                    name={`label:${index}`}
                    required
                  />
                </label>
                <label>
                  Page
                  <input
                    defaultValue={field.page_number}
                    disabled={!canUpdate}
                    min="1"
                    name={`pageNumber:${index}`}
                    required
                    type="number"
                  />
                </label>
                <label>
                  X
                  <input
                    defaultValue={fieldValue(field.position, "x")}
                    disabled={!canUpdate}
                    max="1"
                    min="0"
                    name={`x:${index}`}
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
                <label>
                  Y
                  <input
                    defaultValue={fieldValue(field.position, "y")}
                    disabled={!canUpdate}
                    max="1"
                    min="0"
                    name={`y:${index}`}
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
                <label>
                  Width
                  <input
                    defaultValue={fieldValue(field.position, "width")}
                    disabled={!canUpdate}
                    max="1"
                    min="0.01"
                    name={`width:${index}`}
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
                <label>
                  Height
                  <input
                    defaultValue={fieldValue(field.position, "height")}
                    disabled={!canUpdate}
                    max="1"
                    min="0.01"
                    name={`height:${index}`}
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
                <label>
                  Font size
                  <input
                    defaultValue={field.font_size ?? ""}
                    disabled={!canUpdate}
                    min="1"
                    name={`fontSize:${index}`}
                    step="1"
                    type="number"
                  />
                </label>
                <label>
                  Font family
                  <input
                    defaultValue={field.font_family ?? ""}
                    disabled={!canUpdate}
                    name={`fontFamily:${index}`}
                    placeholder="Inter"
                  />
                </label>
                <label>
                  Alignment
                  <select
                    defaultValue={field.alignment ?? "center"}
                    disabled={!canUpdate}
                    name={`alignment:${index}`}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>
            </article>
          ))}
          {canUpdate ? (
            <button className="button" type="submit">
              Save field configuration
            </button>
          ) : null}
        </form>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Preview and generation</h2>
          <span className="meta-list">
            {templateDetails.jobs.length} recent generation jobs
          </span>
        </div>
        <div className="button-group">
          {canUpdate ? (
            <form action={generatePreview}>
              <button className="button secondary" type="submit">
                Generate technical preview
              </button>
            </form>
          ) : null}
          {canApprove ? (
            <form action={approvePreview}>
              <button className="button secondary" type="submit">
                Approve preview
              </button>
            </form>
          ) : null}
          {canGenerate ? (
            <form action={enqueueGeneration}>
              <button className="button" type="submit">
                Enqueue event generation
              </button>
            </form>
          ) : null}
        </div>

        {templateDetails.jobs.length === 0 ? (
          <div className="empty-state">
            No generation jobs have been queued for this template yet.
          </div>
        ) : (
          <div className="task-list">
            {templateDetails.jobs.map((job) => (
              <div className="task-row" key={job.id}>
                <span>
                  <strong>{formatStatus(job.mode)}</strong>
                  <small>
                    Ready {job.ready_count} · generated {job.generated_count} ·
                    failed {job.failed_count}
                  </small>
                </span>
                <span className="tag">{formatStatus(job.status)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Invitation records</h2>
          <span className="meta-list">
            {templateDetails.invitations.length} recent invitations
          </span>
        </div>
        {templateDetails.invitations.length === 0 ? (
          <div className="empty-state">
            Invitation records will appear after a generation job is queued.
          </div>
        ) : (
          <div className="task-list">
            {templateDetails.invitations.map((invitation) => (
              <div className="task-row" key={invitation.id}>
                <span>
                  <strong>{invitation.id}</strong>
                  <small>{invitation.guest_id}</small>
                </span>
                <span className="tag">{formatStatus(invitation.status)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
