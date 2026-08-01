// ── loadGoogleMaps ────────────────────────────────────────────────────────────
// Lazily loads the Google Maps JavaScript API exactly once, client-side only,
// and returns a promise that resolves with `window.google.maps`.

let loadPromise = null;

export function loadGoogleMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadGoogleMaps can only run in the browser"));
  }
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) { reject(new Error("Maps API key not configured")); return; }

    const existing = document.querySelector("script[data-google-maps-loader]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    window.__initGoogleMaps = () => resolve(window.google.maps);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onerror = () => reject(new Error("Failed to load Google Maps"));

    document.head.appendChild(script);
  });

  return loadPromise;
}