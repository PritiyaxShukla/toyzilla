"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "../providers";

const PAYMENT_METHODS = [
  { id: "COD", label: "Cash on Delivery", icon: "💵", desc: "Pay when it arrives" },
  { id: "UPI", label: "UPI", icon: "📱", desc: "GPay / PhonePe / Paytm" },
  { id: "Card", label: "Card", icon: "💳", desc: "Credit / Debit card" },
];

export default function CartPage() {
  const {
    user,
    cart,
    cartTotal,
    cartCount,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useStore();
  const router = useRouter();

  const [step, setStep] = useState("cart"); // 'cart' | 'checkout'
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [emailWarning, setEmailWarning] = useState(false);
  const [error, setError] = useState(null);

  // Shipping + payment form
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "COD",
  });

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Load the Razorpay Checkout script once, on demand.
  function loadRazorpay() {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  const cartItems = () =>
    cart.map((c) => ({
      product_id: c.product.id,
      name: c.product.name,
      price: c.product.price,
      quantity: c.quantity,
    }));

  // Saves the order (atomic: validates stock, decrements, clears cart) then
  // fires the confirmation email.
  // NOTE (testing): p_payment_id is intentionally omitted so this matches the
  // 6-argument place_order() that is actually deployed in Supabase. Sending it
  // caused "Could not find the function public.place_order(...) in the schema
  // cache". Re-add it once supabase-payments.sql has been run on the database.
  async function finalizeOrder(items, paymentId) {
    const { data: orderId, error: rpcError } = await supabase.rpc("place_order", {
      p_total: cartTotal,
      p_items: items,
      p_name: form.name.trim(),
      p_phone: form.phone.trim(),
      p_address: form.address.trim(),
      p_payment_method: form.payment,
    });

    if (rpcError) {
      setError(rpcError.message);
      setPlacing(false);
      return;
    }

    try {
      const res = await fetch("/api/send-order-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, items, total: cartTotal, orderId }),
      });
      if (!res.ok) setEmailWarning(true);
    } catch {
      setEmailWarning(true);
    }

    await clearCart();
    setPlacing(false);
    setOrderPlaced(true);
  }

  // Online payment via Razorpay (UPI / Card).
  async function payOnline(items) {
    // 1) Ask our server to create a Razorpay order.
    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: cartTotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not start payment.");
      setPlacing(false);
      return;
    }

    // 2) Load Checkout and open the payment popup.
    const ok = await loadRazorpay();
    if (!ok) {
      setError("Could not load the payment window. Check your connection.");
      setPlacing(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: "Toyzilla",
      description: "Toy order",
      prefill: {
        name: form.name.trim(),
        email: user.email,
        contact: form.phone.trim(),
      },
      theme: { color: "#0d9488" },
      handler: async (response) => {
        // 3) Verify the signature on our server before saving the order.
        const v = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (!v.ok) {
          setError("Payment could not be verified. You were not charged.");
          setPlacing(false);
          return;
        }
        await finalizeOrder(items, response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => {
          setError("Payment cancelled.");
          setPlacing(false);
        },
      },
    });
    rzp.open();
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.address.trim()) {
      setError("Please enter your name and delivery address.");
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    setPlacing(true);
    const items = cartItems();

    // TESTING: payment gateway is bypassed — every method (COD / UPI / Card)
    // places the order directly without going through Razorpay. Restore the
    // `payOnline(items)` branch below once payments are configured.
    await finalizeOrder(items, null);
  }

  if (loading) {
    return (
      <div className="container-x flex items-center justify-center py-20 text-gray-500">
        <span className="animate-pulse">Loading your cart…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x py-10">
        <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">
            Please log in
          </h1>
          <p className="text-gray-500 mb-6">You need an account to view your cart.</p>
          <Link href="/login" className="btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="container-x py-10">
        <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5 text-4xl">
            ✅
          </div>
          <h1 className="font-display text-2xl font-bold text-emerald-600">
            Order placed!
          </h1>
          <p className="text-gray-500 mt-2 mb-2">
            Thank you for shopping at Toyzilla.
            {emailWarning
              ? " (We couldn't send the confirmation email, but your order is safe.)"
              : " A confirmation email is on its way."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href="/orders" className="btn-ghost">View my orders</Link>
            <button onClick={() => router.push("/")} className="btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-x py-10">
        <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
          <p className="text-5xl mb-4">🛒</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-500 mb-6">Let&apos;s find some fun toys to fill it up!</p>
          <Link href="/" className="btn-primary">Browse Toys</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          {step === "cart" ? "Your Cart" : "Checkout"}{" "}
          <span className="text-gray-400 font-normal text-lg">({cartCount})</span>
        </h1>
        {step === "cart" ? (
          <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            ← Continue shopping
          </Link>
        ) : (
          <button
            onClick={() => setStep("cart")}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            ← Back to cart
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: items (cart step) or shipping form (checkout step) */}
        <div className="lg:col-span-2 space-y-3">
          {step === "cart" &&
            cart.map((item) => (
              <div
                key={item.id}
                className="card p-4 flex items-center gap-4 hover:shadow-card transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-xl bg-brand-50 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-ink truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    ₹{Number(item.product.price).toFixed(0)} each
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600 text-xs mt-1 font-medium"
                  >
                    Remove
                  </button>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-1 bg-brand-50 rounded-xl p-1 border border-brand-100">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg hover:bg-white text-brand-600 font-bold transition"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={
                      item.product.stock != null &&
                      item.quantity >= item.product.stock
                    }
                    className="w-8 h-8 rounded-lg hover:bg-white text-brand-600 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                <div className="w-20 text-right font-display font-bold text-ink">
                  ₹{(item.product.price * item.quantity).toFixed(0)}
                </div>
              </div>
            ))}

          {step === "checkout" && (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="card p-6 space-y-5">
              <h2 className="font-display font-bold text-lg text-ink">Delivery details</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Full name
                  </label>
                  <input
                    className="input"
                    placeholder="Aarav Sharma"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Phone
                  </label>
                  <input
                    className="input"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Delivery address
                </label>
                <textarea
                  className="input min-h-[90px] resize-y"
                  placeholder="House no, street, area, city, state, PIN code"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Payment method
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`cursor-pointer rounded-xl border p-3 flex flex-col gap-1 transition ${
                        form.payment === m.id
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                          : "border-gray-200 hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={form.payment === m.id}
                        onChange={() => setField("payment", m.id)}
                        className="sr-only"
                      />
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-sm font-semibold text-ink">{m.label}</span>
                      <span className="text-[11px] text-gray-500">{m.desc}</span>
                    </label>
                  ))}
                </div>
                {form.payment !== "COD" && (
                  <p className="text-xs text-gray-400 mt-2">
                    🧪 Test mode — online payment is skipped and the order is placed directly.
                  </p>
                )}
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </form>
          )}
        </div>

        {/* RIGHT: order summary */}
        <div className="card p-6 lg:sticky lg:top-24">
          <h2 className="font-display font-bold text-lg text-ink mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span className="text-emerald-600 font-medium">Free</span>
            </div>
            <div className="border-t border-brand-50 my-3" />
            <div className="flex justify-between items-center">
              <span className="font-display font-semibold text-ink">Total</span>
              <span className="font-display font-bold text-2xl text-ink">
                ₹{cartTotal.toFixed(0)}
              </span>
            </div>
          </div>

          {step === "cart" ? (
            <button
              onClick={() => {
                setError(null);
                setStep("checkout");
              }}
              className="btn-primary w-full mt-5 py-3"
            >
              Proceed to Checkout →
            </button>
          ) : (
            <button
              type="submit"
              form="checkout-form"
              disabled={placing}
              className="btn-primary w-full mt-5 py-3"
            >
              {placing
                ? "Processing…"
                : form.payment === "COD"
                ? `Place Order • ₹${cartTotal.toFixed(0)}`
                : `Pay ₹${cartTotal.toFixed(0)}`}
            </button>
          )}

          <p className="text-xs text-gray-400 text-center mt-3">
            🔒 Secure checkout • Free 30-day returns
          </p>
        </div>
      </div>
    </div>
  );
}
