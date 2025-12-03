"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileWizard } from "./profile-wizard"
import { WizardProgress } from "./wizard-progress"
import { motion, AnimatePresence } from "framer-motion"

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
                        <div className="h-full flex flex-col justify-center pt-16 pb-8">
                            <div className="relative w-full h-full bg-background rounded-3xl overflow-hidden shadow-2xl">
                                {/* Circular Progress - Inside modal, top right - fully contained */}
                                <div className="absolute top-8 right-8 z-10">
                                    <WizardProgress
                                        currentStep={currentStep}
                                        totalSteps={totalSteps}
                                        progress={progress}
                                    />
                                </div>

                                <div className="h-full overflow-y-auto p-8">
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
