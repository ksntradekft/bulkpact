'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Send, Users } from 'lucide-react';
import type { Locale } from '@/lib/i18n-shared';

type Role='BUYER'|'MANUFACTURER';
type Thread={
  key:string;
  id:string;
  title:string;
  subtitle:string;
  counterparty_id:string;
  counterparty_name:string;
};

export default function MessagesHub({role,locale='hu'}:{role:Role;locale?:Locale}){
  const en=locale==='en';
  const t=(hu:string,eng:string)=>en?eng:hu;
  const[threads,setThreads]=useState<Thread[]>([]);
  const[selected,setSelected]=useState<Thread|null>(null);
  const[messages,setMessages]=useState<any[]>([]);
  const[body,setBody]=useState('');
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState('');

  const loadThreads=useCallback(async()=>{
    setBusy(true);setMsg('');
    try{
      if(role==='BUYER'){
        const r=await fetch(`/api/group-orders?locale=${locale}`,{cache:'no-store'});
        const d=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(d.error||t('A beszélgetések betöltése sikertelen.','Could not load conversations.'));
        const list:Thread[]=(d.group_orders||[])
          .filter((o:any)=>o.my_commitment&&o.my_commitment.status!=='CANCELLED'&&o.created_by)
          .map((o:any)=>({
            key:`${o.id}:${o.created_by}`,
            id:o.id,
            title:o.title||o.product_name||t('Group Order','Group Order'),
            subtitle:`${o.product_name||''} · ${o.my_commitment?.quantity||0} ${o.unit||''}`,
            counterparty_id:o.created_by,
            counterparty_name:o.supplier_display_name||t('Beszállító','Supplier'),
          }));
        setThreads(list);
      }else{
        const r=await fetch(`/api/supplier/group-orders?locale=${locale}`,{cache:'no-store'});
        const d=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(d.error||t('A beszélgetések betöltése sikertelen.','Could not load conversations.'));
        const list:Thread[]=[];
        for(const o of d.group_orders||[]){
          for(const c of o.commitments||[]){
            if(c.status==='CANCELLED'||!c.buyer_id)continue;
            list.push({
              key:`${o.id}:${c.buyer_id}`,
              id:o.id,
              title:o.title||o.product_name||'Group Order',
              subtitle:`${c.profiles?.company_name||c.profiles?.email||t('Vevő','Buyer')} · ${c.quantity||0} ${o.unit||''}`,
              counterparty_id:c.buyer_id,
              counterparty_name:c.profiles?.company_name||c.profiles?.email||t('Vevő','Buyer'),
            });
          }
        }
        setThreads(list);
      }
    }catch(e){setMsg(e instanceof Error?e.message:t('Betöltési hiba.','Load failed.'))}
    finally{setBusy(false)}
  },[role,locale]);

  useEffect(()=>{void loadThreads()},[loadThreads]);

  async function loadMessages(thread:Thread){
    setSelected(thread);setBusy(true);setMsg('');
    const r=await fetch(`/api/messages?thread_type=GROUP_ORDER&thread_id=${encodeURIComponent(thread.id)}&counterparty_id=${encodeURIComponent(thread.counterparty_id)}`,{cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(r.ok)setMessages(d.messages||[]);else setMsg(d.error||t('Az üzenetek betöltése sikertelen.','Could not load messages.'));
    setBusy(false);
  }

  async function send(){
    if(!selected||!body.trim())return;
    setBusy(true);setMsg('');
    const r=await fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({thread_type:'GROUP_ORDER',thread_id:selected.id,recipient_id:selected.counterparty_id,body})});
    const d=await r.json().catch(()=>({}));
    if(r.ok){setBody('');await loadMessages(selected)}else setMsg(d.error||t('Az üzenet küldése sikertelen.','Could not send message.'));
    setBusy(false);
  }

  return <div className="platform-stack">
    <section className="manufacturer-panel">
      <div className="manufacturer-toolbar"><div><p className="eyebrow">GROUP ORDER MESSAGES</p><h2>{t('Beszélgetések','Conversations')}</h2><small>{t('A Group Order résztvevője és a beszállító közötti privát üzenetváltás.','Private messages between a Group Order participant and the supplier.')}</small></div><button className="icon-button" onClick={()=>void loadThreads()} aria-label={t('Frissítés','Refresh')}><RefreshCw size={17}/></button></div>
      {msg&&<div className="run-report">{msg}</div>}
    </section>
    <div className="message-layout">
      <aside>{threads.map(thread=><button className={selected?.key===thread.key?'selected':''} key={thread.key} onClick={()=>void loadMessages(thread)}><MessageSquare size={16}/><span><strong>{thread.counterparty_name}</strong><small>{thread.title} · {thread.subtitle}</small></span></button>)}{!threads.length&&!busy&&<div className="empty-state"><Users size={18}/>{role==='BUYER'?t('Még nincs olyan foglalásod, amelyhez beszélgetés tartozik.','You do not have a committed Group Order conversation yet.'):t('Még nincs vevői commitment az ajánlataidhoz.','No buyer commitments on your offers yet.')}</div>}</aside>
      <section>{selected?<><header><strong>{selected.counterparty_name} · {selected.title}</strong></header><div className="message-list">{messages.map(m=><article key={m.id}><strong>{m.profiles?.company_name||m.profiles?.full_name||t('Felhasználó','User')}</strong><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString(en?'en-GB':'hu-HU')}</small></article>)}{!messages.length&&!busy&&<div className="empty-state">{t('Még nincs üzenet.','No messages yet.')}</div>}</div><div className="message-compose"><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder={t('Üzenet...','Message...')}/><button className="button button-small" disabled={busy||!body.trim()} onClick={()=>void send()}><Send size={16}/> {t('Küldés','Send')}</button></div></>:<div className="empty-state">{t('Válassz egy Group Order beszélgetést.','Select a Group Order conversation.')}</div>}</section>
    </div>
  </div>
}
