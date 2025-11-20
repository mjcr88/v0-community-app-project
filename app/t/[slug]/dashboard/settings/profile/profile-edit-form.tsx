"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, X, Plus, AlertCircle, Search, Check } from "lucide-react"
import { COUNTRIES, LANGUAGES } from "@/lib/data/countries-languages"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { PhotoManager } from "@/components/photo-manager"
import { useToast } from "@/hooks/use-toast"

interface Resident {
  id: string
  tenant_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  birthday: string | null
  birth_country: string | null
  current_country: string | null
  languages: string[] | null
  preferred_language: string | null
  photos: string[] | null
  hero_photo: string | null
  journey_stage: string | null
  estimated_move_in_date: string | null
  user_interests?: { interest_id: string }[]
  user_skills?: { skill_id: string; skills?: { name: string }; open_to_requests: boolean }[]
}

interface Tenant {
  features?: {
    interests?: boolean
  }
}

interface Interest {
  id: string
  name: string
  description?: string | null
  user_interests?: { count: number }[]
}

interface Skill {
  id: string
  name: string
  user_skills?: { count: number }[]
}

interface ProfileEditFormProps {
  resident: Resident
  tenant: Tenant
  availableInterests: Interest[]
  availableSkills: Skill[]
  tenantSlug: string
}

