import { serviceWrite } from './supabase-rest';

export async function audit(actorId:string|null|undefined,action:string,entityType:string,entityId?:string|null,metadata:Record<string,unknown>={}){
  try{
    await serviceWrite('audit_log',{method:'POST',body:JSON.stringify({actor_id:actorId||null,action,entity_type:entityType,entity_id:entityId||null,metadata})});
  }catch{}
}

export async function trackEvent(userId:string|null|undefined,role:string|null|undefined,eventType:string,entityType?:string|null,entityId?:string|null,metadata:Record<string,unknown>={}){
  try{
    await serviceWrite('platform_events',{method:'POST',body:JSON.stringify({user_id:userId||null,role:role||null,event_type:eventType,entity_type:entityType||null,entity_id:entityId||null,metadata})});
  }catch{}
}
