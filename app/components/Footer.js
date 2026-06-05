import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Toys", href: "/" },
      { label: "New Arrivals", href: "/?sort=new" },
      { label: "Best Sellers", href: "/?sort=popular" },
      { label: "Deals & Offers", href: "/?sort=deals" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Track Order", href: "/track-order" },
      { label: "Shipping Info", href: "/shipping" },
      { label: "Returns & Refunds", href: "/returns" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "About Toyzilla",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Careers", href: "/about#careers" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "My Orders", href: "/orders" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", icon: "📘", href: "https://facebook.com" },
  { label: "Instagram", icon: "📸", href: "https://instagram.com" },
  { label: "Twitter", icon: "🐦", href: "https://twitter.com" },
  { label: "YouTube", icon: "▶️", href: "https://youtube.com" },
];

export default function Footer() {
  return (
    <footer className="mt-12 bg-slatebar text-gray-300">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-x py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              🦖 Join the Toyzilla club
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Get exclusive deals and new toy alerts in your inbox.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Link columns */}
      <div className="container-x py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🦖</span>
            <span className="font-display font-extrabold text-lg">
              <span className="text-brand-400">Toy</span>
              <span className="text-accent-400">zilla</span>
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            India&apos;s friendliest toy store. Safe, fun and loved by kids
            everywhere.
          </p>
          <div className="flex gap-3 mt-4 text-xl">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="cursor-pointer hover:text-white transition"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-display font-semibold text-white mb-3 text-sm">
              {col.title}
            </h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-brand-400 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Toyzilla. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>We accept:</span>
            <span className="bg-white/10 rounded px-2 py-1">VISA</span>
            <span className="bg-white/10 rounded px-2 py-1">UPI</span>
            <span className="bg-white/10 rounded px-2 py-1">RuPay</span>
            <span className="bg-white/10 rounded px-2 py-1">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
