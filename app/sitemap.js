import { supabase } from "@/lib/supabaseClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toyzilla.example";

export default async function sitemap() {
  const staticRoutes = [
    "",
    "/about",
    "/faq",
    "/shipping",
    "/returns",
    "/contact",
    "/track-order",
    "/login",
    "/signup",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  // Include every product page (best-effort; falls back to static routes).
  let productRoutes = [];
  try {
    const { data } = await supabase
      .from("products")
      .select("id, created_at");
    productRoutes = (data || []).map((p) => ({
      url: `${siteUrl}/product/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // ignore — sitemap still returns static routes
  }

  return [...staticRoutes, ...productRoutes];
}
