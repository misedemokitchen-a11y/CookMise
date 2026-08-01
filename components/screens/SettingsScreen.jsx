"use client";
import { useState, useRef, useEffect } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";

// ── ProfileField helper ───────────────────────────────────────────────────────
function ProfileField({ label, fieldKey, placeholder, type = "text", value, focused, onChange, onFocus, onBlur }) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: focused === fieldKey ? "#FAFAF8" : CARD, transition: "background 0.15s" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(fieldKey, e.target.value)}
        onFocus={() => onFocus(fieldKey)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: TEXT, fontFamily: "inherit", width: "100%" }}
      />
    </div>
  );
}

// ── DietScreen ────────────────────────────────────────────────────────────────
function DietScreen({ onBack, dietaryPrefs = {}, saveDiet }) {
  const [prefs, setPrefs] = useState(dietaryPrefs);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    await saveDiet?.(prefs);
    setSaved(true);
    setTimeout(() => { setSaved(false); onBack(); }, 800);
  };

  const sections = [
    { title: "Dietary Lifestyle", items: ["Vegan", "Vegetarian", "Pescatarian", "Halal", "Kosher", "Keto", "Paleo"] },
    { title: "Allergies & Intolerances", items: ["Gluten-Free", "Dairy-Free", "Nut-Free", "Egg-Free", "Soy-Free", "Shellfish-Free"] },
    { title: "Ingredient Preferences", items: ["Organic Only", "No Processed Foods", "Local & Seasonal", "Low Sodium", "Low Sugar"] },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130, background: BG }}>
      <div style={{ padding: "44px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>Diet & Ingredients</h2>
      </div>

      {sections.map(section => (
        <div key={section.title} style={{ margin: "0 20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{section.title}</div>
          <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            {section.items.map((item, i) => (
              <div key={item}>
                <div onClick={() => toggle(item)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", cursor: "pointer" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>{item}</div>
                  <div style={{ width: 44, height: 26, borderRadius: 13, background: prefs[item] ? ACCENT2 : BORDER, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 3, left: prefs[item] ? 21 : 3, width: 20, height: 20, borderRadius: 10, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                  </div>
                </div>
                {i < section.items.length - 1 && <div style={{ height: 1, background: BORDER, marginLeft: 16 }} />}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ margin: "0 20px" }}>
        <button onClick={handleSave} style={{ width: "100%", padding: "16px", borderRadius: 16, background: saved ? ACCENT2 : "#385348", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", transition: "background 0.3s" }}>
          {saved ? "✓ Saved" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

// ── parseAddressComponents ──────────────────────────────────────────────────
// Splits a Google geocode result into street / city / postcode / lat / lng.
function parseAddressComponents(result) {
  if (!result) return { street: "", city: "", postcode: "", lat: null, lng: null };
  const comps = result.address_components || [];
  const get = (type) => comps.find(c => c.types.includes(type))?.long_name || "";
  const street = [get("street_number"), get("route")].filter(Boolean).join(" ");
  const city = get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_2") || "";
  const postcode = get("postal_code");
  const loc = result.geometry?.location || null;
  return {
    street: street || result.formatted_address || "",
    city,
    postcode,
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
  };
}

// ── AddAddressScreen ───────────────────────────────────────────────────────────
// The map is always visible: it defaults to a continental-US view until an
// address is chosen (search result, or an existing saved address when
// editing), then pans/zooms there. It's an Uber/Lyft-style fixed center-pin
// picker: the person drags the map itself and whatever ends up under the pin
// is the saved location.
//
// This still uses the Google Maps JavaScript API — the "cleaner" look apps
// like Uber/Lyft have comes from custom map styling (fewer POI/business
// labels, muted colors, no transit clutter), not a different mapping API.
const USA_CENTER = { lat: 39.8283, lng: -98.5795 };
const USA_ZOOM   = 4;

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F5F3EE" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8A8880" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#EDE9E2" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#CFE3D6" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#EAF0E7" }] },
];

function AddAddressScreen({ onCancel, onSave, initial = null }) {
  const [label,               setLabel]               = useState(initial?.label || "");
  const [query,                setQuery]                = useState(initial ? [initial.street, initial.city, initial.postcode].filter(Boolean).join(", ") : "");
  const [unit,                 setUnit]                 = useState(initial?.unit || "");
  const [notes,                setNotes]                = useState(initial?.notes || "");
  const [suggestions,          setSuggestions]          = useState([]);
  const [loadingSuggestions,   setLoadingSuggestions]   = useState(false);
  const [focused,              setFocused]              = useState(false);
  const [parsed,               setParsed]               = useState(initial ? { street: initial.street, city: initial.city, postcode: initial.postcode } : null);
  const [coords,               setCoords]               = useState(initial && initial.lat != null ? { lat: initial.lat, lng: initial.lng } : null);
  const [saving,               setSaving]               = useState(false);
  const [mapReady,             setMapReady]             = useState(false);
  const [mapError,             setMapError]             = useState(null);

  const mapDivRef         = useRef(null);
  const mapObjRef         = useRef(null);
  const debounceRef       = useRef(null);
  const initialCoordsRef  = useRef(coords); // captured once, for the initial map center only

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapDivRef.current) return;

        const startCoords = initialCoordsRef.current;
        const map = new maps.Map(mapDivRef.current, {
          center: startCoords || USA_CENTER,
          zoom: startCoords ? 17 : USA_ZOOM,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: MAP_STYLE,
        });
        mapObjRef.current = map;
        setMapReady(true);

        // Fires after any pan/zoom settles — keeps `coords` in sync with
        // whatever the center pin points at.
        map.addListener("idle", () => {
          const c = map.getCenter();
          if (c) setCoords({ lat: c.lat(), lng: c.lng() });
        });
      })
      .catch((e) => setMapError(e.message || "Couldn't load the map"));

    return () => { cancelled = true; };
  }, []);

  const fetchSuggestions = async (val) => {
    if (!val.trim()) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    try {
      const res  = await fetch(`/api/places?type=autocomplete&input=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSuggestions(data.predictions?.map(p => ({ place_id: p.place_id, description: p.description })) || []);
    } catch { setSuggestions([]); }
    setLoadingSuggestions(false);
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const handleSelectSuggestion = async (s) => {
    setSuggestions([]);
    setFocused(false);
    setQuery(s.description);
    setLoadingSuggestions(true);
    try {
      const res    = await fetch(`/api/places?type=geocode&input=${encodeURIComponent(s.description)}`);
      const data   = await res.json();
      const result = data.results?.[0];
      const p      = parseAddressComponents(result);
      setParsed(p);
      if (p.lat != null) {
        setCoords({ lat: p.lat, lng: p.lng });
        if (mapObjRef.current) {
          mapObjRef.current.panTo({ lat: p.lat, lng: p.lng });
          mapObjRef.current.setZoom(18);
        }
      } else {
        setCoords(null);
      }
    } catch {
      setParsed(null);
      setCoords(null);
    }
    setLoadingSuggestions(false);
  };

  const handleSave = async () => {
    if (!parsed || !coords) return;
    setSaving(true);
    await onSave({
      id: initial?.id,
      label:    label.trim() || "Home",
      street:   parsed.street,
      unit:     unit.trim(),
      city:     parsed.city,
      postcode: parsed.postcode,
      notes:    notes.trim(),
      lat: coords.lat,
      lng: coords.lng,
    });
    setSaving(false);
  };

  const fieldBoxStyle = { flexShrink: 0, background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: "11px 14px" };
  const fieldStyle = { border: "none", outline: "none", background: "transparent", fontSize: 14.5, color: TEXT, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ position: "absolute", inset: 0, background: BG, zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "44px 20px 12px", display: "flex", alignItems: "center", gap: 14, background: CARD, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={onCancel} style={{ width: 36, height: 36, borderRadius: 12, background: BG, border: `1px solid ${BORDER}`, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>{initial ? "Edit Address" : "Add Address"}</h2>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 8, padding: "12px 20px 0" }}>
        {/* Name */}
        <div style={fieldBoxStyle}>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Name (Home, Work, etc.)" style={fieldStyle} />
        </div>

        {/* Address */}
        <div style={{ ...fieldBoxStyle, position: "relative", zIndex: 5 }}>
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Address"
            style={fieldStyle}
          />
          {focused && (suggestions.length > 0 || loadingSuggestions) && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: "0 8px 28px rgba(0,0,0,0.14)", zIndex: 50, overflow: "hidden" }}>
              {loadingSuggestions && !suggestions.length
                ? <div style={{ padding: "12px 16px", fontSize: 13, color: MUTED }}>Searching…</div>
                : suggestions.map((s, i) => (
                  <div key={s.place_id}>
                    <div onMouseDown={() => handleSelectSuggestion(s)} onTouchStart={() => handleSelectSuggestion(s)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{s.description}</span>
                    </div>
                    {i < suggestions.length - 1 && <div style={{ height: 1, background: BORDER, marginLeft: 38 }} />}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Unit */}
        <div style={fieldBoxStyle}>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit / Apt (optional)" style={fieldStyle} />
        </div>

        {/* Notes */}
        <div style={fieldBoxStyle}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (gate code, entrance, delivery instructions…)"
            rows={1}
            style={{ ...fieldStyle, resize: "none", lineHeight: 1.4 }}
          />
        </div>

        {/* Map — always visible; defaults to a continental-US view until an address is chosen */}
        <div style={{ flex: 1, minHeight: 90, position: "relative", borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden", background: CARD }}>
          <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />

          {mapReady && !mapError && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)", pointerEvents: "none", zIndex: 10 }}>
              <svg width="30" height="42" viewBox="0 0 30 42" fill="none">
                <path d="M15 41C15 41 28.5 24.5 28.5 14.5C28.5 6.7 22.3 1 15 1C7.7 1 1.5 6.7 1.5 14.5C1.5 24.5 15 41 15 41Z" fill={ACCENT2} stroke="#fff" strokeWidth="2"/>
                <circle cx="15" cy="14.5" r="5.5" fill="#fff"/>
              </svg>
            </div>
          )}

          {!mapReady && !mapError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: MUTED }}>Loading map…</div>
          )}
          {mapError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#C0392B", padding: 24, textAlign: "center", lineHeight: 1.5 }}>{mapError}</div>
          )}
        </div>
        <div style={{ flexShrink: 0, fontSize: 10.5, color: MUTED, margin: "0 2px 8px", lineHeight: 1.4, textAlign: "center" }}>
          {parsed
            ? "Move the map so the pin points to your exact location"
            : "Search for an address above to get started"}
        </div>
      </div>

      <div style={{ padding: 16, background: CARD, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "#F4F2EE", border: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!parsed || !coords || saving}
            style={{ flex: 1, padding: "13px", borderRadius: 12, background: (!parsed || !coords) ? BORDER : "#385348", border: "none", fontSize: 14, fontWeight: 700, color: (!parsed || !coords) ? MUTED : "#fff", cursor: (!parsed || !coords) ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AddressRow ─────────────────────────────────────────────────────────────
function AddressRow({ addr, isDefault, isDragging, dragStyle, dragHandleProps, onEdit, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 12px 14px 6px", background: isDragging ? "#FAFAF8" : CARD, ...dragStyle }}>
      <div {...dragHandleProps} style={{ cursor: "grab", color: MUTED, fontSize: 18, padding: "4px 6px", touchAction: "none", flexShrink: 0, userSelect: "none", lineHeight: 1 }}>⠿</div>

      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onEdit(addr)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr.label}</span>
          {isDefault && <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT2, background: ACCENT2 + "15", borderRadius: 20, padding: "2px 7px", flexShrink: 0, letterSpacing: 0.4 }}>DEFAULT</span>}
        </div>
        <div style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {addr.street}{addr.unit ? `, ${addr.unit}` : ""}{addr.city ? `, ${addr.city}` : ""}{addr.postcode ? `, ${addr.postcode}` : ""}
        </div>
        {addr.notes && (
          <div style={{ fontSize: 11, color: MUTED, fontStyle: "italic", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📝 {addr.notes}
          </div>
        )}
      </div>

      <button onClick={() => onEdit(addr)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14, padding: 6, flexShrink: 0 }}>✎</button>
      <button onClick={() => onDelete(addr.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: 14, padding: 6, flexShrink: 0 }}>🗑</button>
    </div>
  );
}

// ── DraggableAddressList ──────────────────────────────────────────────────────
// Pointer-based drag & drop reorder (works for mouse + touch). Whatever ends up
// on top becomes the default address.
const ROW_HEIGHT = 74; // approx row height incl. divider, used for swap thresholds

function DraggableAddressList({ addresses, onReorder, onEdit, onDelete }) {
  // `dragOrder` only exists while a drag is in progress — it's the live,
  // reordered copy. When not dragging, we render `addresses` directly so
  // there's no prop-to-state syncing effect needed.
  const [dragOrder,  setDragOrder]  = useState(null);
  const [dragIndex,  setDragIndex]  = useState(null);
  const [offsetY,    setOffsetY]    = useState(0);

  const dragIndexRef = useRef(null);
  const startYRef     = useRef(0);
  const orderRef       = useRef(addresses);

  const list = dragOrder || addresses;

  const onPointerDown = (e, index) => {
    orderRef.current = addresses;
    dragIndexRef.current = index;
    setDragIndex(index);
    setDragOrder(addresses);
    startYRef.current = e.clientY;
    setOffsetY(0);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    if (dragIndexRef.current === null) return;
    const delta = e.clientY - startYRef.current;
    setOffsetY(delta);

    const moveBy = Math.round(delta / ROW_HEIGHT);
    if (moveBy !== 0) {
      const from = dragIndexRef.current;
      const to   = Math.min(Math.max(from + moveBy, 0), orderRef.current.length - 1);
      if (to !== from) {
        const next = [...orderRef.current];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        orderRef.current = next;
        setDragOrder(next);
        dragIndexRef.current = to;
        startYRef.current += moveBy * ROW_HEIGHT;
        setOffsetY(delta - moveBy * ROW_HEIGHT);
      }
    }
  };

  const endDrag = () => {
    if (dragIndexRef.current === null) return;
    dragIndexRef.current = null;
    setDragIndex(null);
    setOffsetY(0);
    const finalOrder = orderRef.current;
    setDragOrder(null);
    onReorder(finalOrder.map(a => a.id));
  };

  return (
    <div
      style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden" }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={e => { if (e.buttons === 0) endDrag(); }}
    >
      {list.map((addr, i) => {
        const dragging = dragIndex === i;
        return (
          <div key={addr.id}>
            <AddressRow
              addr={addr}
              isDefault={i === 0}
              isDragging={dragging}
              dragStyle={
                dragging
                  ? { transform: `translateY(${offsetY}px)`, position: "relative", zIndex: 5, boxShadow: "0 6px 20px rgba(0,0,0,0.16)", borderRadius: 12 }
                  : { transition: "transform 0.15s" }
              }
              dragHandleProps={{ onPointerDown: (e) => onPointerDown(e, i) }}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {i < list.length - 1 && <div style={{ height: 1, background: BORDER, marginLeft: 16 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── AddressesScreen ────────────────────────────────────────────────────────────
function AddressesScreen({ onBack, addresses = [], addAddress, updateAddress, deleteAddress, reorderAddresses }) {
  // Single state slot drives the form: null = closed, "new" = add mode,
  // an address object = edit mode. Both cases render the exact same
  // AddAddressScreen — there's no separate "add screen" vs "edit screen".
  const [formTarget, setFormTarget] = useState(null);

  const handleSave = async (fields) => {
    if (fields.id) await updateAddress?.(fields.id, fields);
    else await addAddress?.(fields);
    setFormTarget(null);
  };

  const handleDelete = async (id) => {
    await deleteAddress?.(id);
  };

  if (formTarget) {
    return (
      <AddAddressScreen
        initial={formTarget === "new" ? null : formTarget}
        onCancel={() => setFormTarget(null)}
        onSave={handleSave}
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130, background: BG }}>
      <div style={{ padding: "44px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>Addresses</h2>
      </div>

      <div style={{ margin: "0 20px 12px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
        Delivery Addresses
      </div>

      {addresses.length > 0 && (
        <div style={{ margin: "0 20px 12px" }}>
          <DraggableAddressList
            addresses={addresses}
            onReorder={reorderAddresses}
            onEdit={setFormTarget}
            onDelete={handleDelete}
          />
          <div style={{ fontSize: 11, color: MUTED, margin: "8px 4px 0", lineHeight: 1.5 }}>
            Drag <span style={{ fontWeight: 700 }}>⠿</span> to reorder — the address on top is used as your default. Tap an address to edit it.
          </div>
        </div>
      )}

      {addresses.length === 0 && (
        <div style={{ margin: "0 20px 20px", padding: "24px 16px", textAlign: "center", background: CARD, borderRadius: 18, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, color: MUTED }}>No addresses yet. Add one to get started.</div>
        </div>
      )}

      <div style={{ margin: "0 20px" }}>
        <button
          onClick={() => setFormTarget("new")}
          style={{ width: "100%", padding: "14px", borderRadius: 16, background: "#FFF", border: `1.5px dashed ${ACCENT2}55`, fontSize: 14, fontWeight: 700, color: ACCENT2, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Add Address
        </button>
      </div>
    </div>
  );
}

// ── ProfileScreen ─────────────────────────────────────────────────────────────
function ProfileScreen({ onBack, user, profile, setProfile, updateProfile }) {
  const [fields, setFields] = useState({ ...profile });
  const [focused, setFocused] = useState(null);
  const [saved,   setSaved]   = useState(false);

  const update = (key, val) => setFields(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setProfile(fields);
    await updateProfile?.(fields);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130, background: BG }}>
      <div style={{ padding: "44px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>Profile</h2>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", overflow: "hidden", marginBottom: 10 }}>
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
            : (fields.firstName?.[0] || "U").toUpperCase()
          }
        </div>
        <button style={{ fontSize: 13, fontWeight: 600, color: ACCENT2, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Change Photo</button>
      </div>

      {/* Personal Info */}
      <div style={{ margin: "0 20px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Personal Info</div>
        <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <ProfileField label="First Name"  fieldKey="firstName" placeholder="First name"          value={fields.firstName} focused={focused} onChange={update} onFocus={setFocused} onBlur={() => setFocused(null)} />
          <ProfileField label="Last Name"   fieldKey="lastName"  placeholder="Last name"           value={fields.lastName}  focused={focused} onChange={update} onFocus={setFocused} onBlur={() => setFocused(null)} />
          <ProfileField label="Email"       fieldKey="email"     placeholder="you@example.com" type="email" value={fields.email} focused={focused} onChange={update} onFocus={setFocused} onBlur={() => setFocused(null)} />
          <ProfileField label="Phone"       fieldKey="phone"     placeholder="+1 (555) 000-0000" type="tel" value={fields.phone} focused={focused} onChange={update} onFocus={setFocused} onBlur={() => setFocused(null)} />
        </div>
      </div>

      <div style={{ margin: "0 20px" }}>
        <button onClick={handleSave} style={{ width: "100%", padding: "16px", borderRadius: 16, background: saved ? ACCENT2 : "#385348", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px rgba(56,83,72,0.35)`, transition: "background 0.3s" }}>
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── SettingsScreen ────────────────────────────────────────────────────────────
export function SettingsScreen({ onClose, user, profile, setProfile, updateProfile, dietaryPrefs, saveDiet, addresses, addAddress, updateAddress, deleteAddress, reorderAddresses }) {
  const [subScreen, setSubScreen] = useState(null);

  if (subScreen === "diet")      return <DietScreen      onBack={() => setSubScreen(null)} dietaryPrefs={dietaryPrefs} saveDiet={saveDiet} />;
  if (subScreen === "profile")   return <ProfileScreen   onBack={() => setSubScreen(null)} user={user} profile={profile} setProfile={setProfile} updateProfile={updateProfile} />;
  if (subScreen === "addresses") return <AddressesScreen onBack={() => setSubScreen(null)} addresses={addresses} addAddress={addAddress} updateAddress={updateAddress} deleteAddress={deleteAddress} reorderAddresses={reorderAddresses} />;

  const sections = [
    { title: "Account", items: [
      { icon: "👤", label: "Profile",       desc: "Name, photo, username",                      onTap: () => setSubScreen("profile") },
      { icon: "📍", label: "Addresses",     desc: "Delivery addresses & default",               onTap: () => setSubScreen("addresses") },
      { icon: "🔔", label: "Notifications", desc: "Meal reminders, updates" },
      { icon: "🔒", label: "Privacy",       desc: "Data & permissions" },
    ]},
    { title: "Preferences", items: [
      { icon: "🥗", label: "Diet & Ingredients",  desc: "Restrictions, allergies & preferred ingredients", onTap: () => setSubScreen("diet") },
      { icon: "🌍", label: "Cuisine Preferences", desc: "Your favourite cuisines" },
      { icon: "⏱️", label: "Cooking Time",        desc: "Max time per recipe" },
      { icon: "💰", label: "Budget",              desc: "Ingredient spend per meal" },
    ]},
    { title: "App", items: [
      { icon: "🌙", label: "Appearance",     desc: "Light, dark or system" },
      { icon: "🌐", label: "Language",       desc: "English (US)" },
      { icon: "📦", label: "Storage & Cache", desc: "Manage offline data" },
    ]},
    { title: "Support", items: [
      { icon: "❓", label: "Help & FAQ",  desc: "Common questions" },
      { icon: "✉️", label: "Contact Us",  desc: "Get in touch" },
      { icon: "⭐", label: "Rate mise.", desc: "Leave a review" },
    ]},
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 140, background: BG }}>
      <div style={{ padding: "44px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>Settings</h2>
      </div>

      {/* Profile card */}
      <div onClick={() => setSubScreen("profile")} style={{ margin: "0 20px 24px", background: CARD, borderRadius: 20, padding: "16px", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ width: 52, height: 52, borderRadius: 26, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
            : (user?.user_metadata?.full_name?.[0] || "U").toUpperCase()
          }
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: TEXT }}>{user?.user_metadata?.full_name || "User"}</div>
          <div style={{ fontSize: 13, color: MUTED }}>{user?.email || ""}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 18, color: MUTED }}>›</div>
      </div>

      {/* Sections */}
      {sections.map(section => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, padding: "0 20px", marginBottom: 8 }}>{section.title}</div>
          <div style={{ margin: "0 20px", background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            {section.items.map((item, i) => (
              <div key={item.label}>
                <div onClick={() => item.onTap?.()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", cursor: "pointer" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{item.label}</div>
                  <div style={{ fontSize: 16, color: MUTED }}>›</div>
                </div>
                {i < section.items.length - 1 && <div style={{ height: 1, background: BORDER, marginLeft: 16 }} />}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ margin: "0 20px" }}>
        <button onClick={handleSignOut} style={{ width: "100%", padding: "15px", borderRadius: 16, background: "#FFF0EE", border: `1px solid #FFD5CF`, fontSize: 15, fontWeight: 700, color: "#C0392B", cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
      </div>
    </div>
  );
}
