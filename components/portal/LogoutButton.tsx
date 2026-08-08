'use client';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n-shared';
export default function LogoutButton({locale='hu'}:{locale?:Locale}){const[busy,setBusy]=useState(false);const en=locale==='en';return <button className="portal-logout" disabled={busy} onClick={async()=>{setBusy(true);await fetch('/api/auth/logout',{method:'POST'});window.location.href='/';}}><LogOut size={17}/>{busy?(en?'Logging out...':'Kilépés...'):(en?'Log out':'Kijelentkezés')}</button>}
