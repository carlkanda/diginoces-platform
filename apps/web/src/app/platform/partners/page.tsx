import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import { createPartnerAction } from "@/app/platform/partners/actions";
import { listPartners } from "@/lib/partners/partner-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function hasManagePermission(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data, error } = await supabase.rpc("current_user_has_permission", {
    p_permission: "partners.manage",
    p_scope: "global",
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export default async function PartnersPage() {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/partners"));
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Partners</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Partner records
            will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [partners, canManagePartners] = await Promise.all([
    listPartners(supabase),
    hasManagePermission(supabase),
  ]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 13 foundation</p>
          <h1 className="page-title">Partners</h1>
          <p className="page-summary">
            Partner profiles, lifecycle status, project source tracking, and
            restricted partner operations under Diginoces control.
          </p>
        </div>
        <div className="button-group">
          <Link className="button secondary" href="/platform/partners/review">
            Review queue
          </Link>
          <Link className="button secondary" href="/platform/partner-dashboard">
            Partner dashboard
          </Link>
        </div>
      </div>

      {canManagePartners ? (
        <section className="section">
          <div className="section-heading">
            <h2>Create partner</h2>
            <span className="meta-list">No commissions or billing fields</span>
          </div>
          <form action={createPartnerAction} className="form-panel form-grid">
            <label>
              Organization
              <input name="organizationName" required />
            </label>
            <label>
              Partner type
              <input defaultValue="planner" name="partnerType" required />
            </label>
            <label>
              Primary contact
              <input name="primaryContactName" />
            </label>
            <label>
              Contact email
              <input name="contactEmail" required type="email" />
            </label>
            <label>
              Contact phone
              <input name="contactPhone" />
            </label>
            <label>
              WhatsApp phone
              <input name="whatsappPhone" />
            </label>
            <label>
              Internal notes
              <textarea name="internalNotes" rows={3} />
            </label>
            <div className="button-group">
              <button className="button" type="submit">
                Create partner
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Visible partner profiles</h2>
          <span className="meta-list">{partners.length} records</span>
        </div>
        {partners.length === 0 ? (
          <div className="empty-state">
            No partner profiles are visible for this account yet.
          </div>
        ) : (
          <div className="record-list">
            {partners.map((partner) => (
              <Link
                className="record-row"
                href={`/platform/partners/${partner.id}`}
                key={String(partner.id)}
              >
                <span>
                  <strong>{String(partner.organization_name)}</strong>
                  <small>{String(partner.contact_email)}</small>
                </span>
                <span className="tag">{String(partner.status)}</span>
                <span className="meta-list">
                  {String(partner.partner_type)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
