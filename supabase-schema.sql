-- ============================================================
-- RISE PROPERTIES CRM — Supabase Database Schema
-- Paste this entire script into the Supabase SQL Editor
-- and click "Run" to set up your database.
-- ============================================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  title           TEXT          NOT NULL,
  description     TEXT,
  price           NUMERIC       NOT NULL,
  location        TEXT          NOT NULL CHECK (
                    location IN ('Dekwaneh', 'Sin el Fil', 'Horch Tabet', 'Surrounding Areas')
                  ),
  property_type   TEXT          NOT NULL CHECK (
                    property_type IN ('Sale', 'Rent')
                  ),
  category        TEXT          NOT NULL CHECK (
                    category IN ('Residential Apartment', 'Commercial Office', 'Retail Shop', 'Industrial/Warehouse')
                  ),
  status          TEXT          NOT NULL DEFAULT 'Available' CHECK (
                    status IN ('Available', 'Pending', 'Sold', 'Rented')
                  ),
  image_url       TEXT,
  natoor_notes    TEXT,
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. INDEXES for fast queries
CREATE INDEX IF NOT EXISTS idx_properties_user_id       ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status        ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_location      ON public.properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_created_at    ON public.properties(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 4. DROP existing policies if re-running this script
DROP POLICY IF EXISTS "Users can view their own properties"   ON public.properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- 5. RLS POLICIES — strictly scoped to authenticated owner
CREATE POLICY "Users can view their own properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- DONE. Your properties table is ready with RLS enabled.
-- ============================================================
