export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}

export function supabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

export function supabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function authConfigured() {
  return Boolean(supabaseUrl() && supabasePublishableKey());
}

export function serviceDatabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseServiceRoleKey());
}
