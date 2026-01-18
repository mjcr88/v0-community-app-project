-- Fix Foreign Keys to allow User ID updates (required for handle_new_user trigger)
-- This migration alters all FKs referencing users(id) to use ON UPDATE CASCADE

BEGIN;

-- tenants.tenant_admin_id
ALTER TABLE public.tenants 
DROP CONSTRAINT tenants_tenant_admin_id_fkey,
ADD CONSTRAINT tenants_tenant_admin_id_fkey 
FOREIGN KEY (tenant_admin_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- user_interests.user_id
ALTER TABLE public.user_interests 
DROP CONSTRAINT user_interests_user_id_fkey,
ADD CONSTRAINT user_interests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- user_skills.user_id
ALTER TABLE public.user_skills 
DROP CONSTRAINT user_skills_user_id_fkey,
ADD CONSTRAINT user_skills_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- user_privacy_settings.user_id
ALTER TABLE public.user_privacy_settings 
DROP CONSTRAINT user_privacy_settings_user_id_fkey,
ADD CONSTRAINT user_privacy_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- family_relationships.user_id
ALTER TABLE public.family_relationships 
DROP CONSTRAINT family_relationships_user_id_fkey,
ADD CONSTRAINT family_relationships_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- family_relationships.related_user_id
ALTER TABLE public.family_relationships 
DROP CONSTRAINT family_relationships_related_user_id_fkey,
ADD CONSTRAINT family_relationships_related_user_id_fkey 
FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- locations.created_by
ALTER TABLE public.locations 
DROP CONSTRAINT locations_created_by_fkey,
ADD CONSTRAINT locations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- event_invites.invitee_id
ALTER TABLE public.event_invites 
DROP CONSTRAINT event_invites_invitee_id_fkey,
ADD CONSTRAINT event_invites_invitee_id_fkey 
FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- events.created_by
ALTER TABLE public.events 
DROP CONSTRAINT events_created_by_fkey,
ADD CONSTRAINT events_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- event_rsvps.user_id
ALTER TABLE public.event_rsvps 
DROP CONSTRAINT event_rsvps_user_id_fkey,
ADD CONSTRAINT event_rsvps_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- saved_events.user_id
ALTER TABLE public.saved_events 
DROP CONSTRAINT saved_events_user_id_fkey,
ADD CONSTRAINT saved_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- event_flags.flagged_by
ALTER TABLE public.event_flags 
DROP CONSTRAINT event_flags_flagged_by_fkey,
ADD CONSTRAINT event_flags_flagged_by_fkey 
FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- resident_requests.resolved_by
ALTER TABLE public.resident_requests 
DROP CONSTRAINT resident_requests_resolved_by_fkey,
ADD CONSTRAINT resident_requests_resolved_by_fkey 
FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- resident_requests.original_submitter_id
ALTER TABLE public.resident_requests 
DROP CONSTRAINT resident_requests_original_submitter_id_fkey,
ADD CONSTRAINT resident_requests_original_submitter_id_fkey 
FOREIGN KEY (original_submitter_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- announcements.created_by
ALTER TABLE public.announcements 
DROP CONSTRAINT announcements_created_by_fkey,
ADD CONSTRAINT announcements_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- announcement_reads.user_id
ALTER TABLE public.announcement_reads 
DROP CONSTRAINT announcement_reads_user_id_fkey,
ADD CONSTRAINT announcement_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- documents.created_by
ALTER TABLE public.documents 
DROP CONSTRAINT documents_created_by_fkey,
ADD CONSTRAINT documents_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- document_changelog.changed_by
ALTER TABLE public.document_changelog 
DROP CONSTRAINT document_changelog_changed_by_fkey,
ADD CONSTRAINT document_changelog_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- document_reads.user_id
ALTER TABLE public.document_reads 
DROP CONSTRAINT document_reads_user_id_fkey,
ADD CONSTRAINT document_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- family_units.primary_contact_id
ALTER TABLE public.family_units 
DROP CONSTRAINT family_units_primary_contact_id_fkey,
ADD CONSTRAINT family_units_primary_contact_id_fkey 
FOREIGN KEY (primary_contact_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- neighbor_lists.owner_id
ALTER TABLE public.neighbor_lists 
DROP CONSTRAINT neighbor_lists_owner_id_fkey,
ADD CONSTRAINT neighbor_lists_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- neighbor_list_members.neighbor_id
ALTER TABLE public.neighbor_list_members 
DROP CONSTRAINT neighbor_list_members_neighbor_id_fkey,
ADD CONSTRAINT neighbor_list_members_neighbor_id_fkey 
FOREIGN KEY (neighbor_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- neighbor_list_members.added_by
ALTER TABLE public.neighbor_list_members 
DROP CONSTRAINT neighbor_list_members_added_by_fkey,
ADD CONSTRAINT neighbor_list_members_added_by_fkey 
FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- reservations.user_id
ALTER TABLE public.reservations 
DROP CONSTRAINT reservations_user_id_fkey,
ADD CONSTRAINT reservations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
