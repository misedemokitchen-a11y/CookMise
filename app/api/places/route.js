export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");
  const type = searchParams.get("type"); // "autocomplete" or "distance"
  const origins = searchParams.get("origins");
  const destinations = searchParams.get("destinations");
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  let apiUrl;
  if (type === "autocomplete") {
    apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${key}`;
  } else if (type === "distance") {
    apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&units=imperial&key=${key}`;
  } else if (type === "geocode") {
    apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${key}`;
  }

  const res = await fetch(apiUrl);
  const data = await res.json();
  return Response.json(data);
}