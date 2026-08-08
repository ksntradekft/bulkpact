import { serviceSelect,serviceWrite } from './supabase-rest';
export type RateLimitResult={allowed:boolean;remaining:number;resetAt:string};
export async function rateLimit(bucketKey:string,limit:number,windowSeconds:number):Promise<RateLimitResult>{
  const now=Date.now();
  const rows=await serviceSelect<any[]>(`api_rate_limits?bucket_key=eq.${encodeURIComponent(bucketKey)}&select=*&limit=1`).catch(()=>[]);
  const current=rows[0];
  const resetCurrent=current?.reset_at?new Date(current.reset_at).getTime():0;
  if(!current||!Number.isFinite(resetCurrent)||resetCurrent<=now){
    const resetAt=new Date(now+windowSeconds*1000).toISOString();
    await serviceWrite('api_rate_limits?on_conflict=bucket_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({bucket_key:bucketKey,count:1,reset_at:resetAt,updated_at:new Date().toISOString()})}).catch(()=>null);
    return{allowed:true,remaining:Math.max(0,limit-1),resetAt};
  }
  const count=Math.max(0,Number(current.count)||0);
  if(count>=limit)return{allowed:false,remaining:0,resetAt:current.reset_at};
  await serviceWrite(`api_rate_limits?bucket_key=eq.${encodeURIComponent(bucketKey)}`,{method:'PATCH',body:JSON.stringify({count:count+1,updated_at:new Date().toISOString()})}).catch(()=>null);
  return{allowed:true,remaining:Math.max(0,limit-count-1),resetAt:current.reset_at};
}
