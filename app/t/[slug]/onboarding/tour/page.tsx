"use client"

import { use } from "react"
import { TourCarousel } from "@/components/onboarding/tour-carousel"
import { BeamIntroCard } from "@/components/onboarding/cards/beam-intro"
import { ThemeToggleCard } from "@/components/onboarding/cards/theme-toggle"
import { AnnouncementAlertCard } from "@/components/onboarding/cards/announcement-alert"
import { OrbitingNeighborsCard } from "@/components/onboarding/cards/orbiting-neighbors"
import { MapHighlighterCard } from "@/components/onboarding/cards/map-highlighter"
import { EventMarqueeCard } from "@/components/onboarding/cards/event-marquee"
import { CheckinTyperCard } from "@/components/onboarding/cards/checkin-typer"
import { ExchangeListCard } from "@/components/onboarding/cards/exchange-list"
import { RequestWizardCard } from "@/components/onboarding/cards/request-wizard"
import { FinalCTACard } from "@/components/onboarding/cards/final-cta"
import { useRouter } from "next/navigation"

export default function TourTestPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter()
    const { slug } = use(params)

    const cards = [
        <BeamIntroCard key="beam-intro" />,
        <ThemeToggleCard key="theme-toggle" />,
        <AnnouncementAlertCard key="announcement-alert" />,
        <OrbitingNeighborsCard key="orbiting-neighbors" />,
        <MapHighlighterCard key="map-highlighter" />,
        <EventMarqueeCard key="event-marquee" />,
        <CheckinTyperCard key="checkin-typer" />,
        <ExchangeListCard key="exchange-list" />,
        <RequestWizardCard key="request-wizard" />,
        <FinalCTACard key="final-cta" />,
    ]

    return (
        <div className="min-h-screen">
            <TourCarousel
                cards={cards}
                onComplete={() => {
                    console.log('Tour completed')
                    router.push(`/t/${slug}/dashboard`)
                }}
                onClose={() => router.push(`/t/${slug}/dashboard`)}
            />
        </div>
    )
}
