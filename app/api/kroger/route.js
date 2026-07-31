const KROGER_CLIENT_ID     = process.env.KROGER_CLIENT_ID;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
const KROGER_BASE          = "https://api.kroger.com/v1";

async function getToken(scope = "product.compact locations.compact") {
  const credentials = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: `grant_type=client_credentials&scope=${scope}`,
  });
  const data = await res.json();
  console.log("Kroger token response:", JSON.stringify(data));
  return data.access_token;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type  = searchParams.get("type");

  // ── Debug token ───────────────────────────────────────────────────────────
  if (type === "token") {
    const tokenRes = await fetch(`${KROGER_BASE}/connect/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials&scope=product.compact",
    });
    const result = await tokenRes.json();
    return Response.json({
      result,
      clientIdExists: !!KROGER_CLIENT_ID,
      secretExists:   !!KROGER_CLIENT_SECRET,
    });
  }

  const token = await getToken();

  if (!token) {
    return Response.json({ error: "Failed to get Kroger token" }, { status: 500 });
  }

  // ── Find nearby Kroger stores ─────────────────────────────────────────────
  if (type === "stores") {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const res = await fetch(
      `${KROGER_BASE}/locations?filter.latLong.near=${lat},${lng}&filter.radiusInMiles=10&filter.limit=5`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );
    const data = await res.json();
    return Response.json(data);
  }

  // ── Search for a product at a specific store ──────────────────────────────
  if (type === "product") {
    const query      = searchParams.get("query");
    const locationId = searchParams.get("locationId");
    const res = await fetch(
      `${KROGER_BASE}/products?filter.term=${encodeURIComponent(query)}&filter.locationId=${locationId}&filter.limit=1`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );
    const data = await res.json();
    return Response.json(data);
  }

  // ── Search all ingredients at a store ─────────────────────────────────────
  if (type === "ingredients") {
    const locationId  = searchParams.get("locationId");
    const ingredients = searchParams.get("ingredients")?.split(",") || [];

    const results = await Promise.all(
      ingredients.map(async (ing) => {
        const res  = await fetch(
          `${KROGER_BASE}/products?filter.term=${encodeURIComponent(ing.trim())}&filter.locationId=${locationId}&filter.limit=1`,
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        const data = await res.json();
        const product = data.data?.[0];
        return {
          ingredient: ing.trim(),
          found:      !!product,
          name:       product?.description,
          price:      product?.items?.[0]?.price?.regular,
          image:      product?.images?.[0]?.sizes?.[0]?.url,
        };
      })
    );

    return Response.json({ results });
  }

  return Response.json({ error: "Invalid type" }, { status: 400 });
}