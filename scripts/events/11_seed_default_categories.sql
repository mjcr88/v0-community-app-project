-- Seed default event categories for all existing tenants

-- Insert default categories for each tenant
INSERT INTO event_categories (tenant_id, name, description, icon)
SELECT 
  t.id,
  category.name,
  category.description,
  category.icon
FROM tenants t
CROSS JOIN (
  VALUES 
    ('Social', 'Casual gatherings, meetups, and social activities', 'Users'),
    ('Maintenance', 'Community maintenance, work parties, and upkeep', 'Wrench'),
    ('Educational', 'Workshops, classes, and learning opportunities', 'GraduationCap'),
    ('Sports', 'Physical activities, sports, and fitness events', 'Trophy'),
    ('Community Meeting', 'Official meetings, town halls, and governance', 'MessageSquare'),
    ('Celebration', 'Holidays, birthdays, and special celebrations', 'PartyPopper')
) AS category(name, description, icon)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Add comment
COMMENT ON TABLE event_categories IS 'Event categories with default seeds: Social, Maintenance, Educational, Sports, Community Meeting, Celebration';
