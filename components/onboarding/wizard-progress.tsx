"use client"

import { AnimatedCircularProgressBar } from "@/components/library/animated-circular-progress-bar"
import { cn } from "@/lib/utils"

interface WizardProgressProps {
    currentStep: number
    totalSteps: number
    progress: number
    className?: string
}

export function WizardProgress({ currentStep, totalSteps, progress, className }: WizardProgressProps) {
    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            {/* Circular Progress */}
            <div className="relative">
                <AnimatedCircularProgressBar
                    max={100}
                    min={0}
                    value={progress}
                    gaugePrimaryColor="hsl(var(--primary))"
                    gaugeSecondaryColor="hsl(var(--muted))"
                    className="size-20 [&>span]:hidden"
                />
                {/* Step counter overlay - hide the percentage number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-primary leading-none">{currentStep}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">of {totalSteps}</span>
                </div>
            </div>
        </div>
    )
}
