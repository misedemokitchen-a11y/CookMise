"use client";
import { CARD, ACCENT, MUTED, BORDER, TEXT } from "@/lib/constants";

const HomeIcon = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? ACCENT : "none"} stroke={active ? ACCENT : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const ExploreIcon = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const OrderIcon = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const SavedIcon = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? ACCENT : "none"} stroke={active ? ACCENT : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

export function NavBar({ active, setScreen, closeSettings, onExploreReset }) {
  const tabs = [
    { id: "home",    label: "Home",    Icon: HomeIcon },
    { id: "explore", label: "Explore", Icon: ExploreIcon },
    { id: "order",   label: "Order",   Icon: OrderIcon },
    { id: "saved",   label: "Saved",   Icon: SavedIcon },
  ];

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: CARD, borderTop: `1px solid ${BORDER}`,
      padding: "14px 0 32px",
      display: "flex", justifyContent: "space-around", alignItems: "center",
      zIndex: 100,
    }}>
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => {
              closeSettings?.();
              if (id === "explore") onExploreReset?.();
              setScreen(id);
            }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 16px",
            }}>
            <Icon active={isActive} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? ACCENT : MUTED }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StatusBar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 4px", fontSize: 12, fontWeight: 600, color: TEXT }}>
      <span>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span>▌▌▌</span>
        <span>WiFi</span>
        <span>🔋</span>
      </div>
    </div>
  );
}
