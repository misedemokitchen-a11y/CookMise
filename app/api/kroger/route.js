const KROGER_CLIENT_ID     = process.env.KROGER_CLIENT_ID;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
const KROGER_BASE          = "https://api.kroger.com/v1";

// ── Get access token ──────────────────────────────────────────────────────────
async function getToken() {
  const credentials = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=product.compact+locations.compact",
  });
  const data = await res.json();
  return data.access_token;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type    = searchParams.get("type");
  const token   = await getToken();

  // ── Find nearby Kroger stores ─────────────────────────────────────────────
  if (type === "stores") {
    const lat  = searchParams.get("lat");
    const lng  = searchParams.get("lng");
    const res  = await fetch(`${KROGER_BASE}/locations?filter.latLong.near=${lat},${lng}&filter.radiusInMiles=10&filter.limit=5`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    return Response.json(data);
  }

  // ── Search for a product ──────────────────────────────────────────────────
  if (type === "product") {
    const query      = searchParams.get("query");
    const locationId = searchParams.get("locationId");
    const res  = await fetch(`${KROGER_BASE}/products?filter.term=${encodeURIComponent(query)}&filter.locationId=${locationId}&filter.limit=1`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await res.json();
    return Response.json(data);
  }

  return Response.json({ error: "Invalid type" }, { status: 400 });
}
