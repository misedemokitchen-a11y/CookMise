import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin, forbidden } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const STATUSES = ["confirmed", "shopping", "out_for_delivery", "delivered", "canceled"];

// GET /api/admin/orders — every order, newest first, with customer info.
export async function GET(request) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    const db = getSupabaseAdmin();
    const { data: orders, error } = await db
      .from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const ids = [...new Set(orders.map(o => o.user_id))];
    const { data: profiles } = ids.length
      ? await db.from("profiles").select("*").in("id", ids)
      : { data: [] };
    const byId = Object.fromEntries((profiles || []).map(p => [p.id, p]));

    const withCustomer = await Promise.all(orders.map(async (o) => {
      const p = byId[o.user_id];
      let email = p?.email || null;
      if (!email) {
        const { data } = await db.auth.admin.getUserById(o.user_id);
        email = data?.user?.email || null;
      }
      return {
        ...o,
        customer: {
          name:  [p?.first_name, p?.last_name].filter(Boolean).join(" ") || null,
          phone: p?.phone || null,
          email,
        },
      };
    }));
    return Response.json({ orders: withCustomer });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/admin/orders — body: { orderId, status?, finalTotal? }
export async function PATCH(request) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    const { orderId, status, finalTotal } = await request.json();
    if (!orderId) return Response.json({ error: "orderId required" }, { status: 400 });
    const patch = {};
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
      patch.status = status;
      patch.status_updated_at = new Date().toISOString();
      // Stop showing a stale driver pin once the order is no longer en route.
      if (status !== "out_for_delivery") { patch.driver_lat = null; patch.driver_lng = null; patch.driver_updated_at = null; }
    }
    if (finalTotal !== undefined) {
      const n = finalTotal === null || finalTotal === "" ? null : Number(finalTotal);
      if (n !== null && (!Number.isFinite(n) || n < 0)) return Response.json({ error: "Invalid total" }, { status: 400 });
      patch.final_total = n;
    }
    const { data, error } = await getSupabaseAdmin().from("orders").update(patch).eq("id", orderId).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ order: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
