'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Menu,X} from 'lucide-react';
import type {Locale} from '@/lib/i18n-shared';

type Props={
 locale:Locale;
 groupOrdersEnabled:boolean;
 registrationsEnabled:boolean;
 dashboardHref:string|null;
};
export default function MobileSiteMenu({locale,groupOrdersEnabled,registrationsEnabled,dashboardHref}:Props){
 const[open,setOpen]=useState(false);const en=locale==='en';
 return <div className="site-mobile-menu">
   <button type="button" className="site-mobile-menu-button" aria-label={en?'Open menu':'Menü megnyitása'} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
     {open?<X size={23}/>:<Menu size={23}/>}
   </button>
   {open&&<div className="site-mobile-menu-panel">
     <nav aria-label={en?'Mobile navigation':'Mobil navigáció'}>
       {groupOrdersEnabled&&<Link href="/group-orders" onClick={()=>setOpen(false)}>{en?'Group Orders':'Közös rendelések'}</Link>}
       <Link href="/how-it-works" onClick={()=>setOpen(false)}>{en?'How it works':'Hogyan működik?'}</Link>
       <Link href="/pricing" onClick={()=>setOpen(false)}>{en?'Pricing':'Árazás'}</Link>
       {registrationsEnabled&&<Link href="/supplier/register" onClick={()=>setOpen(false)}>{en?'For suppliers':'Beszállítóknak'}</Link>}
       {registrationsEnabled&&<Link href="/buyer/register" onClick={()=>setOpen(false)}>{en?'For buyers':'Vevőknek'}</Link>}
       {dashboardHref?<Link href={dashboardHref} className="mobile-menu-primary" onClick={()=>setOpen(false)}>{en?'Dashboard':'Saját felület'}</Link>:<Link href="/login" onClick={()=>setOpen(false)}>{en?'Log in':'Belépés'}</Link>}
       <Link href="/group-orders" className="mobile-menu-primary" onClick={()=>setOpen(false)}>{en?'Browse deals':'Ajánlatok'}</Link>
     </nav>
   </div>}
 </div>
}