import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import {
  getGuestImportDetails,
  getStoredImportHeaders,
  getStoredImportMapping,
} from "@/lib/guest-imports/guest-import-db";
import {
  importColumnTargets,
  type ImportColumnTarget,
} from "@/lib/guest-imports/guest-import-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveGuestImportMappingAction } from "../../actions";

export const dynamic = "force-dynamic";

type MappingPageProps = {
  params: Promise<{
    importId: string;
    projectId: string;
  }>;
};

const targetLabels: Record<ImportColumnTarget, string> = {
  displayName: "Display name",
  eventNames: "Event names",
  guestSide: "Guest side",
  guestTitleType: "Guest title/type",
  internalNotes: "Internal notes",
  isPrintedOnly: "Printed-only flag",
  preferredLanguage: "Preferred language",
  tagNames: "Tag names",
  whatsappNumber: "WhatsApp number",
};

export default async function GuestImportMappingPage({
  params,
}: MappingPageProps) {
  const authContext = await getAuthContext();
  const { importId, projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(
      `/login?next=/platform/projects/${projectId}/guest-imports/${importId}/mapping`,
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Column mapping</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest import
            mapping will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const details = await getGuestImportDetails(
    await createSupabaseServerClient(),
    projectId,
    importId,
  );

  if (!details) {
    notFound();
  }

  const headers = getStoredImportHeaders(details);
  const mapping = getStoredImportMapping(details);
  const action = saveGuestImportMappingAction.bind(null, projectId, importId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{details.session.source_filename}</p>
          <h1 className="page-title">Column mapping</h1>
          <p className="page-summary">
            Confirm the CSV columns before validating staged rows.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/guest-imports/${importId}`}
        >
          Import detail
        </Link>
      </div>

      <section className="section">
        <form action={action} className="form">
          {importColumnTargets.map((target) => (
            <div className="field" key={target}>
              <label htmlFor={target}>{targetLabels[target]}</label>
              <select
                defaultValue={mapping[target] ?? ""}
                id={target}
                name={target}
              >
                <option value="">Not mapped</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button className="button" type="submit">
            Validate preview
          </button>
        </form>
      </section>
    </>
  );
}
