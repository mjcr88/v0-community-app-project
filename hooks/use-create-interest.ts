"use client"

import { useState } from "react"
import { createInterestAction } from "@/app/actions/interests"
import { useToast } from "@/hooks/use-toast"

interface UseCreateInterestProps {
    tenantId: string
    onSuccess?: (newInterest: any) => void
}

/**
 * Reusable hook to handle interest creation logic across different components.
 * Manages loading state and standardizes error feedback via toasts.
 */
export function useCreateInterest({ tenantId, onSuccess }: UseCreateInterestProps) {
    const [isAddingInterest, setIsAddingInterest] = useState(false)
    const { toast } = useToast()

    const handleCreateInterest = async (name: string) => {
        if (!name.trim()) return

        if (!tenantId) {
            console.error("Missing tenantId for interest creation")
            toast({
                title: "Error",
                description: "Missing community information. Please try again.",
                variant: "destructive",
            })
            return
        }

        setIsAddingInterest(true)
        try {
            const newInterest = await createInterestAction(name, tenantId)

            toast({
                title: "Success",
                description: `"${newInterest.name}" has been added.`,
            })

            if (onSuccess) {
                onSuccess(newInterest)
            }

            return newInterest
        } catch (error: any) {
            console.error("Error creating interest:", error)
            toast({
                title: "Failed to create interest",
                description: error.message || "An unexpected error occurred. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsAddingInterest(false)
        }
    }

    return {
        handleCreateInterest,
        isAddingInterest,
    }
}
