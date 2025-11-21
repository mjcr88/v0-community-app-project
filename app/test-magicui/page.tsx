import { AnimatedShinyText } from "@/components/library/animated-shiny-text"
import { RainbowButton } from "@/components/library/rainbow-button"
import { ShimmerButton } from "@/components/library/shimmer-button"
import { MagicCard } from "@/components/library/magic-card"
import { ShineBorder } from "@/components/library/shine-border"
import { TypingAnimation } from "@/components/library/typing-animation"
import { Meteors } from "@/components/library/meteors"

export default function TestMagicUIPage() {
    return (
        <div className="container mx-auto py-10 space-y-12">
            <header className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-forest-canopy">
                    <TypingAnimation className="text-4xl font-bold text-black dark:text-white" text="MagicUI Components" />
                </h1>
                <div className="flex justify-center">
                    <div className="rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                        <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                            <span>✨ Visual Effects Demo</span>
                        </AnimatedShinyText>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Buttons</h2>
                    <div className="flex flex-wrap gap-4">
                        <RainbowButton>Rainbow Button</RainbowButton>
                        <ShimmerButton>Shimmer Button</ShimmerButton>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Cards & Borders</h2>
                    <div className="grid gap-4">
                        <ShineBorder className="relative flex h-[200px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl" color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}>
                            <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-4xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
                                Shine Border
                            </span>
                        </ShineBorder>

                        <MagicCard className="cursor-pointer flex-col items-center justify-center shadow-2xl whitespace-nowrap text-4xl" gradientColor="#D9D9D955">
                            Magic Card
                        </MagicCard>
                    </div>
                </div>
            </section>
        </div>
    )
}
