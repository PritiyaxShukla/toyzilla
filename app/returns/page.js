export const metadata = {
  title: "Returns & Refunds — Toyzilla",
  description: "Our hassle-free 30-day return and refund policy for Toyzilla orders.",
};

const STEPS = [
  "Open My Orders and find the item you'd like to return.",
  "Email returns@toyzilla.example with your order number within 30 days.",
  "Pack the toy in its original packaging — we'll arrange a free pickup.",
  "Once we receive it, your refund is processed within 5–7 business days.",
];

export default function ReturnsPage() {
  return (
    <div className="container-x py-10 animate-fade-in max-w-3xl">
      <span className="chip">Returns</span>
      <h1 className="font-display text-3xl font-bold text-ink mt-3">Returns &amp; refunds</h1>
      <p className="text-gray-600 mt-4 leading-relaxed">
        Not delighted? No problem. We offer a <strong>30-day return policy</strong> on
        all unused items in their original packaging.
      </p>

      <div className="card p-6 mt-8">
        <h2 className="font-display font-semibold text-ink mb-4">How to return an item</h2>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                {i + 1}
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Some items (such as opened bath toys, for hygiene reasons) may not be eligible
        for return. Refunds are issued to your original payment method.
      </p>
    </div>
  );
}
