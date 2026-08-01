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
  const [addresses,      setAddresses]      = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [orderHistory,  setOrderHistory]  = useState([]);
  const [loading,       setLoading]       = useState(false);

  // ── Load all user data on sign-in ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([loadSaved(), loadDiet(), loadAddresses(), loadOrders()])
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

  // ── Addresses (list, ordered — top of list is always the default) ─────────
  // Requires an `order_index` (int, default 0) column, `lat`/`lng` (double
  // precision), and `unit`/`notes` (text) columns on `addresses`. If these
  // don't exist yet, run:
  //   alter table addresses add column order_index integer default 0;
  //   alter table addresses add column lat double precision;
  //   alter table addresses add column lng double precision;
  //   alter table addresses add column unit text;
  //   alter table addresses add column notes text;
  const loadAddresses = async () => {
    let { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index", { ascending: true });

    if (error) {
      // Fallback for schemas that don't have order_index yet
      ({ data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }));
    }

    const list = data || [];
    setAddresses(list);
    setDefaultAddress(list.find(a => a.is_default) || list[0] || null);
  };

  const addAddress = async ({ label = "Home", street, unit = "", city, postcode, notes = "", lat = null, lng = null }) => {
    const isFirst = addresses.length === 0;
    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id:     user.id,
        label, street, unit, city, postcode, notes, lat, lng,
        is_default:  isFirst,
        order_index: addresses.length,
      })
      .select()
      .single();
    if (error || !data) return null;
    const next = [...addresses, data];
    setAddresses(next);
    if (isFirst) setDefaultAddress(data);
    return data;
  };

  const renameAddress = async (id, label) => {
    setAddresses(prev => prev.map(a => (a.id === id ? { ...a, label } : a)));
    await supabase.from("addresses").update({ label }).eq("id", id).eq("user_id", user.id);
  };

  // Full edit: label, street, unit, city, postcode, notes, lat, lng.
  const updateAddress = async (id, { label, street, unit, city, postcode, notes, lat, lng }) => {
    const patch = { label, street, unit, city, postcode, notes, lat, lng };
    setAddresses(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));

    const { data } = await supabase
      .from("addresses")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (data) {
      setAddresses(prev => prev.map(a => (a.id === id ? data : a)));
      setDefaultAddress(prev => (prev?.id === id ? data : prev));
    }
    return data;
  };

  const deleteAddress = async (id) => {
    const wasDefault = addresses.find(a => a.id === id)?.is_default;
    let remaining     = addresses.filter(a => a.id !== id);

    await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);

    if (wasDefault && remaining.length > 0) {
      remaining = remaining.map((a, i) => (i === 0 ? { ...a, is_default: true } : a));
      await supabase.from("addresses").update({ is_default: true }).eq("id", remaining[0].id).eq("user_id", user.id);
    }

    setAddresses(remaining);
    setDefaultAddress(remaining.find(a => a.is_default) || remaining[0] || null);
  };

  // Reorders by an array of address ids in the new top-to-bottom order.
  // The item at index 0 becomes the default address.
  const reorderAddresses = async (orderedIds) => {
    const next = orderedIds
      .map((id, i) => {
        const addr = addresses.find(a => a.id === id);
        return addr ? { ...addr, order_index: i, is_default: i === 0 } : null;
      })
      .filter(Boolean);

    setAddresses(next);
    setDefaultAddress(next[0] || null);

    await Promise.all(
      next.map(a =>
        supabase
          .from("addresses")
          .update({ order_index: a.order_index, is_default: a.is_default })
          .eq("id", a.id)
          .eq("user_id", user.id)
      )
    );
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
    addresses, defaultAddress,
    addAddress, renameAddress, updateAddress, deleteAddress, reorderAddresses,
    orderHistory,  placeOrder,
    updateProfile,
    loading,
  };
}
