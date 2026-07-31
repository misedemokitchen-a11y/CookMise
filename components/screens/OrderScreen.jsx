"use client";
import { useState, useEffect, useRef } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";
import { haversine } from "@/lib/utils";
import { stores } from "@/data/recipes";


// ── SwipeableRecipeCard ───────────────────────────────────────────────────────
function SwipeableRecipeCard({ recipe, idx, expanded, toggleExpand, removeRecipe, checked, toggleCheck }) {
  const [swipeX,    setSwipeX]    = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartRef = useRef(null);
  const THRESHOLD = 80;
  if (!recipe) return null;

  const deleteOpacity = Math.min(Math.abs(swipeX) / THRESHOLD, 1);

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
      {swipeX < 0 && (
        <div style={{ position: "absolute", inset: 0, background: "#E53935", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 24, borderRadius: 20, opacity: deleteOpacity }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>Remove</span>
          </div>
        </div>
      )}
      {isHovered && (
        <button onClick={e => { e.stopPropagation(); removeRecipe(idx); }} style={{ position: "absolute", top: 10, right: 10, zIndex: 10, width: 28, height: 28, borderRadius: 8, background: "rgba(229,57,53,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      )}
      <div
        onTouchStart={(e) => { touchStartRef.current = e.touches[0].clientX; setIsSwiping(true); }}
        onTouchMove={(e)  => { if (touchStartRef.current === null) return; const dx = e.touches[0].clientX - touchStartRef.current; if (dx < 0) setSwipeX(Math.max(dx, -THRESHOLD - 20)); }}
        onTouchEnd={()    => { setIsSwiping(false); if (swipeX < -THRESHOLD) removeRecipe(idx); else setSwipeX(0); touchStartRef.current = null; }}
        style={{ transform: `translateX(${swipeX}px)`, transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)", borderRadius: 20, overflow: "hidden", border: `1px solid ${BORDER}`, background: CARD, userSelect: "none" }}>

        <div onClick={() => { if (swipeX === 0) toggleExpand(idx); }} style={{ background: "#2D4A3E", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{recipe.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{recipe.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{recipe.ingredients?.length ?? 0} ingredients · {recipe.servings ?? 2} servings</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", pointerEvents: "none" }}>▾</div>
        </div>

        {expanded && (
          <div>
            {recipe.ingredients?.map((ing, i) => {
              const key       = `${recipe.id}-${i}`;
              const isChecked = !!checked[key];
              return (
                <div key={i}>
                  <div onClick={() => toggleCheck(recipe.id, i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: isChecked ? MUTED : TEXT, textDecoration: isChecked ? "line-through" : "none", transition: "all 0.15s ease" }}>{ing.name}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{ing.qty}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, border: `2px solid ${isChecked ? "#2D4A3E" : BORDER}`, background: isChecked ? "#2D4A3E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}>
                      {isChecked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                  {i < (recipe.ingredients?.length ?? 0) - 1 && <div style={{ height: 1, background: BORDER }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── OrderScreen ───────────────────────────────────────────────────────────────
export function OrderScreen({ orderRecipes, setOrderRecipes, setScreen, profile, placeOrder, defaultAddress }) {
  const [confirmed,      setConfirmed]      = useState(false);
  const [selected,       setSelected]       = useState(0);
  const [checked,        setChecked]        = useState({});
  const [expanded,       setExpanded]       = useState({ 0: true });
  const [deliveryAddress, setDeliveryAddress] = useState(defaultAddress ? `${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.postcode}` : "");
  const [editingAddress, setEditingAddress] = useState(false);
  const [suggestions,    setSuggestions]    = useState([]);
  const [loadingPlaces,  setLoadingPlaces]  = useState(false);
  const [loadingStores,  setLoadingStores]  = useState(false);
  const [userLocation,   setUserLocation]   = useState(null);
  const [sortedStores,   setSortedStores]   = useState(stores);
  const addressInputRef = useRef(null);
  const debounceRef     = useRef(null);

  useEffect(() => { if (editingAddress && addressInputRef.current) addressInputRef.current.focus(); }, [editingAddress]);
  useEffect(() => { if (deliveryAddress) fetchDrivingDistances(deliveryAddress); }, []);

const fetchSuggestions = async (value) => {
  if (!value.trim()) { setSuggestions([]); return; }
  setLoadingPlaces(true);
  try {
    const res  = await fetch(`/api/places?type=autocomplete&input=${encodeURIComponent(value)}`);
    const data = await res.json();
    setSuggestions(data.predictions?.map(p => ({ place_id: p.place_id, description: p.description })) || []);
  } catch { setSuggestions([]); }
  setLoadingPlaces(false);
};

const fetchDrivingDistances = async (address) => {
  setLoadingStores(true);
  try {
    const destinations = stores.map(s => s.address).join("|");
    const res  = await fetch(`/api/places?type=distance&origins=${encodeURIComponent(address)}&destinations=${encodeURIComponent(destinations)}`);
    const data = await res.json();
    if (data.rows?.[0]?.elements) {
      const withDist = stores.map((s, i) => {
        const el = data.rows[0].elements[i];
        const ok = el?.status === "OK";
        return { ...s, distMiles: ok ? el.distance.value / 1609.34 : null, distLabel: ok ? el.distance.text : null, timeLabel: ok ? el.duration.text : null, drivingSecs: ok ? el.duration.value : 999999 };
      }).sort((a, b) => a.drivingSecs - b.drivingSecs);
      setSortedStores(withDist); setSelected(0); setUserLocation(true);
    }
  } catch {
    try {
      const res2 = await fetch(`/api/places?type=geocode&input=${encodeURIComponent(address)}`);
      const geo  = await res2.json();
      if (geo.results?.[0]) {
        const { lat, lng } = geo.results[0].geometry.location;
        setUserLocation({ lat, lng });
        const withDist = stores.map(s => ({
          ...s,
          distMiles: haversine(lat, lng, s.lat, s.lng),
          distLabel: `${haversine(lat, lng, s.lat, s.lng).toFixed(1)} mi`,
          timeLabel: `~${Math.round(20 + haversine(lat, lng, s.lat, s.lng) * 8)} min`,
          drivingSecs: haversine(lat, lng, s.lat, s.lng) * 500
        })).sort((a, b) => a.drivingSecs - b.drivingSecs);
        setSortedStores(withDist); setSelected(0);
      }
    } catch {}
  }
  setLoadingStores(false);
};

  const handleAddressChange = (value) => {
    setDeliveryAddress(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  const selectSuggestion = (desc) => { setDeliveryAddress(desc); setSuggestions([]); setEditingAddress(false); fetchDrivingDistances(desc); };
  const handleAddressBlur = () => { setTimeout(() => { setEditingAddress(false); setSuggestions([]); }, 150); };

  const ingKeywords = (name) => (name || "").toLowerCase().trim().replace(/s$/, "").split(/\s+/);
  const ingsOverlap = (a, b) => {
    const stop = new Set(["and","with","of","in","or","to","the","a","an","fresh","dried","ground","chopped","diced","sliced","minced","oil","powder","pepper","red","green","white"]);
    const ma = ingKeywords(a).filter(w => w.length > 2 && !stop.has(w));
    const mb = ingKeywords(b).filter(w => w.length > 2 && !stop.has(w));
    return ma.some(w => mb.includes(w));
  };

  const toggleCheck = (recipeId, i) => {
    const r      = orderRecipes.find(r => r.id === recipeId);
    const name   = r?.ingredients[i]?.name;
    const newVal = !checked[`${recipeId}-${i}`];
    setChecked(prev => {
      const next = { ...prev, [`${recipeId}-${i}`]: newVal };
      orderRecipes.forEach(r => r.ingredients?.forEach((ing, idx) => {
        if (ingsOverlap(ing.name, name) && !(r.id === recipeId && idx === i)) next[`${r.id}-${idx}`] = newVal;
      }));
      return next;
    });
  };

  const toggleExpand  = (idx) => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  const removeRecipe  = (idx) => {
    setOrderRecipes(prev => prev.filter((_, i) => i !== idx));
    setExpanded(prev => {
      const next = {};
      Object.keys(prev).forEach(k => { if (parseInt(k) !== idx) next[parseInt(k) > idx ? parseInt(k) - 1 : k] = prev[k]; });
      return next;
    });
  };

  const totalIngredients = orderRecipes.reduce((sum, r) => sum + (r.ingredients?.length ?? 0), 0);
  const totalPrice       = orderRecipes.reduce((sum, r) => sum + (r.price ?? 0), 0);

  const storesForOrder = sortedStores.map((s, i) => ({
    ...s,
    storeTotal: (totalPrice * (s.price / stores[0].price)).toFixed(2),
    storeItems: i === 0 ? totalIngredients : Math.max(Math.floor(totalIngredients * (0.95 - i * 0.05)), Math.floor(totalIngredients * 0.6)),
    distLabel:  s.distMiles != null ? `${s.distMiles.toFixed(1)} mi` : null,
    timeLabel:  s.distMiles != null ? `${Math.round(20 + s.distMiles * 8)} min` : null,
  }));

  const handleConfirmOrder = async () => {
    await placeOrder?.({
      orderRecipes,
      ingredients:  orderRecipes.flatMap(r => r.ingredients ?? []),
      address:      deliveryAddress,
      store:        storesForOrder[selected],
      deliveryType: selected === 0 ? "delivery" : "pickup",
      subtotal:     totalPrice,
      total:        totalPrice * (selected === 0 ? 1 : 0.87),
    });
    setConfirmed(true);
  };

  // ── Confirmed state ─────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: ACCENT2 + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT, margin: "0 0 8px", fontFamily: "Georgia, serif" }}>Order Placed!</h2>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.5, margin: "0 0 28px" }}>
          Your ingredients for {orderRecipes.length} {orderRecipes.length === 1 ? "recipe" : "recipes"} are being picked now.
        </p>
        <div style={{ background: CARD, borderRadius: 20, padding: "18px 24px", width: "100%", border: `1px solid ${BORDER}`, marginBottom: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: ACCENT2, marginBottom: 4 }}>45 min</div>
          <div style={{ fontSize: 13, color: MUTED }}>Estimated arrival</div>
          <div style={{ marginTop: 8, fontSize: 12, color: MUTED }}>📍 {storesForOrder[selected]?.name}</div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {orderRecipes.map(r => (
              <span key={r.id} style={{ fontSize: 13, background: ACCENT2 + "15", color: ACCENT2, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>{r.emoji} {r.name}</span>
            ))}
          </div>
        </div>
        <button onClick={() => { setConfirmed(false); setScreen("home"); }} style={{ width: "100%", padding: "16px", borderRadius: 18, background: ACCENT, color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          Back to Home
        </button>
      </div>
    );
  }

  // ── Main order view ─────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130 }}>

      {/* Empty state */}
      {orderRecipes.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 40px 0", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🛒</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Nothing in your order yet</div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>Browse recipes and add ingredients to get started</div>
          <button onClick={() => setScreen("explore")} style={{ background: ACCENT2, color: "#fff", border: "none", borderRadius: 16, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 14px ${ACCENT2}44` }}>
            Browse Recipes
          </button>
        </div>
      ) : (<>

        {/* Header */}
        <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "54px 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: ACCENT, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Your Order</h2>
            <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{orderRecipes.length} {orderRecipes.length === 1 ? "recipe" : "recipes"} · {totalIngredients} items</div>
          </div>

          {/* Address */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => { if (!editingAddress) setEditingAddress(true); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {editingAddress ? (
                <input ref={addressInputRef} value={deliveryAddress} onChange={e => handleAddressChange(e.target.value)} onBlur={handleAddressBlur} onKeyDown={e => e.key === "Enter" && !suggestions.length && setEditingAddress(false)} placeholder="Search address…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 20, fontWeight: 500, color: TEXT, fontFamily: "inherit", padding: 0 }} />
              ) : (
                <span style={{ fontSize: 20, color: MUTED }}>{deliveryAddress || "Add a delivery address…"}</span>
              )}
              {!editingAddress && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.4 }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
            </div>

            {/* Autocomplete */}
            {editingAddress && (suggestions.length > 0 || loadingPlaces) && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: -20, right: -20, background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
                {loadingPlaces && !suggestions.length
                  ? <div style={{ padding: "14px 16px", fontSize: 13, color: MUTED }}>Searching…</div>
                  : suggestions.map((s, i) => (
                    <div key={s.place_id}>
                      <div onMouseDown={() => selectSuggestion(s.description)} onTouchStart={() => selectSuggestion(s.description)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{s.description}</span>
                      </div>
                      {i < suggestions.length - 1 && <div style={{ height: 1, background: BORDER, marginLeft: 39 }} />}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Recipe cards */}
        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          {orderRecipes.map((recipe, idx) => (
            <SwipeableRecipeCard key={recipe.id} recipe={recipe} idx={idx} expanded={!!expanded[idx]} toggleExpand={toggleExpand} removeRecipe={removeRecipe} checked={checked} toggleCheck={toggleCheck} />
          ))}
        </div>

        {/* Store picker */}
        <div style={{ padding: "0 20px", marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            Nearby Stores
            {loadingStores && <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #e0e0e0", borderTopColor: ACCENT2, animation: "spin 0.7s linear infinite" }} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {storesForOrder.map((store, i) => (
              <div key={i} onClick={() => setSelected(i)} style={{ background: CARD, borderRadius: 18, padding: "14px 16px", border: `2px solid ${selected === i ? ACCENT2 : BORDER}`, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: store.color, fontSize: 12 }}>●</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{store.name}</span>
                      {i === 0 && userLocation && <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT2, background: ACCENT2 + "15", borderRadius: 6, padding: "2px 6px" }}>Closest</span>}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{store.distLabel ? `${store.distLabel} · Est. ${store.timeLabel}` : store.address}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: ACCENT2 }}>${store.storeTotal}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{store.storeItems}/{totalIngredients} items</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {orderRecipes.flatMap(r => r.ingredients ?? []).slice(0, store.storeItems).map((ing, j) => (
                    <div key={j} style={{ background: "#E8F4EA", borderRadius: 8, padding: "4px 8px", fontSize: 13 }}>{ing.emoji}</div>
                  ))}
                  {store.storeItems < totalIngredients && <div style={{ background: "#FFE8E8", borderRadius: 8, padding: "4px 8px", fontSize: 11, color: "#C62828", fontWeight: 600 }}>✗ {totalIngredients - store.storeItems} missing</div>}
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleConfirmOrder} style={{ width: "100%", marginTop: 20, padding: "16px", borderRadius: 18, background: ACCENT2, color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 14px ${ACCENT2}55` }}>
            ✓ Confirm Order · ${(totalPrice * (selected === 0 ? 1 : 0.87)).toFixed(2)}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>)}
    </div>
  );
}
