import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  getCommercialActionCapabilities,
  requireAnyCommercialReadPermission,
} from "@/lib/contracts/contract-api";
import { getProjectCommercialOverview } from "@/lib/contracts/contract-db";
import { formatUsd } from "@/lib/contracts/contract-service";
import { ProjectAccessError } from "@/lib/projects/project-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  applyCommercialGestureAction,
  approveContractAction,
  calculatePricingAction,
  confirmPaymentAction,
  createAddendumAction,
  createAddonAction,
  createPackageAction,
  createPaymentExceptionAction,
  generateContractAction,
  recordPaymentAction,
  selectEventPackageAction,
} from "./actions";

export const dynamic = "force-dynamic";

type CommercialPageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    commercialError?: string;
    commercialStatus?: string;
  }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function commercialStatusMessage(code: string) {
  const messages: Record<string, string> = {
    addendum_created: "Addendum created.",
    addon_created: "Add-on created.",
    commercial_gesture_applied: "Commercial gesture applied.",
    contract_approved: "Contract approved.",
    contract_generated: "Contract generated.",
    event_package_selected: "Event package selection saved.",
    package_created: "Package created.",
    payment_confirmed: "Payment confirmed.",
    payment_exception_created: "Payment exception created.",
    payment_recorded: "Payment recorded.",
    pricing_calculated: "Pricing snapshot stored.",
  };

  return messages[code] ?? "Commercial action completed.";
}

function commercialErrorMessage(code: string) {
  const messages: Record<string, string> = {
    commercial_action_failed: "Commercial action failed.",
    invalid_commercial_request: "Commercial action could not be saved.",
  };

  return messages[code] ?? "Commercial action failed.";
}

