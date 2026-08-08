import {NextRequest,NextResponse} from 'next/server';
import {requireApiRole} from '@/lib/auth-server';
import {serviceSelect} from '@/lib/supabase-rest';
const daysAgo=(d:number)=>new Date(Date.now()-d*864e5).toISOString();
export async function GET(request:NextRequest){
  const a=await requireApiRole(request,'ADMIN');if(!a.session)return NextResponse.json({error:a.error},{status:a.status});
  const since=daysAgo(30);
  const[profiles,groupOrders,commitments,events]=await Promise.all([
    serviceSelect<any[]>(`profiles?select=id,role,created_at&created_at=gte.${encodeURIComponent(since)}`).catch(()=>[]),
    serviceSelect<any[]>('group_orders?select=id,title,category,status,target_quantity,unit_price,currency,created_at').catch(()=>[]),
    serviceSelect<any[]>(`group_order_commitments?select=id,group_order_id,quantity,status,created_at&created_at=gte.${encodeURIComponent(since)}`).catch(()=>[]),
    serviceSelect<any[]>(`platform_events?select=event_type,created_at&created_at=gte.${encodeURIComponent(since)}`).catch(()=>[]),
  ]);
  const activeCommitments=commitments.filter((x:any)=>x.status!=='CANCELLED');
  const committedByOrder=new Map<string,number>();for(const c of activeCommitments)committedByOrder.set(c.group_order_id,(committedByOrder.get(c.group_order_id)||0)+(Number(c.quantity)||0));
  const active=groupOrders.filter((g:any)=>!['COMPLETED','CANCELLED'].includes(g.status));
  const reached=groupOrders.filter((g:any)=>['FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED','DELIVERED','COMPLETED'].includes(g.status));
  const completed=groupOrders.filter((g:any)=>g.status==='COMPLETED');
  const eurCommittedGmv=groupOrders.filter((g:any)=>g.currency==='EUR').reduce((s:number,g:any)=>s+(committedByOrder.get(g.id)||0)*(Number(g.unit_price)||0),0);
  const categories=Object.entries(groupOrders.reduce((acc:any,x:any)=>(acc[x.category||'Other']=(acc[x.category||'Other']||0)+1,acc),{})).map(([name,value])=>({name,value})).sort((x:any,y:any)=>Number(y.value)-Number(x.value));
  const eventCounts=Object.entries(events.reduce((acc:any,x:any)=>(acc[x.event_type]=(acc[x.event_type]||0)+1,acc),{})).map(([name,value])=>({name,value})).sort((x:any,y:any)=>Number(y.value)-Number(x.value));
  const withCommitments=groupOrders.filter((g:any)=>(committedByOrder.get(g.id)||0)>0).length;
  const successRate=groupOrders.length?Math.round(reached.length/groupOrders.length*1000)/10:0;
  return NextResponse.json({window_days:30,kpis:{new_users:profiles.length,new_buyers:profiles.filter((x:any)=>x.role==='BUYER').length,new_suppliers:profiles.filter((x:any)=>x.role==='MANUFACTURER').length,active_group_orders:active.length,completed_group_orders:completed.length,group_commitments:activeCommitments.length,eur_committed_gmv:Math.round(eurCommittedGmv*100)/100,moq_success_pct:successRate},categories,events:eventCounts,funnel:[{name:'Group Orders',value:groupOrders.length},{name:'With commitments',value:withCommitments},{name:'MOQ reached',value:reached.length},{name:'Completed',value:completed.length}]});
}
