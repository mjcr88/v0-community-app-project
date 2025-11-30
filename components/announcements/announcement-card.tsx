"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AnnouncementTypeIcon } from "@/components/announcements/announcement-type-icon"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { UpdatedIndicator } from "@/components/announcements/updated-indicator"
import { LocationBadge } from "@/components/events/location-badge"
import { markAnnouncementAsRead } from "@/app/actions/announcements"
import type { AnnouncementWithRelations } from "@/types/announcements"

interface AnnouncementCardProps {
    announcement: AnnouncementWithRelations & { is_read?: boolean }
    slug: string
    onClick?: () => void
    onMarkAsRead?: (id: string) => void
}

export function AnnouncementCard({ announcement, slug, onClick, onMarkAsRead }: AnnouncementCardProps) {
    const router = useRouter()
    const [isMarkingRead, setIsMarkingRead] = useState(false)
    const [optimisticRead, setOptimisticRead] = useState(false)

    const isUrgent = announcement.priority === "urgent"
    const isUnread = !announcement.is_read && !optimisticRead
    const hasImage = announcement.images && announcement.images.length > 0

    if (announcement.location_id || announcement.location_type) {
        console.log("Card Location Debug:", {
            id: announcement.id,
            title: announcement.title,
            type: announcement.location_type,
            locId: announcement.location_id,
            locObj: announcement.location,
            locName: announcement.location?.name
        })
    }

    const handleMarkAsRead = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isMarkingRead) return

        setIsMarkingRead(true)
        setOptimisticRead(true) // Optimistic update

        try {
            const result = await markAnnouncementAsRead(announcement.id, slug)
            if (!result.success) {
                throw new Error(result.error)
            }

            // Call the callback to update parent state immediately
            if (onMarkAsRead) {
                onMarkAsRead(announcement.id)
            }

            router.refresh()
        } catch (error) {
            console.error("Failed to mark as read", error)
            setIsMarkingRead(false)
            setOptimisticRead(false) // Revert on error
        }
    }

    return (
        <motion.div
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            <Card
                className={cn(
                    "group relative overflow-hidden transition-all hover:shadow-md cursor-pointer",
                    // Unread: Full orange border, WHITE background (no tint)
                    isUnread
                        ? "border-orange-200 bg-card dark:border-orange-900/50"
                        : "border-border/50 bg-card"
                )}
                onClick={onClick}
            >
                {/* Priority Strip for Urgent items */}
                {isUrgent && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 z-10" />
                )}

                <CardContent className="p-4 sm:p-5">
                    <div className="flex gap-4">
                        {/* Left: Image Thumbnail (if exists) or Icon */}
                        <div className="flex-shrink-0 pt-1">
                            {hasImage ? (
                                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-md overflow-hidden border bg-muted/50">
                                    <Image
                                        src={announcement.images[0]}
                                        alt="Announcement preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                                        isUrgent
                                            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                                            : "bg-primary/10 text-primary"
                                    )}
                                >
                                    <AnnouncementTypeIcon type={announcement.announcement_type} className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                        {/* Right: Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Top Row: Title + Badges + Action */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3
                                            className={cn(
                                                "font-semibold text-lg leading-tight text-foreground group-hover:text-primary transition-colors",
                                                isUnread && "font-bold"
                                            )}
                                        >
                                            {announcement.title}
                                        </h3>
                                        {isUnread && (
                                            <Badge variant="default" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500 hover:bg-orange-600 border-none">
                                                New
                                            </Badge>
                                        )}
                                        <div className="flex-shrink-0">
                                            <AnnouncementPriorityBadge priority={announcement.priority} />
                                        </div>
                                    </div>
                                </div>

                                {/* Mark as Read Button - More visible */}
                                {isUnread && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/50 -mt-1 -mr-1 flex-shrink-0 transition-all"
                                        onClick={handleMarkAsRead}
                                        title="Mark as read"
                                        disabled={isMarkingRead}
                                    >
                                        {isMarkingRead ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                                {announcement.description}
                            </p>

                            {/* Bottom Row: Metadata */}
                            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-1">
                                <span className="font-medium text-foreground/80">
                                    {format(new Date(announcement.published_at || announcement.created_at), "MMM d, yyyy")}
                                </span>
                                <span className="text-muted-foreground/40">•</span>
                                <span>
                                    {format(new Date(announcement.published_at || announcement.created_at), "h:mm a")}
                                </span>

                                {/* Location Badge */}
                                {(announcement.location_type || announcement.location_id) && (
                                    <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <LocationBadge
                                            locationType={announcement.location_type || (announcement.location ? "community_location" : null)}
                                            locationName={announcement.location?.name ?? ''}
                                            customLocationName={announcement.custom_location_name ?? ''}
                                            compact
                                        />
                                    </>
                                )}

                                {/* Neighborhood Badge */}
                                {announcement.neighborhoods && announcement.neighborhoods.length > 0 ? (
                                    <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                                            {announcement.neighborhoods.length === 1
                                                ? announcement.neighborhoods[0].name
                                                : `${announcement.neighborhoods.length} Neighborhoods`}
                                        </Badge>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                                            Community-Wide
                                        </Badge>
                                    </>
                                )}

                                <UpdatedIndicator
                                    publishedAt={announcement.published_at}
                                    lastEditedAt={announcement.last_edited_at}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
