import { createClient } from "@supabase/supabase-js";

// Comma-separated allowlist; defaults to the owner. Override with ADMIN_EMAILS.
function adminEmails() {
  return (process.env.ADMIN_EMAILS || "wilson.m.tang@gmail.com")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}

// Verifies the caller's Supabase access token (sent as `Authorization: Bearer`)
// and checks their email against the allowlist. Returns the user or null.
export async function requireAdmin(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await anon.auth.getUser(token);
  const user = data?.user;
  if (error || !user?.email || !user.email_confirmed_at) return null;
  return adminEmails().includes(user.email.toLowerCase()) ? user : null;
}

export const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 });
