"use client";
import { useState, useEffect, useRef } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";
import { formatTime } from "@/lib/utils";
import { IngredientRow } from "@/components/ui/IngredientRow";
import { Tag } from "@/components/ui/Tag";

const getServingOptions = (base) => {
  const opts = [];
  for (let m = 1; m <= 3; m++) {
    const n = base * m;
    if (Number.isInteger(n)) opts.push(n);
  }
  return [...new Set(opts)];
};

const sampleReviews = [
  { name: "Sarah M.", rating: 5, date: "2 days ago",   text: "Absolutely incredible — made this for a dinner party and everyone was blown away." },
  { name: "James T.", rating: 5, date: "1 week ago",   text: "Followed the steps exactly and it turned out perfectly. The flavours are so well balanced." },
  { name: "Priya K.", rating: 4, date: "2 weeks ago",  text: "Really delicious! I added a pinch of chilli flakes for a bit of heat. Highly recommend." },
];

export function RecipeScreen({ recipe, setScreen, onOrder, savedRecipes = [], toggleSaved, goBack }) {
  const [activeTab,          setActiveTab]          = useState("ingredients");
  const [servings,           setServings]           = useState(recipe?.servings ?? 2);
  const [showServingsPicker, setShowServingsPicker] = useState(false);
  const [dragOffset,         setDragOffset]         = useState(0);
  const [isDragging,         setIsDragging]         = useState(false);
  const stripRef    = useRef(null);
  const tabIndexRef = useRef(0);

  if (!recipe) return null;

  const tabs         = ["Ingredients", "Instructions", "Reviews"];
  const tabIndex     = tabs.findIndex(t => t.toLowerCase() === activeTab);
  tabIndexRef.current = tabIndex;

  const servingOptions  = getServingOptions(recipe.servings ?? 2);
  const factor          = servings / (recipe.servings ?? 2);
  const scaledCalories  = Math.round((recipe.calories ?? 0) * factor);

  const switchTab = (newTab) => setActiveTab(newTab);

  // Tab strip swipe — non-passive touchmove + mouse drag
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    let startX = 0, startY = 0, lockedAxis = null, mouseDown = false;

    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; lockedAxis = null; setIsDragging(true); setDragOffset(0); };
    const onMove  = (e) => {
      const dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
      if (!lockedAxis) lockedAxis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (lockedAxis !== "x") return;
      e.preventDefault();
      const idx = tabIndexRef.current;
      const atStart = idx === 0 && dx > 0, atEnd = idx === tabs.length - 1 && dx < 0;
      setDragOffset(atStart || atEnd ? dx * 0.2 : dx);
    };
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      setIsDragging(false); setDragOffset(0);
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const idx = tabIndexRef.current;
      if (dx < 0 && idx < tabs.length - 1) switchTab(tabs[idx + 1].toLowerCase());
      else if (dx > 0 && idx > 0) switchTab(tabs[idx - 1].toLowerCase());
    };
    const onMouseStart = (e) => { mouseDown = true; startX = e.clientX; startY = e.clientY; lockedAxis = null; setIsDragging(true); setDragOffset(0); };
    const onMouseMove  = (e) => {
      if (!mouseDown) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!lockedAxis) lockedAxis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
      if (lockedAxis !== "x") return;
      const idx = tabIndexRef.current;
      const atStart = idx === 0 && dx > 0, atEnd = idx === tabs.length - 1 && dx < 0;
      setDragOffset(atStart || atEnd ? dx * 0.2 : dx);
    };
    const onMouseEnd = (e) => {
      if (!mouseDown) return;
      mouseDown = false;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      setIsDragging(false); setDragOffset(0);
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const idx = tabIndexRef.current;
      if (dx < 0 && idx < tabs.length - 1) switchTab(tabs[idx + 1].toLowerCase());
      else if (dx > 0 && idx > 0) switchTab(tabs[idx - 1].toLowerCase());
    };

    el.addEventListener("touchstart", onStart,      { passive: true });
    el.addEventListener("touchmove",  onMove,       { passive: false });
    el.addEventListener("touchend",   onEnd,        { passive: true });
    el.addEventListener("mousedown",  onMouseStart);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove",  onMove);
      el.removeEventListener("touchend",   onEnd);
      el.removeEventListener("mousedown",  onMouseStart);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseEnd);
    };
  }, []);

  // Page-level swipe right → go back
  const pageSwipe = (() => {
    let startX = 0, startY = 0;
    return {
      onTouchStart: (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; },
      onTouchEnd:   (e) => {
        const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
        if (dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goBack();
      },
    };
  })();

  return (
    <div {...pageSwipe} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>

      {/* Fixed top — hero, tags, stats */}
      <div style={{ flexShrink: 0 }}>
        {/* Hero */}
        <div style={{ position: "relative", height: 240 }}>
          <img src={recipe.img} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
          <button onClick={() => goBack()} style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", border: "none", borderRadius: 12, width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <button onClick={() => toggleSaved?.(recipe)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "none", borderRadius: 12, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={savedRecipes.find(r => r.id === recipe.id) ? "#fff" : "rgba(255,255,255,0.15)"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.4)", fontFamily: "Georgia, serif" }}>{recipe.name}</h2>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>{recipe.subtitle}</div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ padding: "14px 20px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {recipe.course    && <Tag>{recipe.course}</Tag>}
          {recipe.mood      && <Tag>{recipe.mood}</Tag>}
          {recipe.difficulty && <Tag>{recipe.difficulty}</Tag>}
          {recipe.dietary   && <Tag color={ACCENT2} bg={ACCENT2 + "18"}>{recipe.dietary}</Tag>}
          {recipe.cuisine   && <Tag color={ACCENT2} bg={ACCENT2 + "18"}>{recipe.cuisine}</Tag>}
        </div>

        {/* Stats row */}
        <div style={{ padding: "16px 0 0" }}>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory", paddingLeft: 20, paddingRight: 20, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {[{ label: "Time", value: formatTime(recipe.time) }, { label: "Rating", value: `⭐${recipe.rating}` }].map(s => (
              <div key={s.label} style={{ flex: "0 0 calc(25% - 8px)", scrollSnapAlign: "start", background: CARD, borderRadius: 14, padding: "10px 8px", textAlign: "center", border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{s.value}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
            <div style={{ flex: "0 0 calc(25% - 8px)", scrollSnapAlign: "start", background: CARD, borderRadius: 14, padding: "10px 8px", textAlign: "center", border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{scaledCalories}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Calories</div>
            </div>
            <div style={{ position: "relative", flex: "0 0 calc(25% - 8px)", scrollSnapAlign: "start" }}>
              <div onClick={() => setShowServingsPicker(v => !v)} style={{ background: CARD, borderRadius: 14, padding: "10px 8px", textAlign: "center", border: `1px solid ${showServingsPicker ? TEXT : BORDER}`, cursor: "pointer", transition: "border-color 0.15s" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEXT, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>{servings} <span style={{ fontSize: 9, color: MUTED }}>▾</span></div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Servings</div>
              </div>
              {showServingsPicker && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", zIndex: 20, overflow: "hidden", minWidth: 80 }}>
                  {servingOptions.map(opt => (
                    <div key={opt} onClick={() => { setServings(opt); setShowServingsPicker(false); }} style={{ padding: "10px 18px", fontSize: 14, fontWeight: opt === servings ? 800 : 500, color: opt === servings ? TEXT : MUTED, cursor: "pointer", textAlign: "center", background: opt === servings ? BG : "transparent", borderBottom: `1px solid ${BORDER}` }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>{/* end fixed top */}

      {/* Tab bar + scrollable content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${BORDER}`, marginTop: 22 }}>
          <div style={{ display: "flex", paddingLeft: 20 }}>
            {tabs.map(tab => {
              const active = activeTab === tab.toLowerCase();
              return (
                <button key={tab} onClick={() => switchTab(tab.toLowerCase())} style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 20px 10px 0", marginRight: 16, fontSize: 14, fontWeight: active ? 700 : 500, color: active ? TEXT : MUTED, borderBottom: active ? `2px solid ${TEXT}` : "2px solid transparent", marginBottom: -1, fontFamily: "inherit", transition: "all 0.15s ease" }}>
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Swipeable strip */}
        <div ref={stripRef} style={{ flex: 1, overflowX: "hidden", overflowY: "hidden", userSelect: "none", cursor: isDragging ? "grabbing" : "grab" }}>
          <div style={{ display: "flex", alignItems: "stretch", height: "100%", width: `${tabs.length * 100}%`, transform: `translateX(calc(${-tabIndex * (100 / tabs.length)}% + ${dragOffset / tabs.length}px))`, transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)", willChange: "transform" }}>

            {/* Ingredients */}
            <div style={{ width: `${100 / tabs.length}%`, flexShrink: 0, boxSizing: "border-box", overflowY: "auto", paddingBottom: 166 }}>
              <div style={{ padding: "4px 20px 0" }}>
                {recipe.ingredients?.map((ing, i) => (
                  <div key={i}>
                    <IngredientRow ing={ing} factor={factor} />
                    {i < (recipe.ingredients?.length ?? 0) - 1 && <div style={{ height: 1, background: BORDER }} />}
                  </div>
                ))}
                <button onClick={() => onOrder?.(recipe) || setScreen("order")} style={{ width: "100%", marginTop: 36, padding: "15px", borderRadius: 18, background: ACCENT2, color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 14px ${ACCENT2}55` }}>
                  Order Ingredients
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div style={{ width: `${100 / tabs.length}%`, flexShrink: 0, boxSizing: "border-box", overflowY: "auto", paddingBottom: 166 }}>
              <div style={{ padding: "16px 20px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {recipe.steps?.map((step, i) => (
                    <div key={i} style={{ background: CARD, borderRadius: 16, padding: "14px 16px", border: `1px solid ${BORDER}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 13, background: ACCENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, flex: 1 }}>{step.title}</div>
                        <div style={{ background: ACCENT + "15", border: `1px solid ${ACCENT}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: ACCENT, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>⏱ {step.time}</div>
                      </div>
                      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0, paddingLeft: 36 }}>{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div style={{ width: `${100 / tabs.length}%`, flexShrink: 0, boxSizing: "border-box", overflowY: "auto", paddingBottom: 166 }}>
              <div style={{ padding: "16px 20px 0" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {sampleReviews.map((review, i) => (
                    <div key={i}>
                      <div style={{ padding: "14px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 16, background: ACCENT + "22", color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{review.name[0]}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{review.name}</div>
                              <div style={{ fontSize: 11, color: MUTED }}>{review.date}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>{"★".repeat(review.rating)}</div>
                        </div>
                        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>{review.text}</p>
                      </div>
                      {i < sampleReviews.length - 1 && <div style={{ height: 1, background: BORDER }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
