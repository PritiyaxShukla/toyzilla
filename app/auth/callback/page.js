"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          router.replace("/");
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="text-center mt-20 text-gray-500">Signing you in…</div>
  );
}
