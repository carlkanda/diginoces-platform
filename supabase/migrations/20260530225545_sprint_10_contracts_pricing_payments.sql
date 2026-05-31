-- Sprint 10 - Contracts, Pricing & Payment Controls
-- Requirements: PAY-001 to PAY-015, PROJ-006, RSVP-002, MSG-004,
-- ROLE-002, ROLE-004, REP-006, TECH-004.
--
-- Scope guard: this migration creates only package, pricing, contract,
-- addendum, manual payment, payment exception, payment gate, permission, RLS,
-- and audit foundations. It intentionally does not implement online payment
-- processing, tax/VAT, multi-currency, e-signature, partner commission,
-- full dashboards, or post-event workflows.

do $$
begin
  create type public.service_pricing_mode as enum (
    'flat',
    'per_guest',
    'base_plus_per_guest'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.service_catalog_status as enum (
    'active',
    'inactive',
    'draft',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_package_selection_status as enum (
    'draft',
    'selected',
    'superseded',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.pricing_calculation_status as enum (
    'draft',
    'current',
    'snapshotted',
    'superseded'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.contract_status as enum (
    'draft',
    'generated',
    'sent_for_approval',
    'approved',
    'superseded',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.contract_addendum_status as enum (
    'draft',
    'generated',
    'sent_for_approval',
    'approved',
    'rejected',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum (
    'recorded',
    'confirmed',
    'rejected',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_exception_status as enum (
    'active',
    'revoked',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.commercial_gesture_type as enum (
    'fixed_amount',
    'percentage'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.commercial_gesture_status as enum (
    'active',
    'revoked'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_list_access_status as enum (
    'locked',
    'contract_approved'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guest_page_access_status as enum (
    'locked',
    'payment_confirmed',
    'exception_override'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.wedding_projects
  add column if not exists guest_list_access_status public.guest_list_access_status not null default 'locked',
  add column if not exists guest_list_access_unlocked_at timestamptz,
  add column if not exists guest_list_access_unlocked_by uuid references auth.users (id) on delete set null,
  add column if not exists latest_contract_id uuid,
  add column if not exists latest_payment_gate_checked_at timestamptz;

create table if not exists public.service_packages (
  id uuid primary key default extensions.gen_random_uuid(),
  package_code text not null unique,
  name text not null,
  description text,
  base_price_cents integer not null default 0,
  pricing_mode public.service_pricing_mode not null default 'base_plus_per_guest',
  included_guest_count integer not null default 0,
  price_per_additional_guest_cents integer not null default 0,
  status public.service_catalog_status not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_packages_code_format check (package_code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint service_packages_name_not_blank check (length(trim(name)) > 0),
  constraint service_packages_amounts_non_negative check (
    base_price_cents >= 0
    and included_guest_count >= 0
    and price_per_additional_guest_cents >= 0
  )
);

create index if not exists service_packages_status_idx
  on public.service_packages (status, package_code);

create table if not exists public.service_package_addons (
  id uuid primary key default extensions.gen_random_uuid(),
  addon_code text not null unique,
  name text not null,
  description text,
  price_cents integer not null default 0,
  pricing_mode public.service_pricing_mode not null default 'flat',
  status public.service_catalog_status not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_package_addons_code_format check (addon_code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint service_package_addons_name_not_blank check (length(trim(name)) > 0),
  constraint service_package_addons_pricing_mode_supported check (pricing_mode in ('flat', 'per_guest')),
  constraint service_package_addons_price_non_negative check (price_cents >= 0)
);

create index if not exists service_package_addons_status_idx
  on public.service_package_addons (status, addon_code);

create table if not exists public.project_event_package_selections (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  service_package_id uuid not null references public.service_packages (id) on delete restrict,
  selected_addon_ids uuid[] not null default '{}',
  selected_addons_snapshot jsonb not null default '[]'::jsonb,
  planned_guest_count integer not null default 0,
  calculated_amount_cents integer not null default 0,
  status public.event_package_selection_status not null default 'selected',
  selected_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_event_package_selections_event_project_match
    foreign key (event_id, project_id)
    references public.events (id, project_id)
    on delete cascade,
  constraint project_event_package_selections_guest_count_non_negative check (planned_guest_count >= 0),
  constraint project_event_package_selections_amount_non_negative check (calculated_amount_cents >= 0)
);

create unique index if not exists project_event_package_selections_active_key
  on public.project_event_package_selections (event_id)
  where status = 'selected';

create index if not exists project_event_package_selections_project_idx
  on public.project_event_package_selections (project_id, status, updated_at desc);

create table if not exists public.pricing_calculations (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  status public.pricing_calculation_status not null default 'draft',
  currency text not null default 'USD',
  planned_guest_count_snapshot integer not null default 0,
  subtotal_amount_cents integer not null default 0,
  discount_amount_cents integer not null default 0,
  total_amount_cents integer not null default 0,
  event_breakdown jsonb not null default '[]'::jsonb,
  notes text,
  calculated_by uuid references auth.users (id) on delete set null,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint pricing_calculations_currency_usd check (currency = 'USD'),
  constraint pricing_calculations_amounts_non_negative check (
    planned_guest_count_snapshot >= 0
    and subtotal_amount_cents >= 0
    and discount_amount_cents >= 0
    and total_amount_cents >= 0
  )
);

create index if not exists pricing_calculations_project_status_idx
  on public.pricing_calculations (project_id, status, calculated_at desc);

create table if not exists public.contracts (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  contract_number text not null unique,
  version integer not null default 1,
  status public.contract_status not null default 'generated',
  currency text not null default 'USD',
  structured_data jsonb not null default '{}'::jsonb,
  rendered_contract text not null,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  planned_guest_count_snapshot integer not null default 0,
  package_snapshot jsonb not null default '[]'::jsonb,
  subtotal_amount_cents integer not null default 0,
  discount_amount_cents integer not null default 0,
  final_amount_cents integer not null default 0,
  generated_by uuid references auth.users (id) on delete set null,
  generated_at timestamptz not null default now(),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  approval_confirmation_text text,
  is_latest boolean not null default true,
  file_id uuid references public.files (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_currency_usd check (currency = 'USD'),
  constraint contracts_version_positive check (version > 0),
  constraint contracts_number_not_blank check (length(trim(contract_number)) > 0),
  constraint contracts_guest_count_non_negative check (planned_guest_count_snapshot >= 0),
  constraint contracts_amounts_non_negative check (
    subtotal_amount_cents >= 0
    and discount_amount_cents >= 0
    and final_amount_cents >= 0
  ),
  constraint contracts_approval_fields_match_status check (
    (status = 'approved' and approved_by is not null and approved_at is not null and length(trim(coalesce(approval_confirmation_text, ''))) > 0)
    or status <> 'approved'
  )
);

create unique index if not exists contracts_project_version_key
  on public.contracts (project_id, version);

create unique index if not exists contracts_id_project_id_key
  on public.contracts (id, project_id);

create unique index if not exists contracts_latest_project_key
  on public.contracts (project_id)
  where is_latest;

create index if not exists contracts_project_status_idx
  on public.contracts (project_id, status, generated_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wedding_projects_latest_contract_id_fkey'
      and conrelid = 'public.wedding_projects'::regclass
  ) then
    alter table public.wedding_projects
      add constraint wedding_projects_latest_contract_id_fkey
      foreign key (latest_contract_id)
      references public.contracts (id)
      on delete set null;
  end if;
end $$;

create table if not exists public.contract_approvals (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  approved_by uuid not null references auth.users (id) on delete restrict,
  approved_at timestamptz not null default now(),
  confirmation_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint contract_approvals_confirmation_not_blank check (length(trim(confirmation_text)) > 0),
  constraint contract_approvals_contract_project_match
    foreign key (contract_id, project_id)
    references public.contracts (id, project_id)
    on delete cascade
);

create unique index if not exists contract_approvals_contract_once_key
  on public.contract_approvals (contract_id);

create table if not exists public.contract_addendums (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  addendum_number text not null unique,
  reason text not null,
  old_value_snapshot jsonb not null default '{}'::jsonb,
  new_value_snapshot jsonb not null default '{}'::jsonb,
  additional_amount_cents integer not null default 0,
  status public.contract_addendum_status not null default 'generated',
  generated_by uuid references auth.users (id) on delete set null,
  generated_at timestamptz not null default now(),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_addendums_contract_project_match
    foreign key (contract_id, project_id)
    references public.contracts (id, project_id)
    on delete cascade,
  constraint contract_addendums_reason_not_blank check (length(trim(reason)) > 0),
  constraint contract_addendums_amount_non_negative check (additional_amount_cents >= 0)
);

create index if not exists contract_addendums_project_status_idx
  on public.contract_addendums (project_id, status, generated_at desc);

create unique index if not exists contract_addendums_id_project_id_key
  on public.contract_addendums (id, project_id);

create table if not exists public.payments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  addendum_id uuid references public.contract_addendums (id) on delete set null,
  expected_amount_cents integer not null default 0,
  paid_amount_cents integer not null,
  currency text not null default 'USD',
  payment_method text not null,
  payment_date date not null default current_date,
  reference_note text,
  proof_file_id uuid references public.files (id) on delete set null,
  status public.payment_status not null default 'recorded',
  recorded_by uuid references auth.users (id) on delete set null,
  confirmed_by uuid references auth.users (id) on delete set null,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_contract_project_match
    foreign key (contract_id, project_id)
    references public.contracts (id, project_id)
    on delete set null (contract_id),
  constraint payments_addendum_project_match
    foreign key (addendum_id, project_id)
    references public.contract_addendums (id, project_id)
    on delete set null (addendum_id),
  constraint payments_currency_usd check (currency = 'USD'),
  constraint payments_method_not_blank check (length(trim(payment_method)) > 0),
  constraint payments_amounts_non_negative check (
    expected_amount_cents >= 0
    and paid_amount_cents > 0
  ),
  constraint payments_confirmed_fields_match_status check (
    (status = 'confirmed' and confirmed_by is not null and confirmed_at is not null)
    or status <> 'confirmed'
  )
);

create index if not exists payments_project_status_idx
  on public.payments (project_id, status, payment_date desc);

create table if not exists public.payment_exceptions (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  approved_by uuid not null references auth.users (id) on delete restrict,
  reason text not null,
  amount_paid_at_approval_cents integer not null default 0,
  remaining_balance_cents integer not null default 0,
  conditions text,
  expires_at timestamptz,
  status public.payment_exception_status not null default 'active',
  revoked_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_exceptions_contract_project_match
    foreign key (contract_id, project_id)
    references public.contracts (id, project_id)
    on delete set null (contract_id),
  constraint payment_exceptions_reason_not_blank check (length(trim(reason)) > 0),
  constraint payment_exceptions_amounts_non_negative check (
    amount_paid_at_approval_cents >= 0
    and remaining_balance_cents >= 0
  ),
  constraint payment_exceptions_revoked_fields_match_status check (
    (status = 'revoked' and revoked_by is not null and revoked_at is not null)
    or status <> 'revoked'
  )
);

create index if not exists payment_exceptions_project_status_idx
  on public.payment_exceptions (project_id, status, created_at desc);

create table if not exists public.commercial_gestures (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  addendum_id uuid references public.contract_addendums (id) on delete set null,
  gesture_type public.commercial_gesture_type not null,
  amount_cents integer,
  percentage_bps integer,
  reason text not null,
  applied_by uuid not null references auth.users (id) on delete restrict,
  status public.commercial_gesture_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_gestures_contract_project_match
    foreign key (contract_id, project_id)
    references public.contracts (id, project_id)
    on delete set null (contract_id),
  constraint commercial_gestures_addendum_project_match
    foreign key (addendum_id, project_id)
    references public.contract_addendums (id, project_id)
    on delete set null (addendum_id),
  constraint commercial_gestures_reason_not_blank check (length(trim(reason)) > 0),
  constraint commercial_gestures_amount_or_percentage check (
    (gesture_type = 'fixed_amount' and amount_cents is not null and amount_cents > 0 and percentage_bps is null)
    or (gesture_type = 'percentage' and percentage_bps is not null and percentage_bps > 0 and percentage_bps <= 10000 and amount_cents is null)
  )
);

create index if not exists commercial_gestures_project_status_idx
  on public.commercial_gestures (project_id, status, created_at desc);

create table if not exists public.payment_gate_events (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.wedding_projects (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  gate_type text not null,
  previous_status public.guest_page_access_status,
  new_status public.guest_page_access_status not null,
  reason text not null,
  balance_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payment_gate_events_gate_type_allowed check (gate_type in ('guest_public_page', 'invitation_sending')),
  constraint payment_gate_events_reason_not_blank check (length(trim(reason)) > 0)
);

create index if not exists payment_gate_events_project_created_idx
  on public.payment_gate_events (project_id, created_at desc);

drop trigger if exists set_service_packages_updated_at on public.service_packages;
create trigger set_service_packages_updated_at
before update on public.service_packages
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_service_package_addons_updated_at on public.service_package_addons;
create trigger set_service_package_addons_updated_at
before update on public.service_package_addons
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_project_event_package_selections_updated_at on public.project_event_package_selections;
create trigger set_project_event_package_selections_updated_at
before update on public.project_event_package_selections
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_contracts_updated_at on public.contracts;
create trigger set_contracts_updated_at
before update on public.contracts
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_contract_addendums_updated_at on public.contract_addendums;
create trigger set_contract_addendums_updated_at
before update on public.contract_addendums
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_payment_exceptions_updated_at on public.payment_exceptions;
create trigger set_payment_exceptions_updated_at
before update on public.payment_exceptions
for each row
execute function app_private.set_updated_at();

drop trigger if exists set_commercial_gestures_updated_at on public.commercial_gestures;
create trigger set_commercial_gestures_updated_at
before update on public.commercial_gestures
for each row
execute function app_private.set_updated_at();

create or replace function app_private.redact_commercial_audit_snapshot(
  p_table_name text,
  p_snapshot jsonb
)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_snapshot is null then null
    when p_table_name in ('payments', 'payment_exceptions') then
      p_snapshot - 'reference_note' - 'proof_file_id' - 'notes' - 'conditions'
    when p_table_name = 'contracts' then
      p_snapshot - 'rendered_contract' - 'approval_confirmation_text' - 'pricing_snapshot' - 'package_snapshot' - 'structured_data'
    when p_table_name = 'contract_approvals' then
      p_snapshot - 'confirmation_text' - 'metadata'
    when p_table_name = 'payment_gate_events' then
      p_snapshot - 'balance_snapshot'
    else p_snapshot
  end;
$$;

revoke all on function app_private.redact_commercial_audit_snapshot(text, jsonb) from public;

create or replace function app_private.audit_commercial_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
  changed_object_type text;
  changed_object_id uuid;
  sanitized_new jsonb;
  sanitized_old jsonb;
begin
  changed_object_type := case tg_table_name
    when 'service_packages' then 'service_package'
    when 'service_package_addons' then 'service_package_addon'
    when 'project_event_package_selections' then 'project_event_package_selection'
    when 'pricing_calculations' then 'pricing_calculation'
    when 'contracts' then 'contract'
    when 'contract_approvals' then 'contract_approval'
    when 'contract_addendums' then 'contract_addendum'
    when 'payments' then 'payment'
    when 'payment_exceptions' then 'payment_exception'
    when 'commercial_gestures' then 'commercial_gesture'
    when 'payment_gate_events' then 'payment_gate_event'
  end;

  changed_object_id := case tg_op
    when 'DELETE' then old.id
    else new.id
  end;

  action_name := case
    when tg_table_name = 'service_packages' and tg_op = 'INSERT' then 'service_packages.created'
    when tg_table_name = 'service_packages' and tg_op = 'UPDATE' then 'service_packages.updated'
    when tg_table_name = 'service_package_addons' and tg_op = 'INSERT' then 'service_package_addons.created'
    when tg_table_name = 'service_package_addons' and tg_op = 'UPDATE' then 'service_package_addons.updated'
    when tg_table_name = 'project_event_package_selections' and tg_op = 'INSERT' then 'project_event_package_selections.selected'
    when tg_table_name = 'project_event_package_selections' and tg_op = 'UPDATE' then 'project_event_package_selections.updated'
    when tg_table_name = 'pricing_calculations' and tg_op = 'INSERT' then 'pricing_calculations.generated'
    when tg_table_name = 'contracts' and tg_op = 'INSERT' then 'contracts.generated'
    when tg_table_name = 'contracts' and tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then 'contracts.approved'
    when tg_table_name = 'contracts' and tg_op = 'UPDATE' then 'contracts.updated'
    when tg_table_name = 'contract_approvals' and tg_op = 'INSERT' then 'contract_approvals.created'
    when tg_table_name = 'contract_addendums' and tg_op = 'INSERT' then 'contract_addendums.generated'
    when tg_table_name = 'contract_addendums' and tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then 'contract_addendums.approved'
    when tg_table_name = 'contract_addendums' and tg_op = 'UPDATE' then 'contract_addendums.updated'
    when tg_table_name = 'payments' and tg_op = 'INSERT' then 'payments.recorded'
    when tg_table_name = 'payments' and tg_op = 'UPDATE' and new.status = 'confirmed' and old.status <> 'confirmed' then 'payments.confirmed'
    when tg_table_name = 'payments' and tg_op = 'UPDATE' then 'payments.updated'
    when tg_table_name = 'payment_exceptions' and tg_op = 'INSERT' then 'payment_exceptions.created'
    when tg_table_name = 'payment_exceptions' and tg_op = 'UPDATE' and new.status = 'revoked' and old.status <> 'revoked' then 'payment_exceptions.revoked'
    when tg_table_name = 'payment_exceptions' and tg_op = 'UPDATE' then 'payment_exceptions.updated'
    when tg_table_name = 'commercial_gestures' and tg_op = 'INSERT' then 'commercial_gestures.applied'
    when tg_table_name = 'commercial_gestures' and tg_op = 'UPDATE' then 'commercial_gestures.updated'
    when tg_table_name = 'payment_gate_events' and tg_op = 'INSERT' then 'payment_gate_events.created'
    else lower(tg_table_name || '.' || tg_op)
  end;

  if tg_op in ('UPDATE', 'DELETE') then
    sanitized_old := app_private.redact_commercial_audit_snapshot(tg_table_name, to_jsonb(old));
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    sanitized_new := app_private.redact_commercial_audit_snapshot(tg_table_name, to_jsonb(new));
  end if;

  insert into public.audit_logs (
    actor_user_id,
    action,
    object_type,
    object_id,
    old_value,
    new_value,
    source
  )
  values (
    (select auth.uid()),
    action_name,
    changed_object_type,
    changed_object_id,
    sanitized_old,
    sanitized_new,
    'api'
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function app_private.audit_commercial_change() from public;

drop trigger if exists audit_service_packages_insert on public.service_packages;
create trigger audit_service_packages_insert
after insert on public.service_packages
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_service_packages_update on public.service_packages;
create trigger audit_service_packages_update
after update on public.service_packages
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_service_package_addons_insert on public.service_package_addons;
create trigger audit_service_package_addons_insert
after insert on public.service_package_addons
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_service_package_addons_update on public.service_package_addons;
create trigger audit_service_package_addons_update
after update on public.service_package_addons
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_project_event_package_selections_insert on public.project_event_package_selections;
create trigger audit_project_event_package_selections_insert
after insert on public.project_event_package_selections
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_project_event_package_selections_update on public.project_event_package_selections;
create trigger audit_project_event_package_selections_update
after update on public.project_event_package_selections
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_pricing_calculations_insert on public.pricing_calculations;
create trigger audit_pricing_calculations_insert
after insert on public.pricing_calculations
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_contracts_insert on public.contracts;
create trigger audit_contracts_insert
after insert on public.contracts
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_contracts_update on public.contracts;
create trigger audit_contracts_update
after update on public.contracts
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_contract_approvals_insert on public.contract_approvals;
create trigger audit_contract_approvals_insert
after insert on public.contract_approvals
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_contract_addendums_insert on public.contract_addendums;
create trigger audit_contract_addendums_insert
after insert on public.contract_addendums
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_contract_addendums_update on public.contract_addendums;
create trigger audit_contract_addendums_update
after update on public.contract_addendums
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_payments_insert on public.payments;
create trigger audit_payments_insert
after insert on public.payments
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_payments_update on public.payments;
create trigger audit_payments_update
after update on public.payments
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_payment_exceptions_insert on public.payment_exceptions;
create trigger audit_payment_exceptions_insert
after insert on public.payment_exceptions
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_payment_exceptions_update on public.payment_exceptions;
create trigger audit_payment_exceptions_update
after update on public.payment_exceptions
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_commercial_gestures_insert on public.commercial_gestures;
create trigger audit_commercial_gestures_insert
after insert on public.commercial_gestures
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_commercial_gestures_update on public.commercial_gestures;
create trigger audit_commercial_gestures_update
after update on public.commercial_gestures
for each row execute function app_private.audit_commercial_change();

drop trigger if exists audit_payment_gate_events_insert on public.payment_gate_events;
create trigger audit_payment_gate_events_insert
after insert on public.payment_gate_events
for each row execute function app_private.audit_commercial_change();

create or replace function app_private.calculate_project_payment_balance(
  p_project_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_contract public.contracts%rowtype;
  v_contract_amount integer := 0;
  v_addendum_amount integer := 0;
  v_expected_amount integer := 0;
  v_paid_amount integer := 0;
  v_active_exception public.payment_exceptions%rowtype;
begin
  select *
  into v_contract
  from public.contracts
  where project_id = p_project_id
    and is_latest = true
  order by version desc
  limit 1;

  if v_contract.id is not null and v_contract.status = 'approved' then
    v_contract_amount := v_contract.final_amount_cents;
  end if;

  select coalesce(sum(additional_amount_cents), 0)::integer
  into v_addendum_amount
  from public.contract_addendums
  where project_id = p_project_id
    and status = 'approved';

  v_expected_amount := v_contract_amount + v_addendum_amount;

  select coalesce(sum(paid_amount_cents), 0)::integer
  into v_paid_amount
  from public.payments
  where project_id = p_project_id
    and status = 'confirmed';

  select *
  into v_active_exception
  from public.payment_exceptions
  where project_id = p_project_id
    and status = 'active'
    and (expires_at is null or expires_at > now())
  order by created_at desc
  limit 1;

  return jsonb_build_object(
    'projectId', p_project_id,
    'contractId', v_contract.id,
    'contractStatus', v_contract.status,
    'contractAmountCents', v_contract_amount,
    'addendumAmountCents', v_addendum_amount,
    'expectedAmountCents', v_expected_amount,
    'confirmedPaidAmountCents', v_paid_amount,
    'balanceDueCents', greatest(v_expected_amount - v_paid_amount, 0),
    'isFullyPaid', v_contract.id is not null and v_contract.status = 'approved' and v_paid_amount >= v_expected_amount,
    'hasActiveException', v_active_exception.id is not null,
    'activeExceptionId', v_active_exception.id
  );
end;
$$;

revoke all on function app_private.calculate_project_payment_balance(uuid) from public;

create or replace function app_private.refresh_project_payment_gate(
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance jsonb;
  v_previous public.guest_page_access_status;
  v_next public.guest_page_access_status;
  v_reason text;
  v_project_contract_id uuid;
begin
  select guest_page_access_status
  into v_previous
  from public.wedding_projects
  where id = p_project_id
  for update;

  if v_previous is null then
    raise exception 'Project not found.';
  end if;

  v_balance := app_private.calculate_project_payment_balance(p_project_id);
  v_project_contract_id := nullif(v_balance ->> 'contractId', '')::uuid;

  if (v_balance ->> 'isFullyPaid')::boolean then
    v_next := 'payment_confirmed'::public.guest_page_access_status;
    v_reason := 'Full confirmed payment meets or exceeds expected amount.';
  elsif (v_balance ->> 'hasActiveException')::boolean then
    v_next := 'exception_override'::public.guest_page_access_status;
    v_reason := 'Active payment exception override unlocks guest-facing access.';
  else
    v_next := 'locked'::public.guest_page_access_status;
    v_reason := 'Payment gate remains locked until full payment or active exception.';
  end if;

  update public.wedding_projects
  set
    guest_page_access_status = v_next,
    guest_page_access_unlocked_at = case when v_next <> 'locked' then coalesce(guest_page_access_unlocked_at, now()) else null end,
    guest_page_access_unlocked_by = case when v_next <> 'locked' then coalesce((select auth.uid()), guest_page_access_unlocked_by) else null end,
    guest_page_payment_exception_reason = case when v_next = 'exception_override' then v_reason else null end,
    latest_payment_gate_checked_at = now()
  where id = p_project_id;

  if v_previous is distinct from v_next then
    insert into public.payment_gate_events (
      project_id,
      contract_id,
      gate_type,
      previous_status,
      new_status,
      reason,
      balance_snapshot,
      created_by
    )
    values
      (p_project_id, v_project_contract_id, 'guest_public_page', v_previous, v_next, v_reason, v_balance, (select auth.uid())),
      (p_project_id, v_project_contract_id, 'invitation_sending', v_previous, v_next, v_reason, v_balance, (select auth.uid()));
  end if;

  return v_balance || jsonb_build_object(
    'previousGateStatus', v_previous,
    'gateStatus', v_next,
    'gateReason', v_reason
  );
end;
$$;

revoke all on function app_private.refresh_project_payment_gate(uuid) from public;

create or replace function app_private.approve_project_contract(
  p_contract_id uuid,
  p_confirmation_text text,
  p_checked boolean
)
returns public.contracts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_contract public.contracts%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not coalesce(p_checked, false) then
    raise exception 'Contract approval confirmation checkbox is required.';
  end if;

  if length(trim(coalesce(p_confirmation_text, ''))) = 0 then
    raise exception 'Contract approval confirmation text is required.';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = p_contract_id
  for update;

  if v_contract.id is null then
    raise exception 'Contract not found.';
  end if;

  if not app_private.user_can_access_project(v_actor_user_id, v_contract.project_id, 'contracts.approve') then
    raise exception 'Contract approval permission denied.';
  end if;

  if v_contract.status not in ('generated', 'sent_for_approval') then
    raise exception 'Only generated contracts can be approved.';
  end if;

  update public.contracts
  set
    status = 'approved',
    approved_by = v_actor_user_id,
    approved_at = now(),
    approval_confirmation_text = trim(p_confirmation_text)
  where id = p_contract_id
  returning * into v_contract;

  insert into public.contract_approvals (
    project_id,
    contract_id,
    approved_by,
    confirmation_text,
    metadata
  )
  values (
    v_contract.project_id,
    v_contract.id,
    v_actor_user_id,
    trim(p_confirmation_text),
    jsonb_build_object('contractVersion', v_contract.version)
  )
  on conflict do nothing;

  update public.wedding_projects
  set
    guest_list_access_status = 'contract_approved',
    guest_list_access_unlocked_at = coalesce(guest_list_access_unlocked_at, now()),
    guest_list_access_unlocked_by = coalesce(guest_list_access_unlocked_by, v_actor_user_id),
    latest_contract_id = v_contract.id
  where id = v_contract.project_id;

  return v_contract;
end;
$$;

revoke all on function app_private.approve_project_contract(uuid, text, boolean) from public;

grant execute on function app_private.calculate_project_payment_balance(uuid) to authenticated;
grant execute on function app_private.refresh_project_payment_gate(uuid) to authenticated;
grant execute on function app_private.approve_project_contract(uuid, text, boolean) to authenticated;

create or replace function public.get_project_payment_balance(
  p_project_id uuid
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
begin
  if not (
    app_private.user_can_access_project(v_actor_user_id, p_project_id, 'payments.read')
    or app_private.user_can_access_project(v_actor_user_id, p_project_id, 'payments.summary.read')
    or app_private.user_can_access_project(v_actor_user_id, p_project_id, 'contracts.read')
  ) then
    raise exception 'Payment summary permission denied.';
  end if;

  return app_private.calculate_project_payment_balance(p_project_id);
end;
$$;

create or replace function public.refresh_project_payment_gate(
  p_project_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
begin
  if not (
    app_private.user_can_access_project(v_actor_user_id, p_project_id, 'payments.confirm')
    or app_private.user_can_access_project(v_actor_user_id, p_project_id, 'payment_exceptions.manage')
  ) then
    raise exception 'Payment gate permission denied.';
  end if;

  return app_private.refresh_project_payment_gate(p_project_id);
end;
$$;

create or replace function public.approve_project_contract(
  p_contract_id uuid,
  p_confirmation_text text,
  p_checked boolean
)
returns public.contracts
language sql
security invoker
set search_path = public, pg_temp
as $$
  select app_private.approve_project_contract(p_contract_id, p_confirmation_text, p_checked);
$$;

revoke all on function public.get_project_payment_balance(uuid) from public;
revoke all on function public.refresh_project_payment_gate(uuid) from public;
revoke all on function public.approve_project_contract(uuid, text, boolean) from public;

grant execute on function public.get_project_payment_balance(uuid) to authenticated;
grant execute on function public.refresh_project_payment_gate(uuid) to authenticated;
grant execute on function public.approve_project_contract(uuid, text, boolean) to authenticated;

alter table public.service_packages enable row level security;
alter table public.service_package_addons enable row level security;
alter table public.project_event_package_selections enable row level security;
alter table public.pricing_calculations enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_approvals enable row level security;
alter table public.contract_addendums enable row level security;
alter table public.payments enable row level security;
alter table public.payment_exceptions enable row level security;
alter table public.commercial_gestures enable row level security;
alter table public.payment_gate_events enable row level security;

drop policy if exists "Service packages visible to catalog readers" on public.service_packages;
create policy "Service packages visible to catalog readers"
on public.service_packages
for select
to authenticated
using (
  app_private.user_has_permission((select auth.uid()), 'service_packages.read', 'global', null)
  or app_private.user_has_permission((select auth.uid()), 'service_packages.manage', 'global', null)
);

drop policy if exists "Service packages managed by package managers" on public.service_packages;
create policy "Service packages managed by package managers"
on public.service_packages
for all
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'service_packages.manage', 'global', null))
with check (app_private.user_has_permission((select auth.uid()), 'service_packages.manage', 'global', null));

drop policy if exists "Service add-ons visible to catalog readers" on public.service_package_addons;
create policy "Service add-ons visible to catalog readers"
on public.service_package_addons
for select
to authenticated
using (
  app_private.user_has_permission((select auth.uid()), 'service_packages.read', 'global', null)
  or app_private.user_has_permission((select auth.uid()), 'service_packages.manage', 'global', null)
);

drop policy if exists "Service add-ons managed by package managers" on public.service_package_addons;
create policy "Service add-ons managed by package managers"
on public.service_package_addons
for all
to authenticated
using (app_private.user_has_permission((select auth.uid()), 'service_packages.manage', 'global', null))
with check (app_private.user_has_permission((select auth.uid()), 'service_packages.manage', 'global', null));

drop policy if exists "Event package selections visible to commercial readers" on public.project_event_package_selections;
create policy "Event package selections visible to commercial readers"
on public.project_event_package_selections
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'pricing.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.read')
);

drop policy if exists "Event package selections managed by pricing managers" on public.project_event_package_selections;
create policy "Event package selections managed by pricing managers"
on public.project_event_package_selections
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'pricing.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'pricing.manage'));

drop policy if exists "Pricing calculations visible to commercial readers" on public.pricing_calculations;
create policy "Pricing calculations visible to commercial readers"
on public.pricing_calculations
for select
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'pricing.read')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.read')
);

drop policy if exists "Pricing calculations created by calculators" on public.pricing_calculations;
create policy "Pricing calculations created by calculators"
on public.pricing_calculations
for insert
to authenticated
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'pricing.calculate'));

drop policy if exists "Contracts visible to contract readers" on public.contracts;
create policy "Contracts visible to contract readers"
on public.contracts
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.read'));

drop policy if exists "Contracts generated by contract managers" on public.contracts;
create policy "Contracts generated by contract managers"
on public.contracts
for insert
to authenticated
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.generate'));

drop policy if exists "Contracts updated by contract managers" on public.contracts;
create policy "Contracts updated by contract managers"
on public.contracts
for update
to authenticated
using (
  app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.generate')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.approve')
)
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.generate')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.approve')
);

drop policy if exists "Contract approvals visible to contract readers" on public.contract_approvals;
create policy "Contract approvals visible to contract readers"
on public.contract_approvals
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.read'));

drop policy if exists "Contract approvals inserted by approvers" on public.contract_approvals;
create policy "Contract approvals inserted by approvers"
on public.contract_approvals
for insert
to authenticated
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.approve'));

drop policy if exists "Contract addendums visible to contract readers" on public.contract_addendums;
create policy "Contract addendums visible to contract readers"
on public.contract_addendums
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.read'));

drop policy if exists "Contract addendums managed by addendum managers" on public.contract_addendums;
create policy "Contract addendums managed by addendum managers"
on public.contract_addendums
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.manage_addendums'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'contracts.manage_addendums'));

drop policy if exists "Payments visible to payment readers" on public.payments;
create policy "Payments visible to payment readers"
on public.payments
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'payments.read'));

drop policy if exists "Payments recorded by payment recorders" on public.payments;
create policy "Payments recorded by payment recorders"
on public.payments
for insert
to authenticated
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'payments.record')
  and status <> 'confirmed'
  and confirmed_by is null
  and confirmed_at is null
);

drop policy if exists "Payments confirmed by payment confirmers" on public.payments;
create policy "Payments confirmed by payment confirmers"
on public.payments
for update
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'payments.confirm'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'payments.confirm'));

drop policy if exists "Payment exceptions visible to exception managers" on public.payment_exceptions;
create policy "Payment exceptions visible to exception managers"
on public.payment_exceptions
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'payment_exceptions.manage'));

drop policy if exists "Payment exceptions managed by exception managers" on public.payment_exceptions;
create policy "Payment exceptions managed by exception managers"
on public.payment_exceptions
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'payment_exceptions.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'payment_exceptions.manage'));

drop policy if exists "Commercial gestures visible to revenue readers" on public.commercial_gestures;
create policy "Commercial gestures visible to revenue readers"
on public.commercial_gestures
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'revenue.read'));

