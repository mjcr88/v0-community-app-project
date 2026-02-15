"use client"

import { Card, CardContent } from "@/components/library/card"
import { RioImage } from "./RioImage"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play } from "lucide-react"

export function RioWelcomeCard({ slug }: { slug: string }) {
    return (
        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <CardContent className="p-3 md:p-6 flex flex-row items-center md:items-center justify-between gap-3 md:gap-4 relative min-h-0 md:min-h-[220px]">
                {/* Mobile: Parrot on left, small */}
                {/* Desktop: Parrot on left, larger scale */}
                <div className="w-1/2 shrink-0 md:absolute md:left-0 md:bottom-0 md:top-0 md:w-[40%] flex items-center justify-center order-1 md:order-none">
                    <div className="transform scale-125 md:scale-[1.4] md:translate-y-2 md:-translate-x-2">
                        {/* @ts-ignore */}
                        <RioImage pose="general" size="md" />
                    </div>
                </div>

                {/* Mobile: Right side */}
                {/* Desktop: Right side, 60% width */}
                <div className="md:ml-auto space-y-2 md:space-y-4 z-10 flex-1 md:w-full md:max-w-[60%] order-2">
                    <div className="space-y-1.5 md:space-y-2 text-left">
                        <p className="text-orange-950 text-sm leading-relaxed font-medium">
                            I'm Rio, your community guide. I'll keep an eye out for important updates for you.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3 justify-start">
                        <Button
                            asChild
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm gap-2"
                        >
                            <Link href={`/t/${slug}/onboarding/tour`}>
                                <Play className="h-3 w-3 fill-current" />
                                Start tour
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="bg-white/60 hover:bg-white border-orange-200 text-orange-950 hover:text-orange-950 shadow-sm gap-2"
                        >
                            <Link href={`/t/${slug}/onboarding/profile?source=dashboard`}>
                                Complete Profile
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