export function ProfileEditForm({
  resident,
  tenant,
  availableInterests,
  availableSkills,
  tenantSlug,
}: ProfileEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: resident.first_name || "",
    lastName: resident.last_name || "",
    phone: resident.phone || "",
    birthday: resident.birthday || "",
    birthCountry: resident.birth_country || "",
    currentCountry: resident.current_country || "",
    languages: resident.languages || [],
    preferredLanguage: resident.preferred_language || "",
    photos: resident.photos || [],
    heroPhoto: resident.hero_photo || (resident.photos && resident.photos.length > 0 ? resident.photos[0] : null),
    journeyStage: resident.journey_stage || "",
    estimatedMoveInDate: resident.estimated_move_in_date || "",
    selectedInterests: resident.user_interests?.map((ui) => ui.interest_id) || [],
    skills:
      resident.user_skills?.map((us) => ({
        skill_id: us.skill_id,
        skill_name: us.skills?.name || "",
        open_to_requests: us.open_to_requests || false,
      })) || [] as { skill_id?: string; skill_name: string; open_to_requests: boolean }[],
    interestSearch: "",
    skillSearch: "",
    newSkill: "",
    languageSearch: "",
  })

  const initials = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error: userError } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          birthday: formData.birthday || null,
          birth_country: formData.birthCountry || null,
          current_country: formData.currentCountry || null,
          languages: formData.languages,
          preferred_language: formData.preferredLanguage || null,
          photos: formData.photos,
          hero_photo: formData.heroPhoto,
          profile_picture_url: formData.heroPhoto || null,
          journey_stage: formData.journeyStage || null,
          estimated_move_in_date: formData.estimatedMoveInDate || null,
        })
        .eq("id", resident.id)

      if (userError) {
        console.error("[v0] Error updating profile:", userError)
        toast({
          title: "Update failed",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        })
        return
      }

      const { error: deleteInterestsError } = await supabase.from("user_interests").delete().eq("user_id", resident.id)

      if (deleteInterestsError) {
        console.error("[v0] Error deleting interests:", deleteInterestsError)
      }

      if (formData.selectedInterests.length > 0) {
        const { error: insertInterestsError } = await supabase.from("user_interests").insert(
          formData.selectedInterests.map((interestId) => ({
            user_id: resident.id,
            interest_id: interestId,
            tenant_id: resident.tenant_id,
          })),
        )

        if (insertInterestsError) {
          console.error("[v0] Error inserting interests:", insertInterestsError)
        }
      }

      const { error: deleteSkillsError } = await supabase.from("user_skills").delete().eq("user_id", resident.id)

      if (deleteSkillsError) {
        console.error("[v0] Error deleting skills:", deleteSkillsError)
      }

      if (formData.skills.length > 0) {
        const skillsToInsert = []

        for (const skill of formData.skills) {
          if (skill.skill_id) {
            skillsToInsert.push({
              user_id: resident.id,
              skill_id: skill.skill_id,
              open_to_requests: skill.open_to_requests,
              tenant_id: resident.tenant_id,
            })
          } else {
            const { data: newSkillData, error: createSkillError } = await supabase
              .from("skills")
              .insert({
                name: skill.skill_name,
                tenant_id: resident.tenant_id,
              })
              .select()
              .single()

            if (!createSkillError && newSkillData) {
              skillsToInsert.push({
                user_id: resident.id,
                skill_id: newSkillData.id,
                open_to_requests: skill.open_to_requests,
                tenant_id: resident.tenant_id,
              })
            }
          }
        }

        if (skillsToInsert.length > 0) {
          const { error: insertSkillsError } = await supabase.from("user_skills").insert(skillsToInsert)

          if (insertSkillsError) {
            console.error("[v0] Error inserting skills:", insertSkillsError)
          }
        }
      }

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotosChange = async (photos: string[]) => {
    setFormData({ ...formData, photos })

    const supabase = createClient()
    try {
      const updateData: any = {
        photos: photos,
      }

      // If hero photo was deleted, set first photo as new hero
      if (formData.heroPhoto && !photos.includes(formData.heroPhoto)) {
        const newHero = photos[0] || null
        updateData.hero_photo = newHero
        updateData.profile_picture_url = newHero
        setFormData({ ...formData, photos, heroPhoto: newHero })
      }

      const { error } = await supabase.from("users").update(updateData).eq("id", resident.id)

      if (error) throw error

      toast({
        description: "Photos updated successfully",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving photos:", error)
      toast({
        title: "Save failed",
        description: "Failed to save photos. Please try again.",
        variant: "destructive",
      })
      // Revert on error
      setFormData({ ...formData, photos: resident.photos || [] })
    }
  }

  const handleHeroPhotoChange = async (heroPhoto: string | null) => {
    setFormData({ ...formData, heroPhoto })

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("users")
        .update({
          hero_photo: heroPhoto,
          profile_picture_url: heroPhoto,
        })
        .eq("id", resident.id)

      if (error) throw error

      toast({
        description: "Hero photo updated",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving hero photo:", error)
      toast({
        title: "Save failed",
        description: "Failed to save hero photo. Please try again.",
        variant: "destructive",
      })
      // Revert on error
      setFormData({ ...formData, heroPhoto: resident.hero_photo || null })
    }
  }

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData({ ...formData, languages: [...formData.languages, language] })
    }
  }

  const removeLanguage = (language: string) => {
    setFormData({ ...formData, languages: formData.languages.filter((l) => l !== language) })
  }

  const addSkill = () => {
    const newSkillTrimmed = formData.newSkill.trim()
    if (newSkillTrimmed) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { skill_name: newSkillTrimmed, open_to_requests: false }],
        newSkill: "",
      })
    }
  }

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_: any, i: number) => i !== index),
    })
  }

  const toggleSkillOpenToRequests = (index: number) => {
    const updatedSkills = [...formData.skills]
    updatedSkills[index].open_to_requests = !updatedSkills[index].open_to_requests
    setFormData({ ...formData, skills: updatedSkills })
  }

  const toggleInterest = (interestId: string) => {
    const isSelected = formData.selectedInterests.includes(interestId)
    setFormData({
      ...formData,
      selectedInterests: isSelected
        ? formData.selectedInterests.filter((id) => id !== interestId)
        : [...formData.selectedInterests, interestId],
    })
  }

  const hasEmptyFields =
    !formData.firstName ||
    !formData.lastName ||
    !formData.phone ||
    !formData.birthday ||
    !formData.birthCountry ||
    !formData.currentCountry ||
    formData.languages.length === 0 ||
    !formData.preferredLanguage ||
    !formData.journeyStage

  const filteredInterests = availableInterests.filter((interest) =>
    interest.name.toLowerCase().includes(formData.interestSearch.toLowerCase()),
  )

  const unselectedInterests = filteredInterests.filter((interest) => !formData.selectedInterests.includes(interest.id))

  const selectedInterestObjects = availableInterests.filter((interest) =>
    formData.selectedInterests.includes(interest.id),
  )

  const filteredSkills = availableSkills.filter((skill) =>
    skill.name.toLowerCase().includes(formData.skillSearch.toLowerCase()),
  )

  const unselectedSkills = filteredSkills.filter(
    (skill) => !formData.skills.some((s) => s.skill_name === skill.name),
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasEmptyFields && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is incomplete. Fill in the missing information to help your neighbours get to know you better.
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your name and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.heroPhoto || "/placeholder.svg"} alt={initials} />
              <AvatarFallback className="text-2xl">{initials || "?"}</AvatarFallback>
            </Avatar>
          </div>

          <PhotoManager
            photos={formData.photos}
            heroPhoto={formData.heroPhoto}
            onPhotosChange={handlePhotosChange}
            onHeroPhotoChange={handleHeroPhotoChange}
            maxPhotos={10}
            entityType="user"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday *</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Languages</CardTitle>
          <CardDescription>Where you're from and languages you speak</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthCountry">Country of Origin *</Label>
              <Combobox
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                value={formData.birthCountry}
                onValueChange={(value) => setFormData({ ...formData, birthCountry: value })}
                placeholder="Select country"
                searchPlaceholder="Search countries..."
                emptyText="No country found."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentCountry">Current Country *</Label>
              <Combobox
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                value={formData.currentCountry}
                onValueChange={(value) => setFormData({ ...formData, currentCountry: value })}
                placeholder="Select country"
                searchPlaceholder="Search countries..."
                emptyText="No country found."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Languages You Speak *</Label>
            <Combobox
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
              value={formData.languageSearch}
              onValueChange={(value) => {
                addLanguage(value)
                setFormData({ ...formData, languageSearch: value })
              }}
              placeholder="Select languages"
              searchPlaceholder="Search languages..."
              emptyText="No language found."
            />
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.languages.map((language) => (
                  <Badge key={language} variant="secondary" className="gap-1">
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred Language *</Label>
            <Combobox
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
              value={formData.preferredLanguage}
              onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
              placeholder="Select preferred language"
              searchPlaceholder="Search languages..."
              emptyText="No language found."
            />
          </div>
        </CardContent>
      </Card>

      {/* Journey Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Journey</CardTitle>
          <CardDescription>Your timeline and stage in the community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="journeyStage">Journey Stage *</Label>
            <Select
              value={formData.journeyStage}
              onValueChange={(value) => setFormData({ ...formData, journeyStage: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning - Researching and deciding</SelectItem>
                <SelectItem value="building">Building - Construction in progress</SelectItem>
                <SelectItem value="arriving">Arriving - Moving in soon</SelectItem>
                <SelectItem value="integrating">Integrating - Settling into the community</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedMoveInDate">Estimated Move-in Date</Label>
            <Input
              id="estimatedMoveInDate"
              type="date"
              value={formData.estimatedMoveInDate}
              onChange={(e) => setFormData({ ...formData, estimatedMoveInDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      {tenant?.features?.interests && availableInterests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Interests</CardTitle>
            <CardDescription>Select interests to connect with like-minded neighbours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Search Interests</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interests..."
                  value={formData.interestSearch}
                  onChange={(e) => setFormData({ ...formData, interestSearch: e.target.value })}
                  className="pl-9"
                />
              </div>

              {unselectedInterests.length > 0 && (
                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {unselectedInterests.map((interest) => (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{interest.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {interest.user_interests?.[0]?.count || 0}{" "}
                            {interest.user_interests?.[0]?.count === 1 ? "person" : "people"}
                          </div>
                        </div>
                        {interest.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{interest.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {selectedInterestObjects.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Selected Interests</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedInterestObjects.map((interest) => (
                    <Card key={interest.id} className="border-primary bg-primary/5">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{interest.name}</span>
                          <button type="button" onClick={() => toggleInterest(interest.id)} className="flex-shrink-0">
                            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
                              <Check className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Your Skills</CardTitle>
          <CardDescription>Share skills you'd like to offer to the community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Add Skills</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Search or add a skill (e.g., Plumbing, Gardening)"
                value={formData.newSkill}
                onChange={(e) => setFormData({ ...formData, newSkill: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSkill()
                  }
                }}
              />
              <Button type="button" onClick={addSkill} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.newSkill && availableSkills.length > 0 && (
              <ScrollArea className="h-[150px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {unselectedSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          skills: [
                            ...formData.skills,
                            { skill_id: skill.id, skill_name: skill.name, open_to_requests: false },
                          ],
                          newSkill: "",
                        })
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{skill.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {skill.user_skills?.[0]?.count || 0}{" "}
                          {skill.user_skills?.[0]?.count === 1 ? "person" : "people"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {formData.skills.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Your Skills</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.skills.map((skill: any, index: number) => (
                  <Card key={index} className="border-primary bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm">{skill.skill_name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 -mt-1 -mr-1"
                          onClick={() => removeSkill(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        <Label htmlFor={`skill-${index}`} className="text-xs font-normal cursor-pointer">
                          Open to help requests
                        </Label>
                        <Switch
                          id={`skill-${index}`}
                          checked={skill.open_to_requests}
                          onCheckedChange={() => toggleSkillOpenToRequests(index)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
