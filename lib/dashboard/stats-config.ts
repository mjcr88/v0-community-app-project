export type StatScope = "Personal" | "Neighborhood" | "Community"

export interface StatDefinition {
    id: string
    label: string
    description: string
    scope: StatScope
    icon: string
    color: string
}

export const AVAILABLE_STATS: StatDefinition[] = [
    {
        id: "active_neighbors",
        label: "Active Neighbors",
        description: "Residents currently checked in",
        scope: "Neighborhood",
        icon: "🏡",
        color: "text-green-600"
    },
    {
        id: "total_neighbors",
        label: "Total Neighbors",
        description: "All residents in scope",
        scope: "Community",
        icon: "👥",
        color: "text-blue-600"
    },
    {
        id: "upcoming_events",
        label: "Upcoming Events",
        description: "Events in next 7 days",
        scope: "Community",
        icon: "📅",
        color: "text-purple-600"
    },
    {
        id: "new_announcements",
        label: "New Announcements",
        description: "Unread announcements",
        scope: "Community",
        icon: "📢",
        color: "text-orange-600"
    },
    {
        id: "active_requests",
        label: "Active Requests",
        description: "Open help requests",
        scope: "Neighborhood",
        icon: "🤝",
        color: "text-amber-600"
    },
    {
        id: "available_listings",
        label: "Available Listings",
        description: "Active marketplace items",
        scope: "Neighborhood",
        icon: "🏪",
        color: "text-teal-600"
    },
    {
        id: "current_checkins",
        label: "Current Check-ins",
        description: "People checked in right now",
        scope: "Community",
        icon: "✅",
        color: "text-emerald-600"
    },
    {
        id: "due_pickups",
        label: "Due Pickups",
        description: "Listings ready for pickup",
        scope: "Personal",
        icon: "📦",
        color: "text-red-600"
    },
    {
        id: "your_events",
        label: "Your Events",
        description: "Events you're attending",
        scope: "Personal",
        icon: "🎉",
        color: "text-pink-600"
    },
    {
        id: "saved_events",
        label: "Saved Events",
        description: "Events you've saved",
        scope: "Personal",
        icon: "⭐",
        color: "text-yellow-600"
    },
    {
        id: "your_listings",
        label: "Your Listings",
        description: "Your active listings",
        scope: "Personal",
        icon: "📝",
        color: "text-indigo-600"
    },
    {
        id: "response_rate",
        label: "Response Rate",
        description: "% of requests you've helped with",
        scope: "Personal",
        icon: "📊",
        color: "text-cyan-600"
    },
    {
        id: "connections",
        label: "Connections",
        description: "Mutual neighbor connections",
        scope: "Personal",
        icon: "🔗",
        color: "text-violet-600"
    }
]

// Map journey_stage values to default stats
// Database journey_stage values: 'planning', 'building', 'arriving', 'integrating'
export const DEFAULT_STATS_BY_PERSONA: Record<string, string[]> = {
    planning: ["total_neighbors", "upcoming_events", "new_announcements", "active_neighbors"],
    building: ["upcoming_events", "active_neighbors", "new_announcements", "connections"],
    arriving: ["your_events", "active_neighbors", "new_announcements", "connections"],
    integrating: ["active_requests", "current_checkins", "upcoming_events", "response_rate"],
    // Legacy/fallback mappings (kept for compatibility)
    newcomer: ["total_neighbors", "upcoming_events", "new_announcements", "active_neighbors"],
    coordinator: ["active_requests", "current_checkins", "upcoming_events", "new_announcements"],
    balanced: ["your_events", "active_neighbors", "new_announcements", "connections"],
    resource_coordinator: ["available_listings", "active_requests", "total_neighbors", "response_rate"]
}

export const DEFAULT_STATS = DEFAULT_STATS_BY_PERSONA.planning

export function getStatDefinition(statId: string): StatDefinition | undefined {
    return AVAILABLE_STATS.find(s => s.id === statId)
}

export function getDefaultStatsForPersona(persona?: string): string[] {
    if (!persona || !DEFAULT_STATS_BY_PERSONA[persona]) {
        console.log("[STATS CONFIG] Unknown persona:", persona, "- using default")
        return DEFAULT_STATS
    }
    return DEFAULT_STATS_BY_PERSONA[persona]
}
