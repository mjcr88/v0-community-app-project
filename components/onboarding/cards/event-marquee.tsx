"use client"

import { Marquee } from "@/components/library/marquee"
import { Calendar, MapPin, Users } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const events = [
    {
        title: "Community Potluck",
        time: "Sat, 6:00 PM",
        location: "Common House",
        attendees: 12,
        color: "bg-orange-100 text-orange-700",
    },
    {
        title: "Yoga in the Park",
        time: "Sun, 9:00 AM",
        location: "Bamboo Garden",
        attendees: 8,
        color: "bg-green-100 text-green-700",
    },
    {
        title: "Gardening Workshop",
        time: "Sat, 10:00 AM",
        location: "Community Garden",
        attendees: 15,
        color: "bg-blue-100 text-blue-700",
    },
    {
        title: "Kids Art Class",
        time: "Sun, 2:00 PM",
        location: "Art Studio",
        attendees: 6,
        color: "bg-purple-100 text-purple-700",
    },
    {
        title: "Movie Night",
        time: "Fri, 7:30 PM",
        location: "Amphitheater",
        attendees: 24,
        color: "bg-red-100 text-red-700",
    },
]

const EventCard = ({
    title,
    time,
    location,
    attendees,
    color,
}: {
    title: string
    time: string
    location: string
    attendees: number
    color: string
}) => {
    return (
        <div className={cn("relative h-32 w-64 cursor-pointer overflow-hidden rounded-xl border p-4 hover:bg-accent transition-colors bg-background mx-4")}>
            <div className="flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                    <div className="font-semibold">{title}</div>
                    <div className={cn("rounded-full px-2 py-0.5 text-xs font-medium", color)}>
                        Event
                    </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function EventMarqueeCard() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12 overflow-hidden">
            {/* Heading */}
            <div className="text-center mb-8 md:mb-12 z-10">
                <h2 className="text-2xl md:text-4xl font-bold">Events & Reservations: Gather together</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    RSVP to community events or book common facilities for your own gatherings.
                </p>
            </div>

            {/* Content area */}
            <div className="flex-1 w-full flex items-center justify-center max-w-6xl relative">

                {/* Background Marquee - Top Row */}
                <div className="absolute top-0 w-full opacity-50 blur-[1px]">
                    <Marquee pauseOnHover className="[--duration:40s]">
                        {events.map((event, i) => (
                            <EventCard key={`top-${i}`} {...event} />
                        ))}
                    </Marquee>
                </div>

                {/* Background Marquee - Bottom Row */}
                <div className="absolute bottom-0 w-full opacity-50 blur-[1px]">
                    <Marquee reverse pauseOnHover className="[--duration:40s]">
                        {events.map((event, i) => (
                            <EventCard key={`bottom-${i}`} {...event} />
                        ))}
                    </Marquee>
                </div>

                {/* Central Calendar Image */}
                <div className="relative z-20 w-full max-w-3xl max-h-[350px] aspect-video rounded-xl overflow-hidden border-2 border-primary/20 shadow-2xl bg-muted/20 mt-4">
                    <Image
                        src="/artifacts/events.png"
                        alt="Community events calendar and facility reservations"
                        fill
                        className="object-contain p-2"
                        priority
                    />
                </div>
            </div>
        </div>

    )
}
