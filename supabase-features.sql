-- ============================================================
--  TOYZILLA — FEATURES UPGRADE
--  Run this in Supabase: Dashboard -> SQL Editor -> New query
--  Adds: profiles (with admin role), product reviews,
--        wishlist, and newsletter subscribers — all with RLS.
--  Safe to run more than once.
-- ============================================================

-- ============================================================
--  1. PROFILES  (one row per user; holds the admin role)
-- ============================================================
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'customer',  -- 'customer' | 'admin'
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- A user can read & update only their own profile.
drop policy if exists "Users read own profile" on profiles;
create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for users who already exist.
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Helper: is the current user an admin?  (used by other policies)
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
--  2. ADMIN can manage PRODUCTS  (customers still read-only)
-- ============================================================
drop policy if exists "Admins manage products" on products;
create policy "Admins manage products"
  on products for all
  using (is_admin())
  with check (is_admin());

-- Admins can see ALL orders (customers still only see their own).
drop policy if exists "Admins view all orders" on orders;
create policy "Admins view all orders"
  on orders for select using (is_admin());

drop policy if exists "Admins update orders" on orders;
create policy "Admins update orders"
  on orders for update using (is_admin()) with check (is_admin());

-- ============================================================
--  3. REVIEWS  (real ratings written by logged-in buyers)
-- ============================================================
create table if not exists reviews (
  id         bigint generated always as identity primary key,
  product_id bigint references products(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  author     text,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz default now(),
  unique (product_id, user_id)   -- one review per product per user
);

alter table reviews enable row level security;

-- Anyone can read reviews.
drop policy if exists "Anyone can read reviews" on reviews;
create policy "Anyone can read reviews"
  on reviews for select using (true);

-- A user can write / edit / delete only their own review.
drop policy if exists "Users manage own reviews" on reviews;
create policy "Users manage own reviews"
  on reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
--  4. WISHLIST  (saved-for-later products)
-- ============================================================
create table if not exists wishlist (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  product_id bigint references products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

alter table wishlist enable row level security;

drop policy if exists "Users manage own wishlist" on wishlist;
create policy "Users manage own wishlist"
  on wishlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
--  5. NEWSLETTER SUBSCRIBERS
-- ============================================================
create table if not exists newsletter_subscribers (
  id         bigint generated always as identity primary key,
  email      text unique not null,
  created_at timestamptz default now()
);

alter table newsletter_subscribers enable row level security;

-- Anyone (even logged out) may subscribe (insert), but nobody can read
-- the list from the client.
drop policy if exists "Anyone can subscribe" on newsletter_subscribers;
create policy "Anyone can subscribe"
  on newsletter_subscribers for insert with check (true);

-- ============================================================
--  HOW TO MAKE YOURSELF AN ADMIN
--  After signing up, run this once (replace the email):
--
--    update profiles set role = 'admin'
--    where email = 'you@example.com';
-- ============================================================
