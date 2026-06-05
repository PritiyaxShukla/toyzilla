# 🦖 Toyzilla — Full End-to-End Toy Store

A complete online toy store built with **Next.js** (frontend + backend) and **Supabase** (database + login/signup).

**Features**
- 🛍️ Product listing (toys loaded from the database)
- 🔐 Sign up / Log in (real authentication, passwords hashed by Supabase)
- 🛒 Shopping cart saved in the database (follows you across devices)
- ✅ Checkout that saves a real order
- 🔒 Row Level Security (users can only touch their own data)

---

## 📦 What you need first (one-time, free)

1. **Node.js** installed on your laptop → https://nodejs.org (download the "LTS" version)
2. A **Supabase account** → https://supabase.com (sign up free)

---

## 🚀 STEP 1 — Set up the database (Supabase)

1. Go to https://supabase.com → **New Project** (pick any name + password). Wait ~2 min.
2. In the left menu click **SQL Editor → New query**.
3. Open the file `supabase-schema.sql` from this project, copy **everything**, paste it in, and click **Run**.
   - This creates the `products`, `cart_items`, and `orders` tables and adds 8 sample toys.
4. Go to **Project Settings (gear icon) → API**. Copy these two values:
   - **Project URL**
   - **anon public** key

### (Recommended for testing) Turn OFF email confirmation
So you can log in instantly without checking email:
- **Authentication → Providers → Email** → turn **OFF** "Confirm email" → Save.
- (You can turn it back on later for the real launch.)

---

## 💻 STEP 2 — Run it on your laptop

1. Open a terminal **inside this `toy-store` folder**.

2. Create your secret env file. Copy the example:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```
   Then open `.env.local` and paste your two Supabase values from Step 1:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Install the dependencies (one time):
   ```powershell
   npm install
   ```

4. Start the website:
   ```powershell
   npm run dev
   ```

5. Open **http://localhost:3000** in your browser. 🎉

Try it: Sign up → browse toys → add to cart → place an order.
Check your Supabase tables (Table Editor) — you'll see the data appear live!

---

## ☁️ STEP 3 — Deploy to Vercel (go live on the internet)

1. Put this project on **GitHub** (create a repo and push it).
2. Go to https://vercel.com → sign in with GitHub → **Add New → Project** → pick your repo.
3. Before clicking Deploy, open **Environment Variables** and add the SAME two values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. In ~1 minute you get a live URL like `https://toyland.vercel.app`. ✅

### Updating later
Just edit code → `git push` → Vercel **automatically rebuilds and redeploys**. No manual upload.

### Custom domain
In Vercel → your project → **Settings → Domains** → add your domain (e.g. from Cloudflare/Namecheap) and follow the DNS steps.

---

## 🗂️ Project structure

```
toy-store/
├── app/
│   ├── layout.js            # wraps every page (navbar + providers)
│   ├── page.js              # HOME — list of toys
│   ├── providers.js         # holds the logged-in user + cart (shared state)
│   ├── globals.css          # styling base
│   ├── components/
│   │   ├── Navbar.js        # top bar with cart count + login/logout
│   │   └── ProductCard.js   # a single toy card with "Add to Cart"
│   ├── login/page.js        # log in form
│   ├── signup/page.js       # sign up form
│   └── cart/page.js         # cart + checkout
├── lib/
│   └── supabaseClient.js    # connects the app to your Supabase database
├── supabase-schema.sql      # run this once in Supabase to create tables
├── .env.local.example       # template for your secret keys
└── package.json
```

---

## 🧠 How the pieces fit (the big picture)

```
  Browser (what users see)
        │   signup / login / add to cart
        ▼
  Next.js app  (frontend + logic)
        │   reads & writes data
        ▼
  Supabase  ──▶ Auth (handles passwords securely)
            └─▶ Database (products, cart_items, orders)
```

- **Frontend** = the pages in `app/`
- **Auth (login/signup)** = Supabase Auth
- **Database** = your toys, carts and orders live in Supabase tables

That's a complete, real, end-to-end website. Happy building! 🚀
