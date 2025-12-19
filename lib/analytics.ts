/**
 * Centralized Analytics Utility
 * 
 * All analytics events are defined here for consistency and type safety.
 * Import the relevant module where you need tracking.
 */

import { posthog } from './posthog'

// ============================================
// USER IDENTIFICATION
// ============================================

export function identifyUser(userId: string, properties: {
    tenant_slug: string
    role: 'resident' | 'tenant_admin' | 'super_admin'
    email?: string
    name?: string
    onboarding_completed?: boolean
}) {
    posthog.identify(userId, {
        tenant_slug: properties.tenant_slug,
        role: properties.role,
        email: properties.email,
        name: properties.name,
        onboarding_completed: properties.onboarding_completed,
    })
}

export function resetUser() {
    posthog.reset()
}

// ============================================
// ONBOARDING & TOURS
// ============================================

export const OnboardingAnalytics = {
    stepCompleted: (step: number, stepName: string) =>
        posthog.capture('onboarding_step_completed', { step, step_name: stepName }),

    completed: () =>
        posthog.capture('onboarding_completed'),

    skipped: (skippedAtStep: number) =>
        posthog.capture('onboarding_skipped', { skipped_at_step: skippedAtStep }),
}

export const TourAnalytics = {
    productTourStarted: () =>
        posthog.capture('product_tour_started'),

    productTourStepViewed: (step: number, totalSteps: number) =>
        posthog.capture('product_tour_step_viewed', { step, total_steps: totalSteps }),

    productTourCompleted: () =>
        posthog.capture('product_tour_completed'),

    productTourSkipped: (skippedAtStep: number) =>
        posthog.capture('product_tour_skipped', { skipped_at_step: skippedAtStep }),

    profileTourStarted: (source?: string) =>
        posthog.capture('profile_tour_started', { source }),

    profileTourCompleted: (source?: string) =>
        posthog.capture('profile_tour_completed', { source }),

    profileTourSkipped: (skippedAtStep: number) =>
        posthog.capture('profile_tour_skipped', { skipped_at_step: skippedAtStep }),
}

// ============================================
// PROFILE & SETTINGS
// ============================================

export const ProfileAnalytics = {
    viewed: (isOwnProfile: boolean) =>
        posthog.capture('profile_viewed', { is_own_profile: isOwnProfile }),

    updated: (fieldsChanged: string[]) =>
        posthog.capture('profile_updated', { fields_changed: fieldsChanged }),

    photoUploaded: () =>
        posthog.capture('profile_photo_uploaded'),

    bannerUploaded: () =>
        posthog.capture('banner_photo_uploaded'),

    interestAdded: (interestName: string) =>
        posthog.capture('interest_added', { interest_name: interestName }),

    interestRemoved: (interestName: string) =>
        posthog.capture('interest_removed', { interest_name: interestName }),

    skillAdded: (skillName: string, openToRequests: boolean) =>
        posthog.capture('skill_added', { skill_name: skillName, open_to_requests: openToRequests }),

    skillRemoved: (skillName: string) =>
        posthog.capture('skill_removed', { skill_name: skillName }),

    languageAdded: (language: string) =>
        posthog.capture('language_added', { language }),

    aboutUpdated: (section: 'bio' | 'journey') =>
        posthog.capture('about_updated', { section }),
}

// ============================================
// EVENTS MODULE
// ============================================

export const EventsAnalytics = {
    created: (props: {
        event_type: 'resident' | 'official'
        category_id: string
        category_name: string
        visibility: 'community' | 'neighborhood' | 'private'
        has_rsvp: boolean
        has_location: boolean
    }) => posthog.capture('event_created', props),

    viewed: (eventId: string) =>
        posthog.capture('event_viewed', { event_id: eventId }),

    rsvp: (eventId: string, response: 'yes' | 'maybe' | 'no') =>
        posthog.capture('event_rsvp', { event_id: eventId, response }),

    saved: (eventId: string) =>
        posthog.capture('event_saved', { event_id: eventId }),

    unsaved: (eventId: string) =>
        posthog.capture('event_unsaved', { event_id: eventId }),

    edited: (eventId: string) =>
        posthog.capture('event_edited', { event_id: eventId }),

    cancelled: (eventId: string) =>
        posthog.capture('event_cancelled', { event_id: eventId }),
}

