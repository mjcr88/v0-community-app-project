"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Megaphone, Calendar, MapPin, Package, AlertCircle, Map, Clock } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

interface DashboardSectionsProps {
    children: React.ReactNode
}

interface SectionTriggerProps {
    id: string
    label: string
    icon: React.ElementType
    isActive: boolean
    onClick: () => void
}

function SectionTrigger({ id, label, icon: Icon, isActive, onClick }: SectionTriggerProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 h-28 w-full hover:shadow-md",
                isActive
                    ? "bg-primary/10 border-primary text-primary ring-1 ring-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <Icon className={cn("w-8 h-8 mb-3", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
        </button>
    )
}

export function DashboardSections({
    announcements,
    events,
    checkins,
    listings,
    requests,
    reservations,
    map
}: {
    announcements: React.ReactNode
    events: React.ReactNode
    checkins: React.ReactNode
    listings: React.ReactNode
    requests: React.ReactNode
    reservations: React.ReactNode // Added reservations
    map: React.ReactNode
}) {
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const sections = [
        { id: "announcements", label: "Community Announcements", icon: Megaphone, content: announcements },
        { id: "events", label: "My Upcoming Events", icon: Calendar, content: events },
        { id: "checkins", label: "Live Check-ins", icon: MapPin, content: checkins },
        { id: "reservations", label: "My Reservations", icon: Clock, content: reservations },
        { id: "listings", label: "My Listings & Transactions", icon: Package, content: listings },
        { id: "requests", label: "My Active Requests", icon: AlertCircle, content: requests },
        { id: "map", label: "Our Neighborhood", icon: Map, content: map },
    ].filter(section => section.content !== null && section.content !== undefined)

    // Auto-scroll to content when section becomes active
    useEffect(() => {
        if (activeSection && contentRef.current) {
            // Delay to allow content to load and animation to complete
            setTimeout(() => {
                contentRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                })
            }, 600)
        }
    }, [activeSection])

    const renderContent = () => {
        switch (activeSection) {
            case "announcements": return announcements
            case "events": return events
            case "checkins": return checkins
            case "reservations": return reservations // Added reservations
            case "listings": return listings
            case "requests": return requests
            case "map": return map
            default: return null
        }
    }

    // Dynamic grid columns based on number of visible sections to fill space
    const gridColsClass = {
        4: "lg:grid-cols-4",
        5: "lg:grid-cols-5",
        6: "lg:grid-cols-6",
        7: "lg:grid-cols-7",
    }[sections.length] || "lg:grid-cols-7"

    return (
        <div className={cn("space-y-6", activeSection === "map" && "h-screen min-h-screen flex flex-col")}>
            <div className={cn(
                "grid grid-cols-2 md:grid-cols-4 gap-3",
                gridColsClass,
                activeSection === "map" && "shrink-0"
            )}>
                {sections.map((section) => (
                    <SectionTrigger
                        key={section.id}
                        id={section.id}
                        label={section.label}
                        icon={section.icon}
                        isActive={activeSection === section.id}
                        onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    />
                ))}
            </div>

            {activeSection === "map" ? (
                <div ref={contentRef} className="flex-1 min-h-[600px]">
                    {renderContent()}
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {activeSection && (
                        <motion.div
                            ref={contentRef}
                            key={activeSection}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-2 border-muted/50 overflow-hidden">
                                <CardContent className="p-6">{renderContent()}</CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}
