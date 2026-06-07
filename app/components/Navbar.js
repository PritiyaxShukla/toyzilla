"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  ShoppingCartSimple,
  Heart,
  User,
  Package,
  Truck,
  SignOut,
} from "@phosphor-icons/react";
import { useStore } from "../providers";

const CATEGORIES = [
  "All Toys",
  "RC Cars",
  "Drones",
  "RC Planes",
  "Helicopters",
  "RC Animals",
  "Boats",
  "Spares",
];

export default function Navbar() {
  const { user, cartCount, cartTotal, wishlist, signOut } = useStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the account menu on outside click.
  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    router.push("/");
  }

  function submitSearch(e) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header className="sticky top-0 z-30 shadow-soft">
      {/* Top utility bar */}
      <div className="bg-slatebar text-gray-300 text-xs">
        <div className="container-x flex items-center justify-between h-9">
          <p className="hidden sm:flex items-center gap-1.5">
            <Truck size={14} weight="fill" className="text-brand-300" />
            Free shipping on orders over ₹999 · Same-day dispatch
          </p>
          <div className="flex items-center gap-4">
            <Link href="/track-order" className="hover:text-white">Track Order</Link>
            <Link href="/faq" className="hidden sm:inline hover:text-white">Help</Link>
            {user ? (
              <button onClick={handleSignOut} className="hover:text-white">
                Logout
              </button>
            ) : (
              <Link href="/login" className="hover:text-white">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white">
        <div className="container-x flex items-center gap-4 sm:gap-8 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="text-2xl sm:text-3xl transition-transform group-hover:-rotate-12">
              🦖
            </span>
            <span className="font-display font-extrabold text-xl sm:text-2xl">
              <span className="text-brand-600">Toy</span>
              <span className="text-accent-500">zilla</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={submitSearch} className="flex-1 max-w-2xl hidden sm:flex" role="search">
            <label htmlFor="navbar-search" className="sr-only">Search for toys</label>
            <input
              id="navbar-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for toys, brands and more…"
              className="flex-1 border border-gray-200 border-r-0 rounded-l-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400"
            />
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 rounded-r-lg font-medium text-sm transition"
            >
              Search
            </button>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-3 sm:gap-5 ml-auto">
            {/* Account */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-2"
                >
                  <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold uppercase">
                    {user.email?.[0]}
                  </span>
                  <div className="leading-tight hidden md:block text-left">
                    <p className="text-[11px] text-gray-400">Hello</p>
                    <p className="text-xs font-semibold text-ink max-w-[120px] truncate">
                      {user.email?.split("@")[0]}
                    </p>
                  </div>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-gray-100 py-1.5 z-40 animate-fade-up"
                  >
                    <MenuLink href="/orders" onClick={() => setMenuOpen(false)}>
                      <Package size={17} /> My Orders
                    </MenuLink>
                    <MenuLink href="/wishlist" onClick={() => setMenuOpen(false)}>
                      <Heart size={17} /> Wishlist
                      {wishlist?.length > 0 && (
                        <span className="ml-auto text-xs text-brand-600">{wishlist.length}</span>
                      )}
                    </MenuLink>
                    <MenuLink href="/track-order" onClick={() => setMenuOpen(false)}>
                      <Truck size={17} /> Track Order
                    </MenuLink>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <SignOut size={17} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition"
              >
                <User size={24} weight="bold" />
                <div className="leading-tight hidden md:block">
                  <p className="text-[11px] text-gray-400">Account</p>
                  <p className="font-semibold">Login</p>
                </div>
              </Link>
            )}

            {/* Wishlist shortcut (logged in) */}
            {user && (
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="relative text-gray-700 hover:text-brand-600 transition hidden sm:block"
              >
                <Heart size={24} weight="bold" />
                {wishlist?.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition"
            >
              <div className="relative">
                <ShoppingCartSimple size={24} weight="bold" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="leading-tight hidden lg:block">
                <p className="text-[11px] text-gray-400">Cart</p>
                <p className="text-xs font-semibold">₹{cartTotal.toFixed(0)}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={submitSearch} className="container-x pb-3 flex sm:hidden" role="search">
          <label htmlFor="navbar-search-mobile" className="sr-only">Search for toys</label>
          <input
            id="navbar-search-mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for toys…"
            className="flex-1 border border-gray-200 border-r-0 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            aria-label="Search"
            className="bg-brand-600 text-white px-4 rounded-r-lg flex items-center justify-center"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
        </form>
      </div>

      {/* Category nav */}
      <nav className="bg-brand-600" aria-label="Toy categories">
        <div className="container-x flex items-center gap-1 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === "All Toys" ? "/" : `/?cat=${encodeURIComponent(cat)}`}
              className="whitespace-nowrap text-sm text-white/90 hover:text-white hover:bg-brand-700 px-3.5 py-2.5 font-medium transition"
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function MenuLink({ href, onClick, children }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="px-4 py-2 text-sm text-ink hover:bg-brand-50 flex items-center gap-2"
    >
      {children}
    </Link>
  );
}
