import { itemsOf, estimateOf } from "@/lib/orderRows";

import { parseTs } from "@/lib/dates";
export { parseTs };

export const valueOf = (o) => (o.final_total != null ? Number(o.final_total) : estimateOf(o));
const keyOf = (o) => o.user_id || o.customer?.email || "unknown";

export function filterOrders(orders, { from, to, store, includeCanceled }) {
  const f = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
  const t = to   ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
  return orders.filter(o => {
    if (!includeCanceled && o.status === "canceled") return false;
    const ms = parseTs(o.created_at).getTime();
    if (ms < f || ms > t) return false;
    if (store && store !== "all" && o.store !== store) return false;
    return true;
  });
}

export function summarize(orders) {
  const per = {};
  orders.forEach(o => { per[keyOf(o)] = (per[keyOf(o)] || 0) + 1; });
  const customers = Object.keys(per).length;
  const repeat = Object.values(per).filter(n => n >= 2).length;
  const revenue = orders.reduce((s, o) => s + valueOf(o), 0);
  return {
    orders: orders.length, revenue, customers,
    aov: orders.length ? revenue / orders.length : 0,
    repeatRate: customers ? repeat / customers : 0,
  };
}

const top = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

export function byCustomer(orders) {
  const map = {};
  orders.forEach(o => {
    const k = keyOf(o);
    const c = (map[k] ||= { id: k, name: o.customer?.name || "", email: o.customer?.email || "", phone: o.customer?.phone || "", orders: 0, spent: 0, first: Infinity, last: -Infinity, recipes: {} });
    const ms = parseTs(o.created_at).getTime();
    c.orders += 1; c.spent += valueOf(o);
    c.first = Math.min(c.first, ms); c.last = Math.max(c.last, ms);
    (o.recipes || []).forEach(r => { c.recipes[r.name] = (c.recipes[r.name] || 0) + 1; });
  });
  return Object.values(map).map(c => ({ ...c, aov: c.spent / c.orders, favorite: top(c.recipes) }));
}

export function byRecipe(orders) {
  const map = {};
  orders.forEach(o => {
    const seen = new Set();
    (o.recipes || []).forEach(r => {
      if (seen.has(r.name)) return; seen.add(r.name);
      const x = (map[r.name] ||= { name: r.name, orders: 0, perCustomer: {}, last: -Infinity });
      x.orders += 1;
      x.perCustomer[keyOf(o)] = (x.perCustomer[keyOf(o)] || 0) + 1;
      x.last = Math.max(x.last, parseTs(o.created_at).getTime());
    });
  });
  return Object.values(map).map(x => {
    const counts = Object.values(x.perCustomer);
    return { name: x.name, orders: x.orders, customers: counts.length, repeatCustomers: counts.filter(n => n >= 2).length, last: x.last };
  });
}

export function byIngredient(orders) {
  const map = {};
  orders.forEach(o => {
    const seen = new Set();
    itemsOf(o).forEach(i => {
      const k = (i.ingredient || "").trim(); if (!k) return;
      const x = (map[k] ||= { name: k, orders: 0, lines: 0, spend: 0, priced: 0 });
      if (!seen.has(k)) { x.orders += 1; seen.add(k); }
      x.lines += 1;
      const p = Number(i.product?.price);
      if (p) { x.spend += p; x.priced += 1; }
    });
  });
  return Object.values(map).map(x => ({ ...x, avgPrice: x.priced ? x.spend / x.priced : null }));
}
