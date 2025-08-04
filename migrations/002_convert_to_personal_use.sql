-- Migration: 002_convert_to_personal_use.sql
-- Description: Convert from auth-based RLS to personal use without authentication
-- Date: 2025-01-04

-- Drop existing RLS policies for clothing_items
DROP POLICY IF EXISTS "Users can view their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can update their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON clothing_items;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Disable RLS for personal use (no authentication needed)
ALTER TABLE clothing_items DISABLE ROW LEVEL SECURITY;

-- Update user_id column to support text instead of UUID
ALTER TABLE clothing_items 
ALTER COLUMN user_id TYPE TEXT,
ALTER COLUMN user_id SET DEFAULT 'personal-user';

-- Update existing records to use personal-user (if any exist)
UPDATE clothing_items SET user_id = 'personal-user' WHERE user_id IS NOT NULL;

-- Create permissive storage policy for personal use
CREATE POLICY "Allow all access to clothing images" ON storage.objects
    FOR ALL USING (bucket_id = 'clothing-images');

-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-images', 'clothing-images', true)
ON CONFLICT (id) DO NOTHING;