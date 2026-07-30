"use client";
import { useState } from "react";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

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

      {/* Address */}
      <div style={{ margin: "0 20px 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Delivery Address</div>
        <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <ProfileField label="Street Address" fieldKey="address"  placeholder="123 Main St" value={fields.address}  focused={focused} onChange={update} onFocus={setFocused} onBlur={() => setFocused(null)} />
          <ProfileField label="City"           fieldKey="city"     placeholder="New York"    value={fields.city}     focused={focused} onChange={update} onFocus={setFocused} onBlur={() => setFocused(null)} />
          <ProfileField label="Postcode"       fieldKey="postcode" placeholder="10001"       value={fields.postcode} focused={focused} onChange={update} onFocus={setFocused} onBlur={() => setFocused(null)} />
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
export function SettingsScreen({ onClose, user, profile, setProfile, updateProfile, dietaryPrefs, saveDiet }) {
  const [subScreen, setSubScreen] = useState(null);

  if (subScreen === "diet")    return <DietScreen    onBack={() => setSubScreen(null)} dietaryPrefs={dietaryPrefs} saveDiet={saveDiet} />;
  if (subScreen === "profile") return <ProfileScreen onBack={() => setSubScreen(null)} user={user} profile={profile} setProfile={setProfile} updateProfile={updateProfile} />;

  const sections = [
    { title: "Account", items: [
      { icon: "👤", label: "Profile",       desc: "Name, photo, username",                      onTap: () => setSubScreen("profile") },
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
