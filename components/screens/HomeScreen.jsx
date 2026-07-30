"use client";
import { useState, useEffect, useRef } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";
import { formatTime } from "@/lib/utils";
import { recipes, moods } from "@/data/recipes";

export function HomeScreen({ setScreen, setSelectedRecipe, setShowSettings, onOrder, savedRecipes = [], toggleSaved, user }) {
  const [activeMood,     setActiveMood]     = useState(null);
  const [featuredIndex,  setFeaturedIndex]  = useState(0);
  const featuredRecipes  = recipes;
  const featured         = featuredRecipes[featuredIndex] || null;
  const featuredIndexRef = useRef(featuredIndex);
  featuredIndexRef.current = featuredIndex;
  const featuredRef = useRef(null);

  const hour      = new Date().getHours();
  const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  // Featured slider — non-passive touchmove + mouse drag
  useEffect(() => {
    const el = featuredRef.current;
    if (!el) return;
    let startX = 0, startY = 0, lockedAxis = null, mouseDown = false;

    const commit = (dx, dy) => {
      if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const idx = featuredIndexRef.current;
      if (dx < 0 && idx < featuredRecipes.length - 1) setFeaturedIndex(idx + 1);
      else if (dx > 0 && idx > 0) setFeaturedIndex(idx - 1);
    };

    const onTouchStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; lockedAxis = null; };
    const onTouchMove  = (e) => {
      const dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
      if (!lockedAxis) lockedAxis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (lockedAxis === "x") e.preventDefault();
    };
    const onTouchEnd = (e) => commit(e.changedTouches[0].clientX - startX, e.changedTouches[0].clientY - startY);
    const onMouseDown = (e) => { mouseDown = true; startX = e.clientX; startY = e.clientY; };
    const onMouseUp   = (e) => { if (!mouseDown) return; mouseDown = false; commit(e.clientX - startX, e.clientY - startY); };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });
    el.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
      el.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130 }}>

      {/* Header */}
      <div style={{ padding: "44px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontStyle: "italic", fontWeight: 800, color: "#385348", letterSpacing: -0.5 }}>
            mise<span style={{ color: ACCENT, fontSize: 24 }}>.</span>
          </span>
          <div
            onClick={() => setShowSettings(true)}
            style={{ width: 40, height: 40, borderRadius: 20, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", cursor: "pointer", overflow: "hidden" }}>
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
              : (user?.user_metadata?.full_name?.[0] || "U").toUpperCase()
            }
          </div>
        </div>
        <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
          Good {timeOfDay}, {user?.user_metadata?.full_name?.split(" ")[0] || "Chef"}
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif", letterSpacing: -0.5, lineHeight: 1.2 }}>
          What are you <em style={{ color: ACCENT2, fontStyle: "italic" }}>craving</em> tonight?
        </h1>
      </div>

      {/* Mood chips */}
      {moods.length > 0 && recipes.length > 0 && (
        <div style={{ paddingBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingLeft: 20 }}>Mood</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory", paddingLeft: 20, paddingRight: 20, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {moods.map(m => (
              <button key={m.label} onClick={() => setActiveMood(activeMood === m.label ? null : m.label)} style={{
                flexShrink: 0, scrollSnapAlign: "start",
                background: activeMood === m.label ? "#2D4A3E" : CARD,
                border: `1.5px solid ${activeMood === m.label ? "#2D4A3E" : BORDER}`,
                borderRadius: 24, padding: "8px 14px", fontSize: 13, fontWeight: 600,
                color: activeMood === m.label ? "#fff" : TEXT,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)", whiteSpace: "nowrap",
              }}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured + Trending */}
      {recipes.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>👨‍🍳</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Recipes coming soon</div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>We're curating the perfect dishes for you. Check back shortly.</div>
        </div>
      ) : (<>

        {/* Featured slider */}
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8 }}>Featured</span>
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {featuredRecipes.map((_, i) => (
                <div key={i} onClick={() => setFeaturedIndex(i)} style={{
                  width: featuredIndex === i ? 18 : 6, height: 6, borderRadius: 3,
                  background: featuredIndex === i ? ACCENT2 : BORDER,
                  cursor: "pointer", transition: "all 0.3s ease",
                }} />
              ))}
            </div>
          </div>
          <div ref={featuredRef} style={{ overflow: "hidden", borderRadius: 20, cursor: "grab", userSelect: "none" }}>
            <div style={{ display: "flex", transform: `translateX(${-featuredIndex * 100}%)`, transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
              {featuredRecipes.map((r) => (
                <div key={r.id} style={{ minWidth: "100%", boxSizing: "border-box" }}>
                  <div onClick={() => { setSelectedRecipe(r); setScreen("recipe"); }} style={{ background: CARD, borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", cursor: "pointer", border: `1px solid ${BORDER}` }}>
                    <div style={{ position: "relative", height: 180 }}>
                      <img src={r.img} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
                      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>{r.name}</div>
                          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{r.subtitle}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", borderRadius: 10, padding: "4px 10px", color: "#fff", fontSize: 13, fontWeight: 700 }}>⭐ {r.rating}</div>
                          <button onClick={(e) => { e.stopPropagation(); toggleSaved?.(r); }} style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "none", borderRadius: 10, width: 34, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={savedRecipes.find(s => s.id === r.id) ? "#fff" : "rgba(255,255,255,0.15)"} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 12, color: MUTED }}>🍽️ {r.cuisine}</span>
                        <span style={{ fontSize: 12, color: MUTED }}>👤 {r?.servings ?? 2} servings</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onOrder?.(r); }} style={{ background: ACCENT2, color: "#fff", border: "none", borderRadius: 12, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        🛒 Auto-order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trending */}
        <div style={{ padding: "32px 20px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Trending Tonight</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recipes.map(r => (
              <div key={r.id} onClick={() => { setSelectedRecipe(r); setScreen("recipe"); }} style={{ background: CARD, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: `1px solid ${BORDER}` }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
                  <img src={r.img} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{formatTime(r.time)} · {r.cuisine} · {r.course || r.mood}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>)}
    </div>
  );
}
