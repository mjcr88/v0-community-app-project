Analytics Event Reference
Overview
This document serves as the source of truth for all analytics events tracked in the Next.js Community App. It details the event names, properties, and where they are instrumented in the codebase.

User Identification
Method	Description	Location

identifyUser
Associating sessions with authenticated users.	

login-form.tsx

resetUser
Clearing user data on logout.	

user-avatar-menu.tsx
Event Catalog
🎓 Onboarding & Tours
Events related to the initial user journey and feature walkthroughs.

Event Name	Properties	Trigger Location
onboarding_step_completed	

step
, step_name	

journey-form.tsx
, 

interests-form.tsx
, 

skills-form.tsx
, 

family-form.tsx
onboarding_completed	-	move-in-date-form.tsx
onboarding_skipped	skipped_at_step	

journey-form.tsx
, 

interests-form.tsx
, 

skills-form.tsx
product_tour_started	-	

tour-carousel.tsx
product_tour_step_viewed	

step
, total_steps	

tour-carousel.tsx
product_tour_completed	-	

tour-carousel.tsx
product_tour_skipped	skipped_at_step	

tour-carousel.tsx
profile_tour_started	-	

profile-tour.tsx
profile_tour_completed	-	

profile-tour.tsx
profile_tour_skipped	skipped_at_step	

profile-tour.tsx
👤 Profile & Settings
User updates to their personal information.

Event Name	Properties	Trigger Location
profile_viewed	is_own_profile	

track-views.tsx
profile_updated	fields_changed	

profile-edit-form.tsx
profile_photo_uploaded	-	

profile-edit-form.tsx
banner_photo_uploaded	-	

profile-edit-form.tsx
interest_added	interest_name	

profile-edit-form.tsx
interest_removed	interest_name	

profile-edit-form.tsx
skill_added	skill_name, open_to_requests	

profile-edit-form.tsx
skill_removed	skill_name	

profile-edit-form.tsx
language_added	

language

profile-edit-form.tsx
about_updated	

section

profile-edit-form.tsx
📅 Events Module
Creation and interaction with community events.

Event Name	Properties	Trigger Location
event_created	event_type, visibility, has_rsvp, has_location	

event-form.tsx
event_viewed	event_id	event-detail-modal.tsx
event_rsvp	event_id, response	

event-rsvp-quick-action.tsx
, event-detail-modal.tsx
event_saved	event_id	event-card.tsx
event_unsaved	event_id	event-card.tsx
event_edited	event_id	edit-event-modal.tsx
event_cancelled	event_id	

cancel-event-dialog.tsx
🛒 Marketplace (Exchange)
Peer-to-peer exchange interactions.

Event Name	Properties	Trigger Location
listing_created	category_id, pricing_type, visibility, has_photos	

create-exchange-listing-modal.tsx
listing_viewed	listing_id	

exchange-listing-detail-modal.tsx
listing_edited	listing_id	

edit-exchange-listing-modal.tsx
listing_paused	listing_id	

exchange-listing-detail-modal.tsx
listing_deleted	listing_id	

edit-exchange-listing-modal.tsx
borrow_requested	listing_id, quantity	

request-borrow-dialog.tsx
transaction_responded	transaction_id, response	transaction-response-dialog.tsx
transaction_completed	transaction_id, outcome	transaction-complete-dialog.tsx
📍 Check-Ins
Location-based check-ins.

Event Name	Properties	Trigger Location
checkin_created	activity_type, duration_minutes, visibility, location_type	

create-check-in-modal.tsx
checkin_viewed	check_in_id	

check-in-detail-modal.tsx
checkin_rsvp	check_in_id, response	

check-in-rsvp-quick-action.tsx
checkin_extended	check_in_id, additional_minutes	

check-in-detail-modal.tsx
checkin_ended_early	check_in_id	

check-in-detail-modal.tsx
📝 Request System
Help and maintenance requests.

Event Name	Properties	Trigger Location
request_submitted	type	

create-request-modal.tsx
request_viewed	request_id	request-detail-page.tsx
request_updated	request_id, new_status	request-status-dialog.tsx
📢 Announcements & Notifications
Communication tracking.

Event Name	Properties	Trigger Location
announcement_viewed	announcement_id, 

priority

announcement-card.tsx
announcement_marked_read	announcement_id	

announcement-card.tsx
announcement_archived	announcement_id	

archive-announcement-dialog.tsx
notification_clicked	notification_type	

notification-card.tsx
notification_marked_read	notification_id	

notification-card.tsx
notifications_all_read	count	

notification-page-client.tsx
notification_archived	notification_id	

notification-card.tsx
🗺️ Map Interactions
Usage of the interactive map.

Event Name	Properties	Trigger Location
map_viewed	-	

resident-map-client.tsx
map_location_clicked	location_id, location_type	

resident-map-client.tsx
map_location_details_viewed	location_id	

resident-map-client.tsx
map_filter_changed	visible_types	

resident-map-client.tsx
map_style_changed	

style

resident-map-client.tsx
map_searched	query_length, result_count	

resident-map-client.tsx
map_geolocation_used	-	

resident-map-client.tsx
📊 Dashboard Engagement
Widgets, stats, and feed interactions.

Event Name	Properties	Trigger Location
dashboard_section_opened	section_id	

DashboardSections.tsx
dashboard_section_closed	section_id	

DashboardSections.tsx
stats_modal_opened	-	

StatsGrid.tsx
stats_saved	selected_stats, stats_count, scope	

StatsGrid.tsx
stats_reordered	new_order	

EditStatModal.tsx
filter_card_clicked	context, filter_type, 

action

exchange-filter-cards.tsx
, 

requests-filter-cards.tsx
mobile_section_toggled	section_title, 

action

CollapsibleMobileSection.tsx
widget_viewed	widget_name	

my-requests-widget.tsx
widget_action_clicked	widget_name, action_name	

my-requests-widget.tsx
priority_item_clicked	item_type, item_id	

PriorityFeed.tsx
priority_item_dismissed	item_type, item_id	

PriorityFeed.tsx
⚠️ Error Tracking
Event Name	Properties	Description
action_failed	

action
, error_message	Triggered when server actions fail (e.g. login, create_event, update_profile). Tracks both API errors and unexpected exceptions.