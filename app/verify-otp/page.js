"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function VerifyOtpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const token = code.trim();
    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    // type "signup" verifies the email-confirmation OTP and signs the user in.
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) router.push("/");
    else setError("Could not verify. Request a new code and try again.");
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) setError(error.message);
    else setMessage("A new code is on its way to your inbox.");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 animate-fade-up">
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <span className="text-3xl">🦖</span>
          <span className="font-display font-extrabold text-2xl">
            <span className="text-brand-600">Toy</span>
            <span className="text-accent-500">zilla</span>
          </span>
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink">Verify your email</h1>
        <p className="text-gray-500 text-sm mt-1">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-ink">{email || "your email"}</span>
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              className="input text-center text-2xl tracking-[0.5em] font-semibold"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {message && (
            <p className="text-emerald-700 text-sm bg-emerald-50 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Verifying…" : "Verify & Continue"}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
          >
            {resending ? "Sending…" : "Didn't get it? Resend code"}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Wrong email?{" "}
        <Link href="/signup" className="text-brand-600 font-semibold hover:text-brand-700">
          Back to sign up
        </Link>
      </p>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-gray-500">Loading…</div>}>
      <VerifyOtpInner />
    </Suspense>
  );
}
