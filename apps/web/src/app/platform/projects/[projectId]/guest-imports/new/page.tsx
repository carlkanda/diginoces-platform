import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/auth-service";
import { getProjectDetails } from "@/lib/projects/project-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startGuestImportAction } from "../actions";

export const dynamic = "force-dynamic";

type NewGuestImportPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function NewGuestImportPage({
  params,
}: NewGuestImportPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;

  if (authContext.status === "anonymous") {
    redirect(`/login?next=/platform/projects/${projectId}/guest-imports/new`);
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Upload guest CSV</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Guest imports
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const projectDetails = await getProjectDetails(
    await createSupabaseServerClient(),
    projectId,
  );

  if (!projectDetails) {
    redirect("/platform/projects");
  }

  const action = startGuestImportAction.bind(null, projectId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{projectDetails.project.project_code}</p>
          <h1 className="page-title">Upload guest CSV</h1>
          <p className="page-summary">
            Start a CSV-only import session. Source files are not persisted in
            Sprint 4; parsed rows and metadata are stored for review.
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}/guest-imports`}
        >
          Import history
        </Link>
      </div>

      <section className="section">
        <form action={action} className="form">
          <div className="field">
            <label htmlFor="importSide">Guest side</label>
            <select id="importSide" name="importSide" required>
              <option value="bride">Bride side</option>
              <option value="groom">Groom side</option>
              <option value="both">Both sides</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="csvFile">CSV file</label>
            <input
              accept=".csv,text/csv"
              id="csvFile"
              name="csvFile"
              type="file"
            />
          </div>

          <div className="field">
            <label htmlFor="sourceFilename">Filename override</label>
            <input
              id="sourceFilename"
              name="sourceFilename"
              placeholder="guest-import.csv"
            />
          </div>

          <div className="field">
            <label htmlFor="csvContent">Paste CSV content</label>
            <textarea
              id="csvContent"
              name="csvContent"
              placeholder="Titre,Nom,WhatsApp,Cote,Evenements"
              rows={8}
            />
            <p className="form-note">
              Paste content only when a local CSV file is not selected.
            </p>
          </div>

          <button className="button" type="submit">
            Continue to mapping
          </button>
        </form>
      </section>
    </>
  );
}
