import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import { requireGuestSidePermission } from "@/lib/guests/guest-api";
import {
  getGuestDetails,
  listGuestTags,
  listGuestTitleTypes,
} from "@/lib/guests/guest-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { listProjectEvents } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateGuestAction } from "../actions";

export const dynamic = "force-dynamic";

type EditGuestPageProps = {
  params: Promise<{
    guestId: string;
    projectId: string;
  }>;
};

export default async function EditGuestPage({ params }: EditGuestPageProps) {
  const authContext = await getAuthContext();
  const { guestId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(`/login?next=/platform/projects/${projectId}/guests/${guestId}`);
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Edit guest</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest editing
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const details = await getGuestDetails(supabase, guestId);

  if (!details || details.guest.project_id !== projectId) {
    notFound();
  }

  try {
    await requireGuestSidePermission(
      {
        supabase,
        user: authContext.user,
      },
      projectId,
      details.guest.guest_side,
    );
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const { data: canPreviewPublicPage, error: previewPermissionError } =
    await supabase.rpc("current_user_can_access_project", {
      p_permission: "guest_public_pages.preview",
      p_project_id: projectId,
    });

  if (previewPermissionError) {
    throw previewPermissionError;
  }

  const [events, tags, titleTypes] = await Promise.all([
    listProjectEvents(supabase, projectId),
    listGuestTags(supabase, projectId),
    listGuestTitleTypes(supabase, projectId),
  ]);
  const selectedEventIds = details.eventAssignments.map(
    (assignment) => assignment.event_id,
  );
  const selectedTagIds = details.tagAssignments.map(
    (assignment) => assignment.tag_id,
  );
  const action = updateGuestAction.bind(null, projectId, guestId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Guest foundation</p>
          <h1 className="page-title">{details.guest.display_name}</h1>
          <p className="page-summary">
            Edit manual guest fields, side, tags, and event assignments.
          </p>
        </div>
        <div className="button-group">
          <Link
            className="button secondary"
            href={`/platform/projects/${projectId}/guests`}
          >
            Guests
          </Link>
          {canPreviewPublicPage ? (
            <Link
              className="button secondary"
              href={`/platform/projects/${projectId}/guests/${guestId}/public-preview`}
            >
              Public preview
            </Link>
          ) : null}
        </div>
      </div>

      <section className="section">
        <form action={action} className="form">
          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input
              defaultValue={details.guest.display_name}
              id="displayName"
              name="displayName"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="guestTitleTypeId">Title/type</label>
            <select
              defaultValue={details.guest.guest_title_type_id ?? ""}
              id="guestTitleTypeId"
              name="guestTitleTypeId"
              required
            >
              <option value="">Select title/type</option>
              {titleTypes.map((titleType) => (
                <option key={titleType.id} value={titleType.id}>
                  {titleType.label} ({titleType.default_guest_count})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="guestSide">Guest side</label>
            <select
              defaultValue={details.guest.guest_side}
              id="guestSide"
              name="guestSide"
              required
            >
              <option value="bride">Bride side</option>
              <option value="groom">Groom side</option>
              <option value="both">Both sides</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="whatsappNumber">WhatsApp number</label>
            <input
              defaultValue={details.guest.whatsapp_number ?? ""}
              id="whatsappNumber"
              name="whatsappNumber"
            />
          </div>

          <label className="check-field">
            <input
              defaultChecked={details.guest.is_printed_only}
              name="isPrintedOnly"
              type="checkbox"
            />
            Printed-only guest
          </label>

          <label className="check-field">
            <input
              defaultChecked={details.guest.is_active}
              name="isActive"
              type="checkbox"
            />
            Active guest record
          </label>

          <div className="field">
            <label htmlFor="eventIds">Event assignments</label>
            <select
              defaultValue={selectedEventIds}
              id="eventIds"
              multiple
              name="eventIds"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="tagIds">Tags</label>
            <select
              defaultValue={selectedTagIds}
              id="tagIds"
              multiple
              name="tagIds"
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="preferredLanguage">Preferred language</label>
            <input
              defaultValue={details.guest.preferred_language ?? ""}
              id="preferredLanguage"
              name="preferredLanguage"
              placeholder="en"
            />
          </div>

          <div className="field">
            <label htmlFor="internalNotes">Internal notes</label>
            <textarea
              defaultValue={details.guest.internal_notes ?? ""}
              id="internalNotes"
              name="internalNotes"
              rows={4}
            />
          </div>

          <button className="button" type="submit">
            Update guest
          </button>
        </form>
      </section>
    </>
  );
}
