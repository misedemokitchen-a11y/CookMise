import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin, forbidden } from "@/lib/adminAuth";

// POST /api/admin/location — body: { lat, lng }
// Publishes the driver's position on every order currently out for delivery.
export async function POST(request) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    const { lat, lng } = await request.json();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    const { data, error } = await getSupabaseAdmin()
      .from("orders")
      .update({ driver_lat: lat, driver_lng: lng, driver_updated_at: new Date().toISOString() })
      .eq("status", "out_for_delivery")
      .select("id");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ updated: data.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
