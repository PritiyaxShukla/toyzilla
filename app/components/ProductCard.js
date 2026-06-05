"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "../providers";
import { discountFor, mrpFor } from "@/lib/format";

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-accent-500 text-xs">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? "★" : i === full && half ? "⯨" : "☆"}</span>
      ))}
    </span>
  );
}

export default function ProductCard({ product }) {
  const { addToCart, isWished, toggleWishlist } = useStore();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState(null);
  const discount = discountFor(product.id);
  const mrp = mrpFor(product.price, discount);

  // Real rating/review count if provided by the page, else a gentle fallback.
  const rating = product.avg_rating != null ? Number(product.avg_rating) : null;
  const reviews = product.review_count ?? 0;

  const outOfStock = product.stock != null && product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 15;
  const wished = isWished?.(product.id);

  async function handleAdd() {
    setAdding(true);
    const result = await addToCart(product);
    setAdding(false);
    if (result?.error === "login") {
      router.push("/login");
      return;
    }
    if (result?.error === "out_of_stock") {
      setNotice("Out of stock");
      setTimeout(() => setNotice(null), 1600);
      return;
    }
    if (result?.error === "max_stock") {
      setNotice(`Only ${result.stock} in stock`);
      setTimeout(() => setNotice(null), 1600);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  async function handleWish(e) {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleWishlist(product);
    if (res?.error === "login") router.push("/login");
  }

  return (
    <div className="group bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-lift transition-all flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative p-3">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <span className="bg-sale text-white text-[11px] font-bold px-2 py-0.5 rounded">
            -{discount}%
          </span>
          {outOfStock ? (
            <span className="bg-gray-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Out of stock
            </span>
          ) : lowStock ? (
            <span className="bg-accent-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Few left
            </span>
          ) : null}
        </div>

        {/* Wishlist heart */}
        <button
          onClick={handleWish}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={!!wished}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-base shadow-soft hover:scale-110 transition"
        >
          {wished ? "❤️" : "🤍"}
        </button>

        <Link href={`/product/${product.id}`} className="block">
          <div className="aspect-square rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                outOfStock ? "opacity-60" : ""
              }`}
            />
          </div>
        </Link>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 flex flex-col flex-1">
        <span className="text-[11px] text-brand-600 font-medium uppercase tracking-wide">
          {product.category}
        </span>
        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-ink mt-1 line-clamp-2 leading-snug min-h-[2.5rem] hover:text-brand-700 transition">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1.5 min-h-[1.25rem]">
          {rating != null ? (
            <>
              <Stars rating={rating} />
              <span className="text-xs text-gray-400">({reviews})</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-ink">
            ₹{Number(product.price).toFixed(0)}
          </span>
          <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
          <span className="text-xs font-semibold text-emerald-600">{discount}% off</span>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          disabled={adding || outOfStock}
          className={`mt-3 w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed ${
            outOfStock
              ? "bg-gray-100 text-gray-400"
              : added
              ? "bg-emerald-500 text-white"
              : notice
              ? "bg-amber-100 text-amber-700"
              : "bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white"
          }`}
        >
          {outOfStock
            ? "Out of Stock"
            : adding
            ? "Adding…"
            : notice
            ? notice
            : added
            ? "✓ Added to Cart"
            : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
