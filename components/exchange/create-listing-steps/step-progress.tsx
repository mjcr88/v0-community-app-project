import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepProgressProps {
    currentStep: number
    steps: Array<{
        number: number
        title: string
    }>
    onStepClick?: (step: number) => void
}

export function StepProgress({ currentStep, steps, onStepClick }: StepProgressProps) {
    return (
        <div className="mb-6">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center">
                        <button
                            type="button"
                            onClick={() => onStepClick?.(step.number)}
                            className={cn(
                                "relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                step.number === currentStep &&
                                "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                                step.number < currentStep &&
                                "bg-success text-success-foreground",
                                step.number > currentStep &&
                                "bg-muted text-muted-foreground border border-border"
                            )}
                            disabled={!onStepClick}
                        >
                            {step.number < currentStep ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                step.number
                            )}
                        </button>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "h-0.5 w-8 transition-colors",
                                    step.number < currentStep ? "bg-success" : "bg-border"
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Current step title */}
            <div className="text-center mt-4">
                <h3 className="font-semibold text-lg">
                    {steps[currentStep - 1]?.title}
                </h3>
            </div>
        </div>
    )
}