drop policy if exists "Commercial gestures managed by gesture managers" on public.commercial_gestures;
create policy "Commercial gestures managed by gesture managers"
on public.commercial_gestures
for all
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'commercial_gestures.manage'))
with check (app_private.user_can_access_project((select auth.uid()), project_id, 'commercial_gestures.manage'));

drop policy if exists "Payment gate events visible to payment readers" on public.payment_gate_events;
create policy "Payment gate events visible to payment readers"
on public.payment_gate_events
for select
to authenticated
using (app_private.user_can_access_project((select auth.uid()), project_id, 'payments.read'));

drop policy if exists "Payment gate events inserted by payment controllers" on public.payment_gate_events;
create policy "Payment gate events inserted by payment controllers"
on public.payment_gate_events
for insert
to authenticated
with check (
  app_private.user_can_access_project((select auth.uid()), project_id, 'payments.confirm')
  or app_private.user_can_access_project((select auth.uid()), project_id, 'payment_exceptions.manage')
);

grant select, insert, update on public.service_packages to authenticated;
grant select, insert, update on public.service_package_addons to authenticated;
grant select, insert, update on public.project_event_package_selections to authenticated;
grant select, insert on public.pricing_calculations to authenticated;
grant select, insert, update on public.contracts to authenticated;
grant select, insert on public.contract_approvals to authenticated;
grant select, insert, update on public.contract_addendums to authenticated;
grant select, insert, update on public.payments to authenticated;
grant select, insert, update on public.payment_exceptions to authenticated;
grant select, insert, update on public.commercial_gestures to authenticated;
grant select, insert on public.payment_gate_events to authenticated;

