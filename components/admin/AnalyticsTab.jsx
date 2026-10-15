"use client";
import { useState, useMemo } from "react";
import DataTable from "@/components/admin/DataTable";
import { CARD, TEXT, MUTED, BORDER } from "@/lib/constants";
import { toCsv, downloadCsv } from "@/lib/csv";
import { ORDER_COLUMNS, ORDER_CSV_COLUMNS, ITEM_CSV_COLUMNS, itemsOf } from "@/lib/orderRows";
import { filterOrders, summarize, byCustomer, byRecipe, byIngredient } from "@/lib/analytics";

const day = (ms) => (Number.isFinite(ms) ? new Date(ms).toLocaleDateString() : "");
const money = (n) => (n == null ? "" : Number(n).toFixed(2));

const CUSTOMER_COLS = [
  { key: "name",     label: "Customer",     value: c => c.name || c.email || "Unknown", sort: c => (c.name || c.email || "").toLowerCase() },
  { key: "email",    label: "Email",        value: c => c.email, sort: c => c.email.toLowerCase() },
  { key: "phone",    label: "Phone",        value: c => c.phone },
  { key: "orders",   label: "Orders",       value: c => c.orders, align: "right" },
  { key: "spent",    label: "Total spent",  value: c => money(c.spent), sort: c => c.spent, money: true },
  { key: "aov",      label: "Avg order",    value: c => money(c.aov),   sort: c => c.aov,   money: true },
  { key: "first",    label: "First order",  value: c => day(c.first), sort: c => c.first },
  { key: "last",     label: "Last order",   value: c => day(c.last),  sort: c => c.last },
  { key: "favorite", label: "Top recipe",   value: c => c.favorite },
];
const RECIPE_COLS = [
  { key: "name",            label: "Recipe",              value: r => r.name, sort: r => r.name.toLowerCase() },
  { key: "orders",          label: "Orders",              value: r => r.orders, align: "right" },
  { key: "customers",       label: "Customers",           value: r => r.customers, align: "right" },
  { key: "repeatCustomers", label: "Repeat customers",    value: r => r.repeatCustomers, align: "right" },
  { key: "last",            label: "Last ordered",        value: r => day(r.last), sort: r => r.last },
];
const INGREDIENT_COLS = [
  { key: "name",     label: "Ingredient",    value: i => i.name, sort: i => i.name.toLowerCase() },
  { key: "orders",   label: "Orders",        value: i => i.orders, align: "right" },
  { key: "lines",    label: "Times bought",  value: i => i.lines, align: "right" },
  { key: "avgPrice", label: "Avg price",     value: i => money(i.avgPrice), sort: i => i.avgPrice ?? -1, money: true },
  { key: "spend",    label: "Total spend",   value: i => money(i.spend),    sort: i => i.spend, money: true },
];
const VIEWS = [
  { id: "orders", label: "Orders" }, { id: "customers", label: "Customers" },
  { id: "recipes", label: "Recipes" }, { id: "ingredients", label: "Ingredients" },
];

