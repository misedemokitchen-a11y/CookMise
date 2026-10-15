import { parseTs } from "@/lib/dates";

// Shared helpers that turn an admin-API order into flat, spreadsheet-friendly rows.
export const STATUS_LABEL = {
  confirmed: "Confirmed", shopping: "Shopping", out_for_delivery: "Out for delivery",
  delivered: "Delivered", canceled: "Canceled", pending: "Pending",
};

// Items for an order: the order_items table first, then the legacy JSON snapshot.
export function itemsOf(o) {
  if (o.order_items?.length) {
    return o.order_items.map(r => ({
      ingredient: r.ingredient, qty: r.qty,
      product: r.product_name ? { name: r.product_name, brand: r.product_brand, price: r.price, image: r.image } : null,
    }));
  }
  if (o.items?.length) return o.items;
  return (o.ingredients || []).map(i => ({ ingredient: i.name, qty: i.qty, product: null }));
}

export const estimateOf = (o) => {
  const sum = itemsOf(o).reduce((s, i) => s + (Number(i.product?.price) || 0), 0);
  return sum || Number(o.total) || 0;
};

export const ORDER_COLUMNS = [
  { key: "created_at", label: "Date",           value: o => parseTs(o.created_at).toLocaleString(), sort: o => parseTs(o.created_at).getTime() },
  { key: "customer",   label: "Customer",       value: o => o.customer?.name || "",  sort: o => (o.customer?.name || "").toLowerCase() },
  { key: "phone",      label: "Phone",          value: o => o.customer?.phone || "", sort: o => o.customer?.phone || "" },
  { key: "email",      label: "Email",          value: o => o.customer?.email || "", sort: o => (o.customer?.email || "").toLowerCase() },
  { key: "address",    label: "Address",        value: o => [o.address, o.delivery_unit && `Unit ${o.delivery_unit}`].filter(Boolean).join(", "), sort: o => (o.address || "").toLowerCase() },
  { key: "notes",      label: "Delivery notes", value: o => o.delivery_notes || "", sort: o => (o.delivery_notes || "").toLowerCase() },
  { key: "store",      label: "Store",          value: o => o.store || "", sort: o => (o.store || "").toLowerCase() },
  { key: "recipes",    label: "Recipes",        value: o => (o.recipes || []).map(r => r.name).join("; "), sort: o => (o.recipes || []).map(r => r.name).join("; ").toLowerCase() },
  { key: "items",      label: "Items",          value: o => itemsOf(o).length, sort: o => itemsOf(o).length },
  { key: "status",     label: "Status",         value: o => STATUS_LABEL[o.status] || o.status, sort: o => o.status },
  { key: "estimate",   label: "Estimated total", value: o => estimateOf(o).toFixed(2), sort: o => estimateOf(o) },
  { key: "final",      label: "Final total",    value: o => o.final_total == null ? "" : Number(o.final_total).toFixed(2), sort: o => o.final_total == null ? -1 : Number(o.final_total) },
];

// Extra IDs only in the CSV export (handy for imports into another system).
export const ORDER_CSV_COLUMNS = [
  { label: "Order ID", value: o => o.id },
  ...ORDER_COLUMNS.map(c => ({ label: c.label, value: c.value })),
  { label: "Delivery lat", value: o => o.delivery_lat ?? "" },
  { label: "Delivery lng", value: o => o.delivery_lng ?? "" },
];

export const ITEM_CSV_COLUMNS = [
  { label: "Order ID",   value: r => r.order.id },
  { label: "Date",       value: r => parseTs(r.order.created_at).toLocaleString() },
  { label: "Customer",   value: r => r.order.customer?.name || r.order.customer?.email || "" },
  { label: "Store",      value: r => r.order.store || "" },
  { label: "Status",     value: r => STATUS_LABEL[r.order.status] || r.order.status },
  { label: "Ingredient", value: r => r.item.ingredient },
  { label: "Quantity",   value: r => r.item.qty || "" },
  { label: "Brand",      value: r => r.item.product?.brand || "" },
  { label: "Product",    value: r => r.item.product?.name || "" },
  { label: "Price",      value: r => r.item.product?.price == null ? "" : Number(r.item.product.price).toFixed(2) },
];
