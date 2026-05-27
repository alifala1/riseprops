-- ============================================================
-- RISE PROPERTIES CRM — Phase 2 Update
-- Run this in your Supabase SQL Editor to enable Storage & Maps
-- ============================================================

-- 1. ADD GOOGLE MAPS COLUMN
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- 2. CREATE PUBLIC STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. STORAGE SECURITY POLICIES (RLS)

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Allow anyone to view the images
CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'property-images');

-- Allow authenticated users (you) to upload images
CREATE POLICY "Authenticated users can upload" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'property-images');

-- Allow authenticated users to update their images
CREATE POLICY "Authenticated users can update" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'property-images');

-- Allow authenticated users to delete their images
CREATE POLICY "Authenticated users can delete" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'property-images');

-- ============================================================
-- DONE. Storage and Maps fields are ready!
-- ============================================================
