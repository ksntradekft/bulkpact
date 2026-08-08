import { createHash } from 'crypto';
import { serviceSelect, serviceWrite } from './supabase-rest';
import type { GroupOrderView } from './group-orders';
import type { Locale } from './i18n-shared';

type TranslationRow={field_name:string;source_hash:string;translated_text:string;target_locale:string};
const hashText=(value:string)=>createHash('sha1').update(value).digest('hex');

async function deepSeekTranslate(fields:Record<string,string>,targetLocale:Locale,context:string):Promise<Record<string,string>|null>{
  const key=process.env.DEEPSEEK_API_KEY;if(!key||targetLocale!=='en')return null;
  const meaningful=Object.fromEntries(Object.entries(fields).filter(([,v])=>String(v||'').trim()));if(!Object.keys(meaningful).length)return{};
  const response=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||'deepseek-v4-flash',messages:[{role:'system',content:'You are the translation engine of BulkPact, a European B2B group-buying marketplace. Translate every supplied value into professional business English. Preserve brand names, product codes, numbers, currencies, URLs, Incoterms, units and legal/company names. Do not add facts, marketing claims or explanations. Return strict JSON with exactly the same keys as the input object and string values only.'},{role:'user',content:JSON.stringify({context,target_language:'English',fields:meaningful})}],response_format:{type:'json_object'},temperature:0,max_tokens:1400}),cache:'no-store'}).catch(()=>null);
  if(!response?.ok)return null;const data=await response.json().catch(()=>null);const content=data?.choices?.[0]?.message?.content;if(!content)return null;
  try{const parsed=JSON.parse(content),out:Record<string,string>={};for(const k of Object.keys(meaningful))out[k]=String(parsed?.[k]??meaningful[k]).trim();return out}catch{return null}
}

async function translateFields(entityId:string,fields:Record<string,string|null|undefined>,targetLocale:Locale):Promise<Record<string,string>>{
  const originals:Record<string,string>={};for(const[k,v]of Object.entries(fields))originals[k]=String(v??'');if(targetLocale!=='en')return originals;
  const names=Object.keys(originals);if(!names.length)return originals;
  const cached=await serviceSelect<TranslationRow[]>(`content_translations?entity_type=eq.GROUP_ORDER&entity_id=eq.${encodeURIComponent(entityId)}&target_locale=eq.en&field_name=in.(${names.map(encodeURIComponent).join(',')})&select=field_name,source_hash,translated_text,target_locale`).catch(()=>[]);
  const result={...originals},missing:Record<string,string>={};
  for(const[field,source]of Object.entries(originals)){if(!source.trim())continue;const h=hashText(source),hit=cached.find(row=>row.field_name===field&&row.source_hash===h);if(hit)result[field]=hit.translated_text;else missing[field]=source}
  if(!Object.keys(missing).length)return result;
  const translated=await deepSeekTranslate(missing,targetLocale,'Fixed-price Group Order campaign. Preserve commercial quantities, MOQ, brand names, currencies and units exactly.');if(!translated)return result;
  const now=new Date().toISOString();const rows=Object.entries(missing).map(([field,source])=>({entity_type:'GROUP_ORDER',entity_id:entityId,field_name:field,source_locale:'auto',target_locale:'en',source_hash:hashText(source),translated_text:String(translated[field]||source),provider:'DEEPSEEK',updated_at:now}));
  await serviceWrite('content_translations?on_conflict=entity_type,entity_id,field_name,target_locale',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)}).catch(()=>null);
  for(const row of rows)result[row.field_name]=row.translated_text;return result;
}

export async function translateGroupOrder(order:GroupOrderView,locale:Locale):Promise<GroupOrderView>{
  if(locale!=='en')return order;const x=await translateFields(order.id,{title:order.title,product_name:order.product_name,product_description:order.product_description,category:order.category,moq_label:order.moq_label,destination_country:order.destination_country},locale);
  return{...order,title:x.title||order.title,product_name:x.product_name||order.product_name,product_description:x.product_description||order.product_description,category:x.category||order.category,moq_label:x.moq_label||order.moq_label,destination_country:x.destination_country||order.destination_country};
}
export async function translateGroupOrders(orders:GroupOrderView[],locale:Locale):Promise<GroupOrderView[]>{return locale==='en'?Promise.all(orders.map(o=>translateGroupOrder(o,locale))):orders}
export async function primeGroupOrderEnglishTranslation(order:GroupOrderView|any){if(!order?.id)return;await translateFields(String(order.id),{title:order.title,product_name:order.product_name,product_description:order.product_description,category:order.category,moq_label:order.moq_label,destination_country:order.destination_country},'en').catch(()=>null)}
