"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Check, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface SkillsFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  resident: {
    id: string
  }
  skills: Array<{ id: string; name: string; description: string | null; user_count?: number }>
  residentSkills: Array<{ id: string; open_to_requests: boolean }>
  isSuperAdmin: boolean
}

export function SkillsForm({ tenant, resident, skills, residentSkills, isSuperAdmin }: SkillsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [allSkills, setAllSkills] =
    useState<Array<{ id: string; name: string; description: string | null; user_count?: number }>>(skills)
  const [selectedSkills, setSelectedSkills] = useState<Array<{ id: string; name: string; open_to_requests: boolean }>>(
    residentSkills
      .map((rs) => {
        const skill = skills.find((s) => s.id === rs.id)
        return skill ? { id: skill.id, name: skill.name, open_to_requests: rs.open_to_requests } : null
      })
      .filter((s): s is { id: string; name: string; open_to_requests: boolean } => s !== null),
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingSkill, setIsAddingSkill] = useState(false)

  const toggleSkill = (skill: { id: string; name: string }) => {
    setSelectedSkills((prev) => {
      const existing = prev.find((s) => s.id === skill.id)
      if (existing) {
        return prev.filter((s) => s.id !== skill.id)
      }
      return [...prev, { id: skill.id, name: skill.name, open_to_requests: false }]
    })
  }

  const toggleOpenToRequests = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, open_to_requests: !s.open_to_requests } : s)),
    )
  }

  const handleCreateSkill = async (skillName: string) => {
    setIsAddingSkill(true)
    try {
      if (isSuperAdmin) {
        console.log("[v0] Super admin test mode - simulating skill creation")
        const tempId = `temp-${Date.now()}`
        const newSkill = { id: tempId, name: skillName.trim(), description: null, user_count: 0 }
        setAllSkills((prev) => [...prev, newSkill])
        setSelectedSkills((prev) => [...prev, { id: tempId, name: skillName.trim(), open_to_requests: false }])
        setSearchQuery("")
        setIsAddingSkill(false)
        return
      }

      const { data: newSkill, error } = await supabase
        .from("skills")
        .insert({
          name: skillName.trim(),
          tenant_id: tenant.id,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating skill:", error)
        return
      }

      console.log("[v0] Created new skill:", newSkill)
      const skillWithCount = { ...newSkill, user_count: 0 }
      setAllSkills((prev) => [...prev, skillWithCount])
      setSelectedSkills((prev) => [...prev, { id: newSkill.id, name: newSkill.name, open_to_requests: false }])
      setSearchQuery("")
    } catch (error) {
      console.error("[v0] Error creating skill:", error)
    } finally {
      setIsAddingSkill(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSuperAdmin) {
        console.log("[v0] Super admin test mode - skipping skills save")
        router.push(`/t/${tenant.slug}/onboarding/family`)
        return
      }

      await supabase.from("user_skills").delete().eq("user_id", resident.id)

      if (selectedSkills.length > 0) {
        const { error } = await supabase.from("user_skills").insert(
          selectedSkills.map((skill) => ({
            user_id: resident.id,
            skill_id: skill.id,
            open_to_requests: skill.open_to_requests,
          })),
        )

        if (error) {
          console.error("[v0] Error saving skills:", error)
          return
        }
      }

      console.log("[v0] Skills saved successfully")
      router.push(`/t/${tenant.slug}/onboarding/family`)
    } catch (error) {
      console.error("[v0] Error updating skills:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push(`/t/${tenant.slug}/onboarding/family`)
  }

  const isSkillSelected = (skillId: string) => selectedSkills.some((s) => s.id === skillId)

  const filteredSkills = allSkills.filter(
    (skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase()) && !isSkillSelected(skill.id),
  )

  const exactMatch = filteredSkills.find((skill) => skill.name.toLowerCase() === searchQuery.toLowerCase())
  const showCreateOption = searchQuery.trim() && !exactMatch && !isAddingSkill

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Your Skills</CardTitle>
          <CardDescription>Share your skills and let neighbors know how you can help</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedSkills.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base">Your Selected Skills</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedSkills.map((skill) => (
                  <Card key={skill.id} className="border-primary bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight">{skill.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSkill({ id: skill.id, name: skill.name })}
                          className="flex-shrink-0"
                        >
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </button>
                      </div>
                      <div
                        className="flex items-center justify-between gap-2 pt-2 border-t"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Label htmlFor={`open-${skill.id}`} className="text-xs font-normal cursor-pointer">
                          Open to help
                        </Label>
                        <Switch
                          id={`open-${skill.id}`}
                          checked={skill.open_to_requests}
                          onCheckedChange={() => toggleOpenToRequests(skill.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base">Search or Add Skills</Label>
            <p className="text-sm text-muted-foreground">Search for existing skills or create a new one</p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills or type to create new..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />

              {searchQuery && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-auto">
                  {showCreateOption && (
                    <button
                      type="button"
                      onClick={() => handleCreateSkill(searchQuery)}
                      disabled={isAddingSkill}
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b flex items-center gap-2"
                    >
                      {isAddingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span className="font-medium">Create "{searchQuery}"</span>
                    </button>
                  )}

                  {filteredSkills.length > 0 ? (
                    filteredSkills.map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          toggleSkill({ id: skill.id, name: skill.name })
                          setSearchQuery("")
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">{skill.name}</div>
                          {skill.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">{skill.description}</div>
                          )}
                        </div>
                        {skill.user_count !== undefined && skill.user_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {skill.user_count} {skill.user_count === 1 ? "person" : "people"}
                          </Badge>
                        )}
                      </button>
                    ))
                  ) : !showCreateOption ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No skills found matching "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

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
