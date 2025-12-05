"use client"

import { Card, CardContent } from "@/components/library/card"
import { RioImage } from "./RioImage"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play } from "lucide-react"

export function RioWelcomeCard({ slug }: { slug: string }) {
    return (
        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <CardContent className="p-3 md:p-6 flex flex-col md:flex-row items-center md:items-center justify-between gap-2 md:gap-4 relative min-h-[160px] md:min-h-[220px]">
                {/* Mobile: Parrot on top, smaller scale */}
                {/* Desktop: Parrot on left, larger scale */}
                <div className="md:absolute md:left-0 md:bottom-0 md:top-0 md:w-[40%] flex items-center justify-center order-1 md:order-none">
                    <div className="transform scale-100 md:scale-[1.4] md:translate-y-2 md:-translate-x-2">
                        {/* @ts-ignore */}
                        <RioImage pose="general" size="md" />
                    </div>
                </div>

                {/* Mobile: Full width below parrot */}
                {/* Desktop: Right side, 60% width */}
                <div className="md:ml-auto space-y-2 md:space-y-4 z-10 w-full md:max-w-[60%] order-2">
                    <div className="space-y-1.5 md:space-y-2 text-center md:text-left">
                        <h3 className="text-lg md:text-xl font-bold text-orange-900">Welcome Home!</h3>
                        <p className="text-orange-800/80 text-sm leading-relaxed">
                            I'm Rio, your community guide. I'll keep an eye out for important updates for you.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
                        <Button
                            asChild
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm gap-2"
                        >
                            <Link href={`/t/${slug}/tour-test`}>
                                <Play className="h-3 w-3 fill-current" />
                                Start tour
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="bg-white/50 hover:bg-white border-orange-200 text-orange-900 shadow-sm gap-2"
                        >
                            <Link href={`/t/${slug}/onboarding/profile`}>
                                Complete Profile
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
