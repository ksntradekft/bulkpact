'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Menu,X} from 'lucide-react';
import type {Locale} from '@/lib/i18n-shared';
import LogoutButton from './LogoutButton';
import RoleSwitchButton from './RoleSwitchButton';

type Item={href:string;hu:string;en:string};
export default function MobilePortalMenu({items,locale,roleLabel,company,email,role}:{items:Item[];locale:Locale;roleLabel:string;company:string;email:string;role:'ADMIN'|'BUYER'|'MANUFACTURER'}){
 const[open,setOpen]=useState(false);const en=locale==='en';
 return <div className="portal-mobile-nav">
  <div className="portal-mobile-bar"><Link href="/" className="brand bulkpact-brand"><span className="bulkpact-mark">BP</span><strong>BulkPact</strong></Link><button type="button" className="portal-menu-button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={en?'Open menu':'Menü megnyitása'}>{open?<X size={24}/>:<Menu size={24}/>}</button></div>
  {open&&<div className="portal-mobile-drawer"><div className="portal-mobile-account"><span>{roleLabel}</span><strong>{company}</strong><small>{email}</small></div><nav>{items.map(item=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)}>{en?item.en:item.hu}</Link>)}</nav>{role!=='ADMIN'&&<RoleSwitchButton role={role} locale={locale}/>}<LogoutButton locale={locale}/></div>}
 </div>
}