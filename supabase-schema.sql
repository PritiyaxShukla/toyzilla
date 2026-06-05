-- ============================================================
--  TOY STORE DATABASE SCHEMA
--  Run this in Supabase: Dashboard -> SQL Editor -> New query
--  Paste everything below and click "Run".
-- ============================================================

-- ----------- 1. PRODUCTS TABLE (the toys) -------------------
create table if not exists products (
  id          bigint generated always as identity primary key,
  name        text not null,
  description text,
  price       numeric(10,2) not null,
  image_url   text,
  category    text,
  stock       int default 100,
  created_at  timestamptz default now()
);

-- ----------- 2. CART ITEMS TABLE ----------------------------
-- Each row = one product in one user's cart.
create table if not exists cart_items (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  product_id  bigint references products(id) on delete cascade not null,
  quantity    int not null default 1,
  created_at  timestamptz default now(),
  unique (user_id, product_id)   -- one row per product per user
);

-- ----------- 3. ORDERS TABLE --------------------------------
create table if not exists orders (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  total       numeric(10,2) not null,
  items       jsonb not null,
  status      text default 'pending',
  created_at  timestamptz default now()
);

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  This makes sure users can ONLY touch their own data.
-- ============================================================
alter table products  enable row level security;
alter table cart_items enable row level security;
alter table orders     enable row level security;

-- Anyone (even logged out) can VIEW products.
drop policy if exists "Anyone can view products" on products;
create policy "Anyone can view products"
  on products for select using (true);

-- A user can only see/add/edit/delete THEIR OWN cart rows.
drop policy if exists "Users manage own cart" on cart_items;
create policy "Users manage own cart"
  on cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A user can only see and create THEIR OWN orders.
drop policy if exists "Users view own orders" on orders;
create policy "Users view own orders"
  on orders for select using (auth.uid() = user_id);

drop policy if exists "Users create own orders" on orders;
create policy "Users create own orders"
  on orders for insert with check (auth.uid() = user_id);

-- ============================================================
--  SEED DATA — some toys to show on the store
-- ============================================================
insert into products (name, description, price, image_url, category, stock) values
  ('Wooden Train Set',     'Classic 20-piece wooden train with tracks. Great for ages 3+.', 1299.00, 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600', 'Wooden', 25),
  ('Plush Teddy Bear',     'Super soft 40cm cuddly teddy bear. Machine washable.',          799.00,  'https://images.unsplash.com/photo-1562040506-a9b32cb51b94?w=600', 'Soft Toys', 50),
  ('Building Blocks (100pc)', 'Colorful interlocking blocks to spark creativity.',          999.00,  'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600', 'Building', 40),
  ('Remote Control Car',   'Fast 2.4GHz RC car with rechargeable battery.',                1899.00, 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600', 'Electronic', 18),
  ('Jigsaw Puzzle 500pc',  'Beautiful landscape puzzle for the whole family.',             499.00,  'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600', 'Puzzles', 60),
  ('Toy Kitchen Set',      'Pretend-play kitchen with pots, pans and play food.',          2499.00, 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600', 'Pretend Play', 12),
  ('Rubber Duck Pack',     'Set of 6 colorful bath ducks. BPA-free.',                      349.00,  'https://images.unsplash.com/photo-1633613286848-e6f43bbafb8d?w=600', 'Bath', 80),
  ('Robot Action Figure',  'Poseable light-up robot figure with sound effects.',           1199.00, 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=600', 'Action', 30)
on conflict do nothing;
