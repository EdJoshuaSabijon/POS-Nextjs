-- Admins mapping: ensure a policy to allow adding admins via admin user
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$ LANGUAGE sql IMMUTABLE;

-- Admins table (ensure exists)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id)
);

-- Admin insert policy for admins table
CREATE POLICY admin_insert_admins ON public.admins
FOR INSERT
USING (public.is_admin())
WITH CHECK (public.is_admin());
