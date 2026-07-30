"use client";
import { useState, useEffect } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";
import { formatTime } from "@/lib/utils";
import { recipes, allCuisines, recipeMatchesCuisine } from "@/data/recipes";

const cuisineColors = [
  "#FFF0E8","#E8F4EA","#FFF8E8","#E8F0FF","#FFE8F0","#F0E8FF",
  "#E8FFF4","#FFF3E0","#E8F8FF","#F5FFE8","#FFF0F8","#EDFFF0",
  "#FFF5E8","#EEE8FF","#E8FFFA","#FFECE8","#F0FFE8","#E8F0FA","#FFFBE8","#FDF6E3",
];

const PROTEIN_KEYWORDS = {
  "Chicken":    ["chicken"],
  "Beef":       ["beef"],
  "Fish":       ["fish", "cod", "salmon", "tuna", "sea bass"],
  "Lamb":       ["lamb"],
  "Vegetarian": ["vegetarian", "vegan", "tofu", "mushroom", "veggie"],
};

// ── CuisineDishList ───────────────────────────────────────────────────────────
function CuisineDishList({ cuisine, onBack, setScreen, setSelectedRecipe }) {
  const [showFilter,    setShowFilter]    = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [pendingFilters, setPendingFilters] = useState({});
  const [pendingMaxTime, setPendingMaxTime] = useState(Infinity);
  const [pendingMaxCal,  setPendingMaxCal]  = useState(Infinity);
  const [activeMaxTime,  setActiveMaxTime]  = useState(Infinity);
  const [activeMaxCal,   setActiveMaxCal]   = useState(Infinity);

  const cuisineDishes = recipes
    .filter(r => recipeMatchesCuisine(r, cuisine))
    .map(r => ({
      name: r.name, desc: r.subtitle, time: r.time,
      cal: r.calories, rating: r.rating, emoji: r.emoji,
      tag: r.course || r.mood, img: r.img, _recipe: r,
    }));

  const allTags = [...new Set(cuisineDishes.map(d => d.tag).filter(Boolean))];

  const openFilter  = () => { setPendingFilters(activeFilters); setPendingMaxTime(activeMaxTime); setPendingMaxCal(activeMaxCal); setShowFilter(true); };
  const applyFilter = () => { setActiveFilters(pendingFilters); setActiveMaxTime(pendingMaxTime); setActiveMaxCal(pendingMaxCal); setShowFilter(false); };
  const clearFilter = () => { setPendingFilters({}); setPendingMaxTime(Infinity); setPendingMaxCal(Infinity); };

  const togglePending = (key, val) => setPendingFilters(prev => {
    const cur  = prev[key] || [];
    const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
    return { ...prev, [key]: next };
  });

  const hasFilters = Object.values(activeFilters).flat().length > 0 || activeMaxTime < Infinity || activeMaxCal < Infinity;
  const hasPending = Object.values(pendingFilters).flat().length > 0 || pendingMaxTime < Infinity || pendingMaxCal < Infinity;

  const visibleDishes = cuisineDishes.filter(dish => {
    const timeOk = (dish.time ?? Infinity) <= activeMaxTime;
    const calOk  = (dish.cal  ?? Infinity) <= activeMaxCal;
    const proteinOk = (() => {
      const sel = activeFilters["protein"] || [];
      if (sel.length === 0) return true;
      const haystack = (dish.name + " " + dish.desc + " " + (dish.tag || "")).toLowerCase();
      return sel.some(val => PROTEIN_KEYWORDS[val].some(k => haystack.includes(k)));
    })();
    const tagOk = (() => {
      const sel = activeFilters["tag"] || [];
      return sel.length === 0 || sel.includes(dish.tag);
    })();
    return timeOk && calOk && proteinOk && tagOk;
  });

  const cuisineSwipe = (() => {
    let startX = 0, startY = 0;
    return {
      onTouchStart: (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; },
      onTouchEnd:   (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) onBack();
      },
    };
  })();

  return (
    <div {...cuisineSwipe} style={{ flex: 1, overflowY: "auto", paddingBottom: 130, position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "54px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{cuisine.desc}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>{cuisine.emoji} {cuisine.label}</h2>
        </div>
        <button onClick={openFilter} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 4, opacity: 0.8 }}>
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
            <line x1="0" y1="3"  x2="22" y2="3"  stroke={hasFilters ? ACCENT : TEXT} strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="7"  cy="3"  r="2.5" fill={hasFilters ? ACCENT : TEXT}/>
            <line x1="0" y1="9"  x2="22" y2="9"  stroke={hasFilters ? ACCENT : TEXT} strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="13" cy="9"  r="2.5" fill={hasFilters ? ACCENT : TEXT}/>
            <line x1="0" y1="15" x2="22" y2="15" stroke={hasFilters ? ACCENT : TEXT} strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="6"  cy="15" r="2.5" fill={hasFilters ? ACCENT : TEXT}/>
          </svg>
        </button>
      </div>

      <div style={{ padding: "14px 20px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>{visibleDishes.length} Dishes</div>
      </div>

      {/* Dish list */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {visibleDishes.map((dish, i) => (
          <div key={i} onClick={() => { setSelectedRecipe(dish._recipe); setScreen("recipe"); }} style={{ background: CARD, borderRadius: 20, overflow: "hidden", cursor: "pointer", boxShadow: "0 3px 14px rgba(0,0,0,0.07)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "stretch" }}>
            <div style={{ width: 100, flexShrink: 0, overflow: "hidden" }}>
              <img src={dish.img} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{dish.name}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT2, flexShrink: 0, marginLeft: 8 }}>⭐ {dish.rating}</span>
                </div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{dish.desc}</div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: MUTED }}>⏱ {formatTime(dish.time)}</span>
                <span style={{ fontSize: 11, color: MUTED }}>{dish.cal} cal</span>
              </div>
            </div>
          </div>
        ))}
        {visibleDishes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: MUTED, fontSize: 14 }}>No dishes match the selected filters.</div>
        )}
      </div>

      {/* Filter modal */}
      {showFilter && (
        <div onClick={() => setShowFilter(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50, display: "flex", alignItems: "flex-start" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", background: BG, borderRadius: "0 0 24px 24px", padding: "16px 24px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>Filter</div>
              {hasPending && <button onClick={clearFilter} style={{ fontSize: 13, color: ACCENT, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear all</button>}
            </div>

            {/* Protein */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Protein</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.keys(PROTEIN_KEYWORDS).map(opt => {
                  const on = (pendingFilters["protein"] || []).includes(opt);
                  return (
                    <button key={opt} onClick={() => togglePending("protein", opt)} style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: on ? 700 : 500, background: on ? TEXT : "transparent", color: on ? "#fff" : MUTED, border: `1.5px solid ${on ? TEXT : BORDER}`, transition: "all 0.15s ease" }}>{opt}</button>
                  );
                })}
              </div>
            </div>

            {/* Cook Time */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Cook Time</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{pendingMaxTime === Infinity ? "Any" : `≤ ${pendingMaxTime} min`}</div>
              </div>
              <input type="range" min={15} max={240} step={1} value={pendingMaxTime === Infinity ? 240 : pendingMaxTime} onChange={e => { const v = Number(e.target.value); setPendingMaxTime(v >= 240 ? Infinity : v); }} style={{ width: "100%", accentColor: TEXT, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 6 }}>
                {[15, 30, 60, Infinity].map(p => (
                  <button key={p} onClick={() => setPendingMaxTime(p)} style={{ flex: 1, padding: "5px 0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: pendingMaxTime === p ? 700 : 500, background: pendingMaxTime === p ? TEXT : "transparent", color: pendingMaxTime === p ? "#fff" : MUTED, border: `1.5px solid ${pendingMaxTime === p ? TEXT : BORDER}`, transition: "all 0.15s ease" }}>{p === Infinity ? "Any" : `${p}m`}</button>
                ))}
              </div>
            </div>

            {/* Calories */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Calories</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{pendingMaxCal === Infinity ? "Any" : `≤ ${pendingMaxCal} cal`}</div>
              </div>
              <input type="range" min={100} max={1200} step={10} value={pendingMaxCal === Infinity ? 1200 : pendingMaxCal} onChange={e => { const v = Number(e.target.value); setPendingMaxCal(v >= 1200 ? Infinity : v); }} style={{ width: "100%", accentColor: TEXT, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 6 }}>
                {[300, 500, 800, Infinity].map(p => (
                  <button key={p} onClick={() => setPendingMaxCal(p)} style={{ flex: 1, padding: "5px 0", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: pendingMaxCal === p ? 700 : 500, background: pendingMaxCal === p ? TEXT : "transparent", color: pendingMaxCal === p ? "#fff" : MUTED, border: `1.5px solid ${pendingMaxCal === p ? TEXT : BORDER}`, transition: "all 0.15s ease" }}>{p === Infinity ? "Any" : `${p}`}</button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Tag</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allTags.map(opt => {
                    const on = (pendingFilters["tag"] || []).includes(opt);
                    return <button key={opt} onClick={() => togglePending("tag", opt)} style={{ padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: on ? 700 : 500, background: on ? TEXT : "transparent", color: on ? "#fff" : MUTED, border: `1.5px solid ${on ? TEXT : BORDER}`, transition: "all 0.15s ease" }}>{opt}</button>;
                  })}
                </div>
              </div>
            )}

            <button onClick={applyFilter} style={{ width: "100%", padding: "14px", borderRadius: 18, background: TEXT, color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ExploreScreen ─────────────────────────────────────────────────────────────
export function ExploreScreen({ setScreen, setSelectedRecipe, resetRef }) {
  const [search,          setSearch]          = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState(null);

  useEffect(() => {
    if (resetRef) resetRef.current = () => setSelectedCuisine(null);
  });

  if (selectedCuisine) {
    return (
      <CuisineDishList
        cuisine={selectedCuisine}
        onBack={() => setSelectedCuisine(null)}
        setScreen={setScreen}
        setSelectedRecipe={setSelectedRecipe}
      />
    );
  }

  const cuisineHasRecipes = (c) => recipes.some(r => recipeMatchesCuisine(r, c));
  const filtered = allCuisines
    .filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    .filter(c => cuisineHasRecipes(c));

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130 }}>
      <div style={{ padding: "54px 20px 16px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: ACCENT, margin: "0 0 14px", fontFamily: "'Playfair Display', Georgia, serif" }}>Explore Cuisines</h2>
        <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 16, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a cuisine..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: TEXT, outline: "none", fontFamily: "inherit" }} />
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>{filtered.length} Cuisines</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {filtered.map((c, i) => (
            <div key={c.label} onClick={() => setSelectedCuisine(c)} style={{ background: cuisineColors[i % cuisineColors.length], border: `1px solid ${BORDER}`, borderRadius: 22, padding: "24px 16px 20px", textAlign: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <div style={{ fontSize: 42, marginBottom: 10, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>{c.desc}</div>
              <div style={{ marginTop: 8, fontSize: 10, color: ACCENT, fontWeight: 700 }}>{recipes.filter(r => recipeMatchesCuisine(r, c)).length} dishes →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
