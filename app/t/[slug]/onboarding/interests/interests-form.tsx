"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Search, Check } from "lucide-react"
import { Input } from "@/components/ui/input"

interface InterestsFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  resident: {
    id: string
  }
  interests: Array<{ id: string; name: string; description: string | null; user_count?: number }>
  residentInterests: string[]
  isSuperAdmin: boolean
}

export function InterestsForm({ tenant, resident, interests, residentInterests, isSuperAdmin }: InterestsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(residentInterests)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

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

      const { error: deleteError } = await supabase.from("user_interests").delete().eq("user_id", resident.id)

      if (deleteError) {
        console.error("[v0] Error deleting old interests:", deleteError)
        return
      }

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

  const filteredInterests = interests.filter((interest) =>
    interest.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedInterestObjects = interests.filter((i) => selectedInterests.includes(i.id))
  const unselectedInterests = filteredInterests.filter((i) => !selectedInterests.includes(i.id))

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-6">
          {interests.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Search Interests</Label>
              <p className="text-sm text-muted-foreground">Find and select interests that match your passions</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="pl-9"
                />

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-auto">
                    {unselectedInterests.length > 0 ? (
                      unselectedInterests.map((interest) => (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => {
                            toggleInterest(interest.id)
                            setSearchQuery("")
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-sm">{interest.name}</div>
                            {interest.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{interest.description}</div>
                            )}
                          </div>
                          {interest.user_count !== undefined && interest.user_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {interest.user_count} {interest.user_count === 1 ? "person" : "people"}
                            </Badge>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {searchQuery ? `No interests found matching "${searchQuery}"` : "No more interests available"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedInterestObjects.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Your Selected Interests</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedInterestObjects.map((interest) => (
                  <Card key={interest.id} className="border-primary bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight">{interest.name}</p>
                          {interest.description && (
                            <p className="text-xs text-muted-foreground mt-1">{interest.description}</p>
                          )}
                        </div>
                        <button type="button" onClick={() => toggleInterest(interest.id)} className="flex-shrink-0">
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
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