// ============================================
// MARKETPLACE (EXCHANGE)
// ============================================

export const MarketplaceAnalytics = {
    listingCreated: (props: {
        category_id: string
        category_name: string
        pricing_type: string
        visibility: 'community' | 'neighborhood'
        has_photos: boolean
    }) => posthog.capture('listing_created', props),

    listingViewed: (listingId: string) =>
        posthog.capture('listing_viewed', { listing_id: listingId }),

    listingEdited: (listingId: string) =>
        posthog.capture('listing_edited', { listing_id: listingId }),

    listingPaused: (listingId: string) =>
        posthog.capture('listing_paused', { listing_id: listingId }),

    listingDeleted: (listingId: string) =>
        posthog.capture('listing_deleted', { listing_id: listingId }),

    borrowRequested: (listingId: string, quantity: number) =>
        posthog.capture('borrow_requested', { listing_id: listingId, quantity }),

    transactionResponded: (transactionId: string, response: 'confirmed' | 'rejected') =>
        posthog.capture('transaction_responded', { transaction_id: transactionId, response }),

    transactionCompleted: (transactionId: string, outcome: string) =>
        posthog.capture('transaction_completed', { transaction_id: transactionId, outcome }),
}

// ============================================
// CHECK-INS
// ============================================

export const CheckInAnalytics = {
    created: (props: {
        activity_type: string
        activity_name: string
        duration_minutes: number
        visibility: 'community' | 'neighborhood' | 'private'
        location_type: 'community_location' | 'custom_temporary'
    }) => posthog.capture('checkin_created', props),

    viewed: (checkInId: string) =>
        posthog.capture('checkin_viewed', { check_in_id: checkInId }),

    rsvp: (checkInId: string, response: 'yes' | 'maybe' | 'no') =>
        posthog.capture('checkin_rsvp', { check_in_id: checkInId, response }),

    extended: (checkInId: string, additionalMinutes: number) =>
        posthog.capture('checkin_extended', { check_in_id: checkInId, additional_minutes: additionalMinutes }),

    endedEarly: (checkInId: string) =>
        posthog.capture('checkin_ended_early', { check_in_id: checkInId }),
}

// ============================================
// REQUESTS
// ============================================

