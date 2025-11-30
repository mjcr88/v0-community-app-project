import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface StepNavigationProps {
    currentStep: number
    totalSteps: number
    canProceed: boolean
    onBack: () => void
    onNext: () => void
    onSaveDraft?: () => void
    onPublish?: () => void
    isSubmitting?: boolean
}

export function StepNavigation({
    currentStep,
    totalSteps,
    canProceed,
    onBack,
    onNext,
    onSaveDraft,
    onPublish,
    isSubmitting = false,
}: StepNavigationProps) {
    const isFirstStep = currentStep === 1
    const isLastStep = currentStep === totalSteps

    return (
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
            {/* Back button */}
            {!isFirstStep && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            )}

            {/* Spacer for first step */}
            {isFirstStep && <div />}

            {/* Next / Submit buttons */}
            <div className="flex gap-2">
                {!isLastStep && (
                    <Button
                        type="button"
                        onClick={onNext}
                        disabled={!canProceed || isSubmitting}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                )}

                {isLastStep && (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSaveDraft}
                            disabled={isSubmitting}
                        >
                            Save as Draft
                        </Button>
                        <Button
                            type="button"
                            onClick={onPublish}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Publishing..." : "Publish Listing"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
