-- Fix missing ON UPDATE CASCADE for all tables referencing users(id)

-- 1. Notifications
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey,
ADD CONSTRAINT notifications_recipient_id_fkey
  FOREIGN KEY (recipient_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey,
ADD CONSTRAINT notifications_actor_id_fkey
  FOREIGN KEY (actor_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 2. Check-in Invites
ALTER TABLE public.check_in_invites
DROP CONSTRAINT IF EXISTS check_in_invites_invitee_id_fkey,
ADD CONSTRAINT check_in_invites_invitee_id_fkey
  FOREIGN KEY (invitee_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE public.check_in_invites
DROP CONSTRAINT IF EXISTS check_in_invites_created_by_fkey,
ADD CONSTRAINT check_in_invites_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 3. Event Invites (re-applying to be safe, as script 050 might have missed some or been run before table creation)
ALTER TABLE public.event_invites
DROP CONSTRAINT IF EXISTS event_invites_invitee_id_fkey,
ADD CONSTRAINT event_invites_invitee_id_fkey
  FOREIGN KEY (invitee_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 4. Resident Requests (e.g. tagged residents, original submitter)
-- Note: Check constraint names first if possible, but standard naming is usually table_column_fkey
ALTER TABLE public.resident_requests
DROP CONSTRAINT IF EXISTS resident_requests_created_by_fkey,
ADD CONSTRAINT resident_requests_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE public.resident_requests
DROP CONSTRAINT IF EXISTS resident_requests_original_submitter_id_fkey,
ADD CONSTRAINT resident_requests_original_submitter_id_fkey
  FOREIGN KEY (original_submitter_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 5. Exchange Listings
ALTER TABLE public.exchange_listings
DROP CONSTRAINT IF EXISTS exchange_listings_created_by_fkey,
ADD CONSTRAINT exchange_listings_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 6. Exchange Transactions
-- 6. Exchange Transactions
ALTER TABLE public.exchange_transactions
DROP CONSTRAINT IF EXISTS exchange_transactions_borrower_id_fkey,
ADD CONSTRAINT exchange_transactions_borrower_id_fkey
  FOREIGN KEY (borrower_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE public.exchange_transactions
DROP CONSTRAINT IF EXISTS exchange_transactions_lender_id_fkey,
ADD CONSTRAINT exchange_transactions_lender_id_fkey
  FOREIGN KEY (lender_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 6b. Exchange Listings (archived_by)
ALTER TABLE public.exchange_listings
DROP CONSTRAINT IF EXISTS exchange_listings_archived_by_fkey,
ADD CONSTRAINT exchange_listings_archived_by_fkey
  FOREIGN KEY (archived_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 6c. Exchange Flags
ALTER TABLE public.exchange_flags
DROP CONSTRAINT IF EXISTS exchange_flags_flagged_by_fkey,
ADD CONSTRAINT exchange_flags_flagged_by_fkey
  FOREIGN KEY (flagged_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 6d. Check-ins
ALTER TABLE public.check_ins
DROP CONSTRAINT IF EXISTS check_ins_created_by_fkey,
ADD CONSTRAINT check_ins_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 6e. Check-in Neighborhoods
ALTER TABLE public.check_in_neighborhoods
DROP CONSTRAINT IF EXISTS check_in_neighborhoods_created_by_fkey,
ADD CONSTRAINT check_in_neighborhoods_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 7. Document Reads
ALTER TABLE public.document_reads
DROP CONSTRAINT IF EXISTS document_reads_user_id_fkey,
ADD CONSTRAINT document_reads_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 8. Event RSVPs
ALTER TABLE public.event_rsvps
DROP CONSTRAINT IF EXISTS event_rsvps_user_id_fkey,
ADD CONSTRAINT event_rsvps_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 9. Check-in RSVPs
ALTER TABLE public.check_in_rsvps
DROP CONSTRAINT IF EXISTS check_in_rsvps_user_id_fkey,
ADD CONSTRAINT check_in_rsvps_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 10. Saved Events
ALTER TABLE public.saved_events
DROP CONSTRAINT IF EXISTS saved_events_user_id_fkey,
ADD CONSTRAINT saved_events_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 11. Neighbor Lists
ALTER TABLE public.neighbor_lists
DROP CONSTRAINT IF EXISTS neighbor_lists_owner_id_fkey,
ADD CONSTRAINT neighbor_lists_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
