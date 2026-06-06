import { Resend } from "resend";

export async function POST(request) {
  const { email, items, total, orderId } = await request.json();

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center">x${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">₹${(item.price * item.quantity).toFixed(0)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <div style="background:#0d9488;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">🦖 Toyzilla</h1>
      </div>

      <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="margin:0 0 6px">Order Confirmed!</h2>
        <p style="color:#6b7280;margin:0 0 24px">Thanks for shopping at Toyzilla. Here's your order summary:</p>

        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="color:#6b7280;font-size:13px">
              <th style="text-align:left;padding-bottom:8px">Item</th>
              <th style="text-align:center;padding-bottom:8px">Qty</th>
              <th style="text-align:right;padding-bottom:8px">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="margin-top:16px;text-align:right;font-size:18px;font-weight:700">
          Total: ₹${Number(total).toFixed(0)}
        </div>

        <p style="color:#6b7280;font-size:13px;margin-top:24px">
          Order ID: #${orderId} • We'll get your toys packed and on their way soon!
        </p>
      </div>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.error("[send-order-email] RESEND_API_KEY is not set.");
    return Response.json({ error: "Email not configured" }, { status: 500 });
  }

  // Instantiate lazily (not at module load) so a missing key can never throw
  // during the build's page-data collection step.
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Sender address. Until you verify your own domain in Resend, the shared test
  // sender `onboarding@resend.dev` only delivers to your Resend account email.
  // After verifying toyzilla in Resend, set ORDER_EMAIL_FROM in .env.local, e.g.
  //   ORDER_EMAIL_FROM=Toyzilla <orders@yourdomain.com>
  const fromAddress =
    process.env.ORDER_EMAIL_FROM || "Toyzilla <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: "Your Toyzilla order is confirmed! 🦖",
    html,
  });

  if (error) {
    // Print the real reason in the server terminal so it's easy to debug.
    console.error("[send-order-email] Resend error:", error);
    return Response.json({ error: error.message || "Email failed" }, { status: 500 });
  }

  console.log("[send-order-email] sent to", email, "id:", data?.id);
  return Response.json({ ok: true });
}
