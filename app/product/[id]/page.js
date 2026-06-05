"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "../../providers";

function Stars({ rating, size = "text-base" }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={`inline-flex items-center gap-0.5 text-accent-500 ${size}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? "★" : i === full && half ? "⯨" : "☆"}</span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={`text-2xl transition ${
            n <= value ? "text-accent-500" : "text-gray-300 hover:text-accent-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, addToCart, isWished, toggleWishlist } = useStore();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [adding, setAdding] = useState(false);
  const [cartNote, setCartNote] = useState(null);

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  async function loadReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });
    setReviews(data || []);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setProduct(data);
        await loadReviews();
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const avg = useMemo(() => {
    if (!reviews.length) return null;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const myReview = useMemo(
    () => reviews.find((r) => r.user_id === user?.id),
    [reviews, user]
  );

  // Pre-fill the form if the user already reviewed.
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || "");
    }
  }, [myReview]);

  async function handleAdd() {
    setAdding(true);
    const res = await addToCart(product);
    setAdding(false);
    if (res?.error === "login") return router.push("/login");
    if (res?.error === "out_of_stock") return setCartNote("Out of stock");
    if (res?.error === "max_stock") return setCartNote(`Only ${res.stock} in stock`);
    setCartNote("✓ Added to cart");
    setTimeout(() => setCartNote(null), 1600);
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewError(null);
    if (!user) return router.push("/login");
    setSubmitting(true);

    const authorName = user.email?.split("@")[0] || "Customer";
    const { error } = await supabase.from("reviews").upsert(
      {
        product_id: Number(id),
        user_id: user.id,
        author: authorName,
        rating,
        comment: comment.trim() || null,
      },
      { onConflict: "product_id,user_id" }
    );
    setSubmitting(false);
    if (error) {
      setReviewError(error.message);
      return;
    }
    await loadReviews();
  }

  if (loading) {
    return (
      <div className="container-x py-16 text-center text-gray-400 animate-pulse">
        Loading…
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container-x py-16">
        <div className="card max-w-md mx-auto p-10 text-center">
          <p className="text-5xl mb-3">🧸</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Toy not found</h1>
          <p className="text-gray-500 mb-6">This product may have been removed.</p>
          <Link href="/" className="btn-primary">Back to shop</Link>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock != null && product.stock <= 0;
  const wished = isWished?.(product.id);

  return (
    <div className="container-x py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-5">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/?cat=${encodeURIComponent(product.category)}`} className="hover:text-brand-600">
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="card p-4">
          <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div>
          <span className="chip">{product.category}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mt-2">
            {avg != null ? (
              <>
                <Stars rating={avg} />
                <span className="text-sm text-gray-500">
                  {avg.toFixed(1)} • {reviews.length} review{reviews.length > 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">No reviews yet</span>
            )}
          </div>

          <p className="text-3xl font-display font-bold text-ink mt-4">
            ₹{Number(product.price).toFixed(0)}
          </p>

          <p className="text-gray-600 mt-4 leading-relaxed">
            {product.description || "A wonderful toy your kids will love."}
          </p>

          <p className="text-sm mt-4">
            {outOfStock ? (
              <span className="text-red-500 font-semibold">Out of stock</span>
            ) : product.stock <= 15 ? (
              <span className="text-accent-600 font-semibold">
                Hurry — only {product.stock} left!
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">In stock</span>
            )}
          </p>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleAdd}
              disabled={adding || outOfStock}
              className="btn-primary flex-1 py-3 disabled:opacity-60"
            >
              {outOfStock ? "Out of Stock" : adding ? "Adding…" : cartNote || "Add to Cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={!!wished}
              className="btn-ghost px-4 py-3 text-xl"
            >
              {wished ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12 grid lg:grid-cols-3 gap-8">
        {/* Write a review */}
        <div className="lg:col-span-1">
          <h2 className="section-title mb-4">
            {myReview ? "Edit your review" : "Write a review"}
          </h2>
          {user ? (
            <form onSubmit={submitReview} className="card p-5 space-y-4">
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                className="input min-h-[100px] resize-y"
                placeholder="Tell other parents what you think…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {reviewError && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                  {reviewError}
                </p>
              )}
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Saving…" : myReview ? "Update review" : "Submit review"}
              </button>
            </form>
          ) : (
            <div className="card p-5 text-center text-sm text-gray-500">
              <Link href="/login" className="text-brand-600 font-semibold">Log in</Link>{" "}
              to leave a review.
            </div>
          )}
        </div>

        {/* Review list */}
        <div className="lg:col-span-2">
          <h2 className="section-title mb-4">
            Customer reviews{" "}
            <span className="text-gray-400 font-normal text-base">({reviews.length})</span>
          </h2>
          {reviews.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              Be the first to review this toy!
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold uppercase">
                        {r.author?.[0] || "U"}
                      </span>
                      <span className="font-semibold text-sm text-ink capitalize">
                        {r.author || "Customer"}
                        {r.user_id === user?.id && (
                          <span className="ml-2 text-[11px] text-brand-600">(you)</span>
                        )}
                      </span>
                    </div>
                    <Stars rating={r.rating} size="text-sm" />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
