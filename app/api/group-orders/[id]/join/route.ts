import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth-server';
import { serviceSelect,serviceWrite } from '@/lib/supabase-rest';
import { notify } from '@/lib/notifications';
import {audit,trackEvent} from '@/lib/audit';
import { getPlatformSettings } from '@/lib/platform-settings';

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){const ps=await getPlatformSettings();if(!ps.group_orders_enabled)return NextResponse.json({error:'Group Orders are currently disabled.'},{status:503});
  const auth=await requireApiRole(request,'BUYER');if(!auth.session)return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;const body=await request.json().catch(()=>({}));const quantity=Number(body.quantity);
  if(!id)return NextResponse.json({error:'Hiányzó kampányazonosító.'},{status:400});
  if(!Number.isFinite(quantity)||quantity<0)return NextResponse.json({error:'Érvénytelen mennyiség.'},{status:400});
  try{
    const before=(await serviceSelect<any[]>(`group_orders?id=eq.${encodeURIComponent(id)}&select=id,title,created_by,target_quantity,status&limit=1`).catch(()=>[]))[0];
    const result:any=await serviceWrite<any>('rpc/reserve_group_order',{method:'POST',body:JSON.stringify({p_group_order_id:id,p_buyer_id:auth.session.user.id,p_quantity:quantity,p_note:String(body.note||'').trim()})});
    const commitment=(await serviceSelect<any[]>(`group_order_commitments?group_order_id=eq.${encodeURIComponent(id)}&buyer_id=eq.${auth.session.user.id}&select=id,buyer_id,quantity,status&limit=1`).catch(()=>[]))[0];
    if(commitment&&quantity>0){await serviceWrite(`group_order_commitments?id=eq.${commitment.id}`,{method:'PATCH',body:JSON.stringify({commitment_type:'COMMITMENT'})}).catch(()=>null)}
    if(before?.created_by&&before.created_by!==auth.session.user.id)await notify(before.created_by,quantity>0?'Új közös beszerzési foglalás':'Foglalás visszavonva',`${before.title}: ${quantity>0?`${quantity} egység foglalás érkezett.`:'egy vevő visszavonta a foglalását.'}`,'/supplier/group-orders','GROUP_ORDER');
    if(result?.status==='FILLED')await notify(auth.session.user.id,'A közös rendelés elérte a MOQ-t',`${before?.title||'A kampány'} elérte a célmennyiséget.`,'/buyer/group-orders','GROUP_ORDER');
    await trackEvent(auth.session.user.id,'BUYER',quantity>0?'GROUP_ORDER_COMMITMENT':'GROUP_ORDER_WITHDRAWAL','GROUP_ORDER',id,{quantity});await audit(auth.session.user.id,quantity>0?'GROUP_ORDER_COMMITMENT':'GROUP_ORDER_WITHDRAWAL','GROUP_ORDER',id,{quantity});
    return NextResponse.json({result});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'A foglalás mentése sikertelen.'},{status:500})}
}
