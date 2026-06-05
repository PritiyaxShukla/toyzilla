// Pure, framework-free helpers — easy to unit-test and shared across the app.

/** Format a number as whole rupees, e.g. 1299 -> "₹1,299". */
export function formatINR(value) {
  const n = Number(value) || 0;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/**
 * Deterministic discount percentage (10–44%) derived from a product id, so the
 * catalog looks like a real store without needing an extra DB column.
 */
export function discountFor(id) {
  const seed = Number(id) || 1;
  return 10 + ((seed * 13) % 35);
}

/** Back-calculate a believable MRP from the sale price + discount. */
export function mrpFor(price, discount) {
  const p = Number(price) || 0;
  return Math.round(p / (1 - discount / 100) / 10) * 10;
}

/** Average rating from a list of { rating } objects, or null when empty. */
export function averageRating(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
  return sum / reviews.length;
}

/**
 * Password strength score 0–4.
 * Rewards length, mixed case, digits and symbols.
 */
export function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
