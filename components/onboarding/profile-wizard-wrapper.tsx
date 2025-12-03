"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfileWizardModal } from "./profile-wizard-modal"

interface ProfileWizardWrapperProps {
    userId: string
    tenantSlug: string
    initialData?: any
    availableInterests?: { id: string, name: string }[]
    availableSkills?: { id: string, name: string, description: string }[]
}

export function ProfileWizardWrapper({
    userId,
    tenantSlug,
    initialData,
    availableInterests = [],
    availableSkills = []
}: ProfileWizardWrapperProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [currentStep, setCurrentStep] = useState(1)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    const totalSteps = 7
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

    // Only render on client to avoid hydration issues
    useEffect(() => {
        setMounted(true)
        console.log('[ProfileWizard] Tenant Slug:', tenantSlug)
    }, [tenantSlug])

    const handleClose = () => {
        // Navigate immediately to avoid showing the white card background
        const dashboardUrl = `/t/${tenantSlug}/dashboard`
        console.log('[ProfileWizard] Navigating to:', dashboardUrl)
        router.push(dashboardUrl)
    }

    // Listen for step changes from ProfileWizard
    useEffect(() => {
        const handleStepChange = (event: CustomEvent) => {
            setCurrentStep(event.detail.step)
        }

        window.addEventListener('wizard-step-change' as any, handleStepChange)
        return () => window.removeEventListener('wizard-step-change' as any, handleStepChange)
    }, [])

    // Don't render until mounted on client
    if (!mounted) {
        return null
    }

    return (
        <ProfileWizardModal
            isOpen={isOpen}
            onClose={handleClose}
            userId={userId}
            currentStep={currentStep}
            totalSteps={totalSteps}
            progress={progress}
            initialData={initialData}
            availableInterests={availableInterests}
            availableSkills={availableSkills}
        />
    )
}
