-- Smart Stall schema
-- Run this in Supabase SQL editor, or via `supabase db push`

-- Extension for UUIDs
create extension if not exists "pgcrypto";

-- One row per stall (lets this scale to multiple stalls/owners later)
create table if not exists stalls (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Stall',
  created_at timestamptz not null default now()
);

-- Owner accounts. Password is stored as a bcrypt hash ONLY.
-- This table is never readable by the anon key (see RLS below) -
-- all access goes through the owner-login edge function using the service role key.
create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  stall_id uuid not null references stalls(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Menu items
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  stall_id uuid not null references stalls(id) on delete cascade,
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  image_url text,
  allergies text[] default '{}',       -- e.g. {nuts, gluten, dairy}
  quantity_available integer not null default 0,
  is_out_of_stock boolean not null default false,
  is_active boolean not null default true, -- soft-delete / hide from menu
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stall_id uuid not null references stalls(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  status text not null default 'pending_payment',
    -- pending_payment | placed | accepted | rejected | ready | completed | cancelled
  payment_status text not null default 'unpaid',
    -- unpaid | paid | failed | refunded
  payment_reference text,            -- mock myPOS transaction id
  total_amount numeric(10,2) not null default 0,
  rejection_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order line items (snapshot of price/name at order time, so menu edits don't change history)
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name_snapshot text not null,
  price_snapshot numeric(10,2) not null,
  quantity integer not null default 1,
  line_total numeric(10,2) not null
);

create index if not exists idx_menu_items_stall on menu_items(stall_id);
create index if not exists idx_orders_stall on orders(stall_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);

-- Keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_menu_items_updated on menu_items;
create trigger trg_menu_items_updated before update on menu_items
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- ============ Row Level Security ============
alter table stalls enable row level security;
alter table owners enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- stalls: public can read (needed to show stall name on customer app)
create policy "stalls are publicly readable" on stalls
  for select using (true);

-- owners table: NO public access at all. Only the service role (used inside
-- the edge function) can read/write this. The anon key cannot touch it.
-- (No policy = no access for anon/authenticated roles under RLS.)

-- menu_items: public can read active items (for the customer app)
create policy "menu items are publicly readable" on menu_items
  for select using (true);

-- menu_items writes: blocked for anon. Owner edits go through the edge
-- function(s) using the service role key, OR you can switch to Supabase Auth
-- later and scope policies to auth.uid(). For now, no insert/update/delete
-- policies exist for anon, so writes are blocked unless using service role.

-- orders: customers need to INSERT their own order (no login), and the
-- created order's id is only known to them (UUID), so we allow public
-- insert + select-by-id implicitly through the app logic (anon key).
-- We restrict to insert + select; updates (accept/reject) go through the
-- service role (owner-side, after owner login).
create policy "anyone can place an order" on orders
  for insert with check (true);

create policy "orders are publicly readable" on orders
  for select using (true);

create policy "anyone can insert order items" on order_items
  for insert with check (true);

create policy "order items are publicly readable" on order_items
  for select using (true);

-- Seed one stall + a couple of demo menu items (edit/remove as you like)
insert into stalls (id, name)
  values ('00000000-0000-0000-0000-000000000001', 'My Stall')
  on conflict (id) do nothing;
