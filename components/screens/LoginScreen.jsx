"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BG, CARD, ACCENT2, TEXT, MUTED, BORDER } from "@/lib/constants";

const friendly = (msg = "") => {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. If you signed up with Google, use “Continue with Google”.";
  if (m.includes("not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("password")) return msg;
  return msg || "Something went wrong. Please try again.";
};

function Field({ label, type = "text", value, onChange, placeholder, name, autoComplete, focused, setFocused }) {
  return (
    <div style={{ width: "100%", marginBottom: 12 }}>
      <div style={{ background: CARD, border: `1.5px solid ${focused === name ? "#385348" : BORDER}`, borderRadius: 14, padding: "13px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
        <input
          type={type} name={name} autoComplete={autoComplete} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}
          placeholder={placeholder}
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: TEXT, fontFamily: "inherit", width: "100%" }}
        />
      </div>
    </div>
  );
}

// Shown after the user opens the password-reset link from their email.
export function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [focused,  setFocused]  = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");

  const submit = async () => {
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError(friendly(error.message)); return; }
    onDone();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", background: BG, padding: "0 32px" }}>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 800, color: ACCENT2, marginBottom: 6 }}>Choose a new password</div>
      <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>You’ll use it to sign in with your email.</div>
      <Field label="New password" type="password" name="new-password" autoComplete="new-password" value={password} onChange={setPassword} placeholder="At least 8 characters" focused={focused} setFocused={setFocused} />
      <Field label="Confirm password" type="password" name="confirm-password" autoComplete="new-password" value={confirm} onChange={setConfirm} placeholder="Repeat password" focused={focused} setFocused={setFocused} />
      {error && <div style={{ color: "#C62828", fontSize: 13, marginBottom: 12 }}>{error}</div>}
      <button onClick={submit} disabled={busy} style={{ width: "100%", padding: "16px", borderRadius: 16, background: "#385348", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.7 : 1 }}>
        {busy ? "Saving…" : "Save password"}
      </button>
    </div>
  );
}

export function LoginScreen({ onLogin }) {
  const [mode,     setMode]     = useState("signin"); // signin | signup | forgot
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogle] = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [notice,   setNotice]   = useState("");
  const [focused,  setFocused]  = useState(null);

  const switchMode = (m) => { setMode(m); setError(""); setNotice(""); };

  const handleGoogleSignIn = async () => {
    setGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { console.error(error); setGoogle(false); setError(friendly(error.message)); }
  };

  const submit = async (e) => {
    e?.preventDefault();
    setError(""); setNotice("");
    const addr = email.trim();
    if (!addr) { setError("Enter your email."); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        if (!password) { setError("Enter your password."); return; }
        const { data, error } = await supabase.auth.signInWithPassword({ email: addr, password });
        if (error) { setError(friendly(error.message)); return; }
        if (data?.user) onLogin(data.user);
      } else if (mode === "signup") {
        if (password.length < 8) { setError("Use a password of at least 8 characters."); return; }
        const { data, error } = await supabase.auth.signUp({
          email: addr, password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: name.trim() ? { full_name: name.trim() } : undefined,
          },
        });
        if (error) { setError(friendly(error.message)); return; }
        if (data?.session && data.user) onLogin(data.user);          // email confirmation turned off
        else if (data?.user && data.user.identities?.length === 0) setError(friendly("already registered"));
        else setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: `${window.location.origin}/auth/reset` });
        if (error) { setError(friendly(error.message)); return; }
        setNotice("If an account exists for that email, we’ve sent a link to reset your password.");
      }
    } finally {
      setBusy(false);
    }
  };

  const title  = mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign In";
  const cta    = busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign In";

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", background: BG, paddingBottom: 48 }}>
      {/* Logo */}
      <div style={{ flex: 1, minHeight: mode === "signin" ? 150 : 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 16 }}>
        <div style={{ fontSize: mode === "signin" ? 56 : 40 }}>👨‍🍳</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: mode === "signin" ? 42 : 34, fontWeight: 800, color: ACCENT2, letterSpacing: -1 }}>mise.</div>
        {mode === "signin" && (
          <div style={{ fontSize: 14, color: MUTED, textAlign: "center", maxWidth: 220, lineHeight: 1.5 }}>
            Restaurant-quality recipes, delivered to your door.
          </div>
        )}
      </div>

      {/* Fields */}
      <form onSubmit={submit} style={{ width: "100%", padding: "0 32px 24px", boxSizing: "border-box" }}>
        {mode !== "signin" && <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 12 }}>{title}</div>}
        {mode === "signup" && <Field label="Name" name="name" autoComplete="name" value={name} onChange={setName} placeholder="Your name" focused={focused} setFocused={setFocused} />}
        <Field label="Email" type="email" name="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@example.com" focused={focused} setFocused={setFocused} />
        {mode !== "forgot" && (
          <Field label="Password" type="password" name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={setPassword} placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} focused={focused} setFocused={setFocused} />
        )}
        {mode === "signin" && (
          <div style={{ textAlign: "right", marginTop: -4, marginBottom: 12 }}>
            <button type="button" onClick={() => switchMode("forgot")} style={{ background: "none", border: "none", fontSize: 13, color: "#385348", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Forgot password?</button>
          </div>
        )}
        {error  && <div style={{ color: "#C62828", fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>{error}</div>}
        {notice && <div style={{ color: ACCENT2, background: ACCENT2 + "14", borderRadius: 12, padding: "10px 12px", fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>{notice}</div>}
        <button
          type="submit" disabled={busy}
          style={{ width: "100%", padding: "16px", borderRadius: 16, background: "#385348", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: busy ? "default" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(56,83,72,0.35)", marginBottom: 14, opacity: busy ? 0.7 : 1 }}>
          {cta}
        </button>
        <div style={{ textAlign: "center" }}>
          {mode === "signin" ? (
            <button type="button" onClick={() => switchMode("signup")} style={{ background: "none", border: "none", fontSize: 13, color: MUTED, cursor: "pointer", fontFamily: "inherit" }}>
              Don&apos;t have an account? <span style={{ color: "#385348", fontWeight: 700 }}>Sign up</span>
            </button>
          ) : (
            <button type="button" onClick={() => switchMode("signin")} style={{ background: "none", border: "none", fontSize: 13, color: MUTED, cursor: "pointer", fontFamily: "inherit" }}>
              Back to <span style={{ color: "#385348", fontWeight: 700 }}>Sign in</span>
            </button>
          )}
        </div>
      </form>

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
