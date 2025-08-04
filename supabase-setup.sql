-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clothing_items table
CREATE TABLE clothing_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create indexes for better performance
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_created_at ON clothing_items(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only see their own items
CREATE POLICY "Users can view their own items" ON clothing_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" ON clothing_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" ON clothing_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" ON clothing_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-images', 'clothing-images', true);

-- Create storage policies
CREATE POLICY "Users can upload their own images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images" ON storage.objects
    FOR SELECT USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);