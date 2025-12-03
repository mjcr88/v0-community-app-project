"use client"

import { TypingAnimation } from "@/components/library/typing-animation"
import { Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function AnnouncementAlertCard() {
    const [showSecond, setShowSecond] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSecond(true)
        }, 3000) // Wait for first card animation (approx 2s) + reading time
        return () => clearTimeout(timer)
    }, [])

    const announcements = [
        {
            title: "February neighbour festival announced.",
            body: "Get ready, plan your trip and take a closer look at our event agenda.",
            author: "Admin Team",
            time: "2 min ago",
            delay: 0
        },
        {
            title: "Our titles are finally here!",
            body: "Get in touch via our request forms to schedule your title transfer",
            author: "Legal Team",
            time: "Just now",
            delay: 500 // Slight delay after card appearance before typing starts
        }
    ]

    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
            {/* Heading */}
            <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold">Announcements: Hear it first</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    Official updates from the community team. Never miss a beat.
                </p>
            </div>

            {/* Content area - Stacked cards */}
            <div className="flex-1 w-full flex flex-col items-center justify-center max-w-2xl gap-4 md:gap-6">
                {announcements.map((announcement, index) => {
                    // Only show second card if showSecond is true
                    if (index === 1 && !showSecond) return null

                    return (
                        <div
                            key={index}
                            className={cn(
                                "w-full bg-background border-2 border-primary/20 rounded-2xl p-5 md:p-6 shadow-xl transition-all duration-500 ease-out",
                                index === 1 ? "animate-in fade-in slide-in-from-bottom-4" : ""
                            )}
                        >
                            {/* Notification badge */}
                            <div className="flex items-center gap-3 mb-3 md:mb-4">
                                <div className="relative">
                                    <Bell className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                                    <span className="absolute -top-1 -right-1 h-3 w-3 md:h-4 md:w-4 bg-red-500 rounded-full animate-pulse" />
                                </div>
                                <span className="text-sm md:text-base font-semibold text-primary uppercase tracking-wide">
                                    New Announcement
                                </span>
                            </div>

                            {/* Typing animation for announcement title */}
                            <TypingAnimation
                                className="text-xl md:text-3xl font-bold mb-2 md:mb-3 leading-tight"
                                duration={50}
                                delay={announcement.delay}
                            >
                                {announcement.title}
                            </TypingAnimation>

                            {/* Preview text */}
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                {announcement.body}
                            </p>

                            {/* Meta info */}
                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                                <span>Posted by {announcement.author}</span>
                                <span>{announcement.time}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
