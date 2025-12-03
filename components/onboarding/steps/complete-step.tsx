"use client"

import { RainbowButton } from "@/components/library/rainbow-button"
import { AuroraText } from "@/components/library/aurora-text"
import { Confetti } from "@/components/library/confetti"
import { Sparkles } from "lucide-react"
import { useEffect } from "react"

interface CompleteStepProps {
    onNext: (data?: any) => void
}

export function CompleteStep({ onNext }: CompleteStepProps) {

    // Trigger confetti on mount
    useEffect(() => {
        // Confetti logic if needed, or rely on the component's internal auto-trigger if it has one
    }, [])

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 text-center py-12">

            <div className="mx-auto h-24 w-24 bg-gradient-to-br from-green-100 to-primary/20 rounded-full flex items-center justify-center text-primary mb-6 shadow-lg">
                <Sparkles className="h-12 w-12" />
            </div>

            <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                    <AuroraText>You're all set!</AuroraText>
                </h2>
                <p className="text-xl text-muted-foreground max-w-md mx-auto">
                    Your profile is ready. Welcome to the neighborhood!
                </p>
            </div>

            <div className="pt-8 flex justify-center">
                <RainbowButton
                    onClick={() => onNext({})}
                    className="h-14 px-8 text-lg font-semibold"
                >
                    Explore Your Community
                </RainbowButton>
            </div>

            <Confetti />
        </div>
    )
}
