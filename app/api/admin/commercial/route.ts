import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth-server';
import { MONETIZATION_ADDONS, MONETIZATION_PLANS, getPlan, normalizePlanCode, type MonetizationAudience } from '@/lib/monetization-catalog';
import { getAccountCommercialState } from '@/lib/monetization-server';
import { serviceSelect, serviceWrite } from '@/lib/supabase-rest';

const text=(v:unknown)=>String(v??'').trim();
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0};
const optionalNum=(v:unknown)=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
function addDays(days:number){const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString()}
function audienceForProfile(p:any,supplierType:string):MonetizationAudience{if(p.role==='BUYER')return'BUYER';return supplierType==='WHOLESALER'?'WHOLESALER':'MANUFACTURER'}

export async function GET(request:NextRequest){
  const auth=await requireApiRole(request,'ADMIN');if(!auth.session)return NextResponse.json({error:auth.error},{status:auth.status});
  const[groupOrders,profiles,suppliers,deletions,requests,subscriptions,ledger,offers]=await Promise.all([
    serviceSelect<any[]>('group_orders?select=id,created_by,title,target_quantity,unit_price,price_units_per_order_unit,currency,platform_fee_pct,platform_fee_amount,commission_status,status,created_at&order=created_at.desc').catch(()=>[]),
    serviceSelect<any[]>('profiles?select=id,email,company_name,role,plan,success_fee_pct,billing_cycle,subscription_status,plan_started_at,plan_renews_at&order=created_at.desc').catch(()=>[]),
    serviceSelect<any[]>('manufacturer_profiles?select=id,supplier_type,featured,featured_until,verification_level').catch(()=>[]),
    serviceSelect<any[]>('data_deletion_requests?select=*&order=created_at.desc').catch(()=>[]),
    serviceSelect<any[]>('billing_requests?select=*&order=created_at.desc&limit=200').catch(()=>[]),
    serviceSelect<any[]>('subscriptions?select=*&order=created_at.desc&limit=200').catch(()=>[]),
    serviceSelect<any[]>('revenue_ledger?select=*&order=created_at.desc&limit=300').catch(()=>[]),
    serviceSelect<any[]>('commercial_offers?select=*&order=sort_order.asc').catch(()=>[]),
  ]);
  const supplierMap=new Map(suppliers.map(x=>[x.id,x]));
  const offerMap=new Map(offers.map(x=>[x.code,x]));
  const enrichedProfiles=profiles.map(p=>({...p,supplier_type:supplierMap.get(p.id)?.supplier_type||null,featured:supplierMap.get(p.id)?.featured||false,featured_until:supplierMap.get(p.id)?.featured_until||null,verification_level:supplierMap.get(p.id)?.verification_level||null}));
  let mrr=0;
  for(const p of enrichedProfiles.filter(p=>p.role!=='ADMIN'&&p.subscription_status==='ACTIVE')){
    const aud=audienceForProfile(p,p.supplier_type);const code=normalizePlanCode(p.plan,aud);const plan=getPlan(code);const offer=offerMap.get(code);
    if(!plan)continue;
    if(p.billing_cycle==='YEARLY'){const yearly=optionalNum(offer?.metadata?.yearly??plan.priceYearly);if(yearly!=null)mrr+=yearly/12}
    else {const monthly=optionalNum(offer?.price??plan.priceMonthly);if(monthly!=null)mrr+=monthly}
  }
  const eurLedger=ledger.filter(x=>x.currency==='EUR');
  const paidRevenue=eurLedger.filter(x=>x.status==='PAID').reduce((s,x)=>s+num(x.amount),0);
  const openRevenue=eurLedger.filter(x=>['PENDING','INVOICED'].includes(x.status)).reduce((s,x)=>s+num(x.amount),0);
  const commercialGroupOrders=groupOrders.filter((o:any)=>o.currency==='EUR'&&['FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED','DELIVERED','COMPLETED'].includes(o.status));const gmv=commercialGroupOrders.reduce((s:number,o:any)=>s+num(o.target_quantity)*Math.max(0.000001,num(o.price_units_per_order_unit)||1)*num(o.unit_price),0);const fees=commercialGroupOrders.reduce((s:number,o:any)=>s+num(o.platform_fee_amount),0);
  const activePaid=enrichedProfiles.filter(p=>{if(p.role==='ADMIN'||p.subscription_status!=='ACTIVE')return false;const code=normalizePlanCode(p.plan,audienceForProfile(p,p.supplier_type));const plan=getPlan(code);return Boolean(plan&&num(plan.priceMonthly)>0)}).length;
  const activeCodes=new Set([...MONETIZATION_PLANS.map(x=>x.code),...MONETIZATION_ADDONS.map(x=>x.code)]);const visibleOffers=offers.filter((o:any)=>activeCodes.has(o.code));
  return NextResponse.json({groupOrders,profiles:enrichedProfiles,deletions,requests,subscriptions,ledger,offers:visibleOffers,kpis:{eur_gmv:gmv,eur_order_fees:fees,mrr,arr:mrr*12,paid_revenue:paidRevenue,open_revenue:openRevenue,group_orders:groupOrders.length,paid_commissions:groupOrders.filter(o=>o.commission_status==='PAID').length,pending_requests:requests.filter(r=>['REQUESTED','IN_REVIEW'].includes(r.status)).length,active_paid_accounts:activePaid}});
}

