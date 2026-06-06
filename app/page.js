"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Truck,
  ShieldCheck,
  ArrowsClockwise,
  Lock,
  ArrowRight,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "./components/ProductCard";

// Toy-category glyphs stay as emoji on purpose: this is a kids' toy brand and the
// playful marks are part of its identity. Functional UI chrome uses icons instead.
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
  { Icon: Truck, title: "Free Shipping", desc: "On orders over ₹999" },
  { Icon: ShieldCheck, title: "Safe & Tested", desc: "Kid-friendly materials" },
  { Icon: ArrowsClockwise, title: "Easy Returns", desc: "30-day return policy" },
  { Icon: Lock, title: "Secure Payment", desc: "100% protected checkout" },
];

// Real hero photography (Unsplash, free license). Verified to return image/jpeg.
// "Father and son building with colorful blocks" by Vitaly Gariev.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1758687126192-98f54f4b747f?w=1400&q=80&auto=format&fit=crop";

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
          <div className="reveal lg:col-span-2 relative overflow-hidden rounded-3xl min-h-[300px] sm:min-h-[360px] shadow-hero">
            {/* Real photography fills the panel; brand scrim keeps copy readable. */}
            <Image
              src={HERO_IMAGE}
              alt="A parent and child building with colorful toy blocks together"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-800/95 via-brand-700/80 to-brand-600/25" />

            <div className="relative z-10 h-full flex flex-col justify-center p-8 sm:p-12 text-white">
              <span className="inline-flex w-fit items-center gap-1.5 bg-accent-400 text-ink text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                New season sale · up to 44% off
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-xl drop-shadow-sm">
                Toys that spark
                <br />
                big imaginations
              </h1>
              <p className="mt-4 text-brand-50/90 text-base sm:text-lg max-w-md leading-relaxed">
                Safe, tested and genuinely loved by kids across India.
              </p>
              <Link
                href="#products"
                className="group mt-6 inline-flex w-fit items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-xl shadow-soft hover:bg-brand-50 active:translate-y-px active:scale-[0.98] transition-all"
              >
                Shop Now
                <ArrowRight
                  size={18}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <Link
              href="/?cat=Building"
              className="reveal group relative overflow-hidden rounded-3xl bg-accent-100 p-6 flex flex-col justify-center transition-all hover:shadow-card hover:-translate-y-0.5"
              style={{ "--i": 1 }}
            >
              <p className="text-accent-600 font-display font-bold text-lg leading-tight">
                Building Blocks
              </p>
              <p className="text-sm text-accent-600/80 mt-1">From ₹499</p>
              <span className="absolute -right-2 -bottom-3 text-6xl opacity-90 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                🧱
              </span>
            </Link>
            <Link
              href="/?cat=Soft Toys"
              className="reveal group relative overflow-hidden rounded-3xl bg-brand-100 p-6 flex flex-col justify-center transition-all hover:shadow-card hover:-translate-y-0.5"
              style={{ "--i": 2 }}
            >
              <p className="text-brand-700 font-display font-bold text-lg leading-tight">
                Soft & Cuddly
              </p>
              <p className="text-sm text-brand-700/80 mt-1">Plush from ₹349</p>
              <span className="absolute -right-2 -bottom-3 text-6xl opacity-90 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                🧸
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Perks */}
      {!isFiltering && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {PERKS.map((perk, i) => (
            <div
              key={perk.title}
              className="reveal bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 transition-all hover:border-brand-200 hover:shadow-card"
              style={{ "--i": i }}
            >
              <span className="shrink-0 w-11 h-11 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <perk.Icon size={22} weight="duotone" />
              </span>
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
                className="group flex flex-col items-center gap-2.5 bg-white rounded-2xl border border-gray-100 hover:border-brand-300 hover:shadow-card hover:-translate-y-0.5 p-4 transition-all"
              >
                <span className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center text-2xl transition-all group-hover:scale-105 group-hover:-rotate-6">
                  {CATEGORY_ICONS[c] || "🎁"}
                </span>
                <span className="text-[11px] sm:text-xs text-center text-gray-600 group-hover:text-brand-700 font-medium leading-tight transition-colors">
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
