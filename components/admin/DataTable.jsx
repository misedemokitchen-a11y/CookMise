"use client";
import { useState, useMemo } from "react";
import { CARD, ACCENT2, TEXT, MUTED, BORDER, BG } from "@/lib/constants";

// Sortable table. columns: [{ key, label, value(row) -> display/CSV text, sort(row) -> comparable, money?, align? }]
export default function DataTable({ columns, rows, onRowClick, defaultSort, emptyText = "No data.", rowKey }) {
  const [sort, setSort] = useState(defaultSort || { key: columns[0].key, dir: "desc" });
  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sort.key) || columns[0];
    const get = col.sort || col.value;
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      const r = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, columns, sort]);

  const toggle = (key) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const th = { textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", position: "sticky", top: 0, background: BG, borderBottom: `1px solid ${BORDER}` };
  const td = { padding: "10px 12px", fontSize: 13, color: TEXT, whiteSpace: "nowrap", borderBottom: `1px solid ${BORDER}`, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" };

  return (
    <div style={{ overflow: "auto", maxHeight: "65vh", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} onClick={() => toggle(c.key)} style={{ ...th, textAlign: c.money || c.align === "right" ? "right" : "left" }}>
                {c.label}{sort.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={rowKey ? rowKey(r) : i} onClick={onRowClick ? () => onRowClick(r) : undefined} style={{ cursor: onRowClick ? "pointer" : "default" }}
                onMouseEnter={e => (e.currentTarget.style.background = BG)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {columns.map(c => {
                const v = c.value(r);
                const right = c.money || c.align === "right";
                return (
                  <td key={c.key} title={String(v)} style={{ ...td, textAlign: right ? "right" : "left", ...(c.key === "status" ? { fontWeight: 700, color: r.status === "canceled" ? "#C62828" : ACCENT2 } : {}) }}>
                    {c.money && v !== "" && v != null ? `$${v}` : v}
                  </td>
                );
              })}
            </tr>
          ))}
          {sorted.length === 0 && <tr><td colSpan={columns.length} style={{ ...td, textAlign: "center", color: MUTED, padding: 30 }}>{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