function Card({ label, value }) {
  return (
    <div style={{ flex: "1 1 130px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default function AnalyticsTab({ orders, onOpen }) {
  const [view,   setView]   = useState("orders");
  const [from,   setFrom]   = useState("");
  const [to,     setTo]     = useState("");
  const [store,  setStore]  = useState("all");
  const [status, setStatus] = useState("all");
  const [query,  setQuery]  = useState("");
  const [includeCanceled, setIncludeCanceled] = useState(false);

  const stores = useMemo(() => [...new Set(orders.map(o => o.store).filter(Boolean))].sort(), [orders]);

  // Base set: date / store / canceled filters. Drives the cards and every view.
  const base = useMemo(() => filterOrders(orders, { from, to, store, includeCanceled }), [orders, from, to, store, includeCanceled]);
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base.filter(o => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return ORDER_COLUMNS.some(c => String(c.value(o)).toLowerCase().includes(q))
        || itemsOf(o).some(i => `${i.ingredient} ${i.product?.name || ""}`.toLowerCase().includes(q));
    });
  }, [base, status, query]);

  const sum = useMemo(() => summarize(scoped), [scoped]);
  const customers   = useMemo(() => byCustomer(scoped),   [scoped]);
  const recipes     = useMemo(() => byRecipe(scoped),     [scoped]);
  const ingredients = useMemo(() => byIngredient(scoped), [scoped]);

  const stamp = new Date().toISOString().slice(0, 10);
  const exportCurrent = () => {
    if (view === "orders") return downloadCsv(`mise-orders-${stamp}.csv`, toCsv(ORDER_CSV_COLUMNS, scoped));
    const spec = { customers: [CUSTOMER_COLS, customers], recipes: [RECIPE_COLS, recipes], ingredients: [INGREDIENT_COLS, ingredients] }[view];
    downloadCsv(`mise-${view}-${stamp}.csv`, toCsv(spec[0].map(c => ({ label: c.label, value: c.value })), spec[1]));
  };
  const exportItems = () => downloadCsv(`mise-order-items-${stamp}.csv`, toCsv(ITEM_CSV_COLUMNS, scoped.flatMap(order => itemsOf(order).map(item => ({ order, item })))));

  // Drill-down: clicking a customer / recipe jumps to their orders.
  const drill = (text) => { setQuery(text); setView("orders"); };

  const input = { padding: "8px 10px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 13, fontFamily: "inherit", background: CARD };
  const btn = { ...input, fontWeight: 600, cursor: "pointer", color: TEXT };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Card label="Orders" value={sum.orders} />
        <Card label="Revenue" value={`$${sum.revenue.toFixed(2)}`} />
        <Card label="Avg order" value={`$${sum.aov.toFixed(2)}`} />
        <Card label="Customers" value={sum.customers} />
        <Card label="Repeat rate" value={`${Math.round(sum.repeatRate * 100)}%`} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: MUTED }}>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={input} /></label>
        <label style={{ fontSize: 12, color: MUTED }}>To <input type="date" value={to} onChange={e => setTo(e.target.value)} style={input} /></label>
        <select value={store} onChange={e => setStore(e.target.value)} style={input}>
          <option value="all">All stores</option>
          {stores.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={input}>
          <option value="all">All statuses</option>
          {["confirmed", "shopping", "out_for_delivery", "delivered", "canceled"].map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <label style={{ fontSize: 12, color: MUTED, display: "flex", gap: 4, alignItems: "center" }}>
          <input type="checkbox" checked={includeCanceled} onChange={e => setIncludeCanceled(e.target.checked)} /> Include canceled
        </label>
        {(from || to || store !== "all" || status !== "all" || query) &&
          <button style={btn} onClick={() => { setFrom(""); setTo(""); setStore("all"); setStatus("all"); setQuery(""); }}>Clear filters</button>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{ ...btn, background: view === v.id ? TEXT : CARD, color: view === v.id ? "#fff" : TEXT, borderColor: view === v.id ? TEXT : BORDER }}>{v.label}</button>
        ))}
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customer, address, recipe, ingredient…" style={{ ...input, flex: "1 1 220px" }} />
        <button style={btn} onClick={exportCurrent}>⬇ {VIEWS.find(v => v.id === view).label} CSV</button>
        <button style={btn} onClick={exportItems}>⬇ Items CSV</button>
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>
        Canceled orders are left out of the numbers unless you tick “Include canceled”. Revenue uses the final total when set, otherwise the estimate. Exports match the current filters.
      </div>

      {view === "orders"      && <DataTable columns={ORDER_COLUMNS} rows={scoped} defaultSort={{ key: "created_at", dir: "desc" }} rowKey={o => o.id} onRowClick={o => onOpen(o.id)} emptyText="No orders match." />}
      {view === "customers"   && <DataTable columns={CUSTOMER_COLS} rows={customers} defaultSort={{ key: "orders", dir: "desc" }} rowKey={c => c.id} onRowClick={c => drill(c.email || c.name)} emptyText="No customers match." />}
      {view === "recipes"     && <DataTable columns={RECIPE_COLS} rows={recipes} defaultSort={{ key: "orders", dir: "desc" }} rowKey={r => r.name} onRowClick={r => drill(r.name)} emptyText="No recipes match." />}
      {view === "ingredients" && <DataTable columns={INGREDIENT_COLS} rows={ingredients} defaultSort={{ key: "orders", dir: "desc" }} rowKey={i => i.name} onRowClick={i => drill(i.name)} emptyText="No ingredients match." />}
    </div>
  );
}
