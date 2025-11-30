"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AnnouncementCard } from "./announcement-card"
import type { AnnouncementWithRelations } from "@/types/announcements"
import { useRouter } from "next/navigation"

interface AnnouncementListProps {
    announcements: AnnouncementWithRelations[]
    slug: string
    onMarkAsRead?: (id: string) => void
}

export function AnnouncementList({ announcements, slug, onMarkAsRead }: AnnouncementListProps) {
    const router = useRouter()

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {announcements.map((announcement, index) => (
                    <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        layout
                    >
                        <AnnouncementCard
                            announcement={announcement}
                            slug={slug}
                            onMarkAsRead={onMarkAsRead}
                            onClick={() => router.push(`/t/${slug}/dashboard/announcements/${announcement.id}`)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
