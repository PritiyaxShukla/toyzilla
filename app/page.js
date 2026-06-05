"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "./components/ProductCard";

const CATEGORY_ICONS = {
  Wooden: "🪵",
  "Soft Toys": "🧸",
  Building: "🧱",
  Electronic: "🤖",
  Puzzles: "🧩",
  "Pretend Play": "🍳",
  Bath: "🦆",
  Action: "🦸",
};

const PERKS = [
  { icon: "🚚", title: "Free Shipping", desc: "Orders over ₹999" },
  { icon: "🛡️", title: "Safe & Tested", desc: "Kid-friendly" },
  { icon: "↩️", title: "Easy Returns", desc: "30-day policy" },
  { icon: "💳", title: "Secure Payment", desc: "100% protected" },
];

function HomeContent() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const cat = params.get("cat") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Merge in real review aggregates (avg rating + count) per product.
      const { data: reviews } = await supabase
        .from("reviews")
        .select("product_id, rating");
      const stats = {};
      (reviews || []).forEach((r) => {
        const s = (stats[r.product_id] ||= { sum: 0, count: 0 });
        s.sum += r.rating;
        s.count += 1;
      });

      setProducts(
        data.map((p) => {
          const s = stats[p.id];
          return s
            ? { ...p, avg_rating: s.sum / s.count, review_count: s.count }
            : p;
        })
      );
      setLoading(false);
    }
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = !cat || p.category === cat;
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, query, cat]);

  const isFiltering = Boolean(query || cat);

  return (
    <div className="container-x py-5 animate-fade-in">
      {/* Hero (hidden while filtering) */}
      {!isFiltering && (
        <section className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-teal-400 text-white p-8 sm:p-10 flex flex-col justify-center min-h-[260px]">
            <span className="inline-block w-fit bg-white/20 backdrop-blur text-xs font-semibold px-3 py-1 rounded-full mb-3">
              🦖 NEW SEASON SALE
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
              Toys that spark
              <br /> big imaginations
            </h1>
            <p className="mt-3 text-brand-50 max-w-md">
              Up to 44% off on bestselling toys. Safe, fun and loved by kids
              across India.
            </p>
            <Link
              href="#products"
              className="mt-5 w-fit bg-white text-brand-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-50 transition"
            >
              Shop Now →
            </Link>
            <span className="absolute -right-6 -bottom-6 text-[140px] opacity-20 select-none">
              🧸
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="rounded-2xl bg-accent-100 p-5 flex flex-col justify-center">
              <p className="text-accent-600 font-bold text-lg leading-tight">
                Building Blocks
              </p>
              <p className="text-sm text-accent-600/80 mt-1">From ₹499</p>
              <span className="text-4xl mt-2">🧱</span>
            </div>
            <div className="rounded-2xl bg-brand-100 p-5 flex flex-col justify-center">
              <p className="text-brand-700 font-bold text-lg leading-tight">
                Soft & Cuddly
              </p>
              <p className="text-sm text-brand-700/80 mt-1">Plush from ₹349</p>
              <span className="text-4xl mt-2">🧸</span>
            </div>
          </div>
        </section>
      )}

      {/* Perks */}
      {!isFiltering && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3"
            >
              <span className="text-2xl shrink-0">{perk.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ink truncate">{perk.title}</p>
                <p className="text-xs text-gray-500 truncate">{perk.desc}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Shop by category */}
      {!isFiltering && !loading && categories.length > 0 && (
        <section className="mb-10">
          <h2 className="section-title mb-4">Shop by Category</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/?cat=${encodeURIComponent(c)}`}
                className="group flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-100 hover:border-brand-300 hover:shadow-card p-3 transition-all"
              >
                <span className="w-12 h-12 rounded-full bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center text-2xl transition">
                  {CATEGORY_ICONS[c] || "🎁"}
                </span>
                <span className="text-[11px] sm:text-xs text-center text-gray-600 font-medium leading-tight">
                  {c}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section id="products">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            {query
              ? `Results for “${query}”`
              : cat
              ? cat
              : "Popular Toys"}
          </h2>
          {isFiltering && (
            <Link href="/" className="text-sm text-brand-600 font-medium hover:text-brand-700">
              ← All toys
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-lg" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mt-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
                <div className="h-8 bg-gray-100 rounded mt-3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-5 rounded-xl">
            <p className="font-semibold">Could not load products</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500">No toys found. Try a different search or category.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container-x py-10 text-gray-400">Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}
