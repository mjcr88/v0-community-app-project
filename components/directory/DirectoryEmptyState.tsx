"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface DirectoryEmptyStateProps {
    type: "residents" | "families" | "lists"
    hasActiveFilters: boolean
    onClearFilters: () => void
    onClearSearch: () => void
    children?: React.ReactNode
}

export function DirectoryEmptyState({
    type,
    hasActiveFilters,
    onClearFilters,
    onClearSearch,
    children,
}: DirectoryEmptyStateProps) {
    const content = {
        residents: {
            withFilters: {
                title: "No residents found",
                description: "Try adjusting your filters or search. Río couldn't find anyone matching!",
            },
            withoutFilters: {
                title: "No residents yet",
                description: "Your community directory is empty. Residents will appear here once they join!",
            },
        },
        families: {
            withFilters: {
                title: "No households found",
                description: "Try adjusting your filters. Río is still looking!",
            },
            withoutFilters: {
                title: "No households yet",
                description: "Households will appear here once residents form them!",
            },
        },
        lists: {
            withFilters: {
                title: "No lists found",
                description: "Try adjusting your search. Río couldn't find any matching lists!",
            },
            withoutFilters: {
                title: "No lists yet",
                description: "Create lists to organize neighbors for events, announcements, or just to keep track of friends.",
            },
        }
    }

    const selected = hasActiveFilters
        ? content[type].withFilters
        : content[type].withoutFilters

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-0 text-center px-4"
        >
            <div className="relative w-40 h-40 mb-2">
                <Image
                    src={hasActiveFilters ? "/rio/rio_searching_confused.png" : "/rio/parrot.png"}
                    alt="Río the Macaw"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">{selected.title}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed mb-4">
                {selected.description}
            </p>

            {hasActiveFilters && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClearSearch}>
                        Clear Search
                    </Button>
                    <Button variant="outline" onClick={onClearFilters}>
                        Clear Filters
                    </Button>
                </div>
            )}
            {children}
        </motion.div>
    )
}
