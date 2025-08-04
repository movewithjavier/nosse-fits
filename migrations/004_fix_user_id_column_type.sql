-- Migration: 004_fix_user_id_column_type.sql
-- Description: Fix user_id column type from UUID to TEXT for personal use
-- Date: 2025-01-04

-- Drop ALL existing policies first (clean slate)
DROP POLICY IF EXISTS "Users can view their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can update their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON clothing_items;
DROP POLICY IF EXISTS "Allow all access to clothing images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on clothing images" ON storage.objects;

-- Drop any other storage policies that might exist
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- DISABLE RLS completely
ALTER TABLE clothing_items DISABLE ROW LEVEL SECURITY;

-- Remove foreign key constraint that references auth.users
ALTER TABLE clothing_items DROP CONSTRAINT IF EXISTS clothing_items_user_id_fkey;

-- Change user_id column from UUID to TEXT
-- First, update any existing UUIDs to 'personal-user'
UPDATE clothing_items SET user_id = 'personal-user'::text WHERE user_id IS NOT NULL;

-- Now change the column type
ALTER TABLE clothing_items 
ALTER COLUMN user_id TYPE TEXT USING user_id::text,
ALTER COLUMN user_id SET DEFAULT 'personal-user',
ALTER COLUMN user_id SET NOT NULL;

-- Update any remaining NULL values
UPDATE clothing_items SET user_id = 'personal-user' WHERE user_id IS NULL;

-- Grant all permissions to public roles
GRANT ALL ON clothing_items TO anon;
GRANT ALL ON clothing_items TO authenticated;
GRANT ALL ON clothing_items TO public;

-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clothing-images', 'clothing-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create completely open storage policy
CREATE POLICY "Public access to clothing images" ON storage.objects
    FOR ALL TO public
    USING (bucket_id = 'clothing-images')
    WITH CHECK (bucket_id = 'clothing-images');

-- Verify the change worked
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'clothing_items' AND column_name = 'user_id';