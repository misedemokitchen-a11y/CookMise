"use client";
import { CARD, ACCENT, TEXT, MUTED, BORDER } from "@/lib/constants";
import { formatTime } from "@/lib/utils";

export function SavedScreen({ savedRecipes = [], toggleSaved, setSelectedRecipe, setScreen }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130 }}>
      <div style={{ padding: "54px 20px 16px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: ACCENT, margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>Saved</h2>
        <div style={{ fontSize: 13, color: MUTED }}>{savedRecipes.length} {savedRecipes.length === 1 ? "recipe" : "recipes"}</div>
      </div>

      {savedRecipes.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>♡</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: "0 0 8px", fontFamily: "Georgia, serif" }}>No saved recipes yet</h2>
          <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.5 }}>Tap the heart on any recipe to save it here.</p>
        </div>
      ) : (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {savedRecipes.map(r => (
            <div
              key={r.id}
              onClick={() => { setSelectedRecipe(r); setScreen("recipe"); }}
              style={{ background: CARD, borderRadius: 18, overflow: "hidden", cursor: "pointer", border: `1px solid ${BORDER}`, display: "flex", alignItems: "stretch", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 90, flexShrink: 0, overflow: "hidden" }}>
                <img src={r.img} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{r.subtitle}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>⏱ {formatTime(r.time)}</span>
                    <span style={{ fontSize: 11, color: MUTED }}>{r.calories} cal</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleSaved?.(r); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
