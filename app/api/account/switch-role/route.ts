import {NextRequest,NextResponse} from 'next/server';
import {getRequestSession} from '@/lib/auth-server';
import {serviceSelect,serviceWrite} from '@/lib/supabase-rest';

type SwitchableRole='BUYER'|'MANUFACTURER';

export async function POST(request:NextRequest){
  const session=await getRequestSession(request);
  if(!session)return NextResponse.json({error:'Nincs bejelentkezve.'},{status:401});
  if(session.profile.status==='SUSPENDED')return NextResponse.json({error:'A fiók fel van függesztve.'},{status:403});
  if(session.profile.role==='ADMIN')return NextResponse.json({error:'Admin fiók nem válthat vevői vagy eladói módra.'},{status:403});
  const body=await request.json().catch(()=>({}));
  const role=String(body.role||'').toUpperCase() as SwitchableRole;
  if(!['BUYER','MANUFACTURER'].includes(role))return NextResponse.json({error:'Érvénytelen fiókmód.'},{status:400});

  if(role==='MANUFACTURER'){
    const existing=await serviceSelect<any[]>(`manufacturer_profiles?id=eq.${encodeURIComponent(session.user.id)}&select=id&limit=1`).catch(()=>[]);
    if(!existing.length){
      await serviceWrite<any[]>('manufacturer_profiles',{
        method:'POST',
        headers:{Prefer:'return=representation,resolution=merge-duplicates'},
        body:JSON.stringify({id:session.user.id,website:session.profile.website||null,approval_status:'PENDING'})
      });
    }
  }
  await serviceWrite<any[]>(`profiles?id=eq.${encodeURIComponent(session.user.id)}`,{
    method:'PATCH',
    body:JSON.stringify({role,updated_at:new Date().toISOString()})
  });
  return NextResponse.json({ok:true,role,redirectTo:role==='MANUFACTURER'?'/supplier':'/buyer'});
}
