-- Clean up malformed categories with Lucide icon names
-- These were created incorrectly and need to be replaced with proper emoji icons

-- Delete malformed categories that have Lucide icon names
DELETE FROM event_categories
WHERE icon IN (
  'PartyPopper', 'MessageSquare', 'GraduationCap', 'Wrench', 'Users', 'Trophy',
  'Calendar', 'Music', 'Camera', 'Heart', 'Star', 'Gift'
)
OR (icon IS NOT NULL AND icon NOT LIKE '%[🎉🔧📚🏆💬🎊🎈🎵📸💖⭐🎁]%');

-- Now run script 11 to insert correct categories with emoji icons
