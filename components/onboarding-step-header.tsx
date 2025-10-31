"use client"

import { usePathname, useRouter } from "next/navigation"
import { CardTitle, CardDescription } from "@/components/ui/card"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const ONBOARDING_STEPS = [
  { path: "welcome", title: "Welcome", description: "Get started with your community" },
  { path: "journey", title: "Your Journey", description: "Share your timeline and goals" },
  { path: "profile", title: "Basic Information", description: "Tell us about yourself" },
  { path: "interests", title: "Your Interests", description: "What are you passionate about?" },
  { path: "skills", title: "Your Skills", description: "How can you help the community?" },
  { path: "complete", title: "All Set!", description: "Welcome to the community" },
]

function getCurrentStep(pathname: string): number {
  const pathParts = pathname.split("/")
  const currentPath = pathParts[pathParts.length - 1]
  const stepIndex = ONBOARDING_STEPS.findIndex((step) => step.path === currentPath)
  return stepIndex >= 0 ? stepIndex + 1 : 1
}

function getStepInfo(pathname: string) {
  const stepIndex = getCurrentStep(pathname) - 1
  return ONBOARDING_STEPS[stepIndex] || ONBOARDING_STEPS[0]
}

interface OnboardingStepHeaderProps {
  tenantName: string
  tenantSlug: string
  isTestMode?: boolean
  showCloseButton?: boolean
}

export function OnboardingStepHeader({
  tenantName,
  tenantSlug,
  isTestMode,
  showCloseButton,
}: OnboardingStepHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const currentStep = getCurrentStep(pathname)
  const stepInfo = getStepInfo(pathname)

  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={ONBOARDING_STEPS.length}
            steps={ONBOARDING_STEPS}
            tenantSlug={tenantSlug}
          />
        </div>
        <div className="flex items-center gap-2">
          {isTestMode && <Badge variant="secondary">Test Mode</Badge>}
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/t/${tenantSlug}/admin/dashboard`)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <CardTitle className="text-2xl">{stepInfo.title}</CardTitle>
        <CardDescription>{stepInfo.description}</CardDescription>
      </div>
    </>
  )
}
