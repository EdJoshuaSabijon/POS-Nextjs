-- =====================================================================
-- Add-Ons table for POS order customizations
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.add_ons (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL,
  price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  available  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "allow_anon_read_add_ons"  ON public.add_ons;
DROP POLICY IF EXISTS "allow_auth_write_add_ons" ON public.add_ons;

CREATE POLICY "allow_anon_read_add_ons"
  ON public.add_ons FOR SELECT
  USING (true);

CREATE POLICY "allow_auth_write_add_ons"
  ON public.add_ons FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.add_ons;

-- Seed sample add-ons
INSERT INTO public.add_ons (id, name, price, available)
VALUES
  ('ao-001', 'Extra Matcha Shot',   25.00, true),
  ('ao-002', 'Oat Milk Upgrade',    20.00, true),
  ('ao-003', 'Vanilla Syrup',       15.00, true),
  ('ao-004', 'Whipped Cream',       15.00, true),
  ('ao-005', 'Tapioca Pearls',      30.00, true),
  ('ao-006', 'Brown Sugar Drizzle', 10.00, true)
ON CONFLICT (id) DO NOTHING;
