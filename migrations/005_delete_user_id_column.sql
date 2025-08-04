-- Migration: 005_delete_user_id_column.sql
-- Description: Just delete the fucking user_id column - we don't need it for personal use
-- Date: 2025-01-04

-- Drop ALL policies first
DROP POLICY IF EXISTS "Users can view their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can update their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON clothing_items;
DROP POLICY IF EXISTS "Allow all access to clothing images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on clothing images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to clothing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- DISABLE RLS completely
ALTER TABLE clothing_items DISABLE ROW LEVEL SECURITY;

-- Remove foreign key constraint
ALTER TABLE clothing_items DROP CONSTRAINT IF EXISTS clothing_items_user_id_fkey;

-- DROP THE FUCKING COLUMN
ALTER TABLE clothing_items DROP COLUMN IF EXISTS user_id;

-- Grant all permissions
GRANT ALL ON clothing_items TO anon;
GRANT ALL ON clothing_items TO authenticated;
GRANT ALL ON clothing_items TO public;

-- Fix storage bucket
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