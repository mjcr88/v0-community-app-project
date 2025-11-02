"use client"

import { usePathname, useRouter } from "next/navigation"
import { OnboardingProgress } from "@/components/onboarding-progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const ONBOARDING_STEPS = [
  { path: "family", title: "Your Family", description: "Connect with your family members in the community" },
  { path: "journey", title: "Your Journey", description: "Share your timeline and goals" },
  { path: "profile", title: "Your Details", description: "Tell us a bit about yourself" },
  {
    path: "interests",
    title: "Your Interests",
    description: "Share your interests to connect with like-minded neighbors",
  },
  { path: "skills", title: "Your Skills", description: "Share your skills and let neighbors know how you can help" },
  { path: "complete", title: "All Set!", description: "Welcome to the community" },
]

function getCurrentStep(pathname: string): number {
  const pathParts = pathname.split("/")
  const currentPath = pathParts[pathParts.length - 1]

  if (currentPath === "welcome") {
    return 0
  }

  const stepIndex = ONBOARDING_STEPS.findIndex((step) => step.path === currentPath)
  return stepIndex >= 0 ? stepIndex + 1 : 1
}

function getStepInfo(pathname: string) {
  const pathParts = pathname.split("/")
  const currentPath = pathParts[pathParts.length - 1]

  if (currentPath === "welcome") {
    return { title: "Welcome", description: "Let's get you set up in just 5 quick steps" }
  }

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
  const isWelcomePage = pathname.endsWith("/welcome")

  const handleClose = () => {
    if (isTestMode) {
      router.push(`/t/${tenantSlug}/admin/dashboard`)
    } else {
      router.push(`/t/${tenantSlug}/dashboard`)
    }
  }

  return (
    <>
      {!isWelcomePage && (
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
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {isWelcomePage && showCloseButton && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            {isTestMode && <Badge variant="secondary">Test Mode</Badge>}
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
