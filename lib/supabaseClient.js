import { createClient } from "@supabase/supabase-js";

// These values come from your .env.local file.
// NEXT_PUBLIC_ means they are safe to use in the browser (the anon key is public by design).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Helpful warning if you forgot to set up .env.local
  console.warn(
    "⚠️  Missing Supabase env vars. Create a .env.local file (see .env.local.example)."
  );
}

// We fall back to harmless placeholders so the project can still BUILD without
// keys (e.g. first build before you add them). Real data calls happen in the
// browser, where your real NEXT_PUBLIC_ values are used.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
