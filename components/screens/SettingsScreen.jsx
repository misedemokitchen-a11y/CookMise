"use client";
import { useState, useRef } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { LocationMapPicker } from "@/components/ui/LocationMapPicker";


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
// Splits a Google geocode result into street / city / postcode.
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

// ── AddressAutocomplete ──────────────────────────────────────────────────────
// Google Places fill-as-you-type input, reused from OrderScreen's pattern.
function AddressAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [focused,     setFocused]     = useState(false);
  const debounceRef = useRef(null);

  const fetchSuggestions = async (val) => {
    if (!val.trim()) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/places?type=autocomplete&input=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSuggestions(data.predictions?.map(p => ({ place_id: p.place_id, description: p.description })) || []);
    } catch { setSuggestions([]); }
    setLoading(false);
  };

  const handleChange = (val) => {
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const handleSelect = async (s) => {
    setSuggestions([]);
    setLoading(true);
    try {
      const res    = await fetch(`/api/places?type=geocode&input=${encodeURIComponent(s.description)}`);
      const data   = await res.json();
      const result = data.results?.[0];
      onChange(s.description);
      onSelect?.(parseAddressComponents(result));
    } catch {
      onChange(s.description);
      onSelect?.(null);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value || ""}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: TEXT, fontFamily: "inherit", width: "100%" }}
      />
      {focused && (suggestions.length > 0 || loading) && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: -16, right: -16, background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: "0 8px 28px rgba(0,0,0,0.14)", zIndex: 300, overflow: "hidden" }}>
          {loading && !suggestions.length
            ? <div style={{ padding: "12px 16px", fontSize: 13, color: MUTED }}>Searching…</div>
            : suggestions.map((s, i) => (
              <div key={s.place_id}>
                <div onMouseDown={() => handleSelect(s)} onTouchStart={() => handleSelect(s)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", cursor: "pointer" }}>
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
  );
}

// ── AddAddressPanel ───────────────────────────────────────────────────────────
// ── AddAddressPanel ───────────────────────────────────────────────────────────
function AddAddressPanel({ onCancel, onSave }) {
  const [label,           setLabel]           = useState("Home");
  const [query,           setQuery]           = useState("");
  const [parsed,          setParsed]          = useState(null); // { street, city, postcode, lat, lng }
  const [confirmedCoords, setConfirmedCoords] = useState(null); // { lat, lng } once fine-tuned on the map
  const [showMap,         setShowMap]         = useState(false);
  const [saving,          setSaving]          = useState(false);

  const handleSelect = (p) => {
    setParsed(p);
    setConfirmedCoords(null); // reset fine-tuning when a new address is picked
  };

  const coords = confirmedCoords || (parsed && parsed.lat != null ? { lat: parsed.lat, lng: parsed.lng } : null);

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    await onSave({
      label:   label.trim() || "Home",
      street:  parsed.street,
      city:    parsed.city,
      postcode: parsed.postcode,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });
    setSaving(false);
  };

  if (showMap && coords) {
    return (
      <LocationMapPicker
        lat={coords.lat}
        lng={coords.lng}
        addressLabel={query}
        onCancel={() => setShowMap(false)}
        onConfirm={(c) => { setConfirmedCoords(c); setShowMap(false); }}
      />
    );
  }

  return (
    <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: 16, margin: "0 20px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Label</div>
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Home, Work, etc."
        style={{ border: "none", outline: "none", background: "#FAFAF8", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: TEXT, fontFamily: "inherit", width: "100%", marginBottom: 14, boxSizing: "border-box" }}
      />

      <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Address</div>
      <div style={{ background: "#FAFAF8", borderRadius: 10, padding: "10px 12px" }}>
        <AddressAutocomplete value={query} onChange={setQuery} onSelect={handleSelect} placeholder="Start typing an address…" />
      </div>

      {parsed && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
            📍 {parsed.street}{parsed.city ? `, ${parsed.city}` : ""}{parsed.postcode ? `, ${parsed.postcode}` : ""}
          </div>
          {coords && (
            <button
              onClick={() => setShowMap(true)}
              style={{ marginTop: 8, width: "100%", padding: "10px", borderRadius: 10, background: confirmedCoords ? ACCENT2 + "12" : "#FAFAF8", border: `1px solid ${confirmedCoords ? ACCENT2 + "40" : BORDER}`, fontSize: 12.5, fontWeight: 700, color: confirmedCoords ? ACCENT2 : TEXT, cursor: "pointer", fontFamily: "inherit" }}
            >
              {confirmedCoords ? "✓ Pin fine-tuned — tap to adjust again" : "🗺️  Fine-tune exact location on map"}
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#F4F2EE", border: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700, color: TEXT, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        <button
          onClick={handleSave}
          disabled={!parsed || saving}
          style={{ flex: 1, padding: "12px", borderRadius: 12, background: !parsed ? BORDER : "#385348", border: "none", fontSize: 14, fontWeight: 700, color: !parsed ? MUTED : "#fff", cursor: !parsed ? "default" : "pointer", fontFamily: "inherit" }}
        >
          {saving ? "Saving…" : "Add Address"}
        </button>
      </div>
    </div>
  );
}

// ── AddressRow ─────────────────────────────────────────────────────────────
function AddressRow({ addr, isDefault, isDragging, dragStyle, dragHandleProps, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label,   setLabel]   = useState(addr.label);

  const commitRename = () => {
    setEditing(false);
    const trimmed = label.trim();
    if (trimmed && trimmed !== addr.label) onRename(addr.id, trimmed);
    else setLabel(addr.label);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 12px 14px 6px", background: isDragging ? "#FAFAF8" : CARD, ...dragStyle }}>
      <div {...dragHandleProps} style={{ cursor: "grab", color: MUTED, fontSize: 18, padding: "4px 6px", touchAction: "none", flexShrink: 0, userSelect: "none", lineHeight: 1 }}>⠿</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          {editing ? (
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => e.key === "Enter" && commitRename()}
              style={{ border: "none", outline: "none", background: "#FAFAF8", borderRadius: 6, padding: "2px 6px", fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: "inherit", minWidth: 0 }}
            />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr.label}</span>
          )}
          {isDefault && <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT2, background: ACCENT2 + "15", borderRadius: 20, padding: "2px 7px", flexShrink: 0, letterSpacing: 0.4 }}>DEFAULT</span>}
        </div>
        <div style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {addr.street}{addr.city ? `, ${addr.city}` : ""}{addr.postcode ? `, ${addr.postcode}` : ""}
        </div>
      </div>

      {!editing && (
        <button onClick={() => setEditing(true)} title="Rename" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14, padding: 6, flexShrink: 0 }}>✎</button>
      )}
      <button onClick={() => onDelete(addr.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#C0392B", fontSize: 14, padding: 6, flexShrink: 0 }}>🗑</button>
    </div>
  );
}

