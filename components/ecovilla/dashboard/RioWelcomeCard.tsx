"use client"

import { Card, CardContent } from "@/components/library/card"
import { RioImage } from "./RioImage"

export function RioWelcomeCard() {
    return (
        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 min-h-[220px] flex flex-col justify-center">
            <CardContent className="p-6 flex items-center justify-between h-full relative">
                <div className="space-y-2 z-10 max-w-[60%]">
                    <h3 className="text-xl font-bold text-orange-900">Welcome Home!</h3>
                    <p className="text-orange-800/80 text-sm leading-relaxed">
                        I'm Rio, your community guide. I'll keep an eye out for important updates for you.
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-[40%] flex items-center justify-center">
                    <div className="transform scale-125 translate-y-2 translate-x-2">
                        {/* @ts-ignore */}
                        <RioImage pose="general" size="md" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
