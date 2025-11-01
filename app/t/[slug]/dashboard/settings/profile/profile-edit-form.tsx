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
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, Loader2, X, Plus, AlertCircle } from "lucide-react"
import { COUNTRIES, LANGUAGES } from "@/lib/data/countries-languages"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProfileEditFormProps {
  resident: any
  tenant: any
  availableInterests: any[]
  tenantSlug: string
}

export function ProfileEditForm({ resident, tenant, availableInterests, tenantSlug }: ProfileEditFormProps) {
  const router = useRouter()
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
    profilePicture: resident.profile_picture_url || "",
    journeyStage: resident.journey_stage || "",
    estimatedMoveInDate: resident.estimated_move_in_date || "",
    selectedInterests: resident.user_interests?.map((ui: any) => ui.interest_id) || [],
    skills:
      resident.user_skills?.map((us: any) => ({
        skill_id: us.skill_id,
        skill_name: us.skills?.name || "",
        open_to_requests: us.open_to_requests || false,
      })) || [],
  })

  const [newSkill, setNewSkill] = useState("")
  const [languageSearch, setLanguageSearch] = useState("")

  const features = (tenant?.features as Record<string, boolean>) || {}

  const countryOptions = COUNTRIES.map((country) => ({
    value: country,
    label: country,
  }))

  const languageOptions = LANGUAGES.map((language) => ({
    value: language,
    label: language,
  }))

  const initials = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implement profile update with server action
      console.log("[v0] Updating profile:", formData)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = () => {
    // TODO: Implement Vercel Blob upload
    alert("Photo upload will be implemented with Vercel Blob storage")
  }

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData({ ...formData, languages: [...formData.languages, language] })
      setLanguageSearch("")
    }
  }

  const removeLanguage = (language: string) => {
    setFormData({ ...formData, languages: formData.languages.filter((l) => l !== language) })
  }

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { skill_name: newSkill.trim(), open_to_requests: false }],
      })
      setNewSkill("")
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
              <AvatarImage src={formData.profilePicture || "/placeholder.svg"} alt={initials} />
              <AvatarFallback className="text-2xl">{initials || "?"}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" onClick={handlePhotoUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </div>

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
                options={countryOptions}
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
                options={countryOptions}
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
              options={languageOptions}
              value={languageSearch}
              onValueChange={(value) => {
                addLanguage(value)
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
              options={languageOptions}
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
      {features.interests && availableInterests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Interests</CardTitle>
            <CardDescription>Select interests to connect with like-minded neighbours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => (
                <Badge
                  key={interest.id}
                  variant={formData.selectedInterests.includes(interest.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleInterest(interest.id)}
                >
                  {interest.name}
                </Badge>
              ))}
            </div>
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
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g., Plumbing, Gardening)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
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

          {formData.skills.length > 0 && (
            <div className="space-y-2">
              {formData.skills.map((skill: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium">{skill.skill_name}</span>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={skill.open_to_requests}
                        onCheckedChange={() => toggleSkillOpenToRequests(index)}
                      />
                      Open to help requests
                    </label>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
