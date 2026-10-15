import { createClient } from "@supabase/supabase-js";

// Server-only. The service-role key bypasses RLS, so never import this from a
// client component. Created lazily so builds don't fail when the key is unset.
let client = null;
export function getSupabaseAdmin() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
