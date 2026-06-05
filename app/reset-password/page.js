"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false); // recovery session detected
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Supabase puts the user into a temporary recovery session when they arrive
  // from the email link. Wait for that before allowing a password change.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1800);
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
        <h1 className="font-display text-2xl font-bold text-ink">Choose a new password</h1>
      </div>

      <div className="card p-6 sm:p-8">
        {done ? (
          <div className="text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-600">Password updated! Redirecting you…</p>
          </div>
        ) : !ready ? (
          <p className="text-gray-500 text-sm text-center">
            Open this page from the reset link in your email. If you got here by mistake,{" "}
            <Link href="/forgot-password" className="text-brand-600 font-medium">
              request a new link
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                New password
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="input"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
