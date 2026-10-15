"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import { parseTs } from "@/lib/dates";
import { itemsOf } from "@/lib/orderRows";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";

const FLOW = [
  { id: "confirmed",        label: "Confirmed" },
  { id: "shopping",         label: "Shopping" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered",        label: "Delivered" },
];
const FILTERS = [
  { id: "active",   label: "Active" },
  { id: "all",      label: "All" },
  { id: "delivered", label: "Delivered" },
  { id: "canceled", label: "Canceled" },
];
const isActive = (o) => !["delivered", "canceled"].includes(o.status);
const money = (n) => (n == null || n === "" ? "—" : `$${Number(n).toFixed(2)}`);

async function api(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}`, ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || "Request failed"), { status: res.status });
  return body;
}

function addressLine(o) {
  return [o.address, o.delivery_unit && `Unit ${o.delivery_unit}`].filter(Boolean).join(" · ");
}
function mapsUrl(o) {
  const q = o.delivery_lat != null ? `${o.delivery_lat},${o.delivery_lng}` : encodeURIComponent(o.address || "");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function OrderCard({ order, onChange, startOpen }) {
  const [open,   setOpen]   = useState(startOpen ?? isActive(order));
  const [total,  setTotal]  = useState(order.final_total ?? "");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState("");
  const [gotItems, setGotItems] = useState({});
  const items = itemsOf(order);
  const idx = FLOW.findIndex(s => s.id === order.status);
  const next = idx >= 0 ? FLOW[idx + 1] : null;
  const estimate = items.reduce((s, i) => s + (i.product?.price || 0), 0);

  const run = async (body) => {
    setBusy(true); setError("");
    try { const { order: updated } = await api("/api/admin/orders", { method: "PATCH", body: JSON.stringify({ orderId: order.id, ...body }) }); onChange(updated); }
    catch (e) { setError(e.message); }
    setBusy(false);
  };

  const btn = (primary) => ({ padding: "10px 14px", borderRadius: 12, border: primary ? "none" : `1px solid ${BORDER}`, background: primary ? ACCENT2 : CARD, color: primary ? "#fff" : TEXT, fontWeight: 700, fontSize: 13, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 });

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: TEXT, fontSize: 15 }}>{order.customer?.name || order.customer?.email || "Customer"}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            {parseTs(order.created_at).toLocaleString()} · {(order.recipes || []).map(r => r.name).join(", ")}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, color: TEXT }}>{money(order.final_total ?? order.total)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: order.status === "canceled" ? "#C62828" : ACCENT2, textTransform: "uppercase", marginTop: 2 }}>{order.status.replace(/_/g, " ")}</div>
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "grid", gap: 6, fontSize: 13, color: TEXT, margin: "12px 0" }}>
            <div>📍 <a href={mapsUrl(order)} target="_blank" rel="noreferrer" style={{ color: ACCENT2, fontWeight: 600 }}>{addressLine(order) || "No address"}</a></div>
            {order.delivery_notes && <div>📝 {order.delivery_notes}</div>}
            {order.customer?.phone && <div>📞 <a href={`tel:${order.customer.phone}`} style={{ color: ACCENT2 }}>{order.customer.phone}</a></div>}
            {order.customer?.email && <div style={{ color: MUTED }}>✉️ {order.customer.email}</div>}
            <div style={{ color: MUTED, fontSize: 12 }}>🆔 Customer ID: <span style={{ userSelect: "all", fontFamily: "monospace" }}>{order.user_id}</span></div>
            <div>🛒 <b>{order.store || "Store not set"}</b></div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "14px 0 6px" }}>
            Shopping list · {items.length} items · est. {money(estimate || order.total)}
          </div>
          {items.map((it, i) => (
            <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}>
              <input type="checkbox" checked={!!gotItems[i]} onChange={() => setGotItems(g => ({ ...g, [i]: !g[i] }))} style={{ marginTop: 3 }} />
              <div style={{ flex: 1, textDecoration: gotItems[i] ? "line-through" : "none", opacity: gotItems[i] ? 0.5 : 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{it.ingredient}{it.qty ? ` — ${it.qty}` : ""}</div>
                {it.product && <div style={{ fontSize: 12, color: MUTED }}>{[it.product.brand, it.product.name].filter(Boolean).join(" · ")} · {money(it.product.price)}</div>}
              </div>
            </label>
          ))}

          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0 10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: MUTED }}>Final total $</span>
            <input value={total} onChange={e => setTotal(e.target.value)} inputMode="decimal" placeholder={String(order.total ?? "")}
              style={{ width: 90, padding: "8px 10px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 14, fontFamily: "inherit" }} />
            <button disabled={busy} onClick={() => run({ finalTotal: total })} style={btn(false)}>Save total</button>
          </div>

          {isActive(order) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {next && <button disabled={busy} onClick={() => run({ status: next.id })} style={btn(true)}>Mark: {next.label}</button>}
              <button disabled={busy} onClick={() => { if (confirm("Cancel this order?")) run({ status: "canceled" }); }} style={{ ...btn(false), color: "#C62828" }}>Cancel order</button>
            </div>
          )}
          {error && <div style={{ color: "#C62828", fontSize: 12, marginTop: 8 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [state,   setState]   = useState("loading"); // loading | signedout | forbidden | ready | error
  const [orders,  setOrders]  = useState([]);
  const [filter,  setFilter]  = useState("active");
  const [tab,     setTab]     = useState("cards"); // cards | table
  const [focusId, setFocusId] = useState(null);
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareInfo, setShareInfo] = useState("");
  const watchRef = useRef(null);
  const lastSentRef = useRef(0);
  const wakeRef = useRef(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState("signedout"); return; }
    try {
      const { orders } = await api("/api/admin/orders");
      setOrders(orders); setState("ready");
    } catch (e) {
      if (e.status === 403) setState("forbidden");
      else { setMessage(e.message); setState("error"); }
    }
  }, []);

  useEffect(() => { queueMicrotask(load); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const stopSharing = useCallback(() => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    wakeRef.current?.release?.().catch(() => {}); wakeRef.current = null;
    setSharing(false); setShareInfo("");
  }, []);
  useEffect(() => stopSharing, [stopSharing]);

  const startSharing = async () => {
    if (!navigator.geolocation) { setShareInfo("Location isn't supported on this device."); return; }
    try { wakeRef.current = await navigator.wakeLock?.request("screen"); } catch {}
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < 8000) return; // throttle
        lastSentRef.current = now;
        try {
          const r = await api("/api/admin/location", { method: "POST", body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }) });
          setShareInfo(`Sharing · updated ${new Date().toLocaleTimeString()} · ${r.updated} order(s) en route`);
        } catch (e) { setShareInfo(`Couldn't send location: ${e.message}`); }
      },
      (err) => { setShareInfo(`Location error: ${err.message}`); stopSharing(); },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    setSharing(true); setShareInfo("Starting…");
  };

  const shown = focusId
    ? orders.filter(o => o.id === focusId)
    : orders.filter(o => filter === "all" ? true : filter === "active" ? isActive(o) : o.status === filter);
  const enRoute = orders.filter(o => o.status === "out_for_delivery").length;
  const center = { maxWidth: tab === "table" ? 1280 : 640, margin: "0 auto", padding: "24px 16px 80px" };

  if (state === "loading") return <div style={{ ...center, color: MUTED }}>Loading…</div>;
  if (state === "signedout") return <div style={center}><h1>mise. admin</h1><p>Sign in first, then come back to this page.</p><Link href="/" style={{ color: ACCENT2, fontWeight: 700 }}>Go to sign in →</Link></div>;
  if (state === "forbidden") return <div style={center}><h1>Not authorized</h1><p style={{ color: MUTED }}>This account doesn’t have admin access.</p></div>;
  if (state === "error") return <div style={center}><h1>Something went wrong</h1><p style={{ color: "#C62828" }}>{message}</p><button onClick={load}>Retry</button></div>;

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <div style={center}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontFamily: "Georgia, serif", color: TEXT }}>mise. <span style={{ color: ACCENT }}>admin</span></h1>
          <button onClick={load} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, cursor: "pointer", fontFamily: "inherit" }}>Refresh</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["cards", "Fulfillment"], ["table", "Spreadsheet"]].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setFocusId(null); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: tab === id ? TEXT : "transparent", color: tab === id ? "#fff" : TEXT, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
          ))}
        </div>

        {tab === "table" && <AnalyticsTab orders={orders} onOpen={(id) => { setFocusId(id); setTab("cards"); }} />}

        {tab === "cards" && (<>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: TEXT }}>Share my live location</div>
              <div style={{ fontSize: 12, color: MUTED }}>{enRoute} order(s) out for delivery. Keep this page open while driving.</div>
            </div>
            <button onClick={sharing ? stopSharing : startSharing} style={{ padding: "10px 14px", borderRadius: 12, border: "none", background: sharing ? "#C62828" : ACCENT2, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              {sharing ? "Stop" : "Start"}
            </button>
          </div>
          {shareInfo && <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>{shareInfo}</div>}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${filter === f.id ? ACCENT2 : BORDER}`, background: filter === f.id ? ACCENT2 : CARD, color: filter === f.id ? "#fff" : TEXT, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {f.label}
            </button>
          ))}
        </div>

        {focusId && <button onClick={() => { setFocusId(null); setTab("table"); }} style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>← Back to spreadsheet</button>}
        {shown.length === 0 && <div style={{ color: MUTED, textAlign: "center", padding: 40 }}>No orders here.</div>}
        {shown.map(o => <OrderCard key={o.id} order={o} startOpen={focusId ? true : undefined} onChange={(u) => setOrders(prev => prev.map(p => p.id === u.id ? { ...p, ...u } : p))} />)}
        </>)}
      </div>
    </div>
  );
}
