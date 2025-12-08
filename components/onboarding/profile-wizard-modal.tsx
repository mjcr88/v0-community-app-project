"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileWizard } from "./profile-wizard"
import { WizardProgress } from "./wizard-progress"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef } from "react"

interface ProfileWizardModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    currentStep: number
    totalSteps: number
    progress: number
    initialData?: any
    availableInterests?: { id: string, name: string }[]
    availableSkills?: { id: string, name: string, description: string }[]
}

export function ProfileWizardModal({
    isOpen,
    onClose,
    userId,
    currentStep,
    totalSteps,
    progress,
    initialData,
    availableInterests = [],
    availableSkills = []
}: ProfileWizardModalProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Reset scroll position when step changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
    }, [currentStep])

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <div className="relative w-full max-w-3xl h-[95vh] mx-4">
                        {/* Close button - Top Left */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 left-4 z-20 text-white hover:bg-white/10"
                            onClick={onClose}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        {/* Content container */}
                        <div className="h-full flex flex-col pt-16 pb-8">
                            <div className="relative w-full h-full bg-background rounded-3xl overflow-hidden shadow-2xl flex flex-col">

                                {/* Sticky Header with Progress Circle */}
                                <div className="shrink-0 z-20 bg-background flex justify-center py-4 border-b border-border/5">
                                    <div className="scale-75 md:scale-100 origin-center">
                                        <WizardProgress
                                            currentStep={currentStep}
                                            totalSteps={totalSteps}
                                            progress={progress}
                                        />
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div
                                    ref={scrollContainerRef}
                                    className="flex-1 overflow-y-auto p-8 md:p-12"
                                >
                                    <ProfileWizard
                                        userId={userId}
                                        initialData={initialData}
                                        availableInterests={availableInterests}
                                        availableSkills={availableSkills}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
