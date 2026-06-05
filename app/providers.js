"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// This "Store" holds the logged-in user, the shopping cart AND the wishlist,
// so any page/component can read them with useStore().
const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) On first load, check if someone is already logged in,
  //    and listen for login/logout changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 2) Whenever the user changes, (re)load their cart + wishlist.
  useEffect(() => {
    if (user) {
      loadCart();
      loadWishlist();
    } else {
      setCart([]);
      setWishlist([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadCart() {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) console.error("loadCart error:", error.message);
    setCart(data || []);
  }

  // Add a product to the cart (or bump quantity if already there).
  // Respects stock: won't let the cart quantity exceed available stock.
  async function addToCart(product) {
    if (!user) return { error: "login" };

    const stock = product.stock ?? Infinity;
    if (stock <= 0) return { error: "out_of_stock" };

    const existing = cart.find((c) => c.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + 1 > stock) {
      return { error: "max_stock", stock };
    }

    if (existing) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
    }
    await loadCart();
    return { ok: true };
  }

  async function updateQuantity(itemId, quantity) {
    if (quantity <= 0) return removeFromCart(itemId);
    // Cap at available stock.
    const item = cart.find((c) => c.id === itemId);
    const stock = item?.product?.stock ?? Infinity;
    const capped = Math.min(quantity, stock);
    await supabase.from("cart_items").update({ quantity: capped }).eq("id", itemId);
    await loadCart();
  }

  async function removeFromCart(itemId) {
    await supabase.from("cart_items").delete().eq("id", itemId);
    await loadCart();
  }

  async function clearCart() {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setCart([]);
  }

  // ---------------- WISHLIST ----------------
  async function loadWishlist() {
    const { data, error } = await supabase
      .from("wishlist")
      .select("id, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("loadWishlist error:", error.message);
    setWishlist(data || []);
  }

  function isWished(productId) {
    return wishlist.some((w) => w.product?.id === productId);
  }

  async function toggleWishlist(product) {
    if (!user) return { error: "login" };
    const existing = wishlist.find((w) => w.product?.id === product.id);
    if (existing) {
      await supabase.from("wishlist").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("wishlist")
        .insert({ user_id: user.id, product_id: product.id });
    }
    await loadWishlist();
    return { ok: true, added: !existing };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setCart([]);
    setWishlist([]);
  }

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * c.product.price, 0);

  return (
    <StoreContext.Provider
      value={{
        user,
        cart,
        cartCount,
        cartTotal,
        wishlist,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isWished,
        toggleWishlist,
        signOut,
        loadCart,
        loadWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
