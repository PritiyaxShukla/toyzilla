import Razorpay from "razorpay";

export async function POST(request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return Response.json(
      { error: "Payments are not configured. Add Razorpay keys to .env.local." },
      { status: 500 }
    );
  }

  const { amount } = await request.json();
  const paise = Math.round(Number(amount) * 100);
  if (!paise || paise < 100) {
    return Response.json({ error: "Invalid amount." }, { status: 400 });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: paise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    // keyId is the PUBLIC key — safe to send to the browser for Checkout.
    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    return Response.json(
      { error: err?.error?.description || "Could not start payment." },
      { status: 500 }
    );
  }
}
