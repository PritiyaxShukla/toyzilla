export const metadata = {
  title: "FAQ — Toyzilla",
  description: "Answers to common questions about ordering, shipping, returns and payments at Toyzilla.",
};

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Most orders are dispatched the same day and arrive within 2–5 business days, depending on your location. You'll get a confirmation email as soon as your order is placed.",
  },
  {
    q: "Is shipping really free?",
    a: "Yes! Shipping is free on all orders over ₹999. Smaller orders carry a small flat fee shown at checkout.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Cash on Delivery (COD), UPI (GPay / PhonePe / Paytm) and credit/debit cards. This is a demo store, so online payments are recorded without a live gateway.",
  },
  {
    q: "Can I return a toy?",
    a: "Absolutely. We offer a 30-day return policy on unused items in their original packaging. See our Returns & Refunds page for details.",
  },
  {
    q: "Are your toys safe for young children?",
    a: "Every toy we sell is tested and certified non-toxic and age-appropriate. Always check the recommended age on each product.",
  },
  {
    q: "How do I track my order?",
    a: "Head to the Track Order page or open My Orders while logged in to see the status of every order you've placed.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-x py-10 animate-fade-in max-w-3xl">
      <span className="chip">Help Center</span>
      <h1 className="font-display text-3xl font-bold text-ink mt-3">
        Frequently asked questions
      </h1>
      <p className="text-gray-500 mt-2">
        Can&apos;t find what you&apos;re looking for? <a href="/contact" className="text-brand-600 font-medium">Contact us</a>.
      </p>

      <div className="mt-8 space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="card p-5 group">
            <summary className="font-semibold text-ink cursor-pointer list-none flex items-center justify-between">
              {f.q}
              <span className="text-brand-500 group-open:rotate-45 transition-transform text-xl leading-none">
                +
              </span>
            </summary>
            <p className="text-gray-600 mt-3 leading-relaxed text-sm">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
