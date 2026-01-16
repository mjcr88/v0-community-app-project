'use client'

import { useEffect } from 'react'
import { EventsAnalytics, RequestsAnalytics, ProfileAnalytics } from '@/lib/analytics'

export function TrackEventView({ eventId }: { eventId: string }) {
    useEffect(() => {
        EventsAnalytics.viewed(eventId)
    }, [eventId])
    return null
}

export function TrackRequestView({ requestId }: { requestId: string }) {
    useEffect(() => {
        RequestsAnalytics.viewed(requestId)
    }, [requestId])
    return null
}

export function TrackProfileView({ isOwnProfile }: { isOwnProfile: boolean }) {
    useEffect(() => {
        ProfileAnalytics.viewed(isOwnProfile)
    }, [isOwnProfile])
    return null
}
