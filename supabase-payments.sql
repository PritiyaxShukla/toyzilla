-- ============================================================
--  TOYZILLA — PAYMENTS UPGRADE (Razorpay)
--  Run this in Supabase: Dashboard -> SQL Editor -> New query
--  Adds a payment_id column and upgrades place_order() to record
--  the Razorpay payment id and mark paid orders as 'paid'.
--  Safe to run more than once.
-- ============================================================

-- 1) Store the Razorpay payment id on the order.
alter table orders add column if not exists payment_id text;

-- 2) Recreate place_order() with an extra optional p_payment_id.
--    When a payment id is supplied (online payment), the order is saved as
--    'paid'; otherwise (Cash on Delivery) it stays 'pending'.
drop function if exists place_order(numeric, jsonb, text, text, text, text);

create or replace function place_order(
  p_total          numeric,
  p_items          jsonb,
  p_name           text,
  p_phone          text,
  p_address        text,
  p_payment_method text,
  p_payment_id     text default null
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
  v_status   text := case when p_payment_id is null then 'pending' else 'paid' end;
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
                      customer_name, phone, address, payment_method, payment_id)
  values (v_uid, p_total, p_items, v_status,
          p_name, p_phone, p_address, p_payment_method, p_payment_id)
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
grant execute on function
  place_order(numeric, jsonb, text, text, text, text, text)
  to authenticated;
