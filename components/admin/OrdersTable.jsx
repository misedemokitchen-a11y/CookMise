"use client";
import { useState, useMemo } from "react";
import { CARD, ACCENT2, TEXT, MUTED, BORDER, BG } from "@/lib/constants";
import { toCsv, downloadCsv } from "@/lib/csv";
import { ORDER_COLUMNS, ORDER_CSV_COLUMNS, ITEM_CSV_COLUMNS, STATUS_LABEL, itemsOf } from "@/lib/orderRows";

const STATUS_FILTERS = ["all", "confirmed", "shopping", "out_for_delivery", "delivered", "canceled"];

export default function OrdersTable({ orders, onOpen }) {
  const [query,  setQuery]  = useState("");
  const [status, setStatus] = useState("all");
  const [sort,   setSort]   = useState({ key: "created_at", dir: "desc" });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = orders.filter(o => status === "all" || o.status === status);
    if (q) {
      list = list.filter(o =>
        ORDER_COLUMNS.some(c => String(c.value(o)).toLowerCase().includes(q)) ||
        itemsOf(o).some(i => `${i.ingredient} ${i.product?.name || ""}`.toLowerCase().includes(q))
      );
    }
    const col = ORDER_COLUMNS.find(c => c.key === sort.key) || ORDER_COLUMNS[0];
    return [...list].sort((a, b) => {
      const x = col.sort(a), y = col.sort(b);
      const r = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === "asc" ? r : -r;
    });
  }, [orders, query, status, sort]);

  const toggleSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const stamp = new Date().toISOString().slice(0, 10);

  const exportOrders = () => downloadCsv(`mise-orders-${stamp}.csv`, toCsv(ORDER_CSV_COLUMNS, rows));
  const exportItems = () => {
    const flat = rows.flatMap(order => itemsOf(order).map(item => ({ order, item })));
    downloadCsv(`mise-order-items-${stamp}.csv`, toCsv(ITEM_CSV_COLUMNS, flat));
  };

  const btn = { padding: "9px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: TEXT, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };
  const th = { textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", position: "sticky", top: 0, background: BG, borderBottom: `1px solid ${BORDER}` };
  const td = { padding: "10px 12px", fontSize: 13, color: TEXT, whiteSpace: "nowrap", borderBottom: `1px solid ${BORDER}`, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customer, address, recipe, ingredient…"
          style={{ flex: "1 1 220px", padding: "9px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 13, fontFamily: "inherit" }} />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...btn, fontWeight: 500 }}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === "all" ? "All statuses" : STATUS_LABEL[s]}</option>)}
        </select>
        <button onClick={exportOrders} style={btn} disabled={!rows.length}>⬇ Orders CSV</button>
        <button onClick={exportItems}  style={btn} disabled={!rows.length}>⬇ Items CSV</button>
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>{rows.length} order{rows.length === 1 ? "" : "s"} · exports include the current search and filter</div>

      <div style={{ overflow: "auto", maxHeight: "70vh", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1100 }}>
          <thead>
            <tr>
              {ORDER_COLUMNS.map(c => (
                <th key={c.key} style={th} onClick={() => toggleSort(c.key)}>
                  {c.label}{sort.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id} onClick={() => onOpen(o.id)} style={{ cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = BG)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                {ORDER_COLUMNS.map(c => {
                  const v = c.value(o);
                  const isStatus = c.key === "status";
                  const money = c.key === "estimate" || c.key === "final";
                  return (
                    <td key={c.key} title={String(v)} style={{ ...td, ...(money ? { textAlign: "right" } : {}), ...(isStatus ? { fontWeight: 700, color: o.status === "canceled" ? "#C62828" : ACCENT2 } : {}) }}>
                      {money && v !== "" ? `$${v}` : v}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={ORDER_COLUMNS.length} style={{ ...td, textAlign: "center", color: MUTED, padding: 30 }}>No orders match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
