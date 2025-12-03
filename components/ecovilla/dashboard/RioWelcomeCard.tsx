"use client"

import { Card, CardContent } from "@/components/library/card"
import { RioImage } from "./RioImage"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play } from "lucide-react"

export function RioWelcomeCard({ slug }: { slug: string }) {
    return (
        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 min-h-[220px] flex flex-col justify-center">
            <CardContent className="p-6 flex items-center justify-between h-full relative">
                <div className="absolute left-0 bottom-0 top-0 w-[40%] flex items-center justify-center">
                    <div className="transform scale-[1.56] translate-y-2 -translate-x-2">
                        {/* @ts-ignore */}
                        <RioImage pose="general" size="md" />
                    </div>
                </div>
                <div className="ml-auto space-y-4 z-10 max-w-[60%]">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-orange-900">Welcome Home!</h3>
                        <p className="text-orange-800/80 text-sm leading-relaxed">
                            I'm Rio, your community guide. I'll keep an eye out for important updates for you.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
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