// ── DraggableAddressList ──────────────────────────────────────────────────────
// Pointer-based drag & drop reorder (works for mouse + touch). Whatever ends up
// on top becomes the default address.
const ROW_HEIGHT = 74; // approx row height incl. divider, used for swap thresholds

function DraggableAddressList({ addresses, onReorder, onRename, onDelete }) {
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
              onRename={onRename}
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
function AddressesScreen({ onBack, addresses = [], addAddress, renameAddress, deleteAddress, reorderAddresses }) {
  const [adding, setAdding] = useState(false);

  const handleAdd = async (fields) => {
    await addAddress?.(fields);
    setAdding(false);
  };

  const handleDelete = async (id) => {
    await deleteAddress?.(id);
  };

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
            onRename={renameAddress}
            onDelete={handleDelete}
          />
          <div style={{ fontSize: 11, color: MUTED, margin: "8px 4px 0", lineHeight: 1.5 }}>
            Drag <span style={{ fontWeight: 700 }}>⠿</span> to reorder — the address on top is used as your default.
          </div>
        </div>
      )}

      {addresses.length === 0 && !adding && (
        <div style={{ margin: "0 20px 20px", padding: "24px 16px", textAlign: "center", background: CARD, borderRadius: 18, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, color: MUTED }}>No addresses yet. Add one to get started.</div>
        </div>
      )}

      {adding ? (
        <AddAddressPanel onCancel={() => setAdding(false)} onSave={handleAdd} />
      ) : (
        <div style={{ margin: "0 20px" }}>
          <button
            onClick={() => setAdding(true)}
            style={{ width: "100%", padding: "14px", borderRadius: 16, background: "#FFF", border: `1.5px dashed ${ACCENT2}55`, fontSize: 14, fontWeight: 700, color: ACCENT2, cursor: "pointer", fontFamily: "inherit" }}
          >
            + Add Address
          </button>
        </div>
      )}
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
export function SettingsScreen({ onClose, user, profile, setProfile, updateProfile, dietaryPrefs, saveDiet, addresses, addAddress, renameAddress, deleteAddress, reorderAddresses }) {
  const [subScreen, setSubScreen] = useState(null);

  if (subScreen === "diet")      return <DietScreen      onBack={() => setSubScreen(null)} dietaryPrefs={dietaryPrefs} saveDiet={saveDiet} />;
  if (subScreen === "profile")   return <ProfileScreen   onBack={() => setSubScreen(null)} user={user} profile={profile} setProfile={setProfile} updateProfile={updateProfile} />;
  if (subScreen === "addresses") return <AddressesScreen onBack={() => setSubScreen(null)} addresses={addresses} addAddress={addAddress} renameAddress={renameAddress} deleteAddress={deleteAddress} reorderAddresses={reorderAddresses} />;

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