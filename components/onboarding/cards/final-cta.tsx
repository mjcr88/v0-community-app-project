"use client"

import { AuroraText } from "@/components/library/aurora-text"
import { RainbowButton } from "@/components/library/rainbow-button"
import { Confetti } from "@/components/library/confetti"
import { ArrowRight } from "lucide-react"
import { useRouter, useParams } from "next/navigation"

export function FinalCTACard() {
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string

    const handleStart = () => {
        // Navigate to profile onboarding
        if (slug) {
            router.push(`/t/${slug}/onboarding/profile?source=product_tour`)
        } else {
            console.error("No slug found")
        }
    }

    return (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 py-8 md:px-8 md:py-12 relative overflow-hidden">

            {/* Background elements (optional) */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />

            <div className="z-10 flex flex-col items-center text-center max-w-2xl space-y-8">

                <div className="space-y-4 flex flex-col items-center">
                    {/* Rio Image */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 mb-4">
                        <img
                            src="/rio/rio_app_tour_completed.png"
                            alt="Rio celebrating"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
                        <span className="bg-gradient-to-r from-orange-500 to-primary bg-clip-text text-transparent">
                            Welcome Home
                        </span>
                    </h2>
                    <p className="text-lg md:text-2xl text-muted-foreground max-w-lg mx-auto">
                        Ready to move in? Let's set up your profile and introduce you to the community.
                    </p>
                </div>

                <div className="pt-4">
                    <RainbowButton onClick={handleStart} className="h-12 px-8 text-lg font-medium">
                        Start My Profile
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </RainbowButton>
                </div>

            </div>

            {/* Confetti on mount or interaction could be added here if desired */}
            {/* <Confetti /> */}
        </div>
    )
}
