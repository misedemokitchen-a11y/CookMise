// ── Theme ─────────────────────────────────────────────────────────────────────
export const BG      = "#FAF7F2";
export const CARD    = "#FFFFFF";
export const ACCENT  = "#E8825A";
export const ACCENT2 = "#3D6B4F";
export const TEXT    = "#1A1A1A";
export const MUTED   = "#8A8880";
export const BORDER  = "#EDE9E2";

// ── A/B test flag for ingredient row layout ───────────────────────────────────
// Options (no image): "A" | "B" | "C" | "D"
// Options (with image): "A_IMG" | "B_IMG" | "C_IMG" | "D_IMG"
//   A      — qty on the far right, name on the left
//   B      — qty immediately right of name, side by side
//   C      — qty on the left, name to its right, side by side
//   D      — name on top, qty below it
//   *_IMG  — same as above but with ingredient image on the far left
export const INGREDIENT_LAYOUT = "A";

// ── Root nav screens (swipe-back disabled for these) ─────────────────────────
export const ROOT_SCREENS = ["home", "order", "saved"];
