"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { scorePassword } from "@/lib/format";

const STRENGTH = [
  { label: "Too weak", color: "bg-red-400", text: "text-red-500" },
  { label: "Weak", color: "bg-orange-400", text: "text-orange-500" },
  { label: "Fair", color: "bg-amber-400", text: "text-amber-600" },
  { label: "Good", color: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const tooWeak = password.length > 0 && strength < 2;

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    // Enforce password strength: require at least "Fair" (mix of length,
    // case, digits or symbols) before we let the account be created.
    if (strength < 2) {
      setError(
        "Please choose a stronger password — add length, mixed case, a number or a symbol."
      );
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      // Email confirmation is disabled in Supabase — user is signed in now.
      router.push("/");
    } else {
      // Email confirmation required: send the email user to the OTP screen.
      // (Google sign-up never lands here — OAuth emails are pre-verified.)
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    }
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
        <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
        <p className="text-gray-500 text-sm mt-1">Join Toyzilla and start shopping</p>
      </div>

      <div className="card p-6 sm:p-8">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white rounded-xl py-2.5 font-medium text-ink hover:border-brand-400 hover:bg-gray-50 transition"
        >
          <GoogleIcon />
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-brand-50" />
          <span className="text-xs text-gray-400">or use email</span>
          <hr className="flex-1 border-brand-50" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Strength meter */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < strength ? STRENGTH[strength].color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${STRENGTH[strength].text}`}>
                  {STRENGTH[strength].label}
                  {tooWeak && " — too weak to continue"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Confirm password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={`input ${mismatch ? "border-red-300 focus:ring-red-200" : ""}`}
            />
            {mismatch && (
              <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match.</p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {message && (
            <p className="text-emerald-700 text-sm bg-emerald-50 rounded-lg px-3 py-2">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading || mismatch || tooWeak}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>
      </div>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
          Log in
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.19 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.29l7.1 5.52C12.4 13.72 17.73 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.96-2.2 5.47-4.68 7.16l7.18 5.58C43.46 37.48 46.5 31.42 46.5 24.5z"/>
      <path fill="#FBBC05" d="M10.74 28.19A14.6 14.6 0 0 1 9.5 24c0-1.45.25-2.85.7-4.17l-7.1-5.52A23.93 23.93 0 0 0 .5 24c0 3.87.92 7.53 2.56 10.77l7.68-6.58z"/>
      <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.53-4.96l-7.18-5.58C28.57 38.1 26.4 38.5 24 38.5c-6.27 0-11.6-4.22-13.26-9.81l-7.68 6.58C6.48 43.1 14.57 47 24 47z"/>
    </svg>
  );
}
