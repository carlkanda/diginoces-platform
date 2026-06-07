import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { redirectToMfaIfStepUpRequired } from "@/lib/auth/mfa-route-guard";
import { requireGuestListContractGateOpen } from "@/lib/contracts/contract-gates";
import { requireAnyGuestCreatePermission } from "@/lib/guests/guest-api";
import { listGuestTags, listGuestTitleTypes } from "@/lib/guests/guest-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { listProjectEvents } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGuestAction } from "../actions";

export const dynamic = "force-dynamic";

type NewGuestPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function NewGuestPage({ params }: NewGuestPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/guests/new`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Add guest</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest creation
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();

  const permissionContext = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireAnyGuestCreatePermission(permissionContext, projectId);
    await requireGuestListContractGateOpen(permissionContext, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      await redirectToMfaIfStepUpRequired(
        permissionContext,
        `/platform/projects/${projectId}/guests/new`,
        [
          {
            permission: "guests.create",
            scope: "project",
            scopeId: projectId,
          },
          {
            permission: "guests.update",
            scope: "project",
            scopeId: projectId,
          },
          {
            permission: "guests.manage_bride_side",
            scope: "project",
            scopeId: projectId,
          },
          {
            permission: "guests.manage_groom_side",
            scope: "project",
            scopeId: projectId,
          },
        ],
      );
      notFound();
    }

    throw error;
  }

  const [events, tags, titleTypes] = await Promise.all([
    listProjectEvents(supabase, projectId),
    listGuestTags(supabase, projectId),
    listGuestTitleTypes(supabase, projectId),
  ]);
  const action = createGuestAction.bind(null, projectId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 3</p>
          <h1 className="page-title">Add guest</h1>
          <p className="page-summary">
            Manual project-level guest creation foundation.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/guests`}
        >
          Guests
        </Link>
      </div>

      <section className="section">
        <form action={action} className="form">
          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input id="displayName" name="displayName" required />
          </div>

          <div className="field">
            <label htmlFor="guestTitleTypeId">Title/type</label>
            <select id="guestTitleTypeId" name="guestTitleTypeId" required>
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
            <select id="guestSide" name="guestSide" required>
              <option value="bride">Bride side</option>
              <option value="groom">Groom side</option>
              <option value="both">Both sides</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="whatsappNumber">WhatsApp number</label>
            <input id="whatsappNumber" name="whatsappNumber" />
          </div>

          <label className="check-field">
            <input name="isPrintedOnly" type="checkbox" />
            Printed-only guest
          </label>

          <div className="field">
            <label htmlFor="eventIds">Event assignments</label>
            <select id="eventIds" multiple name="eventIds">
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            <p className="form-note">
              Event assignment is foundation-only; RSVP and invitations are not
              implemented in Sprint 3.
            </p>
          </div>

          <div className="field">
            <label htmlFor="tagIds">Tags</label>
            <select id="tagIds" multiple name="tagIds">
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
              id="preferredLanguage"
              name="preferredLanguage"
              placeholder="en"
            />
          </div>

          <div className="field">
            <label htmlFor="internalNotes">Internal notes</label>
            <textarea id="internalNotes" name="internalNotes" rows={4} />
          </div>

          <button className="button" type="submit">
            Create guest
          </button>
        </form>
      </section>
    </>
  );
}
