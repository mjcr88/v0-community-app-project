"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface DocumentEmptyStateProps {
    type: "new" | "read" | "archived" | "search"
    onClearFilters?: () => void
}

export function DocumentEmptyState({ type, onClearFilters }: DocumentEmptyStateProps) {
    const content = {
        new: {
            title: "No new documents",
            description: "You're up to date! Check back later for new community documents.",
            image: "/rio/rio_empty_inbox.png",
            action: null,
        },
        read: {
            title: "No read documents",
            description: "Documents you've acknowledged will appear here.",
            image: "/rio/rio_sleeping.png",
            action: null,
        },
        archived: {
            title: "No archived documents",
            description: "Old or superseded documents will be stored here.",
            image: "/rio/rio_archive_archeologist.png",
            action: null,
        },
        search: {
            title: "No results found",
            description: "Try adjusting your search or filters? Río is still looking!",
            image: "/rio/rio_searching_confused.png",
            action: (
                <Button variant="outline" onClick={onClearFilters} className="mt-4">
                    Clear Filters
                </Button>
            ),
        },
    }

    const { title, description, image, action } = content[type]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-12 text-center px-4"
        >
            <div className="relative w-40 h-40 mb-4">
                <Image
                    src={image}
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
