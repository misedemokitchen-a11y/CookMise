"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { parseTs } from "@/lib/dates";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";

const STEPS = [
  { id: "confirmed",        label: "Order received",   desc: "We got your order." },
  { id: "shopping",         label: "Shopping",         desc: "Your groceries are being picked." },
  { id: "out_for_delivery", label: "Out for delivery", desc: "On the way to you." },
  { id: "delivered",        label: "Delivered",        desc: "Enjoy your cooking!" },
];
const money = (n) => (n == null ? "—" : `$${Number(n).toFixed(2)}`);

// Live map: customer pin + moving driver pin.
function DriverMap({ order }) {
  const ref = useRef(null);
  const state = useRef({});
  const [failed, setFailed] = useState(false);
  const hasDriver = order.driver_lat != null && order.driver_lng != null;

  useEffect(() => {
    if (!hasDriver) return;
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled || !ref.current) return;
      const driver = { lat: order.driver_lat, lng: order.driver_lng };
      const s = state.current;
      if (!s.map) {
        s.map = new maps.Map(ref.current, { center: driver, zoom: 14, disableDefaultUI: true, clickableIcons: false });
        s.driver = new maps.Marker({ map: s.map, position: driver, title: "Your driver", label: "🚗" });
        if (order.delivery_lat != null) s.home = new maps.Marker({ map: s.map, position: { lat: order.delivery_lat, lng: order.delivery_lng }, title: "Delivery address", label: "🏠" });
      } else {
        s.driver.setPosition(driver);
      }
      if (s.home) {
        const b = new maps.LatLngBounds(); b.extend(driver); b.extend(s.home.getPosition());
        s.map.fitBounds(b, 50);
      } else s.map.panTo(driver);
    }).catch(() => setFailed(true));
    return () => { cancelled = true; };
  }, [hasDriver, order.driver_lat, order.driver_lng, order.delivery_lat, order.delivery_lng]);

  if (!hasDriver) return <div style={{ padding: 14, background: BG, borderRadius: 14, fontSize: 13, color: MUTED, marginTop: 12 }}>Waiting for your driver’s location…</div>;
  if (failed) return <div style={{ padding: 14, fontSize: 13, color: MUTED }}>Map unavailable right now.</div>;
  return (
    <div style={{ marginTop: 12 }}>
      <div ref={ref} style={{ height: 200, borderRadius: 14, overflow: "hidden", background: BORDER }} />
      {order.driver_updated_at && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Updated {new Date(order.driver_updated_at).toLocaleTimeString()}</div>}
    </div>
  );
}

function OrderCard({ order, startOpen }) {
  const [open, setOpen] = useState(startOpen);
  const canceled = order.status === "canceled";
  const stepIdx = STEPS.findIndex(s => s.id === order.status);
  const names = (order.recipes || []).map(r => r.name).join(", ");

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, marginBottom: 12, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: TEXT, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names || "Order"}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{parseTs(order.created_at).toLocaleDateString()} · {order.store || "Store"}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, color: TEXT }}>{money(order.final_total ?? order.total)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: canceled ? "#C62828" : ACCENT2, textTransform: "uppercase" }}>
            {canceled ? "Canceled" : (STEPS[stepIdx]?.label || order.status)}
          </div>
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${BORDER}` }}>
          {canceled ? (
            <div style={{ padding: "14px 0", fontSize: 14, color: "#C62828" }}>This order was canceled.</div>
          ) : (
            <div style={{ padding: "14px 0 4px" }}>
              {STEPS.map((s, i) => {
                const done = i <= stepIdx, current = i === stepIdx;
                return (
                  <div key={s.id} style={{ display: "flex", gap: 12, minHeight: 40 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: done ? ACCENT2 : BORDER, color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: current ? `0 0 0 4px ${ACCENT2}33` : "none" }}>{done ? "✓" : ""}</div>
                      {i < STEPS.length - 1 && <div style={{ flex: 1, width: 2, background: i < stepIdx ? ACCENT2 : BORDER }} />}
                    </div>
                    <div style={{ paddingBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: current ? 800 : 600, color: done ? TEXT : MUTED }}>{s.label}</div>
                      {current && <div style={{ fontSize: 12, color: MUTED }}>{s.desc}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {order.status === "out_for_delivery" && <DriverMap order={order} />}

          <div style={{ fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 1.5 }}>
            📍 {[order.address, order.delivery_unit && `Unit ${order.delivery_unit}`].filter(Boolean).join(" · ")}
            {order.final_total != null && order.total != null && Number(order.final_total) !== Number(order.total) &&
              <div>Estimated {money(order.total)} → final {money(order.final_total)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrdersScreen({ user, onBack, setScreen }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (alive && data) setOrders(data);
    };
    load();
    const t = setInterval(load, 10000); // poll for status + driver location
    return () => { alive = false; clearInterval(t); };
  }, [user?.id]);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 130, background: BG }}>
      <div style={{ padding: "44px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: CARD, border: `1px solid ${BORDER}`, fontSize: 18, cursor: "pointer" }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>My Orders</h2>
      </div>
      <div style={{ padding: "0 20px" }}>
        {orders === null && <div style={{ color: MUTED, textAlign: "center", padding: 30 }}>Loading…</div>}
        {orders?.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 10px", color: MUTED, fontSize: 14 }}>
            No orders yet.
            <div><button onClick={() => setScreen("explore")} style={{ marginTop: 12, padding: "12px 20px", borderRadius: 14, background: ACCENT, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Find a recipe</button></div>
          </div>
        )}
        {orders?.map((o, i) => <OrderCard key={o.id} order={o} startOpen={i === 0} />)}
      </div>
    </div>
  );
}
