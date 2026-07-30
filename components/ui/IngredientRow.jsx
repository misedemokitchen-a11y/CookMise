"use client";
import { TEXT, MUTED, BORDER, INGREDIENT_LAYOUT } from "@/lib/constants";
import { scaleQty } from "@/lib/utils";

// ── IngredientRow ─────────────────────────────────────────────────────────────
// Owns only the visual layout of a single ingredient row.
// Swipe logic, strip structure, and tab state live above this in RecipeScreen.

export function IngredientRow({ ing, factor }) {
  const qty     = scaleQty(ing.qty, factor);
  const showImg = INGREDIENT_LAYOUT.endsWith("_IMG");
  const base    = INGREDIENT_LAYOUT.replace("_IMG", "");

  const img = showImg && (
    <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: BORDER }}>
      {ing.img
        ? <img src={ing.img} alt={ing.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{ing.emoji}</div>
      }
    </div>
  );

  const name = <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{ing.name}</div>;
  const q    = <div style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>{qty}</div>;

  let layout;
  if (base === "A") layout = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {name}
      <div style={{ marginLeft: 12 }}>{q}</div>
    </div>
  );
  else if (base === "B") layout = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
      {name}{q}
    </div>
  );
  else if (base === "C") layout = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 13, color: MUTED, flexShrink: 0, minWidth: 48 }}>{qty}</div>
      {name}
    </div>
  );
  else layout = (
    <div style={{ flex: 1 }}>
      {name}
      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{qty}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", padding: "10px 0", gap: 12 }}>
      {img}
      {layout}
    </div>
  );
}
