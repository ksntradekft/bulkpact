import Link from 'next/link';
import type { ReactNode } from 'react';
import { Activity, BadgeCheck, Calculator, ClipboardList, CreditCard, Gauge, LayoutDashboard, LifeBuoy, MessageSquare, Settings, ShoppingCart, Users, Building2 } from 'lucide-react';
import type { AppSession, UserRole } from '@/lib/auth-types';
import { getLocale } from '@/lib/i18n-server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from '@/components/platform/NotificationBell';
import { getPlatformSettings } from '@/lib/platform-settings';
import LogoutButton from './LogoutButton';

type NavItem={href:string;hu:string;en:string;icon:ReactNode};
const nav:Record<UserRole,NavItem[]>={
  ADMIN:[
    {href:'/admin',hu:'Áttekintés',en:'Overview',icon:<LayoutDashboard size={18}/>},
    {href:'/admin/group-orders',hu:'Group Orderek',en:'Group Orders',icon:<ShoppingCart size={18}/>},
    {href:'/admin/suppliers',hu:'Beszállítók',en:'Suppliers',icon:<Building2 size={18}/>},
    {href:'/admin/verifications',hu:'Ellenőrzések',en:'Verification',icon:<BadgeCheck size={18}/>},
    {href:'/admin/users',hu:'Felhasználók',en:'Users',icon:<Users size={18}/>},
    {href:'/admin/commercial',hu:'Monetizáció',en:'Commercial',icon:<Gauge size={18}/>},
    {href:'/admin/operations',hu:'Operáció',en:'Operations',icon:<ClipboardList size={18}/>},
    {href:'/admin/analytics',hu:'Analytics',en:'Analytics',icon:<Activity size={18}/>},
    {href:'/admin/support',hu:'Support & Trust',en:'Support & Trust',icon:<LifeBuoy size={18}/>},
    {href:'/admin/settings',hu:'Platform beállítások',en:'Platform settings',icon:<Settings size={18}/>},
  ],
  MANUFACTURER:[
    {href:'/supplier',hu:'Áttekintés',en:'Overview',icon:<Gauge size={18}/>},
    {href:'/supplier/group-orders',hu:'Group Order ajánlatok',en:'Group Order offers',icon:<ShoppingCart size={18}/>},
    {href:'/supplier/verification',hu:'Ellenőrzés',en:'Verification',icon:<BadgeCheck size={18}/>},
    {href:'/supplier/profile',hu:'Céges profil',en:'Company profile',icon:<Building2 size={18}/>},
    {href:'/supplier/messages',hu:'Üzenetek',en:'Messages',icon:<MessageSquare size={18}/>},
    {href:'/supplier/billing',hu:'Csomag és számlázás',en:'Plan & billing',icon:<CreditCard size={18}/>},
    {href:'/supplier/support',hu:'Support',en:'Support',icon:<LifeBuoy size={18}/>},
  ],
  BUYER:[
    {href:'/buyer',hu:'Áttekintés',en:'Overview',icon:<Gauge size={18}/>},
    {href:'/buyer/group-orders',hu:'Közös beszerzés',en:'Group Orders',icon:<ShoppingCart size={18}/>},
    {href:'/buyer/landed-cost',hu:'Landed cost',en:'Landed cost',icon:<Calculator size={18}/>},
    {href:'/buyer/profile',hu:'Céges profil',en:'Company profile',icon:<Settings size={18}/>},
    {href:'/buyer/messages',hu:'Üzenetek',en:'Messages',icon:<MessageSquare size={18}/>},
    {href:'/buyer/billing',hu:'Csomag és számlázás',en:'Plan & billing',icon:<CreditCard size={18}/>},
    {href:'/buyer/support',hu:'Support',en:'Support',icon:<LifeBuoy size={18}/>},
  ],
};
function topAction(role:UserRole,en:boolean){if(role==='ADMIN')return{href:'/admin/group-orders',label:en?'New Group Order':'Új Group Order'};if(role==='MANUFACTURER')return{href:'/supplier/group-orders',label:en?'Submit deal':'Ajánlat beküldése'};return{href:'/buyer/group-orders',label:en?'Browse deals':'Ajánlatok'}}
export default async function PortalShell({session,children}:{session:AppSession;children:ReactNode}){
  const[locale,settings]=await Promise.all([getLocale(),getPlatformSettings()]);const en=locale==='en';
  const items=nav[session.profile.role].filter(item=>(settings.group_orders_enabled||!item.href.includes('group-orders'))&&(settings.support_enabled||!item.href.includes('/support')));
  const action=topAction(session.profile.role,en);
  const roleLabel=session.profile.role==='ADMIN'?(en?'Administrator':'Admin'):session.profile.role==='MANUFACTURER'?(en?'Supplier':'Beszállító'):(en?'Buyer / business':'Vevő / vállalkozás');
  const portalTitle=session.profile.role==='ADMIN'?(en?'BulkPact Administration':'BulkPact Adminisztráció'):session.profile.role==='MANUFACTURER'?(en?'Supplier portal':'Beszállítói portál'):(en?'Buyer portal':'Vevői portál');
  return <div className="portal-layout"><aside className="portal-sidebar"><Link href="/" className="brand portal-brand bulkpact-brand"><span className="bulkpact-mark">BP</span><strong>BulkPact</strong></Link><div className="portal-account"><span>{roleLabel}</span><strong>{session.profile.company_name||session.profile.full_name}</strong><small>{session.profile.email}</small></div><nav>{items.map(item=><Link key={item.href} href={item.href}>{item.icon}{en?item.en:item.hu}</Link>)}</nav><div className="portal-sidebar-language"><LanguageSwitcher locale={locale} inverse/></div><LogoutButton locale={locale}/></aside><div className="portal-content"><header className="portal-topbar"><div><span>{portalTitle}</span><strong>{session.profile.full_name}</strong></div><div className="portal-topbar-actions"><NotificationBell locale={locale}/><LanguageSwitcher locale={locale} compact/><Link href={action.href} className="button button-small">{action.label}</Link></div></header>{children}</div></div>;
}
