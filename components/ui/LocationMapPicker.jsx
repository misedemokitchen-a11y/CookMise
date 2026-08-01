"use client";
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import { BG, CARD, TEXT, MUTED, BORDER } from "@/lib/constants";

// ── LocationMapPicker ────────────────────────────────────────────────────────
// Full-screen draggable-pin map, used to fine-tune a geocoded address to the
// exact building entrance / unit. Overlays whatever it's rendered inside of
// (expects a positioned ancestor — the phone frame in MiseApp already is one).
export function LocationMapPicker({ lat, lng, addressLabel, onConfirm, onCancel }) {
  const mapDivRef  = useRef(null);
  const mapObjRef  = useRef(null);
  const markerRef  = useRef(null);
  const [coords, setCoords] = useState({ lat, lng });
  const [ready,  setReady]  = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapDivRef.current) return;

        const center = { lat, lng };
        const map = new maps.Map(mapDivRef.current, {
          center,
          zoom: 18,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });

        const marker = new maps.Marker({ position: center, map, draggable: true });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          setCoords({ lat: pos.lat(), lng: pos.lng() });
        });

        map.addListener("click", (e) => {
          marker.setPosition(e.latLng);
          setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });

        mapObjRef.current = map;
        markerRef.current = marker;
        setReady(true);
      })
      .catch((e) => setError(e.message || "Couldn't load the map"));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, background: BG, zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "44px 20px 16px", display: "flex", alignItems: "center", gap: 14, background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={onCancel} style={{ width: 36, height: 36, borderRadius: 12, background: BG, border: `1px solid ${BORDER}`, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Georgia, serif" }}>Confirm Location</h2>
          {addressLabel && <div style={{ fontSize: 12, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addressLabel}</div>}
        </div>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />
        {!ready && !error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontSize: 13, color: MUTED }}>Loading map…</div>
        )}
        {error && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontSize: 13, color: "#C0392B", padding: 24, textAlign: "center", lineHeight: 1.5 }}>{error}</div>
        )}
      </div>

      <div style={{ padding: 16, background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 12, textAlign: "center", lineHeight: 1.5 }}>
          Drag the pin or tap the map to point to your exact entrance
        </div>
        <button
          onClick={() => onConfirm(coords)}
          disabled={!ready}
          style={{ width: "100%", padding: "15px", borderRadius: 16, background: !ready ? BORDER : "#385348", color: !ready ? MUTED : "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: !ready ? "default" : "pointer", fontFamily: "inherit" }}
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}