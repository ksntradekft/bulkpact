-- BulkPact 1.2.0 — fresh Supabase bootstrap
-- Run on an EMPTY Supabase project. No Private Label House schema or migration is required.

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- ACCOUNTS
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'BUYER' check (role in ('ADMIN','MANUFACTURER','BUYER')),
  full_name text not null default '',
  company_name text not null default '',
  phone text,
  country text,
  website text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PENDING','SUSPENDED')),
  plan text,
  billing_cycle text,
  subscription_status text not null default 'FREE',
  success_fee_pct numeric(8,4) not null default 1.5 check (success_fee_pct = 1.5),
  plan_started_at timestamptz,
  plan_renews_at timestamptz,
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 0 check (onboarding_step between 0 and 5),
  business_type text,
  preferred_categories text[] not null default '{}',
  preferred_countries text[] not null default '{}',
  annual_purchase_volume text,
  sourcing_notes text,
  notification_email boolean not null default true,
  notification_in_app boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The UI calls these accounts Suppliers. supplier_type distinguishes manufacturers/wholesalers.
create table public.manufacturer_profiles (
  id uuid primary key,
  supplier_type text not null default 'MANUFACTURER' check (supplier_type in ('MANUFACTURER','WHOLESALER','BOTH')),
  description text not null default '',
  website text,
  categories text[] not null default '{}',
  certifications text[] not null default '{}',
  moq_text text,
  moq_value numeric(14,3),
  moq_unit text,
  small_batch boolean not null default false,
  large_batch boolean not null default false,
  production_countries text[] not null default '{}',
  logo_url text,
  cover_url text,
  founded_year integer,
  employee_count integer,
  export_markets text[] not null default '{}',
  packaging_options text[] not null default '{}',
  production_capacity text,
  lead_time_text text,
  whatsapp text,
  factory_address text,
  approval_status text not null default 'PENDING' check (approval_status in ('PENDING','APPROVED','REJECTED')),
  verification_level text not null default 'UNVERIFIED',
  verification_notes text not null default '',
  verified_at timestamptz,
  featured boolean not null default false,
  featured_until timestamptz,
  vies_valid boolean,
  vies_checked_at timestamptz,
  vies_name text,
  vies_address text,
  domain_verified boolean not null default false,
  company_registry_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manufacturer_profiles_id_fkey foreign key (id) references public.profiles(id) on delete cascade
);

create table public.manufacturer_verifications (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null,
  status text not null default 'PENDING' check (status in ('PENDING','IN_REVIEW','APPROVED','REJECTED')),
  vat_number text,
  registry_number text,
  company_registry_checked boolean not null default false,
  vat_checked boolean not null default false,
  domain_checked boolean not null default false,
  factory_address_checked boolean not null default false,
  certifications_checked boolean not null default false,
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manufacturer_verifications_manufacturer_id_key unique (manufacturer_id),
  constraint manufacturer_verifications_manufacturer_id_fkey foreign key (manufacturer_id) references public.profiles(id) on delete cascade
);

