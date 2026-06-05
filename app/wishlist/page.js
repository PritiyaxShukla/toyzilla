"use client";

import Link from "next/link";
import { useStore } from "../providers";
import ProductCard from "../components/ProductCard";

export default function WishlistPage() {
  const { user, wishlist, loading } = useStore();

  if (loading) {
    return (
      <div className="container-x flex items-center justify-center py-20 text-gray-500">
        <span className="animate-pulse">Loading your wishlist…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x py-10">
        <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Please log in</h1>
          <p className="text-gray-500 mb-6">Log in to see your saved toys.</p>
          <Link href="/login" className="btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="container-x py-10">
        <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
          <p className="text-5xl mb-4">🤍</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">
            Your wishlist is empty
          </h1>
          <p className="text-gray-500 mb-6">
            Tap the heart on any toy to save it for later.
          </p>
          <Link href="/" className="btn-primary">Browse Toys</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          My Wishlist{" "}
          <span className="text-gray-400 font-normal text-lg">({wishlist.length})</span>
        </h1>
        <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          ← Continue shopping
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {wishlist
          .filter((w) => w.product)
          .map((w) => (
            <ProductCard key={w.id} product={w.product} />
          ))}
      </div>
    </div>
  );
}