grant select, insert, update on public.service_packages to service_role;
grant select, insert, update on public.service_package_addons to service_role;
grant select, insert, update on public.project_event_package_selections to service_role;
grant select, insert on public.pricing_calculations to service_role;
grant select, insert, update on public.contracts to service_role;
grant select, insert on public.contract_approvals to service_role;
grant select, insert, update on public.contract_addendums to service_role;
grant select, insert, update on public.payments to service_role;
grant select, insert, update on public.payment_exceptions to service_role;
grant select, insert, update on public.commercial_gestures to service_role;
grant select, insert on public.payment_gate_events to service_role;

create or replace function app_private.user_has_permission(
  p_user_id uuid,
  p_permission text,
  p_scope public.role_scope_type default 'global',
  p_scope_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.id = ra.role_id
    join public.role_permissions rp on rp.role_id = ra.role_id
    where ra.user_id = p_user_id
      and rp.permission_slug = p_permission
      and (ra.expires_at is null or ra.expires_at > now())
      and (
        not r.requires_mfa
        or coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      )
      -- p_scope_id = null intentionally means "any instance of p_scope";
      -- global checks match ra.scope = 'global', while scoped checks can
      -- require a concrete ra.scope_id when p_scope_id is provided.
      and (
        ra.scope = 'global'
        or (
          ra.scope = p_scope
          and (p_scope_id is null or ra.scope_id = p_scope_id)
        )
      )
  );
