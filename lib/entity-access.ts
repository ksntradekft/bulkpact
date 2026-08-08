import type { AppSession } from './auth-types';
import { serviceSelect } from './supabase-rest';

export async function canAccessEntity(session:AppSession,entityType:string,entityId:string):Promise<boolean>{
  if(session.profile.role==='ADMIN')return true;
  const uid=session.user.id;
  if(entityType==='MANUFACTURER')return session.profile.role==='MANUFACTURER'&&entityId===uid;
  if(entityType==='GROUP_ORDER'){
    if(session.profile.role==='MANUFACTURER'){
      const rows=await serviceSelect<any[]>(`group_orders?id=eq.${encodeURIComponent(entityId)}&created_by=eq.${encodeURIComponent(uid)}&select=id&limit=1`).catch(()=>[]);return !!rows.length;
    }
    if(session.profile.role==='BUYER'){
      const rows=await serviceSelect<any[]>(`group_order_commitments?group_order_id=eq.${encodeURIComponent(entityId)}&buyer_id=eq.${encodeURIComponent(uid)}&status=neq.CANCELLED&select=id&limit=1`).catch(()=>[]);return !!rows.length;
    }
  }
  return false;
}
