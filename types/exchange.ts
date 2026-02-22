// Exchange category types
export type ExchangeCategory = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

// Exchange listing status
export type ExchangeListingStatus = 'draft' | 'published' | 'paused' | 'cancelled'

// Exchange pricing type
export type ExchangePricingType = 'free' | 'fixed_price' | 'pay_what_you_want'

// Exchange item condition
export type ExchangeCondition = 'new' | 'slightly_used' | 'used' | 'slightly_damaged' | 'maintenance'

// Exchange visibility scope
export type ExchangeVisibilityScope = 'community' | 'neighborhood'

// Exchange listing
export type ExchangeListing = {
  id: string
  tenant_id: string
  created_by: string
  category_id: string

  // Basic info
  title: string
  description: string

  // Status
  status: ExchangeListingStatus
  is_available: boolean

  // Pricing
  pricing_type: ExchangePricingType
  price: number | null

  // Condition
  condition: ExchangeCondition | null

  // Quantity
  available_quantity: number

  // Location
  location_id: string | null
  custom_location_name: string | null
  custom_location_lat: number | null
  custom_location_lng: number | null
  custom_location_address: string | null

  // Visibility
  visibility_scope: ExchangeVisibilityScope

  // Flagging
  is_flagged: boolean
  flagged_at: string | null

  // Cancellation
  cancelled_at: string | null
  cancellation_reason: string | null

  // Archive
  archived_at: string | null
  archived_by: string | null

  // Timestamps
  created_at: string
  updated_at: string
  published_at: string | null
}

// Exchange listing with relations
export type ExchangeListingWithRelations = ExchangeListing & {
  category: ExchangeCategory
  creator?: {
    id: string
    email: string
    full_name: string | null
  }
  images?: ExchangeImage[]
  hero_image?: ExchangeImage
  location?: {
    id: string
    name: string
    type: string
    latitude: number | null
    longitude: number | null
  }
  neighborhoods?: {
    id: string
    name: string
  }[]
  flag_count?: number
}

// Exchange image
export type ExchangeImage = {
  id: string
  tenant_id: string
  listing_id: string
  url: string
  is_hero: boolean
  display_order: number
  created_at: string
}

// Exchange neighborhood junction
export type ExchangeNeighborhood = {
  id: string
  tenant_id: string
  listing_id: string
  neighborhood_id: string
  created_at: string
}

// Exchange transaction status
export type ExchangeTransactionStatus = 'requested' | 'rejected' | 'confirmed' | 'picked_up' | 'returned' | 'completed'

// Exchange return condition
export type ExchangeReturnCondition = 'good' | 'minor_wear' | 'damaged' | 'broken'

// Exchange transaction
export type ExchangeTransaction = {
  id: string
  tenant_id: string
  listing_id: string
  borrower_id: string
  lender_id: string

  // Transaction details
  quantity: number
  status: ExchangeTransactionStatus

  // Dates
  proposed_pickup_date: string | null
  proposed_return_date: string | null
  confirmed_pickup_date: string | null
  expected_return_date: string | null
  actual_pickup_date: string | null
  actual_return_date: string | null

  // Messages
  borrower_message: string | null
  lender_message: string | null
  rejection_reason: string | null

  // Extension requests
  extension_requested: boolean
  extension_new_date: string | null
  extension_message: string | null

  // Return condition
  return_condition: ExchangeReturnCondition | null
  return_notes: string | null
  return_damage_photo_url: string | null

  // Timestamps
  created_at: string
  updated_at: string
  confirmed_at: string | null
  rejected_at: string | null
  completed_at: string | null
}

// Exchange transaction with relations
export type ExchangeTransactionWithRelations = ExchangeTransaction & {
  listing: ExchangeListing
  borrower: {
    id: string
    email: string
    full_name: string | null
  }
  lender: {
    id: string
    email: string
    full_name: string | null
  }
}

// Exchange flag
export type ExchangeFlag = {
  id: string
  tenant_id: string
  listing_id: string
  flagged_by: string
  reason: string
  created_at: string
}

// Exchange flag with relations
export type ExchangeFlagWithRelations = ExchangeFlag & {
  listing: ExchangeListing
  flagged_by_user: {
    id: string
    email: string
    full_name: string | null
  }
}

// New types for archive functionality
export type ListingWithTransactionCount = ExchangeListing & {
  transaction_count: number
}

export type TransactionHistoryItem = ExchangeTransaction & {
  borrower_name: string
  borrower_avatar_url: string | null
  lender_name: string
  lender_avatar_url: string | null
}

// Extended type for listings with creator info
export type ExchangeListingWithCreator = ExchangeListing & {
  creator: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  }
  category?: ExchangeCategory
  location?: {
    id: string
    name: string
  } | null
}
