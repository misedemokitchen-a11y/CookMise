// Format minutes into compact display: 25 → "25m", 210 → "3h 30m", 60 → "1h"
export const formatTime = (mins) => {
  if (!mins) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// Haversine distance in miles between two lat/lng points
export const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Scale a quantity string by a factor e.g. "200g" × 2 → "400g"
export const scaleQty = (qty, factor) => {
  if (!qty || factor === 1) return qty;
  return qty.replace(/[\d.]+/, (n) => {
    const scaled = parseFloat(n) * factor;
    return scaled % 1 === 0 ? scaled : scaled.toFixed(1);
  });
};
