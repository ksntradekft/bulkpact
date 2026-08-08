import { NextRequest,NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/auth-server';
import { canAccessEntity } from '@/lib/entity-access';
import { notify } from '@/lib/notifications';
import { serviceSelect,serviceWrite } from '@/lib/supabase-rest';

const allowed=['GROUP_ORDER'];

async function validGroupOrderCounterparty(session:any,threadId:string,recipientId:string){
  const order=(await serviceSelect<any[]>(`group_orders?id=eq.${encodeURIComponent(threadId)}&select=id,created_by&limit=1`).catch(()=>[]))[0];
  if(!order)return false;
  if(session.profile.role==='BUYER')return order.created_by===recipientId;
  if(session.profile.role==='MANUFACTURER'){
    if(order.created_by!==session.user.id)return false;
    const c=await serviceSelect<any[]>(`group_order_commitments?group_order_id=eq.${encodeURIComponent(threadId)}&buyer_id=eq.${encodeURIComponent(recipientId)}&status=neq.CANCELLED&select=id&limit=1`).catch(()=>[]);
    return !!c.length;
  }
  return session.profile.role==='ADMIN';
}

export async function GET(request:NextRequest){
  const session=await getRequestSession(request);
  if(!session)return NextResponse.json({error:'Nincs bejelentkezve.'},{status:401});
  const thread_type=String(request.nextUrl.searchParams.get('thread_type')||'').toUpperCase();
  const thread_id=String(request.nextUrl.searchParams.get('thread_id')||'');
  const counterparty_id=String(request.nextUrl.searchParams.get('counterparty_id')||'');
  if(!allowed.includes(thread_type)||!thread_id)return NextResponse.json({error:'Hibás beszélgetés.'},{status:400});
  if(!await canAccessEntity(session,thread_type,thread_id))return NextResponse.json({error:'Nincs jogosultság.'},{status:403});
  if(session.profile.role!=='ADMIN'&&(!counterparty_id||!await validGroupOrderCounterparty(session,thread_id,counterparty_id)))return NextResponse.json({error:'Érvénytelen beszélgetőpartner.'},{status:403});
  let rows=await serviceSelect<any[]>(`messages?thread_type=eq.${thread_type}&thread_id=eq.${thread_id}&select=*,profiles!messages_sender_id_fkey(full_name,company_name,role)&order=created_at.asc`).catch(()=>[]);
  if(session.profile.role!=='ADMIN'){
    const uid=session.user.id;
    rows=rows.filter(m=>(m.sender_id===uid&&m.recipient_id===counterparty_id)||(m.sender_id===counterparty_id&&m.recipient_id===uid));
  }
  return NextResponse.json({messages:rows});
}

export async function POST(request:NextRequest){
  const session=await getRequestSession(request);
  if(!session)return NextResponse.json({error:'Nincs bejelentkezve.'},{status:401});
  const b=await request.json().catch(()=>({}));
  const thread_type=String(b.thread_type||'').toUpperCase(),thread_id=String(b.thread_id||''),body=String(b.body||'').trim(),recipient_id=String(b.recipient_id||'');
  if(!allowed.includes(thread_type)||!thread_id||!body||!recipient_id)return NextResponse.json({error:'Hiányos üzenet.'},{status:400});
  if(!await canAccessEntity(session,thread_type,thread_id))return NextResponse.json({error:'Nincs jogosultság.'},{status:403});
  if(!await validGroupOrderCounterparty(session,thread_id,recipient_id))return NextResponse.json({error:'Érvénytelen címzett.'},{status:403});
  const rows=await serviceWrite<any[]>('messages',{method:'POST',body:JSON.stringify({thread_type,thread_id,sender_id:session.user.id,recipient_id,body,attachment_document_id:b.attachment_document_id||null})});
  const target=session.profile.role==='BUYER'?'/supplier/messages':'/buyer/messages';
  await notify(recipient_id,'Új Group Order üzenet',body.slice(0,120),target,'MESSAGE');
  return NextResponse.json({message:rows?.[0]||null});
}
