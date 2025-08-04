-- Migration: 003_super_permissive_personal_use.sql
-- Description: Make everything super permissive for personal use - no restrictions
-- Date: 2025-01-04

-- First, drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Users can view their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can update their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON clothing_items;
DROP POLICY IF EXISTS "Allow all access to clothing images" ON storage.objects;

-- Drop any other storage policies that might exist
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Make user_id completely optional and flexible
ALTER TABLE clothing_items 
ALTER COLUMN user_id SET DEFAULT 'personal-user',
ALTER COLUMN user_id DROP NOT NULL;

-- Remove the foreign key constraint if it exists (it references auth.users which we don't use)
ALTER TABLE clothing_items DROP CONSTRAINT IF EXISTS clothing_items_user_id_fkey;

-- COMPLETELY DISABLE RLS - no restrictions at all
ALTER TABLE clothing_items DISABLE ROW LEVEL SECURITY;

-- Create super permissive policies for storage (allow everything)
CREATE POLICY "Allow all operations on clothing images" ON storage.objects
    FOR ALL 
    USING (bucket_id = 'clothing-images')
    WITH CHECK (bucket_id = 'clothing-images');

-- Make sure the storage bucket exists and is completely public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clothing-images', 'clothing-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Grant all permissions to anon users (for personal use without auth)
GRANT ALL ON clothing_items TO anon;
GRANT ALL ON clothing_items TO authenticated;

-- Update any existing records to ensure they have the right user_id
UPDATE clothing_items SET user_id = 'personal-user' WHERE user_id IS NULL OR user_id = '';

-- Add a comment to make it clear this is for personal use
COMMENT ON TABLE clothing_items IS 'Personal use clothing items - no authentication or restrictions';