async function addCredits(userId:string,type:'BOOST'|'LEAD',amount:number){
  if(amount<=0)return;const current=(await serviceSelect<any[]>(`account_credits?user_id=eq.${encodeURIComponent(userId)}&credit_type=eq.${type}&select=balance&limit=1`).catch(()=>[]))[0];
  await serviceWrite('account_credits?on_conflict=user_id,credit_type',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({user_id:userId,credit_type:type,balance:num(current?.balance)+amount,updated_at:new Date().toISOString()})});
}

async function activateRequest(requestId:string,adminId:string){
  const req=(await serviceSelect<any[]>(`billing_requests?id=eq.${encodeURIComponent(requestId)}&select=*&limit=1`).catch(()=>[]))[0];if(!req)throw new Error('Billing request not found.');
  if(req.status==='FULFILLED')return{plan:null,addon:null,alreadyFulfilled:true};
  const profile=(await serviceSelect<any[]>(`profiles?id=eq.${encodeURIComponent(req.user_id)}&select=id,role,plan&limit=1`).catch(()=>[]))[0];if(!profile)throw new Error('Profile not found.');
  const supplier=(await serviceSelect<any[]>(`manufacturer_profiles?id=eq.${encodeURIComponent(req.user_id)}&select=supplier_type&limit=1`).catch(()=>[]))[0];
  const audience=audienceForProfile(profile,supplier?.supplier_type||'MANUFACTURER');const plan=MONETIZATION_PLANS.find(p=>p.code===req.offer_code);const addon=MONETIZATION_ADDONS.find(x=>x.code===req.offer_code);const cycle=req.billing_cycle==='YEARLY'?'YEARLY':'MONTHLY';
  if(plan){
    const offer=(await serviceSelect<any[]>(`commercial_offers?code=eq.${encodeURIComponent(plan.code)}&select=price,currency,metadata&limit=1`).catch(()=>[]))[0];
    const effectivePrice=optionalNum(cycle==='YEARLY'?(offer?.metadata?.yearly??plan.priceYearly):(offer?.price??plan.priceMonthly));const renews=effectivePrice==null?null:addDays(cycle==='YEARLY'?365:30);const currency=offer?.currency||plan.currency;
    await serviceWrite(`profiles?id=eq.${encodeURIComponent(req.user_id)}`,{method:'PATCH',body:JSON.stringify({plan:plan.code,billing_cycle:cycle,subscription_status:effectivePrice===0?'FREE':'ACTIVE',plan_started_at:new Date().toISOString(),plan_renews_at:renews,success_fee_pct:1.5,updated_at:new Date().toISOString()})});
    await serviceWrite('subscriptions',{method:'POST',body:JSON.stringify({user_id:req.user_id,plan_code:plan.code,billing_cycle:cycle,status:'ACTIVE',price:effectivePrice,currency,starts_at:new Date().toISOString(),renews_at:renews,notes:`Activated from billing request ${req.id}`})});
    if(effectivePrice&&effectivePrice>0)await serviceWrite('revenue_ledger',{method:'POST',body:JSON.stringify({user_id:req.user_id,source_type:'SUBSCRIPTION',offer_code:plan.code,reference_type:'BILLING_REQUEST',reference_id:req.id,description:`${plan.nameEn} ${cycle.toLowerCase()} subscription`,amount:effectivePrice,currency,status:'INVOICED'})});
    if(profile.role==='MANUFACTURER'&&plan.entitlements.featuredProfile)await serviceWrite(`manufacturer_profiles?id=eq.${encodeURIComponent(req.user_id)}`,{method:'PATCH',body:JSON.stringify({featured:true,featured_until:renews,updated_at:new Date().toISOString()})}).catch(()=>null);
    if(plan.entitlements.monthlyBoostCredits)await addCredits(req.user_id,'BOOST',plan.entitlements.monthlyBoostCredits);
    if(plan.entitlements.monthlyLeadCredits)await addCredits(req.user_id,'LEAD',plan.entitlements.monthlyLeadCredits);
  }
  if(addon){
    const offer=(await serviceSelect<any[]>(`commercial_offers?code=eq.${encodeURIComponent(addon.code)}&select=price,currency&limit=1`).catch(()=>[]))[0];let price=num(offer?.price??addon.price??0);const state=await getAccountCommercialState(req.user_id,profile.role).catch(()=>null);
    if(addon.code==='VERIFICATION_REVIEW'&&state?.entitlements.verificationDiscountPct)price=price*(1-state.entitlements.verificationDiscountPct/100);
    let source='ADDON';if(addon.code.includes('VERIFICATION'))source='VERIFICATION';else if(addon.code.includes('SOURCING')||addon.code.includes('MARKET_INTELLIGENCE'))source='SOURCING';else if(addon.code.includes('SAMPLE'))source='SAMPLE';else if(addon.code.includes('BOOST'))source='BOOST';else if(addon.code.includes('LEAD'))source='LEAD';else if(addon.code.includes('TRANSLATION'))source='TRANSLATION';else if(addon.code.includes('SPONSOR'))source='SPONSORSHIP';
    if(price>0)await serviceWrite('revenue_ledger',{method:'POST',body:JSON.stringify({user_id:req.user_id,source_type:source,offer_code:addon.code,reference_type:'BILLING_REQUEST',reference_id:req.id,description:addon.nameEn,amount:price*num(req.quantity||1),currency:offer?.currency||addon.currency,status:'INVOICED'})});
    if(addon.creditType&&addon.creditAmount)await addCredits(req.user_id,addon.creditType,addon.creditAmount*num(req.quantity||1));
    const expiry=addon.code.includes('7D')?addDays(7):addon.code.includes('MONTH')||addon.period==='MONTHLY'?addDays(30):null;
    if(addon.entitlementKey)await serviceWrite('account_entitlements',{method:'POST',body:JSON.stringify({user_id:req.user_id,entitlement_key:addon.entitlementKey,source_offer_code:addon.code,quantity:req.quantity||1,active:true,expires_at:expiry,metadata:req.metadata||{}})});
    if(['FEATURED_PROFILE_MONTH','PROFILE_BOOST_7D'].includes(addon.code))await serviceWrite(`manufacturer_profiles?id=eq.${encodeURIComponent(req.user_id)}`,{method:'PATCH',body:JSON.stringify({featured:true,featured_until:expiry,updated_at:new Date().toISOString()})}).catch(()=>null);
    if(addon.code==='GROUP_ORDER_BOOST_7D'&&req.metadata?.group_order_id)await serviceWrite(`group_orders?id=eq.${encodeURIComponent(String(req.metadata.group_order_id))}&created_by=eq.${encodeURIComponent(req.user_id)}`,{method:'PATCH',body:JSON.stringify({featured_until:addDays(7),updated_at:new Date().toISOString()})}).catch(()=>null);
  }
  await serviceWrite(`billing_requests?id=eq.${encodeURIComponent(requestId)}`,{method:'PATCH',body:JSON.stringify({status:'FULFILLED',reviewed_at:new Date().toISOString(),reviewed_by:adminId})});return{plan:plan?.code||null,addon:addon?.code||null,audience};
}

