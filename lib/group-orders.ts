import { serviceDatabaseConfigured } from './supabase-config';
import { serviceSelect } from './supabase-rest';
import type { Locale } from './i18n-shared';

export const GROUP_ORDER_STATUSES=['DRAFT','OPEN','FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED','DELIVERED','COMPLETED','CANCELLED'] as const;
export const GROUP_ORDER_VISIBILITIES=['PUBLIC','BUYERS_ONLY'] as const;
export type GroupOrderStatus=(typeof GROUP_ORDER_STATUSES)[number];
export type GroupOrderVisibility=(typeof GROUP_ORDER_VISIBILITIES)[number];
export type CommitmentStatus='RESERVED'|'CONFIRMED'|'CANCELLED'|'ALLOCATED';
export type GroupOrderRow={
  id:string;created_by:string|null;title:string;brand:string;product_name:string;product_description:string;category:string;supplier_name:string;supplier_url:string|null;moq_label:string|null;target_quantity:number|string;unit:string;min_join_quantity:number|string;unit_price:number|string|null;price_unit:string;price_units_per_order_unit:number|string;currency:string;destination_country:string;deadline:string|null;status:GroupOrderStatus;visibility:GroupOrderVisibility;notes:string;created_at:string;updated_at:string;
  featured_until?:string|null;platform_fee_pct?:number|string;platform_fee_amount?:number|string;commission_status?:string;freight_total?:number|string;handling_total?:number|string;customs_total?:number|string;insurance_total?:number|string;other_costs_total?:number|string;landed_cost_notes?:string;lifecycle_updated_at?:string;
};
export type CommitmentRow={id:string;group_order_id:string;buyer_id:string;quantity:number|string;status:CommitmentStatus;note:string;commitment_type?:string;deposit_status?:string;deposit_amount?:number|string|null;deposit_currency?:string;deposit_due_at?:string|null;deposit_paid_at?:string|null;payment_reference?:string|null;created_at:string;updated_at:string;profiles?:{company_name?:string|null;email?:string|null;phone?:string|null}|null};
export type InterestRow={id:string;group_order_id:string;buyer_id:string;quantity:number|string;note:string;created_at:string;updated_at:string};
export type GroupOrderView=Omit<GroupOrderRow,'target_quantity'|'min_join_quantity'|'unit_price'>&{
  target_quantity:number;min_join_quantity:number;unit_price:number|null;price_units_per_order_unit:number;reserved_quantity:number;remaining_quantity:number;fill_percentage:number;participants:number;interest_quantity:number;interested_companies:number;estimated_goods_total:number;estimated_extra_costs:number;estimated_platform_fee:number;estimated_landed_total:number;estimated_landed_unit:number|null;commitments?:CommitmentRow[];my_commitment?:CommitmentRow|null;my_interest?:InterestRow|null;
};
const numeric=(value:any)=>{const n=Number(value??0);return Number.isFinite(n)?n:0};

