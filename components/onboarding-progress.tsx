"use client"

import { cn } from "@/lib/utils"
import { useRouter, usePathname } from "next/navigation"
import { Check } from "lucide-react"

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  steps: Array<{ path: string; title: string }>
  tenantSlug: string
  showStepNumbers?: boolean
}

export function OnboardingProgress({ currentStep, totalSteps, steps, tenantSlug, showStepNumbers = true }: OnboardingProgressProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      const stepPath = steps[stepNumber - 1].path
      router.push(`/t/${tenantSlug}/onboarding/${stepPath}`)
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <button
            type="button"
            onClick={() => handleStepClick(step)}
            disabled={step >= currentStep}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all",
              step === currentStep
                ? "bg-primary text-primary-foreground"
                : step < currentStep
                  ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
            title={step < currentStep ? `Go back to ${steps[step - 1].title}` : steps[step - 1].title}
          >
            {showStepNumbers ? step : (step < currentStep ? <Check className="h-4 w-4" /> : null)}
          </button>
          {step < totalSteps && (
            <div className={cn("h-0.5 w-8 transition-colors", step < currentStep ? "bg-primary/20" : "bg-muted")} />
          )}
        </div>
      ))}
    </div>
  )
}
