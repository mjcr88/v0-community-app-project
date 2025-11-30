"use client"

import { useEffect } from "react"
import { markAnnouncementAsRead } from "@/app/actions/announcements"

interface AnnouncementReadTrackerProps {
    announcementId: string
    slug: string
}

export function AnnouncementReadTracker({ announcementId, slug }: AnnouncementReadTrackerProps) {
    useEffect(() => {
        // Call the server action to mark as read
        // We don't need to await it or handle the result for the UI here
        // as the user is already viewing the page
        markAnnouncementAsRead(announcementId, slug)
    }, [announcementId, slug])

    return null
}