export function enrichGroupOrders(orders:GroupOrderRow[],commitments:CommitmentRow[],buyerId?:string,includeCommitments=false,interests:InterestRow[]=[]):GroupOrderView[]{
  return orders.map(order=>{
    const active=commitments.filter(c=>c.group_order_id===order.id&&c.status!=='CANCELLED');
    const ints=interests.filter(i=>i.group_order_id===order.id);
    const reserved=active.reduce((s,c)=>s+numeric(c.quantity),0),target=numeric(order.target_quantity),pct=target>0?reserved/target*100:0;
    const fixedPrice=order.unit_price==null?null:numeric(order.unit_price);
    const priceUnitsPerOrderUnit=Math.max(0.000001,numeric(order.price_units_per_order_unit)||1);
    const priceUnit=String(order.price_unit||order.unit||'db');
    const totalPriceUnits=target*priceUnitsPerOrderUnit;
    const goods=totalPriceUnits*(fixedPrice??0),extras=numeric(order.freight_total)+numeric(order.handling_total)+numeric(order.customs_total)+numeric(order.insurance_total)+numeric(order.other_costs_total),fee=goods*numeric(order.platform_fee_pct)/100,total=goods+extras+fee;
    return{...order,price_unit:priceUnit,target_quantity:target,min_join_quantity:numeric(order.min_join_quantity),unit_price:fixedPrice,price_units_per_order_unit:priceUnitsPerOrderUnit,reserved_quantity:reserved,remaining_quantity:Math.max(0,target-reserved),fill_percentage:Math.round(pct*10)/10,participants:new Set(active.map(c=>c.buyer_id)).size,interest_quantity:ints.reduce((s,i)=>s+numeric(i.quantity),0),interested_companies:new Set(ints.map(i=>i.buyer_id)).size,estimated_goods_total:goods,estimated_extra_costs:extras,estimated_platform_fee:fee,estimated_landed_total:total,estimated_landed_unit:totalPriceUnits>0&&fixedPrice!=null?total/totalPriceUnits:null,commitments:includeCommitments?active:undefined,my_commitment:buyerId?active.find(c=>c.buyer_id===buyerId)??null:undefined,my_interest:buyerId?ints.find(i=>i.buyer_id===buyerId)??null:undefined};
  });
}

export async function loadGroupOrders(options:{admin?:boolean;buyerId?:string;publicOnly?:boolean;includeCommitments?:boolean;createdBy?:string}={}):Promise<GroupOrderView[]>{
  if(!serviceDatabaseConfigured())return[];
  const filters:string[]=[];
  if(options.createdBy)filters.push(`created_by=eq.${encodeURIComponent(options.createdBy)}`);
  else if(!options.admin){filters.push('status=in.(OPEN,FILLED,DEPOSIT,LOCKED,SUPPLIER_CONFIRMED,ORDERED,DISPATCHED,DELIVERED)');if(options.publicOnly)filters.push('visibility=eq.PUBLIC')}
  const oq=`group_orders?select=*&order=created_at.desc${filters.length?`&${filters.join('&')}`:''}`;
  const cq=(options.admin||options.includeCommitments)?'group_order_commitments?select=*,profiles!group_order_commitments_buyer_id_fkey(company_name,email,phone)&order=created_at.desc':'group_order_commitments?select=*&order=created_at.desc';
  const[orders,commitments,interests]=await Promise.all([serviceSelect<GroupOrderRow[]>(oq),serviceSelect<CommitmentRow[]>(cq),serviceSelect<InterestRow[]>('group_order_interests?select=*&order=created_at.desc').catch(()=>[])]);
  return enrichGroupOrders(orders,commitments,options.buyerId,Boolean(options.includeCommitments||options.admin),interests);
}

const unitsEn:Record<string,string>={db:'pcs',darab:'pcs',karton:'cartons',raklap:'pallets',kg:'kg',tonna:'tonnes',liter:'litres',litre:'litres',kamion:'truckloads',csomag:'packs'};
export function displayUnit(unit:string,locale:Locale='hu'){if(locale!=='en')return unit;return unitsEn[unit.toLowerCase()]||unit}
export function formatQuantity(value:number,unit:string,locale:Locale='hu'){return `${new Intl.NumberFormat(locale==='en'?'en-GB':'hu-HU',{maximumFractionDigits:3}).format(value)} ${displayUnit(unit,locale)}`}
export function formatMoney(value:number|null,currency:string,locale:Locale='hu'){if(value==null)return locale==='en'?'On request':'Ajánlat alapján';try{return new Intl.NumberFormat(locale==='en'?'en-GB':'hu-HU',{style:'currency',currency,maximumFractionDigits:2}).format(value)}catch{return`${new Intl.NumberFormat(locale==='en'?'en-GB':'hu-HU',{maximumFractionDigits:2}).format(value)} ${currency}`}}
export function deadlinePassed(deadline:string|null):boolean{if(!deadline)return false;const t=new Date(deadline).getTime();return Number.isFinite(t)&&t<Date.now()}
