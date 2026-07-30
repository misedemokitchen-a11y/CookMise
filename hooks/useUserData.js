"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { recipes } from "@/data/recipes";

// ── useUserData ───────────────────────────────────────────────────────────────
// Central hook that owns all user-specific data and Supabase calls.
// Drop this into your app shell and pass values down as props.

export function useUserData(user) {
  const [savedRecipes,  setSavedRecipes]  = useState([]);
  const [dietaryPrefs,  setDietaryPrefs]  = useState({});
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [orderHistory,  setOrderHistory]  = useState([]);
  const [loading,       setLoading]       = useState(false);

  // ── Load all user data on sign-in ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([loadSaved(), loadDiet(), loadAddress(), loadOrders()])
      .finally(() => setLoading(false));
  }, [user?.id]);

  // ── Saved recipes ──────────────────────────────────────────────────────────
  const loadSaved = async () => {
    const { data } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);
    if (!data) return;
    const saved = recipes.filter(r => data.some(d => d.recipe_id === r.id));
    setSavedRecipes(saved);
  };

  const toggleSaved = async (recipe) => {
    const alreadySaved = savedRecipes.find(r => r.id === recipe.id);
    if (alreadySaved) {
      await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", recipe.id);
      setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
    } else {
      await supabase
        .from("saved_recipes")
        .insert({ user_id: user.id, recipe_id: recipe.id, recipe_name: recipe.name });
      setSavedRecipes(prev => [...prev, recipe]);
    }
  };

  // ── Dietary preferences ────────────────────────────────────────────────────
  const loadDiet = async () => {
    const { data } = await supabase
      .from("dietary_preferences")
      .select("value")
      .eq("user_id", user.id);
    if (!data) return;
    const prefs = {};
    data.forEach(d => { prefs[d.value] = true; });
    setDietaryPrefs(prefs);
  };

  const saveDiet = async (prefs) => {
    await supabase.from("dietary_preferences").delete().eq("user_id", user.id);
    const rows = Object.entries(prefs)
      .filter(([_, on]) => on)
      .map(([value]) => ({ user_id: user.id, value }));
    if (rows.length > 0) await supabase.from("dietary_preferences").insert(rows);
    setDietaryPrefs(prefs);
  };

  // ── Default address ────────────────────────────────────────────────────────
  const loadAddress = async () => {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();
    if (data) setDefaultAddress(data);
  };

  const saveAddress = async ({ label = "Home", street, city, postcode }) => {
    // Clear existing default first
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    const { data } = await supabase
      .from("addresses")
      .insert({ user_id: user.id, label, street, city, postcode, is_default: true })
      .select()
      .single();
    if (data) setDefaultAddress(data);
  };

  // ── Order history ──────────────────────────────────────────────────────────
  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setOrderHistory(data);
  };

  const placeOrder = async ({ orderRecipes, ingredients, address, store, deliveryType, subtotal, total }) => {
    const { data } = await supabase
      .from("orders")
      .insert({
        user_id:       user.id,
        recipes:       orderRecipes.map(r => ({ id: r.id, name: r.name })),
        ingredients,
        address,
        store:         store?.name,
        delivery_type: deliveryType,
        subtotal,
        total,
        status:        "confirmed",
      })
      .select()
      .single();
    if (data) setOrderHistory(prev => [data, ...prev]);
    return data;
  };

  // ── Profile ────────────────────────────────────────────────────────────────
  const updateProfile = async (fields) => {
    await supabase
      .from("profiles")
      .update({
        first_name: fields.firstName,
        last_name:  fields.lastName,
        phone:      fields.phone,
      })
      .eq("id", user.id);
  };

  return {
    savedRecipes,  toggleSaved,
    dietaryPrefs,  saveDiet,
    defaultAddress, saveAddress,
    orderHistory,  placeOrder,
    updateProfile,
    loading,
  };
}
