"use client";
import { ACCENT, CARD, BORDER } from "@/lib/constants";

export const Tag = ({ children, color = ACCENT, bg }) => (
  <div style={{
    display: "inline-flex", alignItems: "center",
    background: bg || color + "18",
    color, borderRadius: 20, padding: "4px 10px",
    fontSize: 11, fontWeight: 700, border: `1px solid ${color}22`,
  }}>
    {children}
  </div>
);
