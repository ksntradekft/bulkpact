-- BULKPACT V1.1.0 — SAFE APPLICATION UPGRADE FROM PLH V9.2.1
-- Run once in Supabase SQL Editor before the first BulkPact deployment.
-- This script DOES NOT delete legacy PL tables/data. The BulkPact application no longer uses the PL/RFQ workflow.

begin;

create extension if not exists pgcrypto;

-- BulkPact uses the existing account model for backward compatibility.
-- MANUFACTURER is an internal role value only; the UI calls this role SUPPLIER.

-- Ensure the Group Order lifecycle required by BulkPact exists.
alter table public.group_orders drop constraint if exists group_orders_status_check;
alter table public.group_orders add constraint group_orders_status_check check (status in (
  'DRAFT','OPEN','FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED','DELIVERED','COMPLETED','CANCELLED'
));

alter table public.group_orders add column if not exists freight_total numeric(14,4) not null default 0;
alter table public.group_orders add column if not exists handling_total numeric(14,4) not null default 0;
alter table public.group_orders add column if not exists customs_total numeric(14,4) not null default 0;
alter table public.group_orders add column if not exists insurance_total numeric(14,4) not null default 0;
alter table public.group_orders add column if not exists other_costs_total numeric(14,4) not null default 0;
alter table public.group_orders add column if not exists landed_cost_notes text not null default '';
alter table public.group_orders add column if not exists lifecycle_updated_at timestamptz not null default now();
alter table public.group_orders add column if not exists featured_until timestamptz;
alter table public.group_orders add column if not exists platform_fee_pct numeric(8,4) not null default 0;
alter table public.group_orders add column if not exists platform_fee_amount numeric(14,4) not null default 0;
alter table public.group_orders add column if not exists commission_status text not null default 'NOT_DUE';
alter table public.group_orders add column if not exists price_unit text;
alter table public.group_orders add column if not exists price_units_per_order_unit numeric(14,3) not null default 1;
update public.group_orders set price_unit=unit where price_unit is null or btrim(price_unit)='';
alter table public.group_orders alter column price_unit set default 'db';
alter table public.group_orders alter column price_unit set not null;
alter table public.group_orders drop constraint if exists group_orders_price_units_per_order_unit_check;
alter table public.group_orders add constraint group_orders_price_units_per_order_unit_check check (price_units_per_order_unit > 0);

alter table public.group_order_commitments add column if not exists commitment_type text not null default 'COMMITMENT';
alter table public.group_order_commitments add column if not exists deposit_status text not null default 'NOT_REQUIRED';
alter table public.group_order_commitments add column if not exists deposit_amount numeric(14,4);
alter table public.group_order_commitments add column if not exists deposit_currency text not null default 'EUR';
alter table public.group_order_commitments add column if not exists deposit_due_at timestamptz;
alter table public.group_order_commitments add column if not exists deposit_paid_at timestamptz;
alter table public.group_order_commitments add column if not exists payment_reference text;

create table if not exists public.group_order_interests (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  quantity numeric(14,3) not null check (quantity > 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_order_id,buyer_id)
);

-- Fixed-price rule: BulkPact never reads group_order_price_tiers.
-- We keep the legacy table untouched so this migration is non-destructive.

-- Transaction-safe reservation function. This is the critical Group Order write path.
create or replace function public.reserve_group_order(
  p_group_order_id uuid,
  p_buyer_id uuid,
  p_quantity numeric,
  p_note text default ''
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.group_orders%rowtype;
  v_reserved numeric := 0;
  v_available numeric := 0;
  v_new_status text;
begin
  select * into v_order from public.group_orders where id=p_group_order_id for update;
  if not found then raise exception 'A közös rendelés nem található.'; end if;

  if not exists(select 1 from public.profiles where id=p_buyer_id and role='BUYER' and status='ACTIVE') then
    raise exception 'Csak aktív vevői fiók foglalhat.';
  end if;

  if v_order.status not in ('OPEN','FILLED') then raise exception 'A kampány jelenleg nem fogad foglalást.'; end if;
  if v_order.deadline is not null and v_order.deadline < now() then raise exception 'A jelentkezési határidő lejárt.'; end if;

  if coalesce(p_quantity,0)=0 then
    insert into public.group_order_commitments(group_order_id,buyer_id,quantity,status,note,updated_at)
    values(p_group_order_id,p_buyer_id,0,'CANCELLED',coalesce(p_note,''),now())
    on conflict(group_order_id,buyer_id) do update set quantity=0,status='CANCELLED',note=excluded.note,updated_at=now();
  else
    if p_quantity < v_order.min_join_quantity then raise exception 'A foglalás nem éri el a minimális csatlakozási mennyiséget.'; end if;

    select coalesce(sum(quantity),0) into v_reserved
    from public.group_order_commitments
    where group_order_id=p_group_order_id and status<>'CANCELLED' and buyer_id<>p_buyer_id;

    v_available := greatest(0,v_order.target_quantity-v_reserved);
    if p_quantity > v_available then raise exception 'A megadott mennyiség nagyobb a még szabad mennyiségnél (% %).',v_available,v_order.unit; end if;

    insert into public.group_order_commitments(group_order_id,buyer_id,quantity,status,note,updated_at)
    values(p_group_order_id,p_buyer_id,p_quantity,'RESERVED',coalesce(p_note,''),now())
    on conflict(group_order_id,buyer_id) do update set quantity=excluded.quantity,status='RESERVED',note=excluded.note,updated_at=now();
  end if;

  select coalesce(sum(quantity),0) into v_reserved
  from public.group_order_commitments
  where group_order_id=p_group_order_id and status<>'CANCELLED';

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

revoke execute on function public.reserve_group_order(uuid,uuid,numeric,text) from public,anon,authenticated;
grant execute on function public.reserve_group_order(uuid,uuid,numeric,text) to service_role;

-- Keep BulkPact Group Orders enabled and disable the old sourcing flag in the application settings.
insert into public.platform_settings(key,value,description) values
 ('group_orders_enabled','true'::jsonb,'Enable BulkPact Group Orders'),
 ('registrations_enabled','true'::jsonb,'Allow buyer and supplier registrations'),
 ('support_enabled','true'::jsonb,'Enable support tickets'),
 ('smart_sourcing_enabled','false'::jsonb,'Legacy setting - disabled in BulkPact')
on conflict(key) do update set value=excluded.value,description=excluded.description,updated_at=now();

create index if not exists group_orders_status_deadline_idx on public.group_orders(status,deadline);
create index if not exists group_order_commitments_order_idx on public.group_order_commitments(group_order_id,status);
create index if not exists group_order_interests_order_idx on public.group_order_interests(group_order_id);

commit;

-- CHECK
select 'BulkPact Group Orders' as component,
       count(*) as existing_rows,
       count(*) filter(where unit_price is not null and unit_price>0) as fixed_price_rows
from public.group_orders;
