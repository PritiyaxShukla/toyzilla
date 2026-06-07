"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Truck,
  ShieldCheck,
  ArrowsClockwise,
  CurrencyInr,
  ArrowRight,
  Lightning,
  Cube,
  HandTap,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "./components/ProductCard";

// three.js is client-only and heavy — load it lazily, never on the server.
const Showcase3D = dynamic(() => import("./components/Showcase3D"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-brand-200 text-sm">
      Loading 3D…
    </div>
  ),
});

// Trust-first perks tuned for an Indian RC/electronics buyer (see if_im.txt §3):
// COD and a plain replacement promise lift conversion more than any animation.
const PERKS = [
  { Icon: CurrencyInr, title: "Cash on Delivery", desc: "Pay when it arrives" },
  { Icon: ArrowsClockwise, title: "7-Day Replacement", desc: "Faulty or damaged" },
  { Icon: ShieldCheck, title: "Genuine Products", desc: "Tested & warranted" },
  { Icon: Truck, title: "Fast Shipping", desc: "Free over ₹999" },
];

// Curated RC categories with AI-generated tile art (Runware, SDXL Turbo).
// These link to product filters — keep the `cat` values in sync with your
// product categories in Supabase so the filtered grid isn't empty.
const CATEGORY_TILES = [
  { name: "RC Cars", cat: "RC Cars", img: "/generated/cat-rc-cars.jpg" },
  { name: "Drones", cat: "Drones", img: "/generated/cat-drones.jpg" },
  { name: "RC Planes", cat: "RC Planes", img: "/generated/cat-planes.jpg" },
  { name: "Helicopters", cat: "Helicopters", img: "/generated/cat-helicopters.jpg" },
  { name: "RC Animals", cat: "RC Animals", img: "/generated/cat-animals.jpg" },
  { name: "Boats", cat: "Boats", img: "/generated/cat-boats.jpg" },
  { name: "Spares & Batteries", cat: "Spares", img: "/generated/cat-spares.jpg" },
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
          {/* Cinematic main hero — AI photography fills the panel, dark scrim
              keeps the copy readable (see if_im.txt §5). */}
          <div className="reveal lg:col-span-2 relative overflow-hidden rounded-3xl min-h-[320px] sm:min-h-[400px] shadow-hero">
            {/* Static image paints instantly (good LCP); the AI video loop
                layers on top once ready. Hidden for reduced-motion users. */}
            <Image
              src="/generated/hero.jpg"
              alt="A remote-control rally car drifting through dust at golden hour"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover object-center"
            />
            <video
              className="hero-video absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster="/generated/hero.jpg"
              aria-hidden="true"
            >
              <source src="/generated/hero.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-transparent" />

            <div className="relative z-10 h-full flex flex-col justify-center p-8 sm:p-12 text-white">
              <span className="inline-flex w-fit items-center gap-1.5 bg-accent-400 text-ink text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                <Lightning size={14} weight="fill" />
                New season sale · up to 44% off
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-xl drop-shadow-md">
                Speed, thrills
                <br />
                remote controlled
              </h1>
              <p className="mt-4 text-gray-200 text-base sm:text-lg max-w-md leading-relaxed">
                RC cars, drones, planes and more · tested, genuine and built to
                take a beating.
              </p>
              <Link
                href="#products"
                className="group mt-6 inline-flex w-fit items-center gap-2 bg-white text-ink font-semibold px-6 py-3 rounded-xl shadow-soft hover:bg-brand-50 active:translate-y-px active:scale-[0.98] transition-all"
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

          {/* Side promos — AI imagery, real RC framing. */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <PromoTile
              href="/?cat=Drones"
              img="/generated/promo-drone.jpg"
              alt="A camera drone hovering in a clear sky"
              kicker="Take off"
              title="Camera Drones"
              sub="From ₹1,499"
              delay={1}
            />
            <PromoTile
              href="/?cat=RC Cars"
              img="/generated/promo-crawler.jpg"
              alt="A rugged remote-control rock crawler climbing rocks"
              kicker="Go anywhere"
              title="Rock Crawlers"
              sub="From ₹999"
              delay={2}
            />
          </div>
        </section>
      )}

      {/* Trust perks */}
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

      {/* Shop by category — curated, image-led */}
      {!isFiltering && (
        <section className="mb-10">
          <h2 className="section-title mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORY_TILES.map((c, i) => (
              <Link
                key={c.cat}
                href={`/?cat=${encodeURIComponent(c.cat)}`}
                style={{ "--i": i }}
                className="reveal group relative overflow-hidden rounded-2xl aspect-[4/3] shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Image
                  src={c.img}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 flex items-center justify-between">
                  <span className="font-display font-bold text-white text-sm sm:text-base drop-shadow">
                    {c.name}
                  </span>
                  <ArrowRight
                    size={18}
                    weight="bold"
                    className="text-white opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lifestyle / trust band */}
      {!isFiltering && (
        <section className="reveal relative overflow-hidden rounded-3xl min-h-[220px] sm:min-h-[260px] mb-12 shadow-card">
          <Image
            src="/generated/lifestyle.jpg"
            alt="A child happily flying a drone in a sunny park"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-center p-8 sm:p-12 text-white max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              Built for real play, loved across India
            </h2>
            <p className="mt-2 text-gray-200 text-sm sm:text-base">
              Cash on delivery · 7-day replacement · genuine, safety-tested gear.
              If it doesn&apos;t work, we make it right.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>COD available</Badge>
              <Badge>7-day replacement</Badge>
              <Badge>Secure payment</Badge>
            </div>
          </div>
        </section>
      )}

      {/* Interactive 3D showcase */}
      {!isFiltering && (
        <section className="reveal mb-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-slatebar to-brand-900 shadow-hero">
            <div className="grid lg:grid-cols-2 gap-0 items-center">
              <div className="p-8 sm:p-12 text-white order-2 lg:order-1">
                <span className="inline-flex items-center gap-1.5 bg-brand-500/20 text-brand-200 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
                  <Cube size={14} weight="fill" /> See it in 3D
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                  Spin it. Inspect it.
                  <br />
                  Then make it yours.
                </h2>
                <p className="mt-3 text-gray-300 text-sm sm:text-base max-w-md">
                  Every angle, in real time · drag to rotate, scroll to zoom.
                  What you see is what lands at your door.
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-200">
                  <HandTap size={16} weight="bold" /> Drag to rotate
                </p>
              </div>
              <div className="relative h-[300px] sm:h-[380px] lg:h-[440px] order-1 lg:order-2">
                <Showcase3D />
              </div>
            </div>
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
              : "Popular Right Now"}
          </h2>
          {isFiltering && (
            <Link href="/" className="text-sm text-brand-600 font-medium hover:text-brand-700">
              ← All products
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
            <p className="text-gray-500">
              No products found. Try a different search or category.
            </p>
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

function PromoTile({ href, img, alt, kicker, title, sub, delay }) {
  return (
    <Link
      href={href}
      style={{ "--i": delay }}
      className="reveal group relative overflow-hidden rounded-3xl min-h-[150px] flex flex-col justify-end p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <Image
        src={img}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
      <div className="relative z-10 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-300">
          {kicker}
        </p>
        <p className="font-display font-bold text-lg leading-tight drop-shadow">{title}</p>
        <p className="text-sm text-gray-200 mt-0.5">{sub}</p>
      </div>
    </Link>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-white/15 text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container-x py-10 text-gray-400">Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}
