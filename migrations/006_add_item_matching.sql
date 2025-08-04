-- Migration: 006_add_item_matching.sql
-- Description: Add item matching/goes-with functionality with bidirectional relationships
-- Date: 2025-01-04

-- Create item_matches table for storing relationships between items
CREATE TABLE item_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    item_id UUID NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
    matches_with_id UUID NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
    
    -- Ensure an item can't match with itself
    CONSTRAINT no_self_match CHECK (item_id != matches_with_id),
    
    -- Ensure unique pairs (prevent duplicates)
    CONSTRAINT unique_match_pair UNIQUE (item_id, matches_with_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_item_matches_item_id ON item_matches(item_id);
CREATE INDEX idx_item_matches_matches_with_id ON item_matches(matches_with_id);

-- Disable RLS for personal use (consistent with clothing_items table)
ALTER TABLE item_matches DISABLE ROW LEVEL SECURITY;

-- Grant permissions for personal use
GRANT ALL ON item_matches TO anon;
GRANT ALL ON item_matches TO authenticated;
GRANT ALL ON item_matches TO public;

-- Create function to ensure bidirectional relationships
CREATE OR REPLACE FUNCTION ensure_bidirectional_match()
RETURNS TRIGGER AS $$
BEGIN
  -- When inserting a match, also insert the reverse match if it doesn't exist
  IF TG_OP = 'INSERT' THEN
    INSERT INTO item_matches (item_id, matches_with_id)
    VALUES (NEW.matches_with_id, NEW.item_id)
    ON CONFLICT (item_id, matches_with_id) DO NOTHING;
    RETURN NEW;
  END IF;
  
  -- When deleting a match, also delete the reverse match
  IF TG_OP = 'DELETE' THEN
    DELETE FROM item_matches 
    WHERE item_id = OLD.matches_with_id AND matches_with_id = OLD.item_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain bidirectional relationships
CREATE TRIGGER trigger_bidirectional_match
  AFTER INSERT OR DELETE ON item_matches
  FOR EACH ROW
  EXECUTE FUNCTION ensure_bidirectional_match();

-- Create view for easier querying of all matches for an item
CREATE VIEW item_matches_view AS
SELECT 
  im.item_id,
  ci.name as item_name,
  ci.image_url as item_image_url,
  im.matches_with_id,
  cm.name as matches_with_name,
  cm.image_url as matches_with_image_url,
  cm.description as matches_with_description,
  im.created_at as match_created_at
FROM item_matches im
JOIN clothing_items ci ON im.item_id = ci.id
JOIN clothing_items cm ON im.matches_with_id = cm.id
ORDER BY im.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON item_matches_view TO anon;
GRANT SELECT ON item_matches_view TO authenticated;
GRANT SELECT ON item_matches_view TO public;