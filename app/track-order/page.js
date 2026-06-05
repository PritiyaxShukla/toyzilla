"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "../providers";

const STATUS_STEPS = ["pending", "paid", "shipped", "delivered"];

export default function TrackOrderPage() {
  const { user } = useStore();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleTrack(e) {
    e.preventDefault();
    setError(null);
    setOrder(null);

    if (!user) {
      setError("Please log in to track your order.");
      return;
    }
    const idNum = Number(orderId.trim());
    if (!idNum) {
      setError("Enter a valid order number.");
      return;
    }

    setBusy(true);
    const { data, error: qErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", idNum)
      .eq("user_id", user.id)
      .maybeSingle();
    setBusy(false);

    if (qErr || !data) {
      setError("No order found with that number on your account.");
      return;
    }
    setOrder(data);
  }

  const currentStep = order
    ? Math.max(0, STATUS_STEPS.indexOf((order.status || "pending").toLowerCase()))
    : 0;

  return (
    <div className="container-x py-10 animate-fade-in max-w-2xl">
      <span className="chip">Track Order</span>
      <h1 className="font-display text-3xl font-bold text-ink mt-3">Where&apos;s my order?</h1>
      <p className="text-gray-500 mt-2">
        Enter your order number to see its status.{" "}
        <Link href="/orders" className="text-brand-600 font-medium">View all orders</Link>.
      </p>

      <form onSubmit={handleTrack} className="card p-6 mt-8 flex gap-3">
        <input
          className="input"
          placeholder="e.g. 1024"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <button type="submit" disabled={busy} className="btn-primary shrink-0">
          {busy ? "Checking…" : "Track"}
        </button>
      </form>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mt-4">{error}</p>
      )}

      {order && (
        <div className="card p-6 mt-6 animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-display font-bold text-ink">Order #{order.id}</p>
              <p className="text-xs text-gray-400">
                Placed {new Date(order.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>
            <p className="font-display font-bold text-ink">
              ₹{Number(order.total).toFixed(0)}
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i <= currentStep
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span className="text-[11px] mt-1 capitalize text-gray-500">{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded ${
                      i < currentStep ? "bg-brand-600" : "bg-gray-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
