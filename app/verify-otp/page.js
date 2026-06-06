"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { supabase } from "@/lib/supabaseClient";
import { getFirebaseAuth } from "@/lib/firebaseClient";

function VerifyOtpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const phone = params.get("phone") || "";

  // Two-step flow: confirm the email code (Supabase), then verify the mobile
  // number over SMS (Firebase Phone Auth). When email confirmation is disabled
  // in Supabase a session already exists, so we skip straight to the phone step.
  const [step, setStep] = useState("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [smsReady, setSmsReady] = useState(false);

  // Firebase reCAPTCHA verifier + the pending SMS confirmation handle.
  const verifierRef = useRef(null);
  const confirmationRef = useRef(null);
  const sentRef = useRef(false);

  const getVerifier = useCallback(() => {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return verifierRef.current;
  }, []);

  // Ask Firebase to text a 6-digit code to the phone number.
  const sendPhoneOtp = useCallback(async () => {
    setSmsReady(false);
    const auth = getFirebaseAuth();
    const verifier = getVerifier();
    if (!auth || !verifier) {
      setError(
        "Mobile verification isn't configured yet. Please contact support."
      );
      return;
    }
    try {
      confirmationRef.current = await signInWithPhoneNumber(auth, phone, verifier);
      setSmsReady(true);
    } catch (err) {
      setError(err?.message || "Couldn't send the SMS code. Try again.");
    }
  }, [phone, getVerifier]);

  const goToPhoneStep = useCallback(() => {
    setStep("phone");
    setCode("");
    setError(null);
    setMessage(null);
  }, []);

  // On load, if the user is already signed in (email confirmation off, or a
  // refresh after confirming email), jump to the phone step.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session && phone) goToPhoneStep();
    });
    return () => {
      active = false;
    };
  }, [phone, goToPhoneStep]);

  // Once we're on the phone step (and the recaptcha container is in the DOM),
  // send the SMS exactly once.
  useEffect(() => {
    if (step === "phone" && phone && !sentRef.current) {
      sentRef.current = true;
      sendPhoneOtp();
    }
  }, [step, phone, sendPhoneOtp]);

  async function handleVerifyEmail(token) {
    // type "signup" verifies the email-confirmation OTP and signs the user in.
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      if (phone) goToPhoneStep();
      else router.push("/");
    } else {
      setError("Could not verify. Request a new code and try again.");
    }
  }

  async function handleVerifyPhone(token) {
    if (!confirmationRef.current) {
      setError("Still sending the code — give it a moment, then try again.");
      return;
    }
    try {
      // Firebase confirms the SMS code; success proves the user owns the number.
      await confirmationRef.current.confirm(token);
    } catch {
      setError("That code didn't match. Check it and try again.");
      return;
    }
    // Record the verified number against the Supabase profile.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("id", user.id);
    }
    // We don't need the Firebase session after verification.
    const auth = getFirebaseAuth();
    if (auth) firebaseSignOut(auth).catch(() => {});
    router.push("/");
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const token = code.trim();
    if (!/^\d{6}$/.test(token)) {
      setError(`Enter the 6-digit code from your ${step === "email" ? "email" : "phone"}.`);
      return;
    }

    setLoading(true);
    if (step === "email") await handleVerifyEmail(token);
    else await handleVerifyPhone(token);
    setLoading(false);
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    setResending(true);
    if (step === "email") {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) setError(error.message);
      else setMessage("A new code is on its way to your inbox.");
    } else {
      await sendPhoneOtp();
      setMessage("A new code is on its way to your phone.");
    }
    setResending(false);
  }

  const isPhone = step === "phone";
  const target = isPhone ? phone : email;

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
        <h1 className="font-display text-2xl font-bold text-ink">
          {isPhone ? "Verify your mobile" : "Verify your email"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-ink">
            {target || (isPhone ? "your phone" : "your email")}
          </span>
        </p>
        {phone && (
          <div className="flex items-center justify-center gap-2 mt-3 text-xs">
            <StepDot label="Email" done={isPhone} active={!isPhone} />
            <span className="text-gray-300">—</span>
            <StepDot label="Mobile" done={false} active={isPhone} />
          </div>
        )}
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
            {isPhone && !smsReady && !error && (
              <p className="text-xs text-gray-400 mt-1.5">Sending code to your phone…</p>
            )}
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
            disabled={loading || code.length !== 6 || (isPhone && !smsReady)}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Verifying…" : isPhone ? "Verify mobile" : "Verify & Continue"}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !target}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
          >
            {resending ? "Sending…" : "Didn't get it? Resend code"}
          </button>
        </div>
      </div>

      {/* Invisible reCAPTCHA host required by Firebase Phone Auth. */}
      <div id="recaptcha-container" />

      <p className="text-sm text-gray-500 mt-6 text-center">
        Wrong details?{" "}
        <Link href="/signup" className="text-brand-600 font-semibold hover:text-brand-700">
          Back to sign up
        </Link>
      </p>
    </div>
  );
}

function StepDot({ label, done, active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${
        active ? "text-brand-600" : done ? "text-emerald-600" : "text-gray-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active ? "bg-brand-500" : done ? "bg-emerald-500" : "bg-gray-300"
        }`}
      />
      {label}
      {done && " ✓"}
    </span>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-gray-500">Loading…</div>}>
      <VerifyOtpInner />
    </Suspense>
  );
}
