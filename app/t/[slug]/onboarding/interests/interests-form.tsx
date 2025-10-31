"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface InterestsFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  resident: {
    id: string
  }
  interests: Array<{ id: string; name: string; description: string | null }>
  residentInterests: string[]
  isSuperAdmin: boolean
}

export function InterestsForm({ tenant, resident, interests, residentInterests, isSuperAdmin }: InterestsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(residentInterests)

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId) ? prev.filter((id) => id !== interestId) : [...prev, interestId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSuperAdmin) {
        console.log("[v0] Super admin test mode - skipping interests save")
        router.push(`/t/${tenant.slug}/onboarding/skills`)
        return
      }

      // First, delete existing interests
      const { error: deleteError } = await supabase.from("user_interests").delete().eq("user_id", resident.id)

      if (deleteError) {
        console.error("[v0] Error deleting old interests:", deleteError)
        return
      }

      // Then insert new interests
      if (selectedInterests.length > 0) {
        const { error: insertError } = await supabase
          .from("user_interests")
          .insert(selectedInterests.map((interestId) => ({ user_id: resident.id, interest_id: interestId })))

        if (insertError) {
          console.error("[v0] Error inserting interests:", insertError)
          return
        }
      }

      console.log("[v0] Interests saved successfully")
      router.push(`/t/${tenant.slug}/onboarding/skills`)
    } catch (error) {
      console.error("[v0] Error updating interests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push(`/t/${tenant.slug}/onboarding/skills`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Your Interests</CardTitle>
          <CardDescription>Share your interests to connect with like-minded neighbors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {interests.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">What are you interested in?</Label>
              <p className="text-sm text-muted-foreground">
                Select all that apply to help us connect you with others who share your interests
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {interests.map((interest) => (
                  <div key={interest.id} className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id={`interest-${interest.id}`}
                      checked={selectedInterests.includes(interest.id)}
                      onCheckedChange={() => toggleInterest(interest.id)}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor={`interest-${interest.id}`} className="font-medium cursor-pointer">
                        {interest.name}
                      </Label>
                      {interest.description && <p className="text-sm text-muted-foreground">{interest.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {interests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No interests have been added yet.</p>
              <p className="text-sm">Community admins can add interests from the admin panel.</p>
            </div>
          )}

          {selectedInterests.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label className="text-sm">Your selections:</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedInterests.length} interests selected</Badge>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleSkip}>
              Skip for Now
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
