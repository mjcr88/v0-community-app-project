"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AnnouncementEmptyStateProps {
    type: "new" | "read" | "archived" | "search"
    onClearSearch?: () => void
}

export function AnnouncementEmptyState({ type, onClearSearch }: AnnouncementEmptyStateProps) {
    const content = {
        new: {
            title: "All caught up!",
            description: "You've seen everything new. Río is taking a siesta too.",
            action: null,
        },
        read: {
            title: "No read announcements",
            description: "Announcements you've read will appear here.",
            action: null,
        },
        archived: {
            title: "No archived announcements",
            description: "Old announcements will be stored here for safekeeping.",
            action: null,
        },
        search: {
            title: "No results found",
            description: "Try adjusting your search? Río is still looking!",
            action: (
                <Button variant="outline" onClick={onClearSearch} className="mt-4">
                    Clear Search
                </Button>
            ),
        },
    }

    const { title, description, action } = content[type]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-12 text-center px-4"
        >
            <div className="relative w-48 h-48 mb-6">
                <Image
                    src="/images/rio-general.png"
                    alt="Río the Macaw"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {description}
            </p>

            {action}
        </motion.div>
    )
}
