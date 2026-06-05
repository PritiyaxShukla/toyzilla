-- ============================================================
--  TOYZILLA — CHECKOUT UPGRADE
--  Run this in Supabase: Dashboard -> SQL Editor -> New query
--  Adds shipping fields to orders + an atomic "place_order"
--  function that checks stock, saves the order, decrements
--  stock, and clears the cart — all in one safe transaction.
-- ============================================================

-- 1) New columns on the orders table -------------------------
alter table orders add column if not exists customer_name  text;
alter table orders add column if not exists phone          text;
alter table orders add column if not exists address        text;
alter table orders add column if not exists payment_method text default 'COD';

-- 2) Atomic place_order() -----------------------------------
--    SECURITY DEFINER lets it safely update product stock
--    (which normal users cannot touch directly via RLS).
create or replace function place_order(
  p_total          numeric,
  p_items          jsonb,
  p_name           text,
  p_phone          text,
  p_address        text,
  p_payment_method text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_order_id bigint;
  v_item     jsonb;
  v_stock    int;
begin
  if v_uid is null then
    raise exception 'You must be logged in to place an order.';
  end if;

  -- Validate stock for every item first.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select stock into v_stock
      from products
     where id = (v_item->>'product_id')::bigint;

    if v_stock is null then
      raise exception 'Product % no longer exists.', v_item->>'name';
    end if;

    if v_stock < (v_item->>'quantity')::int then
      raise exception 'Sorry, only % left of "%".', v_stock, v_item->>'name';
    end if;
  end loop;

  -- Create the order.
  insert into orders (user_id, total, items, status,
                      customer_name, phone, address, payment_method)
  values (v_uid, p_total, p_items, 'pending',
          p_name, p_phone, p_address, p_payment_method)
  returning id into v_order_id;

  -- Decrement stock for each item.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    update products
       set stock = stock - (v_item->>'quantity')::int
     where id = (v_item->>'product_id')::bigint;
  end loop;

  -- Empty the user's cart.
  delete from cart_items where user_id = v_uid;

  return v_order_id;
end;
$$;

-- Only logged-in users can call it.
grant execute on function place_order(numeric, jsonb, text, text, text, text)
  to authenticated;
