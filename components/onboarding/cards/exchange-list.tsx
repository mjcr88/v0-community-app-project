"use client"

import { AnimatedList } from "@/components/library/animated-list"
import { cn } from "@/lib/utils"
import { Hammer, Apple, Tent, Construction } from "lucide-react"
import Image from "next/image"

interface Item {
    name: string
    description: string
    icon: string
    color: string
    time: string
}

let notifications = [
    {
        name: "Cordless Drill",
        description: "Tools • Free",
        time: "2m ago",
        icon: "drill",
        color: "#FFB800",
    },
    {
        name: "Organic Lemons",
        description: "Food • Free",
        time: "5m ago",
        icon: "citrus",
        color: "#00C9A7",
    },
    {
        name: "Folding Ladder",
        description: "Tools • Borrow",
        time: "10m ago",
        icon: "ladder",
        color: "#FF3D71",
    },
    {
        name: "Camping Tent",
        description: "Outdoors • Borrow",
        time: "15m ago",
        icon: "tent",
        color: "#1E86FF",
    },
]

notifications = Array.from({ length: 10 }, () => notifications).flat()

const Notification = ({ name, description, icon, color, time }: Item) => {
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "drill": return <Hammer className="h-4 w-4" />
            case "citrus": return <Apple className="h-4 w-4" />
            case "ladder": return <Construction className="h-4 w-4" />
            case "tent": return <Tent className="h-4 w-4" />
            default: return <Hammer className="h-4 w-4" />
        }
    }

    return (
        <figure
            className={cn(
                "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
                // animation styles
                "transition-all duration-200 ease-in-out hover:scale-[103%]",
                // light styles
                "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
                // dark styles
                "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
            )}
        >
            <div className="flex flex-row items-center gap-3">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{
                        backgroundColor: color,
                    }}
                >
                    <span className="text-lg text-white">{getIcon(icon)}</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium dark:text-white ">
                        <span className="text-sm sm:text-lg">{name}</span>
                        <span className="mx-1">·</span>
                        <span className="text-xs text-gray-500">{time}</span>
                    </figcaption>
                    <p className="text-sm font-normal dark:text-white/60">
                        {description}
                    </p>
                </div>
            </div>
        </figure>
    )
}

export function ExchangeListCard() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12">
            {/* Heading */}
            <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold">Exchange: Share abundance</h2>
                <p className="text-base md:text-xl text-muted-foreground mt-2">
                    From free community listings to a broader exchange economy. Browse categories, seek items, and find trusted local providers.
                </p>
            </div>

            {/* Content area - Split layout */}
            <div className="flex-1 w-full flex items-center justify-center max-w-6xl md:max-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full md:h-full items-center">

                    {/* Left: Screenshot (Mobile: Top) */}
                    <div className="relative w-full h-[250px] md:h-full min-h-[250px] shrink-0 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl bg-muted/20 order-1 group">
                        <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border shadow-sm">
                            <span className="text-xs font-medium text-primary">Community Directory</span>
                        </div>
                        <Image
                            src="/artifacts/exchange_directory_actual.png"
                            alt="Exchange directory screenshot"
                            fill
                            className="object-cover md:object-contain p-1"
                            priority
                        />
                    </div>

                    {/* Right: Animated List (Mobile: Bottom) */}
                    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background p-6 order-2 min-h-[300px] md:min-h-0">
                        <div className="absolute bottom-3 right-3 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border shadow-sm">
                            <span className="text-xs font-medium text-primary">Live Activity</span>
                        </div>
                        <AnimatedList>
                            {notifications.map((item, idx) => (
                                <Notification {...item} key={idx} />
                            ))}
                        </AnimatedList>

                        {/* Gradient overlay for fade effect */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background"></div>
                    </div>

                </div>
            </div>
        </div>
    )
}
