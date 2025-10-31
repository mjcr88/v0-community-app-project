"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

interface SkillsFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  resident: {
    id: string
  }
  skills: Array<{ id: string; name: string; description: string | null }>
  residentSkills: Array<{ id: string; open_to_requests: boolean }>
  isSuperAdmin: boolean
}

export function SkillsForm({ tenant, resident, skills, residentSkills, isSuperAdmin }: SkillsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [allSkills, setAllSkills] = useState<Array<{ id: string; name: string; description: string | null }>>(skills)
  const [selectedSkills, setSelectedSkills] = useState<Array<{ id: string; name: string; open_to_requests: boolean }>>(
    residentSkills.map((rs) => ({
      id: rs.id,
      name: skills.find((s) => s.id === rs.id)?.name || "",
      open_to_requests: rs.open_to_requests,
    })),
  )
  const [newSkillName, setNewSkillName] = useState("")
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

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return

    setIsAddingSkill(true)
    try {
      if (isSuperAdmin) {
        console.log("[v0] Super admin test mode - simulating skill creation")
        const tempId = `temp-${Date.now()}`
        const newSkill = { id: tempId, name: newSkillName.trim(), description: null }
        setAllSkills((prev) => [...prev, newSkill])
        setSelectedSkills((prev) => [...prev, { id: tempId, name: newSkillName.trim(), open_to_requests: false }])
        setNewSkillName("")
        setIsAddingSkill(false)
        return
      }

      const { data: newSkill, error } = await supabase
        .from("skills")
        .insert({
          name: newSkillName.trim(),
          tenant_id: tenant.id,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating skill:", error)
        return
      }

      console.log("[v0] Created new skill:", newSkill)
      setAllSkills((prev) => [...prev, newSkill])
      setSelectedSkills((prev) => [...prev, { id: newSkill.id, name: newSkill.name, open_to_requests: false }])
      setNewSkillName("")
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
        router.push(`/t/${tenant.slug}/onboarding/complete`)
        return
      }

      // First, delete existing skills
      await supabase.from("user_skills").delete().eq("user_id", resident.id)

      // Then insert selected skills
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
      router.push(`/t/${tenant.slug}/onboarding/complete`)
    } catch (error) {
      console.error("[v0] Error updating skills:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push(`/t/${tenant.slug}/onboarding/complete`)
  }

  const isSkillSelected = (skillId: string) => selectedSkills.some((s) => s.id === skillId)

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Your Skills</CardTitle>
          <CardDescription>Share your skills and let neighbors know how you can help</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-skill">Add a New Skill</Label>
            <div className="flex gap-2">
              <Input
                id="new-skill"
                placeholder="e.g., Carpentry, Gardening, Cooking..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddSkill}
                disabled={!newSkillName.trim() || isAddingSkill}
              >
                {isAddingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Don't see your skill? Add it here!</p>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Manage Your Skills</Label>
            <p className="text-sm text-muted-foreground">
              Click on skills you have. Toggle "Open to help" if you're willing to assist neighbors.
            </p>
            {allSkills.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allSkills.map((skill) => {
                  const isSelected = isSkillSelected(skill.id)
                  const selectedSkill = selectedSkills.find((s) => s.id === skill.id)

                  return (
                    <Card
                      key={skill.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleSkill({ id: skill.id, name: skill.name })}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight">{skill.name}</p>
                            {skill.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div
                            className="flex items-center justify-between gap-2 pt-2 border-t"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Label htmlFor={`open-${skill.id}`} className="text-xs font-normal cursor-pointer">
                              Open to help
                            </Label>
                            <Switch
                              id={`open-${skill.id}`}
                              checked={selectedSkill?.open_to_requests || false}
                              onCheckedChange={() => toggleOpenToRequests(skill.id)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No skills available yet.</p>
                <p className="text-sm">Add your first skill above!</p>
              </div>
            )}
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
