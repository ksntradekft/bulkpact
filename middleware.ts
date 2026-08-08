import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, applyAuthCookies, clearAuthCookies } from './lib/auth-cookies';
import { authConfigured, supabasePublishableKey, supabaseUrl } from './lib/supabase-config';

function harden(response:NextResponse){
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');
  if(process.env.NODE_ENV==='production')response.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  return response;
}
async function tokenIsValid(token:string){if(!token)return false;const response=await fetch(`${supabaseUrl()}/auth/v1/user`,{headers:{apikey:supabasePublishableKey(),Authorization:`Bearer ${token}`},cache:'no-store'});return response.ok}
export async function middleware(request:NextRequest){
  if(!authConfigured())return harden(NextResponse.next());
  const access=request.cookies.get(ACCESS_COOKIE)?.value||'';
  if(await tokenIsValid(access))return harden(NextResponse.next());
  const refresh=request.cookies.get(REFRESH_COOKIE)?.value||'';
  if(!refresh)return harden(NextResponse.next());
  const refreshed=await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:supabasePublishableKey(),'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refresh}),cache:'no-store'});
  if(!refreshed.ok){const response=NextResponse.next();clearAuthCookies(response);return harden(response)}
  const session=await refreshed.json();const requestHeaders=new Headers(request.headers);const incomingCookies=request.cookies;incomingCookies.set(ACCESS_COOKIE,session.access_token);incomingCookies.set(REFRESH_COOKIE,session.refresh_token);requestHeaders.set('cookie',incomingCookies.toString());const response=NextResponse.next({request:{headers:requestHeaders}});applyAuthCookies(response,session);return harden(response)
}
export const config={matcher:['/admin/:path*','/supplier/:path*','/manufacturer/:path*','/buyer/:path*','/api/admin/:path*','/api/supplier/:path*','/api/manufacturer/:path*','/api/group-orders/:path*','/api/messages/:path*','/api/notifications/:path*','/api/documents/:path*','/api/account/:path*','/api/billing/:path*','/api/onboarding/:path*','/api/automation/:path*']};