export default async function ProjectCommercialPage({
  params,
  searchParams,
}: CommercialPageProps) {
  const authContext = await getAuthContext();
  const { projectId } = await params;
  const notices = await searchParams;

  if (authContext.status === "anonymous") {
    redirect(
      buildLoginRedirectPath(`/platform/projects/${projectId}/commercial`),
    );
  }

  if (authContext.status === "not_configured") {
    return (
      <>
        <h1 className="page-title">Contracts and payments</h1>
        <section className="section">
          <div className="alert">
            Supabase environment variables are not configured. Commercial
            controls will load after local credentials are supplied.
          </div>
        </section>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const context = {
    supabase,
    user: authContext.user,
  };

  try {
    await requireAnyCommercialReadPermission(context, projectId);
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }

  const capabilities = await getCommercialActionCapabilities(
    context,
    projectId,
  );
  const overview = await getProjectCommercialOverview(
    supabase,
    projectId,
    capabilities,
  );
  const latestContract = overview.contracts[0] ?? null;
  const activeSelectionByEventId = new Map(
    overview.selections.map((selection) => [selection.event_id, selection]),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Sprint 10 commercial foundation</p>
          <h1 className="page-title">Contracts, pricing, and payments</h1>
          <p className="page-summary">
            {overview.project.bride_name} & {overview.project.groom_name} -{" "}
            {overview.project.project_code}
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/platform/projects/${projectId}`}
        >
          Project
        </Link>
      </div>

      {notices.commercialError ? (
        <section className="section">
          <div className="alert">
            {commercialErrorMessage(notices.commercialError)}
          </div>
        </section>
      ) : null}
      {notices.commercialStatus ? (
        <section className="section">
          <div className="success">
            {commercialStatusMessage(notices.commercialStatus)}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Gate status</h2>
          <span className="meta-list">PAY-014 / PAY-015</span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Guest-list gate</span>
            <strong>
              {statusLabel(overview.project.guest_list_access_status)}
            </strong>
          </div>
          <div>
            <span>Guest page / sending gate</span>
            <strong>
              {statusLabel(overview.project.guest_page_access_status)}
            </strong>
          </div>
          <div>
            <span>Expected amount</span>
            <strong>
              {formatUsd(overview.balance?.expectedAmountCents ?? 0)}
            </strong>
          </div>
          <div>
            <span>Balance due</span>
            <strong>{formatUsd(overview.balance?.balanceDueCents ?? 0)}</strong>
          </div>
        </div>
      </section>

      {capabilities.canManagePackages ? (
        <section className="section">
          <div className="section-heading">
            <h2>Service catalog</h2>
            <span className="meta-list">PAY-006</span>
          </div>
          <div className="form-grid">
            <form
              action={createPackageAction.bind(null, projectId)}
              className="form-card"
            >
              <h3>Package</h3>
              <label>
                Code
                <input name="packageCode" placeholder="FULL_SERVICE" required />
              </label>
              <label>
                Name
                <input name="name" placeholder="Full service" required />
              </label>
              <label>
                Pricing mode
                <select name="pricingMode" defaultValue="base_plus_per_guest">
                  <option value="flat">Flat</option>
                  <option value="per_guest">Per guest</option>
                  <option value="base_plus_per_guest">Base plus guests</option>
                </select>
              </label>
              <label>
                Base price cents
                <input min="0" name="basePriceCents" required type="number" />
              </label>
              <label>
                Included guests
                <input min="0" name="includedGuestCount" type="number" />
              </label>
              <label>
                Extra guest cents
                <input
                  min="0"
                  name="pricePerAdditionalGuestCents"
                  type="number"
                />
              </label>
              <label>
                Description
                <textarea name="description" rows={3} />
              </label>
              <button className="button" type="submit">
                Create package
              </button>
            </form>

            <form
              action={createAddonAction.bind(null, projectId)}
              className="form-card"
            >
              <h3>Add-on</h3>
              <label>
                Code
                <input name="addonCode" placeholder="VIP_TABLES" required />
              </label>
              <label>
                Name
                <input name="name" placeholder="VIP table cards" required />
              </label>
              <label>
                Pricing mode
                <select name="pricingMode" defaultValue="flat">
                  <option value="flat">Flat</option>
                  <option value="per_guest">Per guest</option>
                </select>
              </label>
              <label>
                Price cents
                <input min="1" name="priceCents" required type="number" />
              </label>
              <label>
                Description
                <textarea name="description" rows={3} />
              </label>
              <button className="button" type="submit">
                Create add-on
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <h2>Event package selection</h2>
          <span className="meta-list">PROJ-006 / PAY-007</span>
        </div>
        {capabilities.canManagePricing ? (
          <form
            action={selectEventPackageAction.bind(null, projectId)}
            className="stacked-form"
          >
            <div className="form-grid compact">
              <label>
                Event
                <select name="eventId" required>
                  {overview.events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Package
                <select name="servicePackageId" required>
                  {overview.packages.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.package_code} - {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Planned guests
                <input
                  min="0"
                  name="plannedGuestCount"
                  required
                  type="number"
                />
              </label>
            </div>
            <div className="checkbox-grid">
              {overview.addons.map((addon) => (
                <label key={addon.id}>
                  <input name="addonIds" type="checkbox" value={addon.id} />
                  {addon.name} ({formatUsd(addon.price_cents)})
                </label>
              ))}
            </div>
            <button className="button" type="submit">
              Save selection
            </button>
          </form>
        ) : null}

        <div className="record-list">
          {overview.events.map((event) => {
            const selection = activeSelectionByEventId.get(event.id);
            const servicePackage = overview.packages.find(
              (item) => item.id === selection?.service_package_id,
            );

            return (
              <div className="record-row" key={event.id}>
                <span>
                  <strong>{event.name}</strong>
                  <small>
                    {selection
                      ? `${selection.planned_guest_count} planned guests`
                      : "No package selected"}
                  </small>
                </span>
                <span>{servicePackage?.name ?? "Unassigned"}</span>
                <span className="tag">
                  {selection
                    ? formatUsd(selection.calculated_amount_cents)
                    : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Pricing preview</h2>
          <span className="meta-list">PAY-008 / PAY-009 / PAY-012</span>
        </div>
        <div className="detail-grid">
          <div>
            <span>Subtotal</span>
            <strong>
              {formatUsd(overview.pricing?.subtotalAmountCents ?? 0)}
            </strong>
          </div>
          <div>
            <span>Commercial gesture</span>
            <strong>
              {formatUsd(overview.pricing?.discountAmountCents ?? 0)}
            </strong>
          </div>
          <div>
            <span>Total</span>
            <strong>
              {formatUsd(overview.pricing?.totalAmountCents ?? 0)}
            </strong>
          </div>
          <div>
            <span>Planned guests</span>
            <strong>{overview.pricing?.plannedGuestCountSnapshot ?? 0}</strong>
          </div>
        </div>
        <div className="button-group">
          {capabilities.canCalculatePricing ? (
            <form action={calculatePricingAction.bind(null, projectId)}>
              <button className="button secondary" type="submit">
                Store pricing snapshot
              </button>
            </form>
          ) : null}
          {capabilities.canManageGestures ? (
            <form
              action={applyCommercialGestureAction.bind(null, projectId)}
              className="inline-form"
            >
              <label className="inline-field">
                Gesture type
                <select name="gestureType" defaultValue="fixed_amount">
                  <option value="fixed_amount">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </label>
              <label className="inline-field">
                Amount cents
                <input min="1" name="amountCents" type="number" />
              </label>
              <label className="inline-field">
                Basis points
                <input min="1" name="percentageBps" type="number" />
              </label>
              <label className="inline-field">
                Reason
                <input name="reason" required />
              </label>
              <button className="button secondary" type="submit">
                Apply gesture
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Contract</h2>
          <span className="meta-list">PAY-001 / PAY-002 / PAY-003</span>
        </div>
        {capabilities.canGenerateContracts ? (
          <form action={generateContractAction.bind(null, projectId)}>
            <button className="button" type="submit">
              Generate project contract
            </button>
          </form>
        ) : null}

        {latestContract ? (
          <div className="contract-preview">
            <div className="detail-grid">
              <div>
                <span>Contract</span>
                <strong>{latestContract.contract_number}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{statusLabel(latestContract.status)}</strong>
              </div>
              <div>
                <span>Version</span>
                <strong>{latestContract.version}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatUsd(latestContract.final_amount_cents)}</strong>
              </div>
            </div>
            <pre>{latestContract.rendered_contract}</pre>
            {capabilities.canApproveContracts &&
            latestContract.status !== "approved" ? (
              <form
                action={approveContractAction.bind(
                  null,
                  projectId,
                  latestContract.id,
                )}
                className="stacked-form"
              >
                <label>
                  <input name="approvalChecked" required type="checkbox" />I
                  have reviewed this contract and approve it in-app.
                </label>
                <label>
                  Approval confirmation
                  <input name="confirmationText" required />
                </label>
                <button className="button" type="submit">
                  Approve contract
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">No contract generated yet.</div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Payments</h2>
          <span className="meta-list">PAY-013 / PAY-014</span>
        </div>
        {capabilities.canRecordPayments && latestContract ? (
          <form
            action={recordPaymentAction.bind(null, projectId)}
            className="stacked-form"
          >
            <input
              name="contractId"
              type="hidden"
              value={latestContract?.id ?? ""}
            />
            <input
              name="expectedAmountCents"
              type="hidden"
              value={overview.balance?.expectedAmountCents ?? 0}
            />
            <div className="form-grid compact">
              <label>
                Paid cents
                <input min="1" name="paidAmountCents" required type="number" />
              </label>
              <label>
                Method
                <input
                  name="paymentMethod"
                  placeholder="Bank transfer"
                  required
                />
              </label>
              <label>
                Payment date
                <input name="paymentDate" type="date" />
              </label>
            </div>
            <label>
              Reference note
              <input name="referenceNote" />
            </label>
            {capabilities.canConfirmPayments ? (
              <label>
                <input name="confirmNow" type="checkbox" />
                Confirm immediately
              </label>
            ) : null}
            <button className="button" type="submit">
              Record payment
            </button>
          </form>
        ) : null}

        <div className="record-list">
          {overview.payments.length === 0 ? (
            <div className="empty-state">No manual payments recorded yet.</div>
          ) : (
            overview.payments.map((payment) => (
              <div className="record-row" key={payment.id}>
                <span>
                  <strong>{formatUsd(payment.paid_amount_cents)}</strong>
                  <small>{formatDate(payment.payment_date)}</small>
                </span>
                <span>{payment.payment_method}</span>
                <span className="tag">{statusLabel(payment.status)}</span>
                {capabilities.canConfirmPayments &&
                payment.status === "recorded" ? (
                  <form
                    action={confirmPaymentAction.bind(
                      null,
                      projectId,
                      payment.id,
                    )}
                  >
                    <button className="button secondary" type="submit">
                      Confirm
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      {capabilities.canManageExceptions ? (
        <section className="section">
          <div className="section-heading">
            <h2>Payment exception</h2>
            <span className="meta-list">PAY-015</span>
          </div>
          <form
            action={createPaymentExceptionAction.bind(null, projectId)}
            className="stacked-form"
          >
            <label>
              Reason
              <input name="reason" placeholder="Required reason" required />
            </label>
            <label>
              Conditions
              <input name="conditions" placeholder="Conditions" />
            </label>
            <label>
              Expires at
              <input name="expiresAt" type="datetime-local" />
            </label>
            <button className="button" type="submit">
              Approve exception
            </button>
          </form>
        </section>
      ) : null}

      {capabilities.canManageAddendums && latestContract ? (
        <section className="section">
          <div className="section-heading">
            <h2>Addendums</h2>
            <span className="meta-list">PAY-005 / PAY-010 / PAY-011</span>
          </div>
          <form
            action={createAddendumAction.bind(null, projectId)}
            className="stacked-form"
          >
            <input name="contractId" type="hidden" value={latestContract.id} />
            <input
              name="projectCode"
              type="hidden"
              value={overview.project.project_code}
            />
            <label>
              Additional cents
              <input
                min="1"
                name="additionalAmountCents"
                required
                type="number"
              />
            </label>
            <label>
              Reason
              <input name="reason" required />
            </label>
            <button className="button secondary" type="submit">
              Create addendum
            </button>
          </form>
          <div className="record-list">
            {overview.addendums.map((addendum) => (
              <div className="record-row" key={addendum.id}>
                <span>
                  <strong>{addendum.addendum_number}</strong>
                  <small>{addendum.reason}</small>
                </span>
                <span>{formatUsd(addendum.additional_amount_cents)}</span>
                <span className="tag">{statusLabel(addendum.status)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {capabilities.canReadPayments ? (
        <section className="section">
          <div className="section-heading">
            <h2>Gate history</h2>
            <span className="meta-list">REP-006</span>
          </div>
          <div className="record-list">
            {overview.gateEvents.map((event) => (
              <div className="record-row" key={event.id}>
                <span>
                  <strong>{statusLabel(event.gate_type)}</strong>
                  <small>{event.reason}</small>
                </span>
                <span>{statusLabel(event.new_status)}</span>
                <span className="meta-list">
                  {formatDate(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
