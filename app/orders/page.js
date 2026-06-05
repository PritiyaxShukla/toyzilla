"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "../providers";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) console.error("orders error:", error.message);
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container-x flex items-center justify-center py-20 text-gray-500">
        <span className="animate-pulse">Loading your orders…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x py-10">
        <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Please log in</h1>
          <p className="text-gray-500 mb-6">Log in to see your order history.</p>
          <Link href="/login" className="btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container-x py-10">
        <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
          <p className="text-5xl mb-4">📦</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">No orders yet</h1>
          <p className="text-gray-500 mb-6">When you place an order it will show up here.</p>
          <Link href="/" className="btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">My Orders</h1>
        <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          ← Continue shopping
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];
          const status = (order.status || "pending").toLowerCase();
          return (
            <div key={order.id} className="card p-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <p className="font-display font-bold text-ink">Order #{order.id}</p>
                  <p className="text-xs text-gray-400">
                    Placed on {formatDate(order.created_at)}
                    {order.payment_method ? ` • ${order.payment_method}` : ""}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                    STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50 mt-2">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-ink">
                      {it.name}{" "}
                      <span className="text-gray-400">× {it.quantity}</span>
                    </span>
                    <span className="text-gray-600">
                      ₹{(Number(it.price) * Number(it.quantity)).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                {order.address ? (
                  <p className="text-xs text-gray-400 max-w-[60%] truncate">
                    🚚 {order.address}
                  </p>
                ) : (
                  <span />
                )}
                <p className="font-display font-bold text-ink">
                  Total: ₹{Number(order.total).toFixed(0)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