$$;

revoke all on function app_private.user_has_permission(uuid, text, public.role_scope_type, uuid) from public;

create or replace function public.current_user_has_any_commercial_read(
  p_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    app_private.user_has_permission((select auth.uid()), 'service_packages.read', 'global', null)
    or app_private.user_has_permission((select auth.uid()), 'service_packages.manage', 'global', null)
    or app_private.user_can_access_project((select auth.uid()), p_project_id, 'contracts.read')
    or app_private.user_can_access_project((select auth.uid()), p_project_id, 'pricing.read')
    or app_private.user_can_access_project((select auth.uid()), p_project_id, 'payments.summary.read')
    or app_private.user_can_access_project((select auth.uid()), p_project_id, 'payments.read');
$$;

revoke all on function public.current_user_has_any_commercial_read(uuid) from public;
grant execute on function public.current_user_has_any_commercial_read(uuid) to authenticated;

insert into public.permissions (slug, description, requirement_ids)
values
  ('service_packages.read', 'Read active service package and add-on catalog entries.', array['PAY-006', 'PAY-007']),
  ('service_packages.manage', 'Create, update, activate, deactivate, and archive service packages and add-ons.', array['PAY-006', 'ROLE-002', 'REP-006']),
  ('pricing.read', 'Read project pricing previews and snapshots.', array['PAY-007', 'PAY-008', 'PAY-009']),
  ('pricing.calculate', 'Generate deterministic project pricing calculations.', array['PAY-007', 'PAY-008', 'PAY-009']),
  ('pricing.manage', 'Manage event package selections and project pricing inputs.', array['PAY-006', 'PAY-007', 'PAY-009']),
  ('contracts.read', 'Read authorized project contract and addendum records.', array['PAY-001', 'PAY-002', 'PAY-005']),
  ('contracts.generate', 'Generate project-level contract versions from pricing snapshots.', array['PAY-001', 'PAY-004', 'REP-006']),
  ('contracts.approve', 'Approve generated project contracts in-app with confirmation.', array['PAY-002', 'PAY-003', 'REP-006']),
  ('contracts.manage_addendums', 'Generate and manage contract addendums for major price or scope changes.', array['PAY-005', 'PAY-010', 'PAY-011']),
  ('payments.summary.read', 'Read own project payment balance summaries without raw payment records.', array['PAY-013', 'PAY-014']),
  ('payments.read', 'Read internal project payment records, balances, and gate history.', array['PAY-013', 'PAY-014', 'ROLE-004']),
  ('payments.record', 'Record external/manual payments inside the app.', array['PAY-013', 'REP-006']),
  ('payments.confirm', 'Confirm, reject, cancel, and refresh payment gate decisions.', array['PAY-013', 'PAY-014', 'REP-006']),
  ('payment_exceptions.manage', 'Approve or revoke payment exception overrides with reason and audit trail.', array['PAY-015', 'ROLE-002', 'ROLE-004', 'REP-006']),
  ('commercial_gestures.manage', 'Apply or revoke commercial gestures and discounts with reason.', array['PAY-012', 'REP-006']),
  ('revenue.read', 'Read internal revenue, pricing, payment, discount, and balance details.', array['ROLE-002', 'ROLE-004', 'PAY-012', 'PAY-013'])
on conflict (slug) do update
set
  description = excluded.description,
  requirement_ids = excluded.requirement_ids;

with sprint_10_grants(role_slug, permission_slug) as (
  values
    ('diginoces_admin', 'service_packages.read'),
    ('diginoces_admin', 'service_packages.manage'),
    ('diginoces_admin', 'pricing.read'),
    ('diginoces_admin', 'pricing.calculate'),
    ('diginoces_admin', 'pricing.manage'),
    ('diginoces_admin', 'contracts.read'),
    ('diginoces_admin', 'contracts.generate'),
    ('diginoces_admin', 'contracts.approve'),
    ('diginoces_admin', 'contracts.manage_addendums'),
    ('diginoces_admin', 'payments.summary.read'),
    ('diginoces_admin', 'payments.read'),
    ('diginoces_admin', 'payments.record'),
    ('diginoces_admin', 'payments.confirm'),
    ('diginoces_admin', 'payment_exceptions.manage'),
    ('diginoces_admin', 'commercial_gestures.manage'),
    ('diginoces_admin', 'revenue.read'),
    ('operations_manager', 'service_packages.read'),
    ('operations_manager', 'service_packages.manage'),
    ('operations_manager', 'pricing.read'),
    ('operations_manager', 'pricing.calculate'),
    ('operations_manager', 'pricing.manage'),
    ('operations_manager', 'contracts.read'),
    ('operations_manager', 'contracts.generate'),
    ('operations_manager', 'contracts.manage_addendums'),
    ('operations_manager', 'payments.summary.read'),
    ('operations_manager', 'payments.read'),
    ('operations_manager', 'payments.record'),
    ('operations_manager', 'payments.confirm'),
    ('operations_manager', 'payment_exceptions.manage'),
    ('operations_manager', 'commercial_gestures.manage'),
    ('operations_manager', 'revenue.read'),
    ('couple', 'contracts.read'),
    ('couple', 'contracts.approve'),
    ('couple', 'payments.summary.read'),
    ('bride', 'contracts.read'),
    ('bride', 'contracts.approve'),
    ('bride', 'payments.summary.read'),
    ('groom', 'contracts.read'),
    ('groom', 'contracts.approve'),
    ('groom', 'payments.summary.read')
)
insert into public.role_permissions (role_id, permission_slug)
select r.id, g.permission_slug
from sprint_10_grants g
join public.roles r on r.slug = g.role_slug
join public.permissions p on p.slug = g.permission_slug
on conflict (role_id, permission_slug) do nothing;

update public.roles
set requires_mfa = true
where slug = 'operations_manager';
