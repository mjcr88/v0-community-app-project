-- Seed default event categories for all tenants
-- This script should be run when a tenant enables the events feature

INSERT INTO event_categories (tenant_id, name, description, icon)
SELECT 
  t.id as tenant_id,
  category.name,
  category.description,
  category.icon
FROM tenants t
CROSS JOIN (
  VALUES 
    ('Social', 'Social gatherings and community bonding activities', '🎉'),
    ('Maintenance', 'Property maintenance and improvement activities', '🔧'),
    ('Educational', 'Learning workshops and educational sessions', '📚'),
    ('Sports', 'Sports activities and fitness events', '🏆'),
    ('Community Meeting', 'Official community meetings and discussions', '💬'),
    ('Celebration', 'Special occasions and celebrations', '🎊')
) AS category(name, description, icon)
WHERE t.events_enabled = true
  AND NOT EXISTS (
    SELECT 1 FROM event_categories ec
    WHERE ec.tenant_id = t.id AND ec.name = category.name
  );