export const RequestsAnalytics = {
    submitted: (props: {
        type: 'maintenance' | 'safety' | 'general'
        type_label: string
        priority: string
    }) => posthog.capture('request_submitted', props),

    viewed: (requestId: string) =>
        posthog.capture('request_viewed', { request_id: requestId }),

    updated: (requestId: string, newStatus: string) =>
        posthog.capture('request_updated', { request_id: requestId, new_status: newStatus }),
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export const AnnouncementsAnalytics = {
    viewed: (announcementId: string, priority: string) =>
        posthog.capture('announcement_viewed', { announcement_id: announcementId, priority }),

    markedRead: (announcementId: string) =>
        posthog.capture('announcement_marked_read', { announcement_id: announcementId }),

    archived: (announcementId: string) =>
        posthog.capture('announcement_archived', { announcement_id: announcementId }),
}

// ============================================
// NOTIFICATIONS
// ============================================

export const NotificationsAnalytics = {
    clicked: (notificationType: string) =>
        posthog.capture('notification_clicked', { notification_type: notificationType }),

    markedRead: (notificationId: string) =>
        posthog.capture('notification_marked_read', { notification_id: notificationId }),

    allMarkedRead: (count: number) =>
        posthog.capture('notifications_all_read', { count }),

    archived: (notificationId: string) =>
        posthog.capture('notification_archived', { notification_id: notificationId }),
}

// ============================================
// MAP INTERACTIONS
// ============================================

export const MapAnalytics = {
    viewed: () =>
        posthog.capture('map_viewed'),

    locationClicked: (locationId: string, locationType: string, isInsideBoundary: boolean) =>
        posthog.capture('map_location_clicked', { location_id: locationId, location_type: locationType, is_inside_boundary: isInsideBoundary }),

    mapClicked: (isInsideBoundary: boolean, coordinates: { lat: number, lng: number }) =>
        posthog.capture('map_clicked', { is_inside_boundary: isInsideBoundary, coordinates }),

    locationDetailsViewed: (locationId: string) =>
        posthog.capture('map_location_details_viewed', { location_id: locationId }),

    filterChanged: (visibleTypes: string[]) =>
        posthog.capture('map_filter_changed', { visible_types: visibleTypes }),

    styleChanged: (style: 'satellite' | 'streets' | 'outdoors') =>
        posthog.capture('map_style_changed', { style }),

    searched: (queryLength: number, resultCount: number) =>
        posthog.capture('map_searched', { query_length: queryLength, result_count: resultCount }),

    geolocationUsed: () =>
        posthog.capture('map_geolocation_used'),
}

// ============================================
// THEME & PREFERENCES
// ============================================

export const ThemeAnalytics = {
    changed: (theme: 'light' | 'dark' | 'system') =>
        posthog.capture('theme_changed', { theme }),

    detected: (theme: string, source: 'system' | 'preference') =>
        posthog.capture('theme_detected', { theme, source }),
}

// ============================================
// NAVIGATION & GENERAL
// ============================================

export const NavigationAnalytics = {
    sidebarClicked: (itemName: string) =>
        posthog.capture('sidebar_item_clicked', { item_name: itemName }),

    searchUsed: (queryLength: number, resultCount: number, context: string) =>
        posthog.capture('search_used', { query_length: queryLength, result_count: resultCount, context }),

    filterApplied: (filterType: string, filterValue: string) =>
        posthog.capture('filter_applied', { filter_type: filterType, filter_value: filterValue }),

    modalOpened: (modalName: string) =>
        posthog.capture('modal_opened', { modal_name: modalName }),
}

// ============================================
// DASHBOARD
// ============================================

export const DashboardAnalytics = {
    // Dashboard sections (Announcements, Events, Check-ins, etc.)
    sectionOpened: (sectionId: string) =>
        posthog.capture('dashboard_section_opened', { section_id: sectionId }),

    sectionClosed: (sectionId: string) =>
        posthog.capture('dashboard_section_closed', { section_id: sectionId }),

    // Stats grid
    statsModalOpened: () =>
        posthog.capture('stats_modal_opened'),

    statsSaved: (selectedStats: string[], scope: 'tenant' | 'neighborhood') =>
        posthog.capture('stats_saved', {
            selected_stats: selectedStats,
            stats_count: selectedStats.length,
            scope
        }),

    statsReordered: (newOrder: string[]) =>
        posthog.capture('stats_reordered', { new_order: newOrder }),

    // Filter cards (Exchange, Requests, Events, Notifications)
    filterCardClicked: (context: 'exchange' | 'requests' | 'events' | 'notifications', filterType: string, isActive: boolean) =>
        posthog.capture('filter_card_clicked', {
            context,
            filter_type: filterType,
            action: isActive ? 'deactivated' : 'activated'
        }),

    // Collapsible mobile sections
    mobileSectionToggled: (sectionTitle: string, isOpen: boolean) =>
        posthog.capture('mobile_section_toggled', {
            section_title: sectionTitle,
            action: isOpen ? 'opened' : 'closed'
        }),

    // Widget interactions
    widgetViewed: (widgetName: string) =>
        posthog.capture('widget_viewed', { widget_name: widgetName }),

    widgetActionClicked: (widgetName: string, actionName: string) =>
        posthog.capture('widget_action_clicked', {
            widget_name: widgetName,
            action_name: actionName
        }),

    // Priority feed
    priorityItemClicked: (itemType: string, itemId: string) =>
        posthog.capture('priority_item_clicked', { item_type: itemType, item_id: itemId }),

    priorityItemDismissed: (itemType: string, itemId: string) =>
        posthog.capture('priority_item_dismissed', { item_type: itemType, item_id: itemId }),
}

// ============================================
// ERROR TRACKING
// ============================================

export const ErrorAnalytics = {
    actionFailed: (action: string, errorMessage: string) =>
        posthog.capture('action_failed', { action, error_message: errorMessage }),
}
