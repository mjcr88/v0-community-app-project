export type AnnouncementType = 'general' | 'emergency' | 'maintenance' | 'event' | 'policy' | 'safety' | 'alert' | 'community_update' | 'resource'
export type AnnouncementPriority = 'normal' | 'important' | 'urgent'
export type AnnouncementStatus = 'draft' | 'published' | 'archived' | 'deleted'

export interface Announcement {
  id: string
  tenant_id: string
  created_by: string

  // Content
  title: string
  description: string | null
  announcement_type: AnnouncementType
  priority: AnnouncementPriority
  status: AnnouncementStatus

  // Optional event link
  event_id: string | null

  // Location (optional)
  location_type: 'community_location' | 'custom_temporary' | null
  location_id: string | null
  custom_location_name: string | null
  custom_location_lat: number | null
  custom_location_lng: number | null

  // Images
  images: string[]

  // Auto-archive date
  auto_archive_date: string | null

  // Status timestamps
  published_at: string | null
  archived_at: string | null
  deleted_at: string | null
  last_edited_at: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

export interface AnnouncementWithRelations extends Announcement {
  creator?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  }
  event?: {
    id: string
    title: string
    start_date: string
    start_time: string | null
  } | null
  location?: {
    id: string
    name: string
    coordinates: any
  } | null
  neighborhoods?: {
    id: string
    name: string
  }[]
  is_read?: boolean
  read_count?: number
  reads?: {
    user_id: string
  }[]
}

export interface CreateAnnouncementData {
  title: string
  description?: string | null
  announcement_type: AnnouncementType
  priority: AnnouncementPriority
  status?: AnnouncementStatus
  event_id?: string | null
  location_type?: 'community' | 'custom' | 'none'
  location_id?: string | null
  custom_location_name?: string | null
  custom_location_lat?: number | null
  custom_location_lng?: number | null
  images?: string[]
  auto_archive_date?: string | null
  neighborhood_ids?: string[]
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {
  id: string
}
