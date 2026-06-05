export const metadata = {
  title: "Shipping Info — Toyzilla",
  description: "Delivery times, shipping charges and coverage for Toyzilla orders across India.",
};

export default function ShippingPage() {
  return (
    <div className="container-x py-10 animate-fade-in max-w-3xl">
      <span className="chip">Shipping</span>
      <h1 className="font-display text-3xl font-bold text-ink mt-3">Shipping information</h1>

      <div className="card p-6 mt-8 space-y-5 text-sm text-gray-600 leading-relaxed">
        <div>
          <h2 className="font-display font-semibold text-ink text-base mb-1">Delivery time</h2>
          <p>Orders are dispatched within 24 hours and typically arrive in 2–5 business days. Remote areas may take a little longer.</p>
        </div>
        <div>
          <h2 className="font-display font-semibold text-ink text-base mb-1">Shipping charges</h2>
          <p>Free shipping on all orders over ₹999. A flat ₹49 fee applies to smaller orders and is shown at checkout.</p>
        </div>
        <div>
          <h2 className="font-display font-semibold text-ink text-base mb-1">Coverage</h2>
          <p>We currently deliver across all major cities and most PIN codes in India. Enter your address at checkout to confirm availability.</p>
        </div>
        <div>
          <h2 className="font-display font-semibold text-ink text-base mb-1">Order tracking</h2>
          <p>You can follow your order from the <a href="/track-order" className="text-brand-600 font-medium">Track Order</a> page or under <a href="/orders" className="text-brand-600 font-medium">My Orders</a>.</p>
        </div>
      </div>
    </div>
  );
}
