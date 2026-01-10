"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Check, Loader2, FileText, File } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { markDocumentAsRead } from "@/app/actions/documents"
import { Database } from "@/types/supabase"

type Document = Database["public"]["Tables"]["documents"]["Row"] & { is_read?: boolean }

interface DocumentCardProps {
    document: Document
    slug: string
    onMarkAsRead?: (id: string) => void
}

export function DocumentCard({ document, slug, onMarkAsRead }: DocumentCardProps) {
    const router = useRouter()
    const [isMarkingRead, setIsMarkingRead] = useState(false)
    const [optimisticRead, setOptimisticRead] = useState(false)

    const isUnread = !document.is_read && !optimisticRead
    const hasImage = !!document.cover_image_url

    const handleMarkAsRead = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation
        e.stopPropagation()
        if (isMarkingRead) return

        setIsMarkingRead(true)
        setOptimisticRead(true) // Optimistic update

        try {
            const result = await markDocumentAsRead(document.id, slug)
            if (!result.success) {
                throw new Error(result.error)
            }

            // Call the callback to update parent state immediately
            if (onMarkAsRead) {
                onMarkAsRead(document.id)
            }

            router.refresh()
        } catch (error) {
            console.error("Failed to mark as read", error)
            setIsMarkingRead(false)
            setOptimisticRead(false) // Revert on error
        }
    }

    const categoryLabels: Record<string, string> = {
        regulation: "Regulations",
        financial: "Financial",
        construction: "Construction",
        hoa: "HOA"
    }

    const categoryEmojis: Record<string, string> = {
        regulation: "📋",
        financial: "💰",
        construction: "🏗️",
        hoa: "🏠"
    }

    // Always link to detail page
    const href = `/t/${slug}/dashboard/official/${document.id}`

    return (
        <Link href={href}>
            <motion.div
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <Card
                    className={cn(
                        "group relative overflow-hidden transition-all hover:shadow-md cursor-pointer h-full",
                        // Unread: Full orange border, WHITE background (no tint)
                        isUnread
                            ? "border-orange-200 bg-card dark:border-orange-900/50"
                            : "border-border/50 bg-card"
                    )}
                >
                    {/* Featured Strip */}
                    {document.is_featured && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 z-10" />
                    )}

                    <CardContent className="p-4 sm:p-5">
                        <div className="flex gap-4">
                            {/* Left: Image Thumbnail (if exists) or Icon */}
                            <div className="flex-shrink-0 pt-1">
                                {hasImage ? (
                                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-md overflow-hidden border bg-muted/50">
                                        <Image
                                            src={document.cover_image_url!}
                                            alt="Document cover"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className={cn(
                                            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                                            document.is_featured
                                                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                : "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {document.document_type === 'pdf' ? (
                                            <File className="h-6 w-6" />
                                        ) : (
                                            <FileText className="h-6 w-6" />
                                        )}
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
                                                {document.title}
                                            </h3>
                                            {document.document_type === 'pdf' && (
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 hover:bg-red-200 border-none">
                                                    PDF
                                                </Badge>
                                            )}
                                            {isUnread && (
                                                <Badge variant="default" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500 hover:bg-orange-600 border-none">
                                                    New
                                                </Badge>
                                            )}
                                            {document.is_featured && (
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none">
                                                    Featured
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mark as Read Button - More visible */}
                                    {isUnread && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/50 -mt-1 -mr-1 flex-shrink-0 transition-all z-20"
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
                                    {document.description || ''}
                                </p>

                                {/* Bottom Row: Metadata */}
                                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                                        {categoryEmojis[document.category || 'hoa']} {categoryLabels[document.category || 'hoa']}
                                    </span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span>
                                        {format(new Date(document.updated_at), "MMM d, yyyy")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </Link>
    )
}
