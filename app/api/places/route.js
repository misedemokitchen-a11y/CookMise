export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type         = searchParams.get("type");
  const input        = searchParams.get("input");
  const origins      = searchParams.get("origins");
  const destinations = searchParams.get("destinations");
  const key          = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return Response.json({ error: "Maps API key not configured" }, { status: 500 });
  }

  // ── Autocomplete (new Places API) ─────────────────────────────────────────
  if (type === "autocomplete") {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    const predictions = data.suggestions?.map(s => ({
      place_id:    s.placePrediction?.placeId,
      description: s.placePrediction?.text?.text,
    })) || [];
    return Response.json({ predictions });
  }

  // ── Distance Matrix ───────────────────────────────────────────────────────
  if (type === "distance") {
    const res  = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&units=imperial&key=${key}`);
    const data = await res.json();
    return Response.json(data);
  }

  // ── Geocode ───────────────────────────────────────────────────────────────
  if (type === "geocode") {
    const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${key}`);
    const data = await res.json();
    return Response.json(data);
  }

  return Response.json({ error: "Invalid type" }, { status: 400 });
}
