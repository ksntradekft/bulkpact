import {NextRequest,NextResponse} from 'next/server';
import {requireApiRole} from '@/lib/auth-server';
import {notify} from '@/lib/notifications';
import {serviceSelect,serviceWrite} from '@/lib/supabase-rest';
import {audit} from '@/lib/audit';

function cronOk(r:NextRequest){const secret=process.env.CRON_SECRET;const supplied=r.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||r.headers.get('x-cron-secret');return Boolean(secret&&supplied===secret)}
async function allowed(r:NextRequest){if(cronOk(r))return{ok:true,actor:null as string|null};const a=await requireApiRole(r,'ADMIN');return a.session?{ok:true,actor:a.session.user.id}:{ok:false,actor:null}}
async function already(rule:string,entityId:string,recipient:string){const rows=await serviceSelect<any[]>(`followup_jobs?rule_key=eq.${encodeURIComponent(rule)}&entity_id=eq.${encodeURIComponent(entityId)}&recipient_id=eq.${encodeURIComponent(recipient)}&status=in.(PENDING,SENT)&select=id&limit=1`).catch(()=>[]);return rows.length>0}
async function ensureTask(title:string,entityType:string,entityId:string,priority='NORMAL',description=''){const existing=await serviceSelect<any[]>(`admin_tasks?entity_type=eq.${encodeURIComponent(entityType)}&entity_id=eq.${encodeURIComponent(entityId)}&status=in.(OPEN,IN_PROGRESS)&select=id&limit=1`).catch(()=>[]);if(existing.length)return false;await serviceWrite('admin_tasks',{method:'POST',body:JSON.stringify({title,description,entity_type:entityType,entity_id:entityId,priority,status:'OPEN',due_at:new Date().toISOString()})});return true}
async function queue(rule:string,recipient:string,entityId:string,title:string,body:string,href:string){if(await already(rule,entityId,recipient))return false;const rows=await serviceWrite<any[]>('followup_jobs',{method:'POST',body:JSON.stringify({rule_key:rule,recipient_id:recipient,entity_type:'GROUP_ORDER',entity_id:entityId,due_at:new Date().toISOString(),channel:'BOTH',status:'PENDING',payload:{title,body,href}})});try{await notify(recipient,title,body,href,'FOLLOW_UP');await serviceWrite(`followup_jobs?id=eq.${rows?.[0]?.id}`,{method:'PATCH',body:JSON.stringify({status:'SENT',attempts:1,sent_at:new Date().toISOString(),updated_at:new Date().toISOString()})});return true}catch(e){await serviceWrite(`followup_jobs?id=eq.${rows?.[0]?.id}`,{method:'PATCH',body:JSON.stringify({status:'FAILED',attempts:1,last_error:e instanceof Error?e.message:'Unknown error',updated_at:new Date().toISOString()})}).catch(()=>null);return false}}

export async function GET(request:NextRequest){
  const auth=await allowed(request);if(!auth.ok)return NextResponse.json({error:'Unauthorized'},{status:401});
  let sent=0;const now=Date.now();
  const open=await serviceSelect<any[]>(`group_orders?status=eq.OPEN&deadline=not.is.null&select=id,title,deadline,target_quantity,created_by`).catch(()=>[]);
  for(const go of open){
    const deadline=new Date(go.deadline).getTime();
    if(!Number.isFinite(deadline)||deadline<=now)continue;
    const cs=await serviceSelect<any[]>(`group_order_commitments?group_order_id=eq.${encodeURIComponent(go.id)}&status=neq.CANCELLED&select=buyer_id`).catch(()=>[]);
    const buyers=[...new Set(cs.map((x:any)=>String(x.buyer_id||'')).filter(Boolean))];
    if(deadline-now<=2*864e5){for(const buyer of buyers)sent+=await queue('GROUP_ORDER_DEADLINE_48H',buyer,go.id,'Group Order határidő közeleg',`${go.title} jelentkezési határideje 48 órán belül lejár.`,'/buyer/group-orders')?1:0}
    if(deadline-now<=24*36e5&&go.created_by)sent+=await queue('SUPPLIER_GROUP_ORDER_DEADLINE_24H',String(go.created_by),go.id,'Group Order 24 órán belül zár',`${go.title} kampány hamarosan lezárul. Ellenőrizd a commitmenteket és az MOQ állapotát.`,'/supplier/group-orders')?1:0;
  }
  const deposit=await serviceSelect<any[]>('group_order_commitments?deposit_status=eq.DUE&select=id,buyer_id,group_order_id,deposit_due_at').catch(()=>[]);
  for(const c of deposit){const due=c.deposit_due_at?new Date(c.deposit_due_at).getTime():0;if(c.buyer_id&&(!due||due-now<=24*36e5))sent+=await queue('GROUP_ORDER_DEPOSIT_DUE',String(c.buyer_id),String(c.group_order_id),'Group Order előleg esedékes','A foglalásodhoz kapcsolódó előleg esedékes.','/buyer/group-orders')?1:0}
  const pendingVerifications=await serviceSelect<any[]>(`manufacturer_verifications?status=in.(PENDING,IN_REVIEW)&submitted_at=lte.${encodeURIComponent(new Date(now-2*864e5).toISOString())}&select=id,manufacturer_id`).catch(()=>[]);
  for(const v of pendingVerifications)await ensureTask('Beszállítói verification ellenőrzés','MANUFACTURER',v.manufacturer_id,'HIGH','A verification kérelem legalább 2 napja vár.');
  const filled=await serviceSelect<any[]>('group_orders?status=eq.FILLED&select=id,title').catch(()=>[]);
  for(const g of filled)await ensureTask(`Group Order lock / előleg: ${g.title}`,'GROUP_ORDER',g.id,'HIGH','Az MOQ teljesült. Következő lépés: deposit/lock és beszállítói visszaigazolás.');
  await audit(auth.actor,'FOLLOWUP_AUTOMATION_RUN','SYSTEM','followups',{sent,open_group_orders:open.length,deposit_due:deposit.length,pending_verifications:pendingVerifications.length,filled_group_orders:filled.length});
  return NextResponse.json({success:true,sent,checked:{open_group_orders:open.length,deposit_due:deposit.length,pending_verifications:pendingVerifications.length,filled_group_orders:filled.length}});
}
