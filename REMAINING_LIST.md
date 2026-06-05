# 🧸 Toyzilla — Remaining List (Resolved)

_Last reviewed: 2026-06-05 — all 21 items addressed in code._

Status legend: ✅ done in code · ⚙️ needs a one-time manual step (below).

---

## ⚙️ MANUAL STEPS YOU MUST DO ONCE (nothing works without these)

1. **Run the two new SQL files in Supabase → SQL Editor → New query:**
   - `supabase-checkout.sql` — the atomic `place_order()` function + shipping
     columns (checkout now depends on this).
   - `supabase-features.sql` — profiles/admin role, reviews, wishlist, newsletter
     tables + their security policies.
2. **Make yourself an admin** (after signing up once), in SQL Editor:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
   Then visit `/admin`.
3. **(Optional) Real customer emails:** verify a sending domain in Resend and
   change the `from:` address in `app/api/send-order-email/route.js`. Until then,
   `onboarding@resend.dev` only delivers to your own Resend account email.
4. **(Optional) SEO base URL:** set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
   in `.env.local` / Vercel so canonical links, sitemap and robots use it.

---

## 🔴 Critical — ✅ resolved
- **#1 Checkout ignored `place_order()`** → ✅ `app/cart/page.js` now calls the
  `place_order` RPC (validates stock, decrements stock, clears cart atomically).
- **#2 Leaked Google client secret** → ✅ file deleted + `client_secret_*.json`
  added to `.gitignore`.
- **#3 Emails only reached you / errors swallowed** → ✅ checkout now surfaces an
  email-failure warning to the user. ⚙️ verify a Resend domain for real delivery.
- **#4 No shipping/contact collected** → ✅ checkout has a name / phone / address
  form with validation.

## 🟠 Important — ✅ resolved
- **#5 No order history** → ✅ new `/orders` page.
- **#6 No product detail page** → ✅ new `/product/[id]` page; cards link to it.
- **#7 No payment choice** → ✅ COD / UPI / Card selector saved on the order.
- **#8 Out-of-stock still purchasable** → ✅ button disabled + stock guard in
  `providers.js` (cart can't exceed stock).
- **#9 Dead links** → ✅ real pages: `/about`, `/faq`, `/shipping`, `/returns`,
  `/contact`, `/track-order`; footer + navbar wired up.
- **#10 Dead newsletter** → ✅ subscribes into `newsletter_subscribers`.
- **#11 Bath category missing from navbar** → ✅ added.
- **#12 ToyLand vs Toyzilla** → ✅ unified to Toyzilla (README, Hero3D, signup).

## 🟡 Polish — ✅ resolved
- **#13 Fake ratings** → ✅ real `reviews` table; product page has a review form,
  home/cards show real averages.
- **#14 No admin panel** → ✅ `/admin` (role-guarded): manage products + orders.
- **#15 Weak SEO** → ✅ metadata template + OG/Twitter in `layout.js`,
  `app/sitemap.js`, `app/robots.js`.
- **#16 No error/404 pages** → ✅ `app/not-found.js` + `app/error.js`.
- **#17 No wishlist** → ✅ `wishlist` table, heart buttons, `/wishlist` page.
- **#18 Thin auth UX** → ✅ confirm-password + strength meter on signup;
  `/forgot-password` + `/reset-password` flow.
- **#19 Accessibility** → ✅ aria-labels on icon buttons, real social links,
  labelled search inputs.
- **#20 Mobile account access** → ✅ account dropdown (Orders / Wishlist / Track /
  Logout) works on mobile.
- **#21 No tests/CI** → ✅ Vitest unit tests in `lib/format.test.js` (11 passing)
  + `.github/workflows/ci.yml` (install → test → build).

---

## ✅ Verified
- `npm test` → 11/11 passing.
- `npm run build` → all 22 routes compile successfully.
