"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // 'ok' | 'dupe' | 'error'
  const [busy, setBusy] = useState(false);

  async function handleSubscribe(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setBusy(true);
    setStatus(null);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: value });

    setBusy(false);
    if (error) {
      // Unique-violation = already subscribed (code 23505).
      setStatus(error.code === "23505" ? "dupe" : "error");
      return;
    }
    setStatus("ok");
    setEmail("");
  }

  return (
    <div className="w-full md:w-auto">
      <form onSubmit={handleSubscribe} className="flex max-w-md">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 md:w-72 rounded-l-lg px-4 py-2.5 text-sm text-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold px-5 rounded-r-lg text-sm transition"
        >
          {busy ? "…" : "Subscribe"}
        </button>
      </form>
      {status === "ok" && (
        <p className="text-emerald-400 text-xs mt-2">🎉 You&apos;re subscribed! Welcome to the club.</p>
      )}
      {status === "dupe" && (
        <p className="text-gray-400 text-xs mt-2">You&apos;re already on the list 😊</p>
      )}
      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}
