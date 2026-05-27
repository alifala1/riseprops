-- ============================================================
-- RISE PROPERTIES CRM — Phase 3 Update
-- Run this in your Supabase SQL Editor to enable Multiple Images
-- ============================================================

-- 1. ADD NEW ARRAY COLUMN
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'::TEXT[];

-- 2. MIGRATE EXISTING IMAGES
-- If you already added properties with single images, this securely 
-- moves them into the new array format so nothing is lost!
UPDATE public.properties 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL 
  AND image_url != '' 
  AND image_urls = '{}'::TEXT[];

-- Note: We are keeping the old `image_url` column safely ignored 
-- so we don't accidentally break anything.

-- ============================================================
-- DONE. Your database is ready for up to 10 images per property!
-- ============================================================
