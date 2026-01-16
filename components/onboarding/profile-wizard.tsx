"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { IdentityStep } from "./steps/identity-step"
import { ContactStep } from "./steps/contact-step"
import { JourneyStep } from "./steps/journey-step"
import { HouseholdStep } from "./steps/household-step"
import { RootsStep } from "./steps/roots-step"
import { SkillsStep } from "./steps/skills-step"
import { CompleteStep } from "./steps/complete-step"
import { updateBasicInfo, updateContactInfo, updateJourney, updateInterests, updateSkills, completeOnboarding } from "@/app/actions/onboarding"
import { useToast } from "@/hooks/use-toast"
import { TourAnalytics, ProfileAnalytics } from "@/lib/analytics"

const STEPS = [
    { id: "identity", title: "Identity", description: "Who are you?" },
    { id: "contact", title: "Contact", description: "How to reach you" },
    { id: "journey", title: "Journey", description: "Your path here" },
    { id: "household", title: "Household", description: "Family & Pets" },
    { id: "roots", title: "Roots", description: "Your Interests" },
    { id: "skills", title: "Skills", description: "What you can do" },
    { id: "complete", title: "Complete", description: "All set!" }
]

interface ProfileWizardProps {
    userId: string
    initialData?: any
    availableInterests?: { id: string, name: string }[]
    availableSkills?: { id: string, name: string, description: string }[]
}

export function ProfileWizard({ userId, initialData, availableInterests = [], availableSkills = [] }: ProfileWizardProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(0)
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    // Track tour start (user entering the profile wizard)
    useEffect(() => {
        const source = searchParams?.get('source') || undefined
        TourAnalytics.profileTourStarted(source)
    }, [searchParams])

    // Emit step changes to parent
    useEffect(() => {
        const event = new CustomEvent('wizard-step-change', {
            detail: { step: currentStep + 1 }
        })
        window.dispatchEvent(event)
    }, [currentStep])

    // Calculate progress based on current step index
    const progress = (currentStep / (STEPS.length - 1)) * 100

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1)
            setCurrentStep(currentStep - 1)
        }
    }

    const handleNext = async (stepData: any) => {
        const currentStepId = STEPS[currentStep].id

        try {
            if (currentStepId === "identity") {
                await updateBasicInfo(userId, {
                    firstName: stepData.firstName,
                    lastName: stepData.lastName,
                    avatarUrl: stepData.avatarUrl,
                    about: stepData.about,
                    birthday: stepData.birthday,
                    birthCountry: stepData.birthCountry,
                    currentCountry: stepData.currentCountry
                })
                ProfileAnalytics.updated(['first_name', 'last_name', 'about', 'birthday', 'location'])
            } else if (currentStepId === "contact") {
                await updateContactInfo(userId, {
                    email: stepData.email,
                    phone: stepData.phone,
                    languages: stepData.languages,
                    preferredLanguage: stepData.preferredLanguage
                })
                ProfileAnalytics.updated(['email', 'phone', 'languages'])
            } else if (currentStepId === "journey") {
                await updateJourney(userId, {
                    journeyStage: stepData.journeyStage,
                    estimatedMoveInDate: stepData.estimatedMoveInDate,
                    constructionStartDate: stepData.constructionStartDate,
                    constructionEndDate: stepData.constructionEndDate
                })
                ProfileAnalytics.updated(['journey_stage', 'move_dates'])
            } else if (currentStepId === "household") {
                // HouseholdStep saves data directly, but we track the milestone here
                ProfileAnalytics.updated(['household_info'])
            } else if (currentStepId === "roots") {
                await updateInterests(userId, stepData.interests || [])
                ProfileAnalytics.updated(['interests'])
            } else if (currentStepId === "skills") {
                // stepData.skills is already in the format [{ id, openToRequests }]
                await updateSkills(userId, stepData.skills || [])
                ProfileAnalytics.updated(['skills'])
            } else if (currentStepId === "complete") {
                await completeOnboarding(userId)
                const source = searchParams?.get('source') || undefined
                TourAnalytics.profileTourCompleted(source)
                router.push(`/t/${initialData.tenantSlug}/dashboard`)
                return
            }

            if (currentStep < STEPS.length - 1) {
                setDirection(1)
                setCurrentStep(prev => prev + 1)
            }
        } catch (error) {
            console.error(`Failed to save ${currentStepId} info:`, error)
            toast({
                title: "Error saving data",
                description: "Please try again.",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1"
                >
                    {currentStep === 0 && (
                        <IdentityStep
                            onNext={handleNext}
                            initialData={initialData}
                        />
                    )}
                    {currentStep === 1 && (
                        <ContactStep
                            onNext={handleNext}
                            onBack={handleBack}
                            initialData={initialData}
                        />
                    )}
                    {currentStep === 2 && (
                        <JourneyStep
                            onNext={handleNext}
                            onBack={handleBack}
                            initialData={initialData}
                        />
                    )}
                    {currentStep === 3 && (
                        <HouseholdStep
                            onNext={handleNext}
                            onBack={handleBack}
                            initialData={initialData}
                        />
                    )}
                    {currentStep === 4 && (
                        <RootsStep
                            onNext={handleNext}
                            onBack={handleBack}
                            availableInterests={availableInterests}
                            initialData={initialData}
                        />
                    )}
                    {currentStep === 5 && (
                        <SkillsStep
                            onNext={handleNext}
                            onBack={handleBack}
                            availableSkills={availableSkills}
                            initialData={initialData}
                        />
                    )}
                    {currentStep === 6 && (
                        <CompleteStep onNext={handleNext} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
