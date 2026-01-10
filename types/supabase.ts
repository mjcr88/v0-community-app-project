export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            announcement_neighborhoods: {
                Row: {
                    announcement_id: string
                    created_at: string
                    id: string
                    neighborhood_id: string
                }
                Insert: {
                    announcement_id: string
                    created_at?: string
                    id?: string
                    neighborhood_id: string
                }
                Update: {
                    announcement_id?: string
                    created_at?: string
                    id?: string
                    neighborhood_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "announcement_neighborhoods_announcement_id_fkey"
                        columns: ["announcement_id"]
                        isOneToOne: false
                        referencedRelation: "announcements"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcement_neighborhoods_neighborhood_id_fkey"
                        columns: ["neighborhood_id"]
                        isOneToOne: false
                        referencedRelation: "neighborhoods"
                        referencedColumns: ["id"]
                    },
                ]
            }
            announcement_reads: {
                Row: {
                    announcement_id: string
                    created_at: string
                    id: string
                    read_at: string
                    user_id: string
                }
                Insert: {
                    announcement_id: string
                    created_at?: string
                    id?: string
                    read_at?: string
                    user_id: string
                }
                Update: {
                    announcement_id?: string
                    created_at?: string
                    id?: string
                    read_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "announcement_reads_announcement_id_fkey"
                        columns: ["announcement_id"]
                        isOneToOne: false
                        referencedRelation: "announcements"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcement_reads_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            announcements: {
                Row: {
                    category_id: string | null
                    content: string
                    created_at: string
                    created_by: string
                    event_id: string | null
                    id: string
                    images: string[] | null
                    is_pinned: boolean
                    pin_expires_at: string | null
                    priority: Database["public"]["Enums"]["announcement_priority"]
                    published_at: string | null
                    status: Database["public"]["Enums"]["announcement_status"]
                    tenant_id: string
                    title: string
                    type: Database["public"]["Enums"]["announcement_type"]
                    updated_at: string
                    visibility: string | null
                }
                Insert: {
                    category_id?: string | null
                    content: string
                    created_at?: string
                    created_by: string
                    event_id?: string | null
                    id?: string
                    images?: string[] | null
                    is_pinned?: boolean
                    pin_expires_at?: string | null
                    priority?: Database["public"]["Enums"]["announcement_priority"]
                    published_at?: string | null
                    status?: Database["public"]["Enums"]["announcement_status"]
                    tenant_id: string
                    title: string
                    type?: Database["public"]["Enums"]["announcement_type"]
                    updated_at?: string
                    visibility?: string | null
                }
                Update: {
                    category_id?: string | null
                    content?: string
                    created_at?: string
                    created_by?: string
                    event_id?: string | null
                    id?: string
                    images?: string[] | null
                    is_pinned?: boolean
                    pin_expires_at?: string | null
                    priority?: Database["public"]["Enums"]["announcement_priority"]
                    published_at?: string | null
                    status?: Database["public"]["Enums"]["announcement_status"]
                    tenant_id?: string
                    title?: string
                    type?: Database["public"]["Enums"]["announcement_type"]
                    updated_at?: string
                    visibility?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "announcements_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcements_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcements_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            check_ins: {
                Row: {
                    created_at: string
                    created_by: string
                    details: string | null
                    expires_at: string | null
                    id: string
                    is_active: boolean
                    location_id: string
                    status: string
                    tenant_id: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    created_by: string
                    details?: string | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean
                    location_id: string
                    status?: string
                    tenant_id: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    created_by?: string
                    details?: string | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean
                    location_id?: string
                    status?: string
                    tenant_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "check_ins_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "check_ins_location_id_fkey"
                        columns: ["location_id"]
                        isOneToOne: false
                        referencedRelation: "locations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "check_ins_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            document_changelog: {
                Row: {
                    change_summary: string
                    changed_at: string
                    changed_by: string | null
                    document_id: string
                    id: string
                }
                Insert: {
                    change_summary: string
                    changed_at?: string
                    changed_by?: string | null
                    document_id: string
                    id?: string
                }
                Update: {
                    change_summary?: string
                    changed_at?: string
                    changed_by?: string | null
                    document_id?: string
                    id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "document_changelog_changed_by_fkey"
                        columns: ["changed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "document_changelog_document_id_fkey"
                        columns: ["document_id"]
                        isOneToOne: false
                        referencedRelation: "documents"
                        referencedColumns: ["id"]
                    },
                ]
            }
            documents: {
                Row: {
                    category: string | null
                    content: string | null
                    cover_image_url: string | null
                    created_at: string
                    created_by: string | null
                    description: string | null
                    document_type: string | null
                    file_url: string | null
                    id: string
                    is_featured: boolean | null
                    status: string | null
                    tenant_id: string
                    title: string
                    updated_at: string
                }
                Insert: {
                    category?: string | null
                    content?: string | null
                    cover_image_url?: string | null
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    document_type?: string | null
                    file_url?: string | null
                    id?: string
                    is_featured?: boolean | null
                    status?: string | null
                    tenant_id: string
                    title: string
                    updated_at?: string
                }
                Update: {
                    category?: string | null
                    content?: string | null
                    cover_image_url?: string | null
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    document_type?: string | null
                    file_url?: string | null
                    id?: string
                    is_featured?: boolean | null
                    status?: string | null
                    tenant_id?: string
                    title?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "documents_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "documents_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            event_categories: {
                Row: {
                    color: string
                    created_at: string
                    icon: string
                    id: string
                    name: string
                    tenant_id: string
                }
                Insert: {
                    color: string
                    created_at?: string
                    icon: string
                    id?: string
                    name: string
                    tenant_id: string
                }
                Update: {
                    color?: string
                    created_at?: string
                    icon?: string
                    id?: string
                    name?: string
                    tenant_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "event_categories_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            event_images: {
                Row: {
                    created_at: string
                    event_id: string
                    id: string
                    image_url: string
                }
                Insert: {
                    created_at?: string
                    event_id: string
                    id?: string
                    image_url: string
                }
                Update: {
                    created_at?: string
                    event_id?: string
                    id?: string
                    image_url?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "event_images_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    },
                ]
            }
            event_rsvps: {
                Row: {
                    created_at: string
                    event_id: string
                    guest_count: number
                    id: string
                    status: string
                    tenant_id: string | null
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    event_id: string
                    guest_count?: number
                    id?: string
                    status?: string
                    tenant_id?: string | null
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    event_id?: string
                    guest_count?: number
                    id?: string
                    status?: string
                    tenant_id?: string | null
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "event_rsvps_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "event_rsvps_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "event_rsvps_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            events: {
                Row: {
                    additional_notes: string | null
                    cancellation_reason: string | null
                    cancelled_at: string | null
                    cancelled_by: string | null
                    category_id: string | null
                    created_at: string
                    created_by: string
                    custom_location_coordinates: Json | null
                    custom_location_name: string | null
                    custom_location_type: string | null
                    description: string | null
                    end_date: string | null
                    end_time: string | null
                    event_type: string
                    external_url: string | null
                    flagged_at: string | null
                    hide_creator_contact: boolean | null
                    id: string
                    is_all_day: boolean
                    is_flagged: boolean
                    location_id: string | null
                    location_type: string | null
                    max_attendees: number | null
                    requires_rsvp: boolean
                    rsvp_deadline: string | null
                    start_date: string
                    start_time: string
                    status: string
                    tenant_id: string
                    title: string
                    updated_at: string
                    visibility_scope: string | null
                }
                Insert: {
                    additional_notes?: string | null
                    cancellation_reason?: string | null
                    cancelled_at?: string | null
                    cancelled_by?: string | null
                    category_id?: string | null
                    created_at?: string
                    created_by: string
                    custom_location_coordinates?: Json | null
                    custom_location_name?: string | null
                    custom_location_type?: string | null
                    description?: string | null
                    end_date?: string | null
                    end_time?: string | null
                    event_type?: string
                    external_url?: string | null
                    flagged_at?: string | null
                    hide_creator_contact?: boolean | null
                    id?: string
                    is_all_day?: boolean
                    is_flagged?: boolean
                    location_id?: string | null
                    location_type?: string | null
                    max_attendees?: number | null
                    requires_rsvp?: boolean
                    rsvp_deadline?: string | null
                    start_date: string
                    start_time: string
                    status?: string
                    tenant_id: string
                    title: string
                    updated_at?: string
                    visibility_scope?: string | null
                }
                Update: {
                    additional_notes?: string | null
                    cancellation_reason?: string | null
                    cancelled_at?: string | null
                    cancelled_by?: string | null
                    category_id?: string | null
                    created_at?: string
                    created_by?: string
                    custom_location_coordinates?: Json | null
                    custom_location_name?: string | null
                    custom_location_type?: string | null
                    description?: string | null
                    end_date?: string | null
                    end_time?: string | null
                    event_type?: string
                    external_url?: string | null
                    flagged_at?: string | null
                    hide_creator_contact?: boolean | null
                    id?: string
                    is_all_day?: boolean
                    is_flagged?: boolean
                    location_id?: string | null
                    location_type?: string | null
                    max_attendees?: number | null
                    requires_rsvp?: boolean
                    rsvp_deadline?: string | null
                    start_date?: string
                    start_time?: string
                    status?: string
                    tenant_id?: string
                    title?: string
                    updated_at?: string
                    visibility_scope?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "events_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "event_categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "events_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "events_location_id_fkey"
                        columns: ["location_id"]
                        isOneToOne: false
                        referencedRelation: "locations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "events_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            exchange_categories: {
                Row: {
                    created_at: string
                    icon: string
                    id: string
                    name: string
                    slug: string
                }
                Insert: {
                    created_at?: string
                    icon: string
                    id?: string
                    name: string
                    slug: string
                }
                Update: {
                    created_at?: string
                    icon?: string
                    id?: string
                    name?: string
                    slug?: string
                }
                Relationships: []
            }
            exchange_images: {
                Row: {
                    created_at: string
                    id: string
                    listing_id: string
                    order_index: number
                    url: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    listing_id: string
                    order_index?: number
                    url: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    listing_id?: string
                    order_index?: number
                    url?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "exchange_images_listing_id_fkey"
                        columns: ["listing_id"]
                        isOneToOne: false
                        referencedRelation: "exchange_listings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            exchange_listings: {
                Row: {
                    buyer_id: string | null
                    category: string
                    completed_at: string | null
                    condition: string | null
                    created_at: string
                    description: string | null
                    hero_photo: string | null
                    id: string
                    is_active: boolean
                    photos: string[] | null
                    price: number | null
                    seller_id: string
                    status: string
                    tenant_id: string
                    title: string
                    type: string
                    updated_at: string
                }
                Insert: {
                    buyer_id?: string | null
                    category: string
                    completed_at?: string | null
                    condition?: string | null
                    created_at?: string
                    description?: string | null
                    hero_photo?: string | null
                    id?: string
                    is_active?: boolean
                    photos?: string[] | null
                    price?: number | null
                    seller_id: string
                    status?: string
                    tenant_id: string
                    title: string
                    type: string
                    updated_at?: string
                }
                Update: {
                    buyer_id?: string | null
                    category?: string
                    completed_at?: string | null
                    condition?: string | null
                    created_at?: string
                    description?: string | null
                    hero_photo?: string | null
                    id?: string
                    is_active?: boolean
                    photos?: string[] | null
                    price?: number | null
                    seller_id?: string
                    status?: string
                    tenant_id?: string
                    title?: string
                    type?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "exchange_listings_buyer_id_fkey"
                        columns: ["buyer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "exchange_listings_seller_id_fkey"
                        columns: ["seller_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "exchange_listings_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            exchange_transactions: {
                Row: {
                    completed_at: string | null
                    created_at: string
                    id: string
                    listing_id: string
                    picked_up_at: string | null
                    price_amount: number | null
                    requester_id: string
                    return_damage_notes: string | null
                    return_damage_photo_url: string | null
                    return_rating_notes: string | null
                    return_rating_score: number | null
                    returned_at: string | null
                    status: string
                    tenant_id: string
                    updated_at: string
                }
                Insert: {
                    completed_at?: string | null
                    created_at?: string
                    id?: string
                    listing_id: string
                    picked_up_at?: string | null
                    price_amount?: number | null
                    requester_id: string
                    return_damage_notes?: string | null
                    return_damage_photo_url?: string | null
                    return_rating_notes?: string | null
                    return_rating_score?: number | null
                    returned_at?: string | null
                    status?: string
                    tenant_id: string
                    updated_at?: string
                }
                Update: {
                    completed_at?: string | null
                    created_at?: string
                    id?: string
                    listing_id?: string
                    picked_up_at?: string | null
                    price_amount?: number | null
                    requester_id?: string
                    return_damage_notes?: string | null
                    return_damage_photo_url?: string | null
                    return_rating_notes?: string | null
                    return_rating_score?: number | null
                    returned_at?: string | null
                    status?: string
                    tenant_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "exchange_transactions_listing_id_fkey"
                        columns: ["listing_id"]
                        isOneToOne: false
                        referencedRelation: "exchange_listings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "exchange_transactions_requester_id_fkey"
                        columns: ["requester_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "exchange_transactions_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            families: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    tenant_id: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    tenant_id: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    tenant_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "families_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            family_members: {
                Row: {
                    created_at: string
                    family_id: string
                    id: string
                    role: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    family_id: string
                    id?: string
                    role?: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    family_id?: string
                    id?: string
                    role?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "family_members_family_id_fkey"
                        columns: ["family_id"]
                        isOneToOne: false
                        referencedRelation: "families"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "family_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            family_relationships: {
                Row: {
                    created_at: string
                    id: string
                    related_to_user_id: string
                    relationship_type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    related_to_user_id: string
                    relationship_type: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    related_to_user_id?: string
                    relationship_type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "family_relationships_related_to_user_id_fkey"
                        columns: ["related_to_user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "family_relationships_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            family_units: {
                Row: {
                    banner_image_url: string | null
                    created_at: string
                    hero_photo: string | null
                    id: string
                    lot_id: string | null
                    name: string
                    photos: string[] | null
                    primary_contact_id: string | null
                    profile_picture_url: string | null
                    tenant_id: string
                    updated_at: string
                }
                Insert: {
                    banner_image_url?: string | null
                    created_at?: string
                    hero_photo?: string | null
                    id?: string
                    lot_id?: string | null
                    name: string
                    photos?: string[] | null
                    primary_contact_id?: string | null
                    profile_picture_url?: string | null
                    tenant_id: string
                    updated_at?: string
                }
                Update: {
                    banner_image_url?: string | null
                    created_at?: string
                    hero_photo?: string | null
                    id?: string
                    lot_id?: string | null
                    name?: string
                    photos?: string[] | null
                    primary_contact_id?: string | null
                    profile_picture_url?: string | null
                    tenant_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "family_units_lot_id_fkey"
                        columns: ["lot_id"]
                        isOneToOne: false
                        referencedRelation: "lots"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "family_units_primary_contact_id_fkey"
                        columns: ["primary_contact_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "family_units_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            interests: {
                Row: {
                    category: string
                    created_at: string
                    id: string
                    name: string
                }
                Insert: {
                    category: string
                    created_at?: string
                    id?: string
                    name: string
                }
                Update: {
                    category?: string
                    created_at?: string
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            locations: {
                Row: {
                    accessibility_features: string | null
                    amenities: string[] | null
                    capacity: number | null
                    coordinates: Json | null
                    created_at: string
                    created_by: string
                    description: string | null
                    elevation_gain: string | null
                    facility_type: string | null
                    hero_photo: string | null
                    hours: string | null
                    icon: string | null
                    id: string
                    is_active: boolean
                    location_type: string
                    lot_id: string | null
                    max_occupancy: number | null
                    name: string
                    neighborhood_id: string | null
                    parking_spaces: number | null
                    path_difficulty: string | null
                    path_length: string | null
                    path_surface: string | null
                    photos: string[] | null
                    rules: string | null
                    status: string | null
                    tenant_id: string
                    updated_at: string
                }
                Insert: {
                    accessibility_features?: string | null
                    amenities?: string[] | null
                    capacity?: number | null
                    coordinates?: Json | null
                    created_at?: string
                    created_by: string
                    description?: string | null
                    elevation_gain?: string | null
                    facility_type?: string | null
                    hero_photo?: string | null
                    hours?: string | null
                    icon?: string | null
                    id?: string
                    is_active?: boolean
                    location_type: string
                    lot_id?: string | null
                    max_occupancy?: number | null
                    name: string
                    neighborhood_id?: string | null
                    parking_spaces?: number | null
                    path_difficulty?: string | null
                    path_length?: string | null
                    path_surface?: string | null
                    photos?: string[] | null
                    rules?: string | null
                    status?: string | null
                    tenant_id: string
                    updated_at?: string
                }
                Update: {
                    accessibility_features?: string | null
                    amenities?: string[] | null
                    capacity?: number | null
                    coordinates?: Json | null
                    created_at?: string
                    created_by?: string
                    description?: string | null
                    elevation_gain?: string | null
                    facility_type?: string | null
                    hero_photo?: string | null
                    hours?: string | null
                    icon?: string | null
                    id?: string
                    is_active?: boolean
                    location_type?: string
                    lot_id?: string | null
                    max_occupancy?: number | null
                    name?: string
                    neighborhood_id?: string | null
                    parking_spaces?: number | null
                    path_difficulty?: string | null
                    path_length?: string | null
                    path_surface?: string | null
                    photos?: string[] | null
                    rules?: string | null
                    status?: string | null
                    tenant_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "locations_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "locations_lot_id_fkey"
                        columns: ["lot_id"]
                        isOneToOne: false
                        referencedRelation: "lots"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "locations_neighborhood_id_fkey"
                        columns: ["neighborhood_id"]
                        isOneToOne: false
                        referencedRelation: "neighborhoods"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "locations_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            lots: {
                Row: {
                    coordinates: Json | null
                    created_at: string
                    id: string
                    is_occupied: boolean
                    location_id: string | null
                    name: string
                    neighborhood_id: string
                    status: string
                    tenant_id: string
                    type: string
                    updated_at: string
                }
                Insert: {
                    coordinates?: Json | null
                    created_at?: string
                    id?: string
                    is_occupied?: boolean
                    location_id?: string | null
                    name: string
                    neighborhood_id: string
                    status?: string
                    tenant_id: string
                    type?: string
                    updated_at?: string
                }
                Update: {
                    coordinates?: Json | null
                    created_at?: string
                    id?: string
                    is_occupied?: boolean
                    location_id?: string | null
                    name?: string
                    neighborhood_id?: string
                    status?: string
                    tenant_id?: string
                    type?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "lots_location_id_fkey"
                        columns: ["location_id"]
                        isOneToOne: false
                        referencedRelation: "locations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "lots_neighborhood_id_fkey"
                        columns: ["neighborhood_id"]
                        isOneToOne: false
                        referencedRelation: "neighborhoods"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "lots_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            neighborhoods: {
                Row: {
                    coordinates: Json | null
                    created_at: string
                    description: string | null
                    hero_photo: string | null
                    id: string
                    location_id: string | null
                    name: string
                    photos: string[] | null
                    slug: string
                    tenant_id: string
                    updated_at: string
                }
                Insert: {
                    coordinates?: Json | null
                    created_at?: string
                    description?: string | null
                    hero_photo?: string | null
                    id?: string
                    location_id?: string | null
                    name: string
                    photos?: string[] | null
                    slug: string
                    tenant_id: string
                    updated_at?: string
                }
                Update: {
                    coordinates?: Json | null
                    created_at?: string
                    description?: string | null
                    hero_photo?: string | null
                    id?: string
                    location_id?: string | null
                    name?: string
                    photos?: string[] | null
                    slug?: string
                    tenant_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "neighborhoods_location_id_fkey"
                        columns: ["location_id"]
                        isOneToOne: false
                        referencedRelation: "locations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "neighborhoods_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notification_settings: {
                Row: {
                    allow_email: boolean
                    allow_push: boolean
                    created_at: string
                    id: string
                    notification_type: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    allow_email?: boolean
                    allow_push?: boolean
                    created_at?: string
                    id?: string
                    notification_type: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    allow_email?: boolean
                    allow_push?: boolean
                    created_at?: string
                    id?: string
                    notification_type?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notification_settings_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    action_label: string | null
                    action_url: string | null
                    created_at: string
                    entity_id: string | null
                    entity_type: string | null
                    id: string
                    is_read: boolean
                    message: string
                    read_at: string | null
                    tenant_id: string
                    title: string
                    type: string
                    user_id: string
                }
                Insert: {
                    action_label?: string | null
                    action_url?: string | null
                    created_at?: string
                    entity_id?: string | null
                    entity_type?: string | null
                    id?: string
                    is_read?: boolean
                    message: string
                    read_at?: string | null
                    tenant_id: string
                    title: string
                    type: string
                    user_id: string
                }
                Update: {
                    action_label?: string | null
                    action_url?: string | null
                    created_at?: string
                    entity_id?: string | null
                    entity_type?: string | null
                    id?: string
                    is_read?: boolean
                    message?: string
                    read_at?: string | null
                    tenant_id?: string
                    title?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            pets: {
                Row: {
                    breed: string | null
                    created_at: string
                    family_unit_id: string | null
                    hero_photo: string | null
                    id: string
                    name: string
                    notes: string | null
                    owner_id: string
                    photos: string[] | null
                    profile_picture_url: string | null
                    species: string
                    tenant_id: string
                    updated_at: string
                }
                Insert: {
                    breed?: string | null
                    created_at?: string
                    family_unit_id?: string | null
                    hero_photo?: string | null
                    id?: string
                    name: string
                    notes?: string | null
                    owner_id: string
                    photos?: string[] | null
                    profile_picture_url?: string | null
                    species: string
                    tenant_id: string
                    updated_at?: string
                }
                Update: {
                    breed?: string | null
                    created_at?: string
                    family_unit_id?: string | null
                    hero_photo?: string | null
                    id?: string
                    name?: string
                    notes?: string | null
                    owner_id?: string
                    photos?: string[] | null
                    profile_picture_url?: string | null
                    species?: string
                    tenant_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "pets_family_unit_id_fkey"
                        columns: ["family_unit_id"]
                        isOneToOne: false
                        referencedRelation: "family_units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "pets_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "pets_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            resident_requests: {
                Row: {
                    admin_comment: string | null
                    assigned_to: string | null
                    category: string
                    completed_at: string | null
                    created_at: string
                    description: string
                    id: string
                    images: string[] | null
                    priority: Database["public"]["Enums"]["request_priority"]
                    status: Database["public"]["Enums"]["request_status"]
                    tenant_id: string
                    title: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    admin_comment?: string | null
                    assigned_to?: string | null
                    category: string
                    completed_at?: string | null
                    created_at?: string
                    description: string
                    id?: string
                    images?: string[] | null
                    priority?: Database["public"]["Enums"]["request_priority"]
                    status?: Database["public"]["Enums"]["request_status"]
                    tenant_id: string
                    title: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    admin_comment?: string | null
                    assigned_to?: string | null
                    category?: string
                    completed_at?: string | null
                    created_at?: string
                    description?: string
                    id?: string
                    images?: string[] | null
                    priority?: Database["public"]["Enums"]["request_priority"]
                    status?: Database["public"]["Enums"]["request_status"]
                    tenant_id?: string
                    title?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "resident_requests_assigned_to_fkey"
                        columns: ["assigned_to"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "resident_requests_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "resident_requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            residents: {
                Row: {
                    auth_user_id: string | null
                    created_at: string
                    email: string
                    family_id: string | null
                    family_unit_id: string | null
                    first_name: string
                    id: string
                    is_primary_contact: boolean
                    last_name: string
                    lot_id: string | null
                    migrated_to_user_id: string | null
                    phone: string | null
                    profile_picture_url: string | null
                    role: string | null
                    status: string
                    tenant_id: string | null
                    updated_at: string
                }
                Insert: {
                    auth_user_id?: string | null
                    created_at?: string
                    email: string
                    family_id?: string | null
                    family_unit_id?: string | null
                    first_name: string
                    id?: string
                    is_primary_contact?: boolean
                    last_name: string
                    lot_id?: string | null
                    migrated_to_user_id?: string | null
                    phone?: string | null
                    profile_picture_url?: string | null
                    role?: string | null
                    status?: string
                    tenant_id?: string | null
                    updated_at?: string
                }
                Update: {
                    auth_user_id?: string | null
                    created_at?: string
                    email?: string
                    family_id?: string | null
                    family_unit_id?: string | null
                    first_name?: string
                    id?: string
                    is_primary_contact?: boolean
                    last_name?: string
                    lot_id?: string | null
                    migrated_to_user_id?: string | null
                    phone?: string | null
                    profile_picture_url?: string | null
                    role?: string | null
                    status?: string
                    tenant_id?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "residents_family_id_fkey"
                        columns: ["family_id"]
                        isOneToOne: false
                        referencedRelation: "families"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "residents_family_unit_id_fkey"
                        columns: ["family_unit_id"]
                        isOneToOne: false
                        referencedRelation: "family_units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "residents_lot_id_fkey"
                        columns: ["lot_id"]
                        isOneToOne: false
                        referencedRelation: "lots"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "residents_migrated_to_user_id_fkey"
                        columns: ["migrated_to_user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "residents_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            skills: {
                Row: {
                    category: string
                    created_at: string
                    id: string
                    name: string
                }
                Insert: {
                    category: string
                    created_at?: string
                    id?: string
                    name: string
                }
                Update: {
                    category?: string
                    created_at?: string
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            team_members: {
                Row: {
                    created_at: string
                    id: string
                    role: string | null
                    team_id: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    role?: string | null
                    team_id: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    role?: string | null
                    team_id?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_members_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teams: {
                Row: {
                    created_at: string
                    id: string
                    image: string | null
                    name: string
                    slug: string
                    stripe_customer_id: string | null
                    subscription_plan: string | null
                    subscription_status: string | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    image?: string | null
                    name: string
                    slug: string
                    stripe_customer_id?: string | null
                    subscription_plan?: string | null
                    subscription_status?: string | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    image?: string | null
                    name?: string
                    slug?: string
                    stripe_customer_id?: string | null
                    subscription_plan?: string | null
                    subscription_status?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            tenant_settings: {
                Row: {
                    allow_guest_invites: boolean
                    branded_login: boolean
                    community_guidelines: string | null
                    contact_email: string | null
                    created_at: string
                    enable_announcements: boolean
                    enable_chat: boolean
                    enable_events: boolean
                    enable_marketplace: boolean
                    id: string
                    maintenance_mode: boolean
                    primary_color: string | null
                    privacy_policy: string | null
                    system_status: string
                    tenant_id: string
                    terms_of_service: string | null
                    updated_at: string
                }
                Insert: {
                    allow_guest_invites?: boolean
                    branded_login?: boolean
                    community_guidelines?: string | null
                    contact_email?: string | null
                    created_at?: string
                    enable_announcements?: boolean
                    enable_chat?: boolean
                    enable_events?: boolean
                    enable_marketplace?: boolean
                    id?: string
                    maintenance_mode?: boolean
                    primary_color?: string | null
                    privacy_policy?: string | null
                    system_status?: string
                    tenant_id: string
                    terms_of_service?: string | null
                    updated_at?: string
                }
                Update: {
                    allow_guest_invites?: boolean
                    branded_login?: boolean
                    community_guidelines?: string | null
                    contact_email?: string | null
                    created_at?: string
                    enable_announcements?: boolean
                    enable_chat?: boolean
                    enable_events?: boolean
                    enable_marketplace?: boolean
                    id?: string
                    maintenance_mode?: boolean
                    primary_color?: string | null
                    privacy_policy?: string | null
                    system_status?: string
                    tenant_id?: string
                    terms_of_service?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tenant_settings_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: true
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tenants: {
                Row: {
                    address: string | null
                    created_at: string
                    description: string | null
                    domain: string | null
                    id: string
                    logo_url: string | null
                    name: string
                    slug: string
                    status: string
                    updated_at: string
                }
                Insert: {
                    address?: string | null
                    created_at?: string
                    description?: string | null
                    domain?: string | null
                    id?: string
                    logo_url?: string | null
                    name: string
                    slug: string
                    status?: string
                    updated_at?: string
                }
                Update: {
                    address?: string | null
                    created_at?: string
                    description?: string | null
                    domain?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string
                    slug?: string
                    status?: string
                    updated_at?: string
                }
                Relationships: []
            }
            user_interests: {
                Row: {
                    created_at: string
                    id: string
                    interest_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    interest_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    interest_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_interests_interest_id_fkey"
                        columns: ["interest_id"]
                        isOneToOne: false
                        referencedRelation: "interests"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_interests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_privacy_settings: {
                Row: {
                    created_at: string
                    id: string
                    show_bio: boolean
                    show_contact_info: boolean
                    show_email: boolean
                    show_family: boolean
                    show_interests: boolean
                    show_phone: boolean
                    show_profile_picture: boolean
                    show_skills: boolean
                    show_social_links: boolean
                    updated_at: string
                    user_id: string
                    visibility_scope: Database["public"]["Enums"]["resident_visibility_scope"]
                }
                Insert: {
                    created_at?: string
                    id?: string
                    show_bio?: boolean
                    show_contact_info?: boolean
                    show_email?: boolean
                    show_family?: boolean
                    show_interests?: boolean
                    show_phone?: boolean
                    show_profile_picture?: boolean
                    show_skills?: boolean
                    show_social_links?: boolean
                    updated_at?: string
                    user_id: string
                    visibility_scope?: Database["public"]["Enums"]["resident_visibility_scope"]
                }
                Update: {
                    created_at?: string
                    id?: string
                    show_bio?: boolean
                    show_contact_info?: boolean
                    show_email?: boolean
                    show_family?: boolean
                    show_interests?: boolean
                    show_phone?: boolean
                    show_profile_picture?: boolean
                    show_skills?: boolean
                    show_social_links?: boolean
                    updated_at?: string
                    user_id?: string
                    visibility_scope?: Database["public"]["Enums"]["resident_visibility_scope"]
                }
                Relationships: [
                    {
                        foreignKeyName: "user_privacy_settings_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_skills: {
                Row: {
                    created_at: string
                    id: string
                    skill_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    skill_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    skill_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_skills_skill_id_fkey"
                        columns: ["skill_id"]
                        isOneToOne: false
                        referencedRelation: "skills"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_skills_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    banner_image_url: string | null
                    bio: string | null
                    created_at: string
                    email: string
                    email_verified: boolean | null
                    family_unit_id: string | null
                    first_name: string | null
                    hero_photo: string | null
                    id: string
                    image: string | null
                    is_primary_contact: boolean | null
                    last_name: string | null
                    lot_id: string | null
                    name: string | null
                    phone: string | null
                    photos: string[] | null
                    profile_picture_url: string | null
                    role: string
                    status: string
                    tenant_id: string | null
                    updated_at: string
                }
                Insert: {
                    banner_image_url?: string | null
                    bio?: string | null
                    created_at?: string
                    email: string
                    email_verified?: boolean | null
                    family_unit_id?: string | null
                    first_name?: string | null
                    hero_photo?: string | null
                    id?: string
                    image?: string | null
                    is_primary_contact?: boolean | null
                    last_name?: string | null
                    lot_id?: string | null
                    name?: string | null
                    phone?: string | null
                    photos?: string[] | null
                    profile_picture_url?: string | null
                    role?: string
                    status?: string
                    tenant_id?: string | null
                    updated_at?: string
                }
                Update: {
                    banner_image_url?: string | null
                    bio?: string | null
                    created_at?: string
                    email?: string
                    email_verified?: boolean | null
                    family_unit_id?: string | null
                    first_name?: string | null
                    hero_photo?: string | null
                    id?: string
                    image?: string | null
                    is_primary_contact?: boolean | null
                    last_name?: string | null
                    lot_id?: string | null
                    name?: string | null
                    phone?: string | null
                    photos?: string[] | null
                    profile_picture_url?: string | null
                    role?: string
                    status?: string
                    tenant_id?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "users_family_unit_id_fkey"
                        columns: ["family_unit_id"]
                        isOneToOne: false
                        referencedRelation: "family_units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_lot_id_fkey"
                        columns: ["lot_id"]
                        isOneToOne: false
                        referencedRelation: "lots"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_user_role: {
                Args: {
                    user_id: string
                }
                Returns: string
            }
            get_user_tenant_id: {
                Args: {
                    user_id: string
                }
                Returns: string
            }
        }
        Enums: {
            announcement_priority: "normal" | "important" | "urgent"
            announcement_status: "draft" | "published" | "archived" | "deleted"
            announcement_type:
            | "general"
            | "emergency"
            | "maintenance"
            | "event"
            | "policy"
            | "safety"
            request_priority: "low" | "medium" | "high" | "urgent"
            request_status:
            | "pending"
            | "in_progress"
            | "completed"
            | "rejected"
            | "cancelled"
            resident_visibility_scope: "neighborhood" | "tenant"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database["public"]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            announcement_priority: ["normal", "important", "urgent"],
            announcement_status: ["draft", "published", "archived", "deleted"],
            announcement_type: [
                "general",
                "emergency",
                "maintenance",
                "event",
                "policy",
                "safety",
            ],
            request_priority: ["low", "medium", "high", "urgent"],
            request_status: [
                "pending",
                "in_progress",
                "completed",
                "rejected",
                "cancelled",
            ],
            resident_visibility_scope: ["neighborhood", "tenant"],
        },
    },
} as const
