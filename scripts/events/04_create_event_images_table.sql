-- Create event_images table (max 5 images per event)
CREATE TABLE IF NOT EXISTS event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_hero BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fixed: Create partial unique index instead of inline constraint with WHERE clause
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_hero_per_event 
  ON event_images(event_id) 
  WHERE is_hero = true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_display_order ON event_images(event_id, display_order);

-- Add comments for documentation
COMMENT ON TABLE event_images IS 'Event images with hero image selection (max 5 per event)';
COMMENT ON COLUMN event_images.is_hero IS 'Primary image displayed prominently on event details';
