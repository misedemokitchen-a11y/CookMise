// Minimal CSV builder + browser download. A BOM is prepended so Excel reads UTF-8 correctly.
const cell = (v) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(columns, rows) {
  const head = columns.map(c => cell(c.label)).join(",");
  const body = rows.map(r => columns.map(c => cell(c.value(r))).join(","));
  return [head, ...body].join("\r\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