-- ============================================================
-- GROUP ORDERS: ONE FIXED PRICE + ONE FIXED MOQ
-- ============================================================
create table public.group_orders (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  brand text not null default '',
  product_name text not null,
  product_description text not null default '',
  category text not null default 'Egyéb',
  supplier_name text not null default '',
  supplier_url text,
  moq_label text,
  target_quantity numeric(14,3) not null check (target_quantity > 0),
  unit text not null default 'db',
  min_join_quantity numeric(14,3) not null check (min_join_quantity > 0 and min_join_quantity <= target_quantity),
  unit_price numeric(14,4) not null check (unit_price > 0),
  price_unit text not null default 'db',
  price_units_per_order_unit numeric(14,3) not null default 1 check (price_units_per_order_unit > 0),
  currency text not null default 'EUR',
  destination_country text not null default 'Magyarország',
  deadline timestamptz,
  status text not null default 'DRAFT' check (status in ('DRAFT','OPEN','FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED','DELIVERED','COMPLETED','CANCELLED')),
  visibility text not null default 'BUYERS_ONLY' check (visibility in ('PUBLIC','BUYERS_ONLY')),
  notes text not null default '',
  freight_total numeric(14,4) not null default 0 check (freight_total >= 0),
  handling_total numeric(14,4) not null default 0 check (handling_total >= 0),
  customs_total numeric(14,4) not null default 0 check (customs_total >= 0),
  insurance_total numeric(14,4) not null default 0 check (insurance_total >= 0),
  other_costs_total numeric(14,4) not null default 0 check (other_costs_total >= 0),
  landed_cost_notes text not null default '',
  featured_until timestamptz,
  platform_fee_pct numeric(8,4) not null default 1.5 check (platform_fee_pct = 1.5),
  platform_fee_amount numeric(14,4) not null default 0 check (platform_fee_amount >= 0),
  commission_status text not null default 'NOT_DUE' check (commission_status in ('NOT_DUE','DUE','INVOICED','PAID','WAIVED')),
  lifecycle_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_order_commitments (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  buyer_id uuid not null,
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  status text not null default 'RESERVED' check (status in ('RESERVED','CONFIRMED','CANCELLED','ALLOCATED')),
  note text not null default '',
  commitment_type text not null default 'COMMITMENT',
  deposit_status text not null default 'NOT_REQUIRED' check (deposit_status in ('NOT_REQUIRED','DUE','PAID','REFUNDED')),
  deposit_amount numeric(14,4),
  deposit_currency text not null default 'EUR',
  deposit_due_at timestamptz,
  deposit_paid_at timestamptz,
  payment_reference text,
  buyer_fee_pct numeric(8,4) not null default 1.5 check (buyer_fee_pct = 1.5),
  buyer_fee_amount numeric(14,4) not null default 0 check (buyer_fee_amount >= 0),
  buyer_fee_status text not null default 'NOT_DUE' check (buyer_fee_status in ('NOT_DUE','DUE','INVOICED','PAID','WAIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_order_id,buyer_id),
  constraint group_order_commitments_buyer_id_fkey foreign key (buyer_id) references public.profiles(id) on delete cascade
);

create table public.group_order_interests (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  quantity numeric(14,3) not null check (quantity > 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_order_id,buyer_id)
);

-- ============================================================
-- COMMERCIAL / BILLING
-- ============================================================
create table public.commercial_offers (
  code text primary key,
  audience text,
  offer_type text not null default 'PLAN',
  name_hu text not null default '',
  name_en text not null default '',
  price numeric(14,4),
  price_pct numeric(8,4),
  currency text not null default 'EUR',
  billing_period text,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.billing_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_code text not null references public.commercial_offers(code) on delete restrict,
  request_type text not null,
  billing_cycle text,
  quantity numeric(14,3) not null default 1 check (quantity > 0),
  status text not null default 'REQUESTED',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_code text not null,
  billing_cycle text,
  status text not null default 'ACTIVE',
  price numeric(14,4),
  currency text not null default 'EUR',
  starts_at timestamptz not null default now(),
  renews_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.revenue_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  source_type text not null,
  offer_code text,
  reference_type text,
  reference_id text,
  description text not null default '',
  amount numeric(14,4) not null default 0,
  currency text not null default 'EUR',
  status text not null default 'PENDING',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entitlement_key text not null,
  source_offer_code text,
  quantity numeric(14,3) not null default 1,
  active boolean not null default true,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  credit_type text not null,
  balance numeric(14,3) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,credit_type)
);

-- ============================================================
-- COMMUNICATION / OPERATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  href text,
  type text not null default 'INFO',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  filename text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  visibility text not null default 'PARTICIPANTS' check (visibility in ('PUBLIC','PARTICIPANTS','PRIVATE')),
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_type text not null,
  thread_id text not null,
  sender_id uuid not null constraint messages_sender_id_fkey references public.profiles(id) on delete cascade,
  recipient_id uuid not null constraint messages_recipient_id_fkey references public.profiles(id) on delete cascade,
  body text not null,
  attachment_document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null constraint support_tickets_created_by_fkey references public.profiles(id) on delete cascade,
  role text not null,
  subject text not null,
  category text not null default 'GENERAL',
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','WAITING_USER','RESOLVED','CLOSED')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null constraint moderation_reports_reporter_id_fkey references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text not null default '',
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','DISMISSED')),
  resolution_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  entity_type text,
  entity_id text,
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','BLOCKED','DONE','CANCELLED')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.platform_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  role text,
  event_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.followup_jobs (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  due_at timestamptz not null,
  channel text not null default 'BOTH',
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED','CANCELLED')),
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  field_name text not null,
  source_locale text not null default 'auto',
  target_locale text not null,
  source_hash text not null,
  translated_text text not null,
  provider text not null default 'DEEPSEEK',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type,entity_id,field_name,target_locale)
);

create table public.api_rate_limits (
  bucket_key text primary key,
  count integer not null default 0 check (count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '',
  status text not null default 'REQUESTED',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  body text not null,
  message_id text,
  status text not null default 'SENT',
  sent_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index group_orders_status_deadline_idx on public.group_orders(status,deadline);
create index group_orders_creator_idx on public.group_orders(created_by,created_at desc);
create index group_order_commitments_order_idx on public.group_order_commitments(group_order_id,status);
create index group_order_commitments_buyer_idx on public.group_order_commitments(buyer_id,created_at desc);
create index group_order_interests_order_idx on public.group_order_interests(group_order_id);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create index messages_thread_idx on public.messages(thread_type,thread_id,created_at);
create index support_tickets_creator_idx on public.support_tickets(created_by,created_at desc);
create index support_ticket_messages_ticket_idx on public.support_ticket_messages(ticket_id,created_at);
create index platform_events_created_idx on public.platform_events(created_at desc);
create index audit_log_created_idx on public.audit_log(created_at desc);
create index followup_jobs_due_idx on public.followup_jobs(status,due_at);
create index revenue_ledger_user_idx on public.revenue_ledger(user_id,created_at desc);
create index subscriptions_user_idx on public.subscriptions(user_id,created_at desc);

-- ============================================================
-- AUTH / SECURITY HELPERS
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=(select auth.uid()) and role='ADMIN' and status='ACTIVE') $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare requested_role text; requested_supplier_type text;
begin
  requested_role := upper(coalesce(new.raw_user_meta_data->>'role','BUYER'));
  if requested_role not in ('MANUFACTURER','BUYER') then requested_role := 'BUYER'; end if;
  requested_supplier_type := upper(coalesce(new.raw_user_meta_data->>'supplier_type','MANUFACTURER'));
  if requested_supplier_type not in ('MANUFACTURER','WHOLESALER','BOTH') then requested_supplier_type := 'MANUFACTURER'; end if;

  insert into public.profiles(id,email,role,full_name,company_name,phone,country,website,status,plan,subscription_status,success_fee_pct)
  values(
    new.id,coalesce(new.email,''),requested_role,
    coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.raw_user_meta_data->>'company_name',''),
    nullif(new.raw_user_meta_data->>'phone',''),nullif(new.raw_user_meta_data->>'country',''),nullif(new.raw_user_meta_data->>'website',''),
    case when requested_role='MANUFACTURER' then 'PENDING' else 'ACTIVE' end,
    case when requested_role='BUYER' then 'BUYER_FREE' else case when requested_supplier_type='WHOLESALER' then 'WHS_STARTER' else 'MFG_STARTER' end end,
    'FREE',1.5
  ) on conflict(id) do nothing;

  if requested_role='MANUFACTURER' then
    insert into public.manufacturer_profiles(id,website,supplier_type)
    values(new.id,nullif(new.raw_user_meta_data->>'website',''),requested_supplier_type)
    on conflict(id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Critical transactional Group Order reservation path.
create or replace function public.reserve_group_order(
  p_group_order_id uuid,
  p_buyer_id uuid,
  p_quantity numeric,
  p_note text default ''
) returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  v_order public.group_orders%rowtype;
  v_reserved numeric := 0;
  v_available numeric := 0;
  v_new_status text;
  v_buyer_fee_pct constant numeric := 1.5;
begin
  select * into v_order from public.group_orders where id=p_group_order_id for update;
  if not found then raise exception 'A közös rendelés nem található.'; end if;

  if not exists(select 1 from public.profiles where id=p_buyer_id and role='BUYER' and status='ACTIVE') then
    raise exception 'Csak aktív vevői fiók foglalhat.';
  end if;

  if v_order.status not in ('OPEN','FILLED') then raise exception 'A kampány jelenleg nem fogad foglalást.'; end if;
  if v_order.deadline is not null and v_order.deadline < now() then raise exception 'A jelentkezési határidő lejárt.'; end if;

  if coalesce(p_quantity,0)=0 then
    insert into public.group_order_commitments(group_order_id,buyer_id,quantity,status,note,buyer_fee_pct,buyer_fee_amount,buyer_fee_status,updated_at)
    values(p_group_order_id,p_buyer_id,0,'CANCELLED',coalesce(p_note,''),v_buyer_fee_pct,0,'NOT_DUE',now())
    on conflict(group_order_id,buyer_id) do update
      set quantity=0,status='CANCELLED',note=excluded.note,buyer_fee_pct=excluded.buyer_fee_pct,buyer_fee_amount=0,buyer_fee_status='NOT_DUE',updated_at=now();
  else
    if p_quantity < v_order.min_join_quantity then raise exception 'A foglalás nem éri el a minimális csatlakozási mennyiséget.'; end if;

    select coalesce(sum(quantity),0) into v_reserved
    from public.group_order_commitments
    where group_order_id=p_group_order_id and status<>'CANCELLED' and buyer_id<>p_buyer_id;

    v_available := greatest(0,v_order.target_quantity-v_reserved);
    if p_quantity > v_available then raise exception 'A megadott mennyiség nagyobb a még szabad mennyiségnél (% %).',v_available,v_order.unit; end if;

    insert into public.group_order_commitments(group_order_id,buyer_id,quantity,status,note,buyer_fee_pct,buyer_fee_amount,buyer_fee_status,updated_at)
    values(
      p_group_order_id,p_buyer_id,p_quantity,'RESERVED',coalesce(p_note,''),v_buyer_fee_pct,
      p_quantity*v_order.price_units_per_order_unit*v_order.unit_price*v_buyer_fee_pct/100,
      'NOT_DUE',now()
    )
    on conflict(group_order_id,buyer_id) do update
      set quantity=excluded.quantity,status='RESERVED',note=excluded.note,buyer_fee_pct=excluded.buyer_fee_pct,
          buyer_fee_amount=excluded.buyer_fee_amount,buyer_fee_status='NOT_DUE',updated_at=now();
  end if;

  select coalesce(sum(quantity),0) into v_reserved
  from public.group_order_commitments where group_order_id=p_group_order_id and status<>'CANCELLED';

  v_new_status := case when v_reserved>=v_order.target_quantity then 'FILLED' else 'OPEN' end;
  if v_order.status in ('OPEN','FILLED') then
    update public.group_orders set status=v_new_status,updated_at=now(),lifecycle_updated_at=now() where id=p_group_order_id;
  end if;

  return jsonb_build_object(
    'group_order_id',p_group_order_id,
    'reserved_quantity',v_reserved,
    'target_quantity',v_order.target_quantity,
    'remaining_quantity',greatest(0,v_order.target_quantity-v_reserved),
    'fill_percentage',round((v_reserved/nullif(v_order.target_quantity,0))*100,1),
    'status',v_new_status
  );
end;
$$;

create or replace function public.consume_account_credit(p_user_id uuid,p_credit_type text,p_amount numeric default 1)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_balance numeric;
begin
  if p_amount <= 0 then return false; end if;
  select balance into v_balance from public.account_credits where user_id=p_user_id and credit_type=p_credit_type for update;
  if not found or v_balance < p_amount then return false; end if;
  update public.account_credits set balance=balance-p_amount,updated_at=now() where user_id=p_user_id and credit_type=p_credit_type;
  return true;
end;
$$;

revoke execute on function public.reserve_group_order(uuid,uuid,numeric,text) from public,anon,authenticated;
grant execute on function public.reserve_group_order(uuid,uuid,numeric,text) to service_role;
revoke execute on function public.consume_account_credit(uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.consume_account_credit(uuid,text,numeric) to service_role;

-- ============================================================
-- RLS. Browser writes are intentionally limited; application APIs use service_role server-side.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.manufacturer_profiles enable row level security;
alter table public.manufacturer_verifications enable row level security;
alter table public.group_orders enable row level security;
alter table public.group_order_commitments enable row level security;
alter table public.group_order_interests enable row level security;
alter table public.commercial_offers enable row level security;
alter table public.billing_requests enable row level security;
alter table public.subscriptions enable row level security;
alter table public.revenue_ledger enable row level security;
alter table public.account_entitlements enable row level security;
alter table public.account_credits enable row level security;
alter table public.notifications enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.admin_tasks enable row level security;
alter table public.audit_log enable row level security;
alter table public.platform_events enable row level security;
alter table public.followup_jobs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.content_translations enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.data_deletion_requests enable row level security;
alter table public.email_messages enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid())=id or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy manufacturer_profiles_select_own on public.manufacturer_profiles for select to authenticated using ((select auth.uid())=id or (select public.is_admin()));
create policy manufacturer_profiles_insert_own on public.manufacturer_profiles for insert to authenticated with check ((select auth.uid())=id);
create policy manufacturer_profiles_update_own on public.manufacturer_profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);

-- Column-level protection: users cannot change their own role/status/plan/fees through direct REST.
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update(full_name,company_name,phone,country,website,business_type,preferred_categories,preferred_countries,annual_purchase_volume,sourcing_notes,notification_email,notification_in_app,onboarding_completed,onboarding_step,updated_at) on public.profiles to authenticated;
revoke insert,update on public.manufacturer_profiles from authenticated;
grant select on public.manufacturer_profiles to authenticated;

grant usage on schema public to anon,authenticated,service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Private storage bucket; upload/download is mediated by server-side authenticated APIs.
insert into storage.buckets(id,name,public,file_size_limit)
values('bulkpact-documents','bulkpact-documents',false,15728640)
on conflict(id) do update set file_size_limit=excluded.file_size_limit,public=false;

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================
insert into public.platform_settings(key,value,description) values
 ('group_orders_enabled','true'::jsonb,'Enable BulkPact Group Orders'),
 ('registrations_enabled','true'::jsonb,'Allow buyer and supplier registrations'),
 ('support_enabled','true'::jsonb,'Enable support tickets'),
 ('maintenance_banner_hu','""'::jsonb,'Hungarian maintenance banner'),
 ('maintenance_banner_en','""'::jsonb,'English maintenance banner'),
 ('support_email','""'::jsonb,'Public support email'),
 ('default_currency','"EUR"'::jsonb,'Default platform currency');

-- Billing catalog. Subscription prices remain editable in Admin; transaction fees are fixed at 1.5% per side.
insert into public.commercial_offers(code,audience,offer_type,name_hu,name_en,price,price_pct,currency,billing_period,active,featured,sort_order,metadata) values
 ('BUYER_FREE','BUYER','PLAN','Buyer Free','Buyer Free',0,null,'EUR','MONTHLY',true,false,10,'{"yearly":0}'::jsonb),
 ('BUYER_BUSINESS','BUYER','PLAN','Buyer Business','Buyer Business',29,null,'EUR','MONTHLY',true,true,20,'{"yearly":290}'::jsonb),
 ('BUYER_PRO','BUYER','PLAN','Buyer Pro','Buyer Pro',79,null,'EUR','MONTHLY',true,false,30,'{"yearly":790}'::jsonb),
 ('BUYER_ENTERPRISE','BUYER','PLAN','Buyer Enterprise','Buyer Enterprise',null,null,'EUR','CUSTOM',true,false,40,'{}'::jsonb),
 ('MFG_STARTER','MANUFACTURER','PLAN','Supplier Starter','Supplier Starter',0,null,'EUR','MONTHLY',true,false,50,'{"yearly":0}'::jsonb),
 ('MFG_BASIC','MANUFACTURER','PLAN','Supplier Basic','Supplier Basic',49,null,'EUR','MONTHLY',true,true,60,'{"yearly":490}'::jsonb),
 ('MFG_PRO','MANUFACTURER','PLAN','Supplier Pro','Supplier Pro',99,null,'EUR','MONTHLY',true,false,70,'{"yearly":990}'::jsonb),
 ('MFG_PREMIUM','MANUFACTURER','PLAN','Supplier Premium','Supplier Premium',199,null,'EUR','MONTHLY',true,false,80,'{"yearly":1990}'::jsonb),
 ('WHS_STARTER','WHOLESALER','PLAN','Wholesale Starter','Wholesale Starter',0,null,'EUR','MONTHLY',true,false,90,'{"yearly":0}'::jsonb),
 ('WHS_BASIC','WHOLESALER','PLAN','Wholesale Basic','Wholesale Basic',49,null,'EUR','MONTHLY',true,true,100,'{"yearly":490}'::jsonb),
 ('WHS_PRO','WHOLESALER','PLAN','Wholesale Pro','Wholesale Pro',129,null,'EUR','MONTHLY',true,false,110,'{"yearly":1290}'::jsonb),
 ('WHS_ENTERPRISE','WHOLESALER','PLAN','Wholesale Enterprise','Wholesale Enterprise',299,null,'EUR','MONTHLY',true,false,120,'{"yearly":2990}'::jsonb),
 ('GROUP_ORDER_BOOST_7D','SUPPLIER','ADDON','Group Order boost 7 napra','Group Order boost for 7 days',39,null,'EUR','ONE_TIME',true,false,200,'{}'::jsonb),
 ('CATEGORY_SPONSOR_MONTH','SUPPLIER','ADDON','Kategória szponzoráció','Category sponsorship',299,null,'EUR','MONTHLY',true,false,210,'{}'::jsonb),
 ('LEAD_PACK_10','SUPPLIER','ADDON','10 buyer demand kredit','10 buyer-demand credits',49,null,'EUR','ONE_TIME',true,false,220,'{}'::jsonb),
 ('MARKET_INTELLIGENCE_REPORT','ALL','ADDON','B2B keresleti riport','B2B demand intelligence report',89,null,'EUR','ONE_TIME',true,false,230,'{}'::jsonb),
 ('LOGISTICS_QUOTE_COORDINATION','ALL','ADDON','Fuvarajánlat koordináció','Logistics quote coordination',35,null,'EUR','ONE_TIME',true,false,240,'{}'::jsonb),
 ('GROUP_ORDER_SETUP_SERVICE','SUPPLIER','ADDON','Group Order kampány setup','Managed Group Order setup',79,null,'EUR','ONE_TIME',true,false,250,'{}'::jsonb),
 ('BUYER_INTENT_INSIGHTS_MONTH','SUPPLIER','ADDON','Buyer demand insight 30 napra','Buyer-demand insights for 30 days',59,null,'EUR','MONTHLY',true,false,260,'{}'::jsonb),
 ('DATA_EXPORT_MONTH','ALL','ADDON','Haladó export / riport','Advanced export / reporting',39,null,'EUR','MONTHLY',true,false,270,'{}'::jsonb),
 ('EXPRESS_VERIFICATION','SUPPLIER','ADDON','Express verification','Express verification',179,null,'EUR','ONE_TIME',true,false,280,'{}'::jsonb),
 ('API_DATA_ACCESS_MONTH','ALL','ADDON','API / adat-hozzáférés','API / data access',149,null,'EUR','MONTHLY',true,false,290,'{}'::jsonb),
 ('GROUP_ORDER_TRANSACTION_FEE','SUPPLIER','FEE','Group Order tranzakciós díj','Group Order transaction fee',null,1.5,'EUR','PERCENTAGE',true,false,300,'{}'::jsonb),
 ('SUCCESS_FEE','BUYER','FEE','Vevői tranzakciós díj','Buyer transaction fee',null,1.5,'EUR','PERCENTAGE',true,false,310,'{}'::jsonb);

commit;

-- Bootstrap check
select
  (select count(*) from public.platform_settings) as settings,
  (select count(*) from public.commercial_offers) as commercial_offers,
  (select count(*) from storage.buckets where id='bulkpact-documents') as storage_bucket;
