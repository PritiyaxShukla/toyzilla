const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toyzilla.example";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/account pages out of the index.
        disallow: ["/cart", "/orders", "/wishlist", "/admin", "/auth/", "/reset-password"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
