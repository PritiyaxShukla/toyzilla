import crypto from "crypto";

// Verifies that a Razorpay payment is genuine by recomputing the signature
// with our SECRET key. Never trust the browser's "payment succeeded" alone.
export async function POST(request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return Response.json({ valid: false, error: "Not configured" }, { status: 500 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await request.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json({ valid: false }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const valid = expected === razorpay_signature;
  return Response.json({ valid }, { status: valid ? 200 : 400 });
}
