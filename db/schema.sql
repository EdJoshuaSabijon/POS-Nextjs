-- =====================================================================
-- Ritual Matcha Bar — Supabase Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Products table
CREATE TABLE IF NOT EXISTS public.products (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name     TEXT NOT NULL,
  category TEXT NOT NULL,
  price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock    INTEGER DEFAULT 0,
  image    TEXT,
  sku      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer TEXT NOT NULL DEFAULT 'Walk-in Customer',
  date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total    NUMERIC(10,2) NOT NULL DEFAULT 0,
  status   TEXT NOT NULL DEFAULT 'Pending'
             CHECK (status IN ('Pending','Processing','Completed','Cancelled')),
  items    JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: allow public read (anon), authenticated write
-- Products
DROP POLICY IF EXISTS "allow_anon_read_products"  ON public.products;
DROP POLICY IF EXISTS "allow_auth_write_products"  ON public.products;

CREATE POLICY "allow_anon_read_products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "allow_auth_write_products"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "allow_anon_read_orders"  ON public.orders;
DROP POLICY IF EXISTS "allow_auth_write_orders"  ON public.orders;

CREATE POLICY "allow_anon_read_orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "allow_auth_write_orders"
  ON public.orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Enable Realtime for both tables
-- (Run in Supabase Dashboard → Database → Replication → enable products & orders)
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 6. Seed sample products
INSERT INTO public.products (id, name, category, price, stock, sku)
VALUES
  ('p-001', 'Ceremonial Origin A',    'Matcha Powder', 48.00, 12, 'RIT-MAT-001'),
  ('p-002', 'Hand-Carved Chasen',     'Teaware',       32.00,  5, 'RIT-ACC-042'),
  ('p-003', 'Roasted Hojicha Blend',  'Matcha Powder', 38.00, 10, 'RIT-MAT-009'),
  ('p-004', 'Speckled Ceramic Chawan','Teaware',       64.00,  3, 'RIT-ACC-098'),
  ('p-005', 'Ceremonial Matcha Latte','Drinks',         6.50, 99, 'RIT-DRK-001'),
  ('p-006', 'Iced Oat Milk Matcha',   'Drinks',         5.75, 99, 'RIT-DRK-002'),
  ('p-007', 'Strawberry Cloud Matcha','Drinks',         7.25, 99, 'RIT-DRK-003'),
  ('p-008', 'Bamboo Chasen (Whisk)',  'Teaware',       18.50,  8, 'RIT-ACC-010'),
  ('p-009', 'Matcha Whisk Set',       'Merchandise',   24.00,  6, 'RIT-MER-001'),
  ('p-010', 'Gourmet Snack Box',      'Snacks',         9.50, 20, 'RIT-SNK-001')
ON CONFLICT (id) DO NOTHING;
