'use client';
import {useState} from 'react';
import {ArrowLeftRight,LoaderCircle} from 'lucide-react';
import type {Locale} from '@/lib/i18n-shared';

export default function RoleSwitchButton({role,locale,compact=false}:{role:'BUYER'|'MANUFACTURER';locale:Locale;compact?:boolean}){
 const[busy,setBusy]=useState(false);const en=locale==='en';const target=role==='BUYER'?'MANUFACTURER':'BUYER';
 const label=target==='MANUFACTURER'?(en?'Switch to selling':'Váltás eladói módra'):(en?'Switch to buying':'Váltás vevői módra');
 async function go(){if(busy)return;setBusy(true);try{const r=await fetch('/api/account/switch-role',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:target})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Role switch failed');window.location.href=d.redirectTo||'/'}catch(e:any){alert(e?.message||'A váltás sikertelen.');setBusy(false)}}
 return <button type="button" className={compact?'role-switch compact':'role-switch'} onClick={go} disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:<ArrowLeftRight size={16}/>}<span>{label}</span></button>
}
