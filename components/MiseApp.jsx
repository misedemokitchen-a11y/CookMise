"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUserData } from "@/hooks/useUserData";
import { BG, CARD, BORDER, ROOT_SCREENS } from "@/lib/constants";
import { StatusBar } from "@/components/layout/NavBar";
import { NavBar } from "@/components/layout/NavBar";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ExploreScreen } from "@/components/screens/ExploreScreen";
import { RecipeScreen } from "@/components/screens/RecipeScreen";
import { OrderScreen } from "@/components/screens/OrderScreen";
import { SavedScreen } from "@/components/screens/SavedScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { recipes } from "@/data/recipes";

export default function MiseApp() {
  const exploreResetRef = useRef(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [loggedIn, setLoggedIn] = useState(false);
  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", postcode: "" });

  // Listen for Supabase auth state changes (covers Google redirect return)
  useEffect(() => {
  setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("Delayed session check:", session);
        if (session?.user) { setUser(session.user); setLoggedIn(true); }
      });
    }, 500);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); setLoggedIn(true); }
      else { setUser(null); setLoggedIn(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── User data (Supabase) ──────────────────────────────────────────────────
  const {
    savedRecipes, toggleSaved,
    dietaryPrefs, saveDiet,
    defaultAddress, saveAddress,
    orderHistory, placeOrder,
    updateProfile,
  } = useUserData(user);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [screen,         setScreen]         = useState("home");
  const [screenHistory,  setScreenHistory]  = useState(["home"]);
  const [selectedRecipe, setSelectedRecipe] = useState(recipes[0] || null);
  const [showSettings,   setShowSettings]   = useState(false);
  const [orderRecipes,   setOrderRecipes]   = useState([]);

  // Load Google font
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const handleSetScreen = (s) => {
    setShowSettings(false);
    setScreenHistory(prev => [...prev, s]);
    setScreen(s);
  };

  const handleGoBack = () => {
    setScreenHistory(prev => {
      if (prev.length <= 1) return prev;
      const next   = prev.slice(0, -1);
      const target = next[next.length - 1];
      if (ROOT_SCREENS.includes(target)) return prev;
      setScreen(target);
      return next;
    });
  };

  const navScreen = ["home","explore","order","saved"].includes(screen) ? screen : screenHistory.findLast(s => ["home","explore","order","saved"].includes(s)) || "home";

  const handleGoToOrder = (recipe) => {
    setOrderRecipes(prev => prev.find(r => r.id === recipe.id) ? prev : [...prev, recipe]);
    handleSetScreen("order");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const showNav = !["login"].includes(screen);

  const renderScreen = () => {
    if (showSettings) return <SettingsScreen onClose={() => setShowSettings(false)} user={user} profile={profile} setProfile={setProfile} updateProfile={updateProfile} dietaryPrefs={dietaryPrefs} saveDiet={saveDiet} />;
    switch (screen) {
      case "home":    return <HomeScreen setScreen={handleSetScreen} setSelectedRecipe={setSelectedRecipe} showSettings={showSettings} setShowSettings={setShowSettings} onOrder={handleGoToOrder} savedRecipes={savedRecipes} toggleSaved={toggleSaved} user={user} profile={profile} setProfile={setProfile} />;
      case "explore": return <ExploreScreen setScreen={handleSetScreen} setSelectedRecipe={setSelectedRecipe} resetRef={exploreResetRef} />;
      case "recipe":  return <RecipeScreen recipe={selectedRecipe} setScreen={handleSetScreen} onOrder={handleGoToOrder} savedRecipes={savedRecipes} toggleSaved={toggleSaved} goBack={handleGoBack} />;
      case "order":   return <OrderScreen orderRecipes={orderRecipes} setOrderRecipes={setOrderRecipes} setScreen={handleSetScreen} profile={profile} placeOrder={placeOrder} defaultAddress={defaultAddress} saveAddress={saveAddress} />;
      case "saved":   return <SavedScreen savedRecipes={savedRecipes} toggleSaved={toggleSaved} setSelectedRecipe={setSelectedRecipe} setScreen={handleSetScreen} />;
      default:        return null;
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#E8E0D5" }}>
      <div style={{ width: 390, height: 844, background: BG, borderRadius: 44, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.35), 0 0 0 10px #1A1A1A", position: "relative", display: "flex", flexDirection: "column" }}>
        <StatusBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!loggedIn
            ? <LoginScreen onLogin={(u) => { setUser(u); setLoggedIn(true); }} />
            : renderScreen()
          }
        </div>
        {loggedIn && showNav && (
          <NavBar
            active={navScreen}
            setScreen={handleSetScreen}
            closeSettings={() => setShowSettings(false)}
            onExploreReset={() => exploreResetRef.current?.()}
          />
        )}
      </div>
    </div>
  );
}