export async function PATCH(request:NextRequest){
  const auth=await requireApiRole(request,'ADMIN');if(!auth.session)return NextResponse.json({error:auth.error},{status:auth.status});const b=await request.json().catch(()=>({}));
  if(b.billing_request_id){try{const status=text(b.status||'IN_REVIEW');if(status==='APPROVED'||status==='FULFILLED'){const result=await activateRequest(text(b.billing_request_id),auth.session.user.id);return NextResponse.json({success:true,activated:true,...result})}await serviceWrite(`billing_requests?id=eq.${encodeURIComponent(text(b.billing_request_id))}`,{method:'PATCH',body:JSON.stringify({status,reviewed_at:['REJECTED','CANCELLED'].includes(status)?new Date().toISOString():null,reviewed_by:auth.session.user.id})});return NextResponse.json({success:true})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Activation failed.'},{status:500})}}
  if(b.ledger_id){const status=text(b.status||'PENDING');const patch:any={status,updated_at:new Date().toISOString()};if(status==='PAID')patch.paid_at=new Date().toISOString();await serviceWrite(`revenue_ledger?id=eq.${encodeURIComponent(text(b.ledger_id))}`,{method:'PATCH',body:JSON.stringify(patch)});return NextResponse.json({success:true})}
  if(b.offer_code){
    const offerCode=text(b.offer_code);const patch:any={updated_at:new Date().toISOString()};
    if(b.price!==undefined)patch.price=b.price===''?null:Number(b.price);if(b.price_pct!==undefined)patch.price_pct=['GROUP_ORDER_TRANSACTION_FEE','SUCCESS_FEE'].includes(offerCode)?1.5:(b.price_pct===''?null:Number(b.price_pct));if(b.active!==undefined)patch.active=Boolean(b.active);if(b.featured!==undefined)patch.featured=Boolean(b.featured);
    if(b.yearly_price!==undefined){const current=(await serviceSelect<any[]>(`commercial_offers?code=eq.${encodeURIComponent(offerCode)}&select=metadata&limit=1`).catch(()=>[]))[0];patch.metadata={...(current?.metadata||{}),yearly:b.yearly_price===''?null:Number(b.yearly_price)}}
    await serviceWrite(`commercial_offers?code=eq.${encodeURIComponent(offerCode)}`,{method:'PATCH',body:JSON.stringify(patch)});return NextResponse.json({success:true})
  }
  if(b.profile_id){const patch:any={};if(b.plan!==undefined)patch.plan=text(b.plan);patch.success_fee_pct=1.5;if(b.subscription_status!==undefined)patch.subscription_status=text(b.subscription_status);if(b.billing_cycle!==undefined)patch.billing_cycle=text(b.billing_cycle);patch.updated_at=new Date().toISOString();await serviceWrite(`profiles?id=eq.${encodeURIComponent(text(b.profile_id))}`,{method:'PATCH',body:JSON.stringify(patch)});return NextResponse.json({success:true})}
  if(b.deletion_id){await serviceWrite(`data_deletion_requests?id=eq.${encodeURIComponent(text(b.deletion_id))}`,{method:'PATCH',body:JSON.stringify({status:text(b.status||'IN_REVIEW'),reviewed_at:new Date().toISOString()})});return NextResponse.json({success:true})}
  if(b.group_order_id){
    const groupOrderId=text(b.group_order_id);const order=(await serviceSelect<any[]>(`group_orders?id=eq.${encodeURIComponent(groupOrderId)}&select=created_by,title,target_quantity,unit_price,price_units_per_order_unit,currency&limit=1`).catch(()=>[]))[0];if(!order)return NextResponse.json({error:'Group Order nem található.'},{status:404});
    const pct=1.5;const amount=num(order.target_quantity)*Math.max(0.000001,num(order.price_units_per_order_unit)||1)*num(order.unit_price)*pct/100;const commissionStatus=text(b.commission_status||'DUE');
    await serviceWrite(`group_orders?id=eq.${encodeURIComponent(groupOrderId)}`,{method:'PATCH',body:JSON.stringify({platform_fee_pct:pct,platform_fee_amount:amount,commission_status:commissionStatus,updated_at:new Date().toISOString()})});
    const existing=(await serviceSelect<any[]>(`revenue_ledger?reference_type=eq.GROUP_ORDER&reference_id=eq.${encodeURIComponent(groupOrderId)}&source_type=eq.GROUP_ORDER_FEE&select=id&limit=1`).catch(()=>[]))[0];
    const ledgerStatus=commissionStatus==='PAID'?'PAID':commissionStatus==='WAIVED'?'WAIVED':commissionStatus==='INVOICED'?'INVOICED':'PENDING';
    const ledgerPayload={user_id:order.created_by,source_type:'GROUP_ORDER_FEE',offer_code:'GROUP_ORDER_TRANSACTION_FEE',reference_type:'GROUP_ORDER',reference_id:groupOrderId,description:`Group Order fee – ${order.title||groupOrderId}`,amount,currency:order.currency||'EUR',status:ledgerStatus,updated_at:new Date().toISOString(),...(ledgerStatus==='PAID'?{paid_at:new Date().toISOString()}:{})};
    if(existing)await serviceWrite(`revenue_ledger?id=eq.${existing.id}`,{method:'PATCH',body:JSON.stringify(ledgerPayload)});else if(amount>0)await serviceWrite('revenue_ledger',{method:'POST',body:JSON.stringify(ledgerPayload)});

    // BulkPact charges the buyer side the same fixed 1.5% on each active commitment.
    const commitments=await serviceSelect<any[]>(`group_order_commitments?group_order_id=eq.${encodeURIComponent(groupOrderId)}&status=neq.CANCELLED&select=id,buyer_id,quantity&limit=1000`).catch(()=>[]);
    const buyerFeeStatus=commissionStatus==='PAID'?'PAID':commissionStatus==='WAIVED'?'WAIVED':commissionStatus==='INVOICED'?'INVOICED':commissionStatus==='DUE'?'DUE':'NOT_DUE';
    for(const commitment of commitments){
      const buyerAmount=num(commitment.quantity)*Math.max(0.000001,num(order.price_units_per_order_unit)||1)*num(order.unit_price)*0.015;
      await serviceWrite(`group_order_commitments?id=eq.${encodeURIComponent(commitment.id)}`,{method:'PATCH',body:JSON.stringify({buyer_fee_pct:1.5,buyer_fee_amount:buyerAmount,buyer_fee_status:buyerFeeStatus,updated_at:new Date().toISOString()})});
      const buyerExisting=(await serviceSelect<any[]>(`revenue_ledger?reference_type=eq.GROUP_ORDER_COMMITMENT&reference_id=eq.${encodeURIComponent(commitment.id)}&source_type=eq.BUYER_GROUP_ORDER_FEE&select=id&limit=1`).catch(()=>[]))[0];
      const buyerLedgerStatus=buyerFeeStatus==='PAID'?'PAID':buyerFeeStatus==='WAIVED'?'WAIVED':buyerFeeStatus==='INVOICED'?'INVOICED':buyerFeeStatus==='DUE'?'PENDING':'PENDING';
      const buyerPayload={user_id:commitment.buyer_id,source_type:'BUYER_GROUP_ORDER_FEE',offer_code:'SUCCESS_FEE',reference_type:'GROUP_ORDER_COMMITMENT',reference_id:commitment.id,description:`Buyer fee – ${order.title||groupOrderId}`,amount:buyerAmount,currency:order.currency||'EUR',status:buyerLedgerStatus,updated_at:new Date().toISOString(),...(buyerLedgerStatus==='PAID'?{paid_at:new Date().toISOString()}:{})};
      if(buyerExisting)await serviceWrite(`revenue_ledger?id=eq.${buyerExisting.id}`,{method:'PATCH',body:JSON.stringify(buyerPayload)});else if(buyerAmount>0&&buyerFeeStatus!=='NOT_DUE')await serviceWrite('revenue_ledger',{method:'POST',body:JSON.stringify(buyerPayload)});
    }
    return NextResponse.json({success:true,platform_fee_pct:pct,platform_fee_amount:amount,buyer_fee_pct:1.5,buyer_fee_commitments:commitments.length});
  }
  return NextResponse.json({error:'Hiányzó cél.'},{status:400});
}
