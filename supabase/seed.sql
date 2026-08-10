-- BULKPACT 1.2.0 — OPTIONAL DEMO MARKETPLACE DATA
-- DO NOT RUN on a live production marketplace unless you intentionally want demo campaigns.
-- Safe to run repeatedly: deterministic UUIDs + ON CONFLICT.

begin;

insert into public.group_orders(
  id,created_by,title,brand,product_name,product_description,category,supplier_name,supplier_url,moq_label,
  target_quantity,unit,min_join_quantity,unit_price,price_unit,price_units_per_order_unit,currency,destination_country,deadline,status,visibility,notes,
  freight_total,handling_total,customs_total,insurance_total,other_costs_total,landed_cost_notes,updated_at
) values
('b1000000-0000-0000-0000-000000000001',null,'[DEMO] Laundry detergent pallet pool','CleanWave','Laundry Detergent 4.5 L','Fixed-price pallet deal for independent retailers.','Háztartási és FMCG','CEE Household Distribution',null,'66 pallets',66,'raklap',1,18.50,'karton',60,'EUR','Hungary',now()+interval '8 days','OPEN','PUBLIC','DEMO',1150,180,0,40,0,'Estimated cross-dock shipment to Hungary.',now()),
('b1000000-0000-0000-0000-000000000002',null,'[DEMO] Energy drink truckload','VoltRush','Energy Drink 250 ml 24-pack','Full-truck MOQ shared between convenience stores and resellers.','Ital, kávé és tea','Danube Beverage Hub',null,'33 pallets',33,'raklap',1,12.90,'karton',108,'EUR','Hungary',now()+interval '5 days','OPEN','PUBLIC','DEMO',790,120,0,30,0,'Freight estimated for one truck.',now()),
('b1000000-0000-0000-0000-000000000003',null,'[DEMO] Premium coffee wholesale lot','RoastUnion','Arabica Coffee Beans 1 kg','Wholesale coffee lot for HoReCa and specialty retail buyers.','Ital, kávé és tea','Central Roast Trading',null,'20 pallets',20,'raklap',0.5,7.85,'db',600,'EUR','Hungary',now()+interval '12 days','OPEN','PUBLIC','DEMO',620,90,0,25,0,'Cross-dock estimate.',now()),
('b1000000-0000-0000-0000-000000000004',null,'[DEMO] Confectionery mixed pallet order','SweetRoute','Mixed branded confectionery cartons','Mixed confectionery stocklot offered at a single fixed campaign price.','Édesség és snack','Balkan FMCG Export',null,'40 pallets',40,'raklap',1,925.00,'raklap',1,'EUR','Hungary',now()+interval '4 days','OPEN','PUBLIC','DEMO',880,140,0,25,0,'Price shown per pallet.',now()),
('b1000000-0000-0000-0000-000000000005',null,'[DEMO] Paper towel bulk purchase','HomeStock','3-ply kitchen paper','High-volume household paper offer for retail buyers.','Háztartási és FMCG','V4 Paper Wholesale',null,'48 pallets',48,'raklap',1,640.00,'raklap',1,'EUR','Hungary',now()+interval '10 days','OPEN','PUBLIC','DEMO',960,150,0,35,0,'Estimated inbound freight.',now()),
('b1000000-0000-0000-0000-000000000006',null,'[DEMO] HoReCa takeaway packaging','PackServe','750 ml kraft food box','Shared MOQ for restaurants, food trucks and takeaway operators.','HoReCa','Adria Packaging Trade',null,'120,000 pcs',120000,'db',5000,0.118,'db',1,'EUR','Hungary',now()+interval '14 days','OPEN','PUBLIC','DEMO',720,110,0,20,0,'Estimated landed costs for the full MOQ.',now())
on conflict(id) do update set
  title=excluded.title,brand=excluded.brand,product_name=excluded.product_name,product_description=excluded.product_description,
  category=excluded.category,supplier_name=excluded.supplier_name,moq_label=excluded.moq_label,target_quantity=excluded.target_quantity,
  unit=excluded.unit,min_join_quantity=excluded.min_join_quantity,unit_price=excluded.unit_price,price_unit=excluded.price_unit,price_units_per_order_unit=excluded.price_units_per_order_unit,currency=excluded.currency,
  destination_country=excluded.destination_country,deadline=excluded.deadline,status=excluded.status,visibility=excluded.visibility,
  freight_total=excluded.freight_total,handling_total=excluded.handling_total,customs_total=excluded.customs_total,
  insurance_total=excluded.insurance_total,other_costs_total=excluded.other_costs_total,landed_cost_notes=excluded.landed_cost_notes,updated_at=now();

-- If demo buyers already exist, create realistic commitments without touching real buyer accounts.
with buyers as (
  select id,row_number() over(order by email) rn
  from public.profiles
  where role='BUYER' and email like '%@demo.bulkpact.local'
), rows(group_order_id,rn,quantity) as (
  values
  ('b1000000-0000-0000-0000-000000000001'::uuid,1,8::numeric),
  ('b1000000-0000-0000-0000-000000000001'::uuid,2,7::numeric),
  ('b1000000-0000-0000-0000-000000000001'::uuid,3,10::numeric),
  ('b1000000-0000-0000-0000-000000000001'::uuid,4,6::numeric),
  ('b1000000-0000-0000-0000-000000000001'::uuid,5,12::numeric),
  ('b1000000-0000-0000-0000-000000000002'::uuid,1,5::numeric),
  ('b1000000-0000-0000-0000-000000000002'::uuid,2,4::numeric),
  ('b1000000-0000-0000-0000-000000000002'::uuid,6,8::numeric),
  ('b1000000-0000-0000-0000-000000000003'::uuid,3,2::numeric),
  ('b1000000-0000-0000-0000-000000000003'::uuid,7,3::numeric),
  ('b1000000-0000-0000-0000-000000000004'::uuid,4,9::numeric),
  ('b1000000-0000-0000-0000-000000000004'::uuid,8,11::numeric),
  ('b1000000-0000-0000-0000-000000000005'::uuid,5,8::numeric),
  ('b1000000-0000-0000-0000-000000000005'::uuid,9,7::numeric),
  ('b1000000-0000-0000-0000-000000000006'::uuid,10,15000::numeric),
  ('b1000000-0000-0000-0000-000000000006'::uuid,11,10000::numeric)
)
insert into public.group_order_commitments(group_order_id,buyer_id,quantity,status,note,updated_at)
select r.group_order_id,b.id,r.quantity,'RESERVED','DEMO commitment',now()
from rows r join buyers b on b.rn=r.rn
on conflict(group_order_id,buyer_id) do update set quantity=excluded.quantity,status='RESERVED',note=excluded.note,updated_at=now();

-- Recalculate OPEN/FILLED from commitments.
update public.group_orders g set status=case when x.reserved>=g.target_quantity then 'FILLED' else 'OPEN' end,updated_at=now()
from (
  select group_order_id,coalesce(sum(quantity),0) reserved
  from public.group_order_commitments where status<>'CANCELLED' group by group_order_id
) x
where g.id=x.group_order_id and g.id::text like 'b1000000-%';

commit;

select title,unit_price,currency,price_unit,price_units_per_order_unit,target_quantity,unit,status
from public.group_orders where id::text like 'b1000000-%' order by title;
