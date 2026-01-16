"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { OnboardingAnalytics } from "@/lib/analytics"

interface JourneyFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  resident: {
    id: string
    journey_stage: string | null
    estimated_move_in_date: string | null
  }
  isSuperAdmin: boolean
}

const JOURNEY_STAGES = [
  {
    value: "planning",
    label: "Planning",
    description: "I'm exploring the idea and researching communities",
  },
  {
    value: "building",
    label: "Building",
    description: "I'm actively building or preparing my home",
  },
  {
    value: "arriving",
    label: "Arriving",
    description: "I'm in the process of moving in",
  },
  {
    value: "integrating",
    label: "Integrating",
    description: "I've moved in and am settling into community life",
  },
]

export function JourneyForm({ tenant, resident, isSuperAdmin }: JourneyFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    journeyStage: resident.journey_stage || "",
    estimatedMoveInDate: resident.estimated_move_in_date || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSuperAdmin) {
        console.log("[v0] Super admin test mode - skipping journey save")
        router.push(`/t/${tenant.slug}/onboarding/profile`)
        return
      }

      const { error } = await supabase
        .from("users")
        .update({
          journey_stage: formData.journeyStage,
          estimated_move_in_date: formData.estimatedMoveInDate || null,
        })
        .eq("id", resident.id)

      if (error) {
        console.error("[v0] Error updating journey:", error)
        return
      }

      console.log("[v0] Journey data saved successfully")
      OnboardingAnalytics.stepCompleted(2, 'journey')
      router.push(`/t/${tenant.slug}/onboarding/profile`)
    } catch (error) {
      console.error("[v0] Error updating journey:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    OnboardingAnalytics.skipped(2)
    router.push(`/t/${tenant.slug}/onboarding/profile`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Your Journey</CardTitle>
          <CardDescription>Help us understand where you are in your journey to {tenant.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Journey Stage */}
          <div className="space-y-3">
            <Label>Where are you in your journey? *</Label>
            <RadioGroup
              value={formData.journeyStage}
              onValueChange={(value) => setFormData({ ...formData, journeyStage: value })}
              required
            >
              {JOURNEY_STAGES.map((stage) => (
                <div key={stage.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={stage.value} id={stage.value} />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor={stage.value} className="font-medium cursor-pointer">
                      {stage.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Estimated Move-in Date */}
          <div className="space-y-2">
            <Label htmlFor="moveInDate">Estimated Move-in Date</Label>
            <Input
              id="moveInDate"
              type="date"
              value={formData.estimatedMoveInDate}
              onChange={(e) => setFormData({ ...formData, estimatedMoveInDate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This helps us plan community activities and connect you with others at similar stages
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleSkip}>
              Skip for Now
            </Button>
            <Button type="submit" disabled={isLoading || !formData.journeyStage}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
