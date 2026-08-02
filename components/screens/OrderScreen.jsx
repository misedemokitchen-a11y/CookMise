"use client";
import { useState, useEffect, useRef } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";

// ── SwipeableRecipeCard ───────────────────────────────────────────────────────
function SwipeableRecipeCard({ recipe, idx, expanded, toggleExpand, removeRecipe, checked, toggleCheck, krogerResults }) {
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
        onTouchMove={(e) => { if (touchStartRef.current === null) return; const dx = e.touches[0].clientX - touchStartRef.current; if (dx < 0) setSwipeX(Math.max(dx, -THRESHOLD - 20)); }}
        onTouchEnd={() => { setIsSwiping(false); if (swipeX < -THRESHOLD) removeRecipe(idx); else setSwipeX(0); touchStartRef.current = null; }}
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
              const key = `${recipe.id}-${i}`;
              const kroger = krogerResults?.[ing.name];
              const isUnavailable = kroger?.found === false;
              const isChecked = !isUnavailable && checked[key] !== false; // checked = needs buying; unchecked = already have
              return (
                <div key={i}>
                  <div
                    onClick={() => { if (!isUnavailable) toggleCheck(recipe.id, i); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: isUnavailable ? "default" : "pointer", opacity: isUnavailable ? 0.5 : 1 }}
                  >
                    {kroger?.image && (
                      <img src={kroger.image} alt={ing.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: isUnavailable || !isChecked ? MUTED : TEXT, textDecoration: !isUnavailable && !isChecked ? "line-through" : "none", transition: "all 0.15s ease" }}>{ing.name}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 1, display: "flex", gap: 8 }}>
                        <span>{ing.qty}</span>
                        {kroger?.found && kroger?.price && <span style={{ color: ACCENT2, fontWeight: 600 }}>${kroger.price}</span>}
                        {isUnavailable && <span style={{ color: "#E53935" }}>Not at this store</span>}
                      </div>
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
  const [confirmed,          setConfirmed]          = useState(false);
  const [selected,           setSelected]           = useState(0);
  const [checked,            setChecked]            = useState({});
  const [expanded,           setExpanded]           = useState({ 0: true });
  const [deliveryAddress,    setDeliveryAddress]    = useState(defaultAddress ? `${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.postcode}` : "");
  const [editingAddress,     setEditingAddress]     = useState(false);
  const [suggestions,        setSuggestions]        = useState([]);
  const [loadingPlaces,      setLoadingPlaces]      = useState(false);
  const [loadingStores,      setLoadingStores]      = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [krogerStores,       setKrogerStores]       = useState([]);
  const [krogerResults,      setKrogerResults]      = useState({});
  const [userCoords,         setUserCoords]         = useState(null);
  const addressInputRef = useRef(null);
  const debounceRef     = useRef(null);

  useEffect(() => { if (editingAddress && addressInputRef.current) addressInputRef.current.focus(); }, [editingAddress]);
  useEffect(() => { if (deliveryAddress) findStoresAndIngredients(deliveryAddress); }, []);

  const findStoresAndIngredients = async (address) => {
    setLoadingStores(true);
    setKrogerStores([]);
    setKrogerResults({});
    try {
      const geoRes  = await fetch(`/api/places?type=geocode&input=${encodeURIComponent(address)}`);
      const geoData = await geoRes.json();
      if (!geoData.results?.[0]) { setLoadingStores(false); return; }

      const { lat, lng } = geoData.results[0].geometry.location;
      setUserCoords({ lat, lng });

      const storeRes  = await fetch(`/api/kroger?type=stores&lat=${lat}&lng=${lng}`);
      const storeData = await storeRes.json();
      const stores = storeData.data?.data || storeData.data || [];
      setKrogerStores(stores);
      setLoadingStores(false);

      if (stores.length > 0) {
        setLoadingIngredients(true);
        const locationId  = stores[0].locationId;
        const ingredients = orderRecipes.flatMap(r => r.ingredients ?? []).map(i => i.name);
        const unique      = [...new Set(ingredients)];

        const results = await Promise.all(
          unique.map(async (name) => {
            const res     = await fetch(`/api/kroger?type=product&query=${encodeURIComponent(name)}&locationId=${locationId}`);
            const data    = await res.json();
            const product = data.data?.[0];
            return [name, {
              found: !!product,
              name:  product?.description,
              price: product?.items?.[0]?.price?.regular,
              image: product?.images?.find(i => i.perspective === "front")?.sizes?.find(s => s.size === "thumbnail")?.url,
            }];
          })
        );

        setKrogerResults(Object.fromEntries(results));
        setLoadingIngredients(false);
      }
    } catch (e) {
      console.error(e);
      setLoadingStores(false);
      setLoadingIngredients(false);
    }
  };

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

  const handleAddressChange = (value) => {
    setDeliveryAddress(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  const selectSuggestion = (desc) => {
    setDeliveryAddress(desc);
    setSuggestions([]);
    setEditingAddress(false);
    findStoresAndIngredients(desc);
  };

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
    if (krogerResults?.[name]?.found === false) return; // unavailable — not toggleable
    const currentlyChecked = checked[`${recipeId}-${i}`] !== false;
    const newVal = !currentlyChecked;
    setChecked(prev => {
      const next = { ...prev, [`${recipeId}-${i}`]: newVal };
      orderRecipes.forEach(r => r.ingredients?.forEach((ing, idx) => {
        if (krogerResults?.[ing.name]?.found === false) return; // unavailable — skip when syncing matches
        if (ingsOverlap(ing.name, name) && !(r.id === recipeId && idx === i)) next[`${r.id}-${idx}`] = newVal;
      }));
      return next;
    });
  };

  const toggleExpand = (idx) => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  const removeRecipe = (idx) => {
    setOrderRecipes(prev => prev.filter((_, i) => i !== idx));
    setExpanded(prev => {
      const next = {};
      Object.keys(prev).forEach(k => { if (parseInt(k) !== idx) next[parseInt(k) > idx ? parseInt(k) - 1 : k] = prev[k]; });
      return next;
    });
  };

  // Whether a given (unique) ingredient name is currently checked — looks up
  // the first matching instance across the cart's recipes.
  const isIngredientChecked = (name) => {
    for (const r of orderRecipes) {
      const idx = r.ingredients?.findIndex(ing => ing.name === name) ?? -1;
      if (idx >= 0) return checked[`${r.id}-${idx}`] !== false;
    }
    return true;
  };

  const totalIngredients = orderRecipes.reduce((sum, r) => sum + (r.ingredients?.length ?? 0), 0);
  const foundCount       = Object.values(krogerResults).filter(r => r.found).length;
  const krogerTotal      = Object.entries(krogerResults).reduce(
    (sum, [name, r]) => (r.price && isIngredientChecked(name) ? sum + r.price : sum),
    0
  );
  const selectedStore    = krogerStores[selected];

  const handleConfirmOrder = async () => {
    const checkedIngredients = orderRecipes.flatMap(r =>
      (r.ingredients ?? []).filter((ing, idx) =>
        checked[`${r.id}-${idx}`] !== false && krogerResults?.[ing.name]?.found !== false
      )
    );
    await placeOrder?.({
      orderRecipes,
      ingredients:  checkedIngredients,
      address:      deliveryAddress,
      store:        selectedStore?.name,
      deliveryType: "delivery",
      subtotal:     krogerTotal,
      total:        krogerTotal,
    });
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: ACCENT2 + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT, margin: "0 0 8px", fontFamily: "Georgia, serif" }}>Order Placed!</h2>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.5, margin: "0 0 28px" }}>
          Your ingredients for {orderRecipes.length} {orderRecipes.length === 1 ? "recipe" : "recipes"} are on their way.
        </p>
        <div style={{ background: CARD, borderRadius: 20, padding: "18px 24px", width: "100%", border: `1px solid ${BORDER}`, marginBottom: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: ACCENT2, marginBottom: 4 }}>45 min</div>
          <div style={{ fontSize: 13, color: MUTED }}>Estimated arrival</div>
          <div style={{ marginTop: 8, fontSize: 12, color: MUTED }}>📍 {selectedStore?.name}</div>
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

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130 }}>
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
            <SwipeableRecipeCard key={recipe.id} recipe={recipe} idx={idx} expanded={!!expanded[idx]} toggleExpand={toggleExpand} removeRecipe={removeRecipe} checked={checked} toggleCheck={toggleCheck} krogerResults={krogerResults} />
          ))}
        </div>

        {/* Kroger stores */}
        <div style={{ padding: "0 20px", marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            Nearby Stores
            {(loadingStores || loadingIngredients) && (
              <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #e0e0e0", borderTopColor: ACCENT2, animation: "spin 0.7s linear infinite" }} />
            )}
          </div>

          {!deliveryAddress && (
            <div style={{ fontSize: 13, color: MUTED, padding: "12px 0" }}>Enter a delivery address to find nearby stores.</div>
          )}

          {deliveryAddress && !loadingStores && krogerStores.length === 0 && (
            <div style={{ fontSize: 13, color: MUTED, padding: "12px 0" }}>No Kroger stores found near this address.</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {krogerStores.map((store, i) => {
              const distMiles = userCoords
                ? Math.sqrt(Math.pow(store.geolocation.latitude - userCoords.lat, 2) + Math.pow(store.geolocation.longitude - userCoords.lng, 2)) * 69
                : null;

              return (
                <div key={store.locationId} onClick={() => setSelected(i)} style={{ background: CARD, borderRadius: 18, padding: "14px 16px", border: `2px solid ${selected === i ? ACCENT2 : BORDER}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{store.name}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                        {store.address.addressLine1}, {store.address.city}
                        {distMiles != null && ` · ${distMiles.toFixed(1)} mi`}
                      </div>
                    </div>
                    {selected === i && krogerTotal > 0 && (
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: ACCENT2 }}>${krogerTotal.toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: MUTED }}>{foundCount}/{totalIngredients} found</div>
                      </div>
                    )}
                  </div>

                  {selected === i && (
                    <div>
                      {loadingIngredients ? (
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Checking ingredient availability…</div>
                      ) : (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                          {Object.entries(krogerResults).map(([name, result]) => (
                            <div key={name} style={{ background: result.found ? "#E8F4EA" : "#FFE8E8", borderRadius: 8, padding: "3px 8px", fontSize: 11, color: result.found ? "#2D6A4F" : "#C62828", fontWeight: 600 }}>
                              {result.found ? "✓" : "✗"} {name.split(" ")[0]}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {krogerStores.length > 0 && (
            <button
              onClick={handleConfirmOrder}
              disabled={loadingIngredients}
              style={{ width: "100%", marginTop: 20, padding: "16px", borderRadius: 18, background: loadingIngredients ? MUTED : ACCENT2, color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: loadingIngredients ? "default" : "pointer", fontFamily: "inherit", boxShadow: `0 4px 14px ${ACCENT2}55` }}>
              {loadingIngredients ? "Finding ingredients…" : `✓ Confirm Order · $${krogerTotal.toFixed(2)}`}
            </button>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>)}
    </div>
  );
}