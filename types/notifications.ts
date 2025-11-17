// Notification types enum
export type NotificationType =
  // Exchange-related
  | 'exchange_request'
  | 'exchange_confirmed'
  | 'exchange_rejected'
  | 'exchange_picked_up'
  | 'exchange_returned' // Added exchange_returned for when lender marks item as returned
  | 'exchange_return_initiated'
  | 'exchange_completed'
  | 'exchange_extension_request'
  | 'exchange_extension_approved'
  | 'exchange_extension_rejected'
  | 'exchange_cancelled'
  | 'exchange_request_cancelled'
  | 'exchange_flagged'
  | 'exchange_flag_resolved'
  | 'exchange_reminder' // 2 days before return date
  | 'exchange_overdue' // When return date has passed
  // Event-related (future)
  | 'event_invite'
  | 'event_rsvp'
  | 'event_cancelled'
  | 'event_updated'
  // Check-in-related (future)
  | 'checkin_invite'
  | 'checkin_joined'
  // Announcements (future)
  | 'announcement'
  // Mentions (future)
  | 'mention'

// Base notification interface
export interface Notification {
  id: string
  tenant_id: string
  recipient_id: string
  
  // Content
  type: NotificationType
  title: string
  message: string | null
  
  // Status
  is_read: boolean
  is_archived: boolean
  action_required: boolean
  action_taken: boolean
  action_response: 'confirmed' | 'rejected' | 'approved' | 'declined' | 'accepted' | null
  
  // Timestamps
  created_at: string
  read_at: string | null
  
  // Polymorphic relationships
  exchange_transaction_id: string | null
  exchange_listing_id: string | null
  event_id: string | null
  check_in_id: string | null
  
  // Context
  actor_id: string | null
  action_url: string | null
  metadata: Record<string, any> | null
}

// Notification with actor details
export interface NotificationWithActor extends Notification {
  actor?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
}

// Notification with exchange listing details
export interface NotificationWithExchangeListing extends NotificationWithActor {
  exchange_listing?: {
    id: string
    title: string
    hero_photo: string | null
    category: {
      id: string
      name: string
    } | null
  } | null
}

// Notification with exchange transaction details
export interface NotificationWithExchangeTransaction extends NotificationWithExchangeListing {
  exchange_transaction?: {
    id: string
    quantity: number
    status: string
    proposed_pickup_date: string | null
    proposed_return_date: string | null
    expected_return_date: string | null
    actual_return_date: string | null
    return_condition: string | null
    return_notes: string | null
  } | null
}

// Full notification with all possible relations
export type NotificationFull = NotificationWithExchangeTransaction

// Notification filters
export interface NotificationFilters {
  type?: NotificationType | NotificationType[]
  is_read?: boolean
  is_archived?: boolean
  action_required?: boolean
  action_taken?: boolean
}

// Notification create data
export interface CreateNotificationData {
  tenant_id: string
  recipient_id: string
  type: NotificationType
  title: string
  message?: string | null
  action_required?: boolean
  exchange_transaction_id?: string | null
  exchange_listing_id?: string | null
  event_id?: string | null
  check_in_id?: string | null
  actor_id?: string | null
  action_url?: string | null
  metadata?: Record<string, any> | null
}
