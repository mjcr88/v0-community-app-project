"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShimmerButton } from "@/components/library/shimmer-button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

interface JourneyStepProps {
    onNext: (data: any) => void
    onBack: () => void
    initialData?: any
}

const JOURNEY_STAGES = [
    {
        value: "planning",
        label: "🔍 Planning",
        description: "Planning my move, researching communities, and learning more",
    },
    {
        value: "building",
        label: "🏗️ Building",
        description: "Actively building or preparing my home",
    },
    {
        value: "arriving",
        label: "🚚 Arriving",
        description: "In the process of moving in",
    },
    {
        value: "integrating",
        label: "🌱 Integrating",
        description: "Moved in and settling into community life",
    },
]

export function JourneyStep({ onNext, onBack, initialData }: JourneyStepProps) {
    const [journeyStage, setJourneyStage] = useState(initialData?.journeyStage || "")
    const [estimatedMoveInDate, setEstimatedMoveInDate] = useState<Date | undefined>(
        initialData?.estimatedMoveInDate ? new Date(initialData.estimatedMoveInDate) : undefined
    )
    const [constructionStartDate, setConstructionStartDate] = useState<Date | undefined>(
        initialData?.constructionStartDate ? new Date(initialData.constructionStartDate) : undefined
    )
    const [constructionEndDate, setConstructionEndDate] = useState<Date | undefined>(
        initialData?.constructionEndDate ? new Date(initialData.constructionEndDate) : undefined
    )

    useEffect(() => {
        if (initialData) {
            setJourneyStage(initialData.journeyStage || "")
            setEstimatedMoveInDate(initialData.estimatedMoveInDate ? new Date(initialData.estimatedMoveInDate) : undefined)
            setConstructionStartDate(initialData.constructionStartDate ? new Date(initialData.constructionStartDate) : undefined)
            setConstructionEndDate(initialData.constructionEndDate ? new Date(initialData.constructionEndDate) : undefined)
        }
    }, [initialData])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext({
            journeyStage,
            estimatedMoveInDate: estimatedMoveInDate?.toISOString(),
            constructionStartDate: constructionStartDate?.toISOString(),
            constructionEndDate: constructionEndDate?.toISOString()
        })
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-primary">Your journey to Ecovilla</h2>
                <p className="text-muted-foreground text-sm">
                    Where are you in the process?
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
                <div className="space-y-3">
                    <RadioGroup value={journeyStage} onValueChange={setJourneyStage} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {JOURNEY_STAGES.map((stage) => (
                            <div key={stage.value}>
                                <RadioGroupItem value={stage.value} id={stage.value} className="peer sr-only" />
                                <Label
                                    htmlFor={stage.value}
                                    className={cn(
                                        "flex flex-col h-full items-start justify-between rounded-xl border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                                        journeyStage === stage.value && "border-primary bg-primary/10 dark:bg-primary/20"
                                    )}
                                >
                                    <span className="font-semibold text-base text-foreground">{stage.label}</span>
                                    <span className="text-xs text-muted-foreground mt-1 font-normal leading-snug">
                                        {stage.description}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-3 pt-2 border-t">
                    <h3 className="font-medium text-sm">Key Dates</h3>

                    <div className="space-y-2">
                        <Label className="text-sm">Estimated Move-in Date</Label>
                        <DateTimePicker
                            date={estimatedMoveInDate}
                            setDate={setEstimatedMoveInDate}
                            placeholder="Select date"
                        />
                    </div>

                    {(journeyStage === "building" || journeyStage === "planning") && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-sm">Construction Start</Label>
                                <DateTimePicker
                                    date={constructionStartDate}
                                    setDate={setConstructionStartDate}
                                    placeholder="Start date"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Construction End</Label>
                                <DateTimePicker
                                    date={constructionEndDate}
                                    setDate={setConstructionEndDate}
                                    placeholder="End date"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onBack} className="flex-1 h-12">Back</Button>
                    <ShimmerButton type="submit" className="flex-1 h-12" disabled={!journeyStage} background="hsl(var(--primary))">
                        Continue
                    </ShimmerButton>
                </div>
            </form>
        </div>
    )
}
