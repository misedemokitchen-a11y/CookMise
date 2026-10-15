-- Order fulfillment + tracking columns. Safe to re-run.
alter table orders add column if not exists final_total       numeric;
alter table orders add column if not exists items             jsonb;   -- [{ingredient, qty, product:{name,brand,price,image}}]
alter table orders add column if not exists delivery_unit     text;
alter table orders add column if not exists delivery_notes    text;
alter table orders add column if not exists delivery_lat      double precision;
alter table orders add column if not exists delivery_lng      double precision;
alter table orders add column if not exists driver_lat        double precision;
alter table orders add column if not exists driver_lng        double precision;
alter table orders add column if not exists driver_updated_at timestamptz;
alter table orders add column if not exists status_updated_at timestamptz default now();

-- Customers may read and create their own orders, but NOT edit them
-- (status / final_total / driver location are changed only by the admin API,
-- which uses the service-role key and bypasses RLS).
alter table orders enable row level security;
drop policy if exists "Users read own orders"   on orders;
drop policy if exists "Users insert own orders" on orders;
create policy "Users read own orders"   on orders for select using (auth.uid() = user_id);
create policy "Users insert own orders" on orders for insert with check (auth.uid() = user_id);
-- If you previously created an UPDATE/ALL policy on orders for customers, drop it:
--   drop policy "<its name>" on orders;
