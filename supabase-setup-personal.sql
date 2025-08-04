-- Personal use setup without authentication requirements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can update their own items" ON clothing_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON clothing_items;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create clothing_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS clothing_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'personal-user',
    
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_created_at ON clothing_items(created_at DESC);

-- DISABLE RLS for personal use (no authentication needed)
ALTER TABLE clothing_items DISABLE ROW LEVEL SECURITY;

-- Create storage bucket for clothing images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-images', 'clothing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create permissive storage policies for personal use
CREATE POLICY "Allow all access to clothing images" ON storage.objects
    FOR ALL USING (bucket_id = 'clothing-images');