"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BG, CARD, ACCENT, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";

export function LoginScreen({ onLogin }) {
  const [email, setEmail]           = useState("");
  const [googleLoading, setGoogle]  = useState(false);
  const [focused, setFocused]       = useState(null);

  const handleGoogleSignIn = async () => {
    setGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) { console.error(error); setGoogle(false); }
    // Supabase redirects to Google — on return, auth state updates automatically
  };

  const handleEmailSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: "demo" });
    if (data?.user) onLogin(data.user);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", background: BG, paddingBottom: 48 }}>
      {/* Logo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ fontSize: 56 }}>👨‍🍳</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 42, fontWeight: 800, color: ACCENT2, letterSpacing: -1 }}>mise.</div>
        <div style={{ fontSize: 14, color: MUTED, textAlign: "center", maxWidth: 220, lineHeight: 1.5 }}>
          Restaurant-quality recipes, delivered to your door.
        </div>
      </div>

      {/* Fields */}
      <div style={{ width: "100%", padding: "0 32px 24px" }}>
        <div style={{ width: "100%", marginBottom: 12 }}>
          <div style={{ background: CARD, border: `1.5px solid ${focused === "email" ? "#385348" : BORDER}`, borderRadius: 14, padding: "13px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Email</div>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              placeholder="you@example.com"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: TEXT, fontFamily: "inherit", width: "100%" }}
            />
          </div>
        </div>
        <div style={{ width: "100%", marginBottom: 24 }}>
          <div style={{ background: CARD, border: `1.5px solid ${focused === "password" ? "#385348" : BORDER}`, borderRadius: 14, padding: "13px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Password</div>
            <input
              type="password"
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: TEXT, fontFamily: "inherit", width: "100%" }}
            />
          </div>
        </div>
        <button
          onClick={handleEmailSignIn}
          style={{ width: "100%", padding: "16px", borderRadius: 16, background: "#385348", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(56,83,72,0.35)", marginBottom: 14 }}>
          Sign In
        </button>
        <button style={{ background: "none", border: "none", fontSize: 13, color: MUTED, cursor: "pointer", fontFamily: "inherit" }}>
          Don't have an account? <span style={{ color: "#385348", fontWeight: 700 }}>Sign up</span>
        </button>
      </div>

      {/* Google */}
      <div style={{ padding: "0 32px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 16, background: googleLoading ? "#f5f5f5" : CARD, border: `1.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: googleLoading ? "default" : "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {googleLoading ? (
            <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid #e0e0e0", borderTopColor: "#4285F4", animation: "spin 0.7s linear infinite" }} /><span style={{ fontSize: 15, color: MUTED }}>Signing in…</span></>
          ) : (
            <><svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Continue with Google</span></>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
