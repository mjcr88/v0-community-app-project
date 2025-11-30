"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, X, Plus, AlertCircle, Mail, Phone, Languages, Lightbulb, Wrench, MapPin } from "lucide-react"
import { COUNTRIES, LANGUAGES } from "@/lib/data/countries-languages"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EditableProfileBanner } from "@/components/profile/editable-profile-banner"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { PhotoManager } from "@/components/photo-manager"
import { MultiSelect } from "@/components/ui/multi-select"

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
  profile_picture_url: string | null
  banner_image_url: string | null
  about: string | null
  journey_stage: string | null
  estimated_move_in_date: string | null
  estimated_construction_start_date: string | null
  estimated_construction_end_date: string | null
  user_interests?: { interest_id: string }[]
  user_skills?: { skill_id: string; skills?: { name: string }; open_to_requests: boolean }[]
  lot_id?: string
  lots?: {
    lot_number: string
    neighborhoods?: {
      name: string
    }
  }
}

interface Tenant {
  features?: {
    interests?: boolean
  }
  map_center_coordinates?: {
    lat: number
    lng: number
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
  locations?: any[]
}

export function ProfileEditForm({
  resident,
  tenant,
  availableInterests,
  availableSkills,
  tenantSlug,
  locations = [],
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
    heroPhoto: resident.hero_photo || resident.profile_picture_url || null,
    bannerImageUrl: resident.banner_image_url || null,
    about: resident.about || "",
    journeyStage: resident.journey_stage || "",
    estimatedMoveInDate: resident.estimated_move_in_date || "",
    estimatedConstructionStartDate: resident.estimated_construction_start_date || "",
    estimatedConstructionEndDate: resident.estimated_construction_end_date || "",
    selectedInterests: resident.user_interests?.map((ui) => ui.interest_id) || [],
    skills:
      resident.user_skills?.map((us) => ({
        skill_id: us.skill_id,
        skill_name: us.skills?.name || "",
        open_to_requests: us.open_to_requests || false,
      })) || [] as { skill_id?: string; skill_name: string; open_to_requests: boolean }[],
    newSkill: "",
    languageSearch: "",
  })

  const initials = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
          about: formData.about || null,
          journey_stage: formData.journeyStage || null,
          estimated_move_in_date: formData.estimatedMoveInDate || null,
          estimated_construction_start_date: formData.estimatedConstructionStartDate || null,
          estimated_construction_end_date: formData.estimatedConstructionEndDate || null,
          photos: formData.photos,
          hero_photo: formData.heroPhoto,
          profile_picture_url: formData.heroPhoto, // Sync profile picture with hero photo
          banner_image_url: formData.bannerImageUrl,
        })
        .eq("id", resident.id)

      if (userError) throw userError

      // Handle Interests
      const { error: deleteInterestsError } = await supabase.from("user_interests").delete().eq("user_id", resident.id)
      if (deleteInterestsError) console.error("Error deleting interests:", deleteInterestsError)

      if (formData.selectedInterests.length > 0) {
        const interestsToInsert = formData.selectedInterests.map((interestId) => ({
          user_id: resident.id,
          interest_id: interestId,
        }))
        const { error: insertInterestsError } = await supabase.from("user_interests").insert(interestsToInsert)
        if (insertInterestsError) throw insertInterestsError
      }

      // Handle Skills
      const { error: deleteSkillsError } = await supabase.from("user_skills").delete().eq("user_id", resident.id)
      if (deleteSkillsError) console.error("Error deleting skills:", deleteSkillsError)

      if (formData.skills.length > 0) {
        const skillsToInsert = []
        for (const skill of formData.skills) {
          if (skill.skill_id) {
            skillsToInsert.push({
              user_id: resident.id,
              skill_id: skill.skill_id,
              open_to_requests: skill.open_to_requests,
            })
          } else {
            const { data: newSkillData } = await supabase
              .from("skills")
              .insert({ name: skill.skill_name, tenant_id: resident.tenant_id })
              .select()
              .single()

            if (newSkillData) {
              skillsToInsert.push({
                user_id: resident.id,
                skill_id: newSkillData.id,
                open_to_requests: skill.open_to_requests,
              })
            }
          }
        }
        if (skillsToInsert.length > 0) {
          const { error: insertSkillsError } = await supabase.from("user_skills").insert(skillsToInsert)
          if (insertSkillsError) throw insertSkillsError
        }
      }

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBannerChange = async (url: string | null) => {
    setFormData(prev => ({ ...prev, bannerImageUrl: url }))
    // We don't save immediately here to allow batch saving with the form, 
    // but EditableProfileBanner might expect immediate feedback. 
    // The previous implementation saved immediately. Let's keep that for banner/profile photo 
    // as they are "header" elements, but also update local state.
    const supabase = createClient()
    await supabase.from("users").update({ banner_image_url: url }).eq("id", resident.id)
    router.refresh()
  }

  const handleProfilePhotoChange = async (url: string | null) => {
    setFormData(prev => ({ ...prev, heroPhoto: url }))
    const supabase = createClient()
    await supabase.from("users").update({
      hero_photo: url,
      profile_picture_url: url
    }).eq("id", resident.id)
    router.refresh()
  }

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData({ ...formData, languages: [...formData.languages, language], languageSearch: "" })
    }
  }

  const removeLanguage = (language: string) => {
    setFormData({ ...formData, languages: formData.languages.filter((l) => l !== language) })
  }

  const addSkill = () => {
    const newSkillTrimmed = formData.newSkill.trim()
    if (newSkillTrimmed) {
      // Check if skill already exists in selected skills
      if (!formData.skills.some(s => s.skill_name.toLowerCase() === newSkillTrimmed.toLowerCase())) {
        setFormData({
          ...formData,
          skills: [...formData.skills, { skill_name: newSkillTrimmed, open_to_requests: false }],
          newSkill: "",
        })
      }
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

  // Find the location for this resident's lot
  const lotLocation = locations?.find((loc) => loc.lot_id === resident.lot_id && loc.type === "lot")
  const mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

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
    <div className="space-y-6">
      <EditableProfileBanner
        bannerUrl={formData.bannerImageUrl}
        profileUrl={formData.heroPhoto}
        initials={initials}
        onBannerChange={handleBannerChange}
        onProfilePhotoChange={handleProfilePhotoChange}
      />

      {hasEmptyFields && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is incomplete. Fill in the missing information to help your neighbours get to know you better.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Identity & Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded-md overflow-hidden">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">Contact Admin to change</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
              <CardDescription>Tell your neighbors a bit about yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                placeholder="I love gardening and community dinners..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthCountry">Country of Origin</Label>
                  <Combobox
                    options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                    value={formData.birthCountry}
                    onValueChange={(value) => setFormData({ ...formData, birthCountry: value })}
                    placeholder="Select country"
                    searchPlaceholder="Search countries..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentCountry">Current Country</Label>
                <Combobox
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                  value={formData.currentCountry}
                  onValueChange={(value) => setFormData({ ...formData, currentCountry: value })}
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Languages className="h-5 w-5" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Languages You Speak</Label>
                <Combobox
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  value={formData.languageSearch}
                  onValueChange={(value) => {
                    addLanguage(value)
                  }}
                  placeholder="Add a language"
                  searchPlaceholder="Search languages..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.languages.map((language) => (
                    <Badge key={language} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                      {language}
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-1 hover:text-destructive rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Combobox
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  value={formData.preferredLanguage}
                  onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                  placeholder="Select preferred language"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Journey Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Journey</CardTitle>
              <CardDescription>Track your progress in the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="journeyStage">Journey Stage *</Label>
                <Select
                  value={formData.journeyStage}
                  onValueChange={(value) => setFormData({ ...formData, journeyStage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="arriving">Arriving</SelectItem>
                    <SelectItem value="integrating">Integrating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estimated Move-in Date</Label>
                <Input
                  type="date"
                  value={formData.estimatedMoveInDate}
                  onChange={(e) => setFormData({ ...formData, estimatedMoveInDate: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Construction Start</Label>
                  <Input
                    type="date"
                    value={formData.estimatedConstructionStartDate}
                    onChange={(e) => setFormData({ ...formData, estimatedConstructionStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Construction End</Label>
                  <Input
                    type="date"
                    value={formData.estimatedConstructionEndDate}
                    onChange={(e) => setFormData({ ...formData, estimatedConstructionEndDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          {tenant?.features?.interests && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5" />
                  Interests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <MultiSelect
                    options={availableInterests.map(i => ({ value: i.id, label: i.name }))}
                    selected={formData.selectedInterests}
                    onChange={(selected) => setFormData({ ...formData, selectedInterests: selected })}
                    placeholder="Select interests..."
                    searchPlaceholder="Search interests..."
                    emptyMessage="No interests found."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-5 w-5" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Skills</Label>
                <MultiSelect
                  options={availableSkills.map(s => ({ value: s.id, label: s.name }))}
                  selected={formData.skills.filter(s => s.skill_id).map(s => s.skill_id!)}
                  onChange={(selectedIds) => {
                    // Handle selection changes
                    // Keep existing skills that are still selected
                    const existingSkills = formData.skills.filter(s => s.skill_id && selectedIds.includes(s.skill_id))

                    // Find newly selected skills
                    const newIds = selectedIds.filter(id => !formData.skills.some(s => s.skill_id === id))
                    const newSkills = newIds.map(id => {
                      const skill = availableSkills.find(s => s.id === id)
                      return {
                        skill_id: id,
                        skill_name: skill?.name || "",
                        open_to_requests: false
                      }
                    })

                    // Keep custom skills (no skill_id)
                    const customSkills = formData.skills.filter(s => !s.skill_id)

                    setFormData({
                      ...formData,
                      skills: [...existingSkills, ...newSkills, ...customSkills]
                    })
                  }}
                  placeholder="Select skills..."
                  searchPlaceholder="Search skills..."
                  emptyMessage="No skills found."
                />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a custom skill..."
                  value={formData.newSkill}
                  onChange={(e) => setFormData({ ...formData, newSkill: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <span className="font-medium">{skill.skill_name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={skill.open_to_requests ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSkillOpenToRequests(index)}
                        className="text-xs h-7"
                      >
                        {skill.open_to_requests ? "Open to Help" : "Not Open"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSkill(index)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Photo Gallery</CardTitle>
              <CardDescription>Share photos of yourself and your life</CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoManager
                photos={formData.photos}
                heroPhoto={formData.heroPhoto}
                onPhotosChange={(photos) => setFormData({ ...formData, photos })}
                onHeroPhotoChange={(heroPhoto) => setFormData({ ...formData, heroPhoto })}
                entityType="user"
                maxPhotos={10}
              />
            </CardContent>
          </Card>

          {/* Location Map */}
          {lotLocation && locations && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">My Location</Label>
                {resident.lots && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    Lot {resident.lots.lot_number}
                  </Badge>
                )}
              </div>
              <div className="rounded-xl overflow-hidden border shadow-sm">
                <MapPreviewWidget
                  tenantSlug={tenantSlug}
                  tenantId={resident.tenant_id}
                  locations={locations}
                  mapCenter={mapCenter}
                  highlightLocationId={lotLocation.id}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Location is managed by administrators
              </p>
            </div>
          )}

          {/* Save Button (Sticky on mobile or bottom of column) */}
          <div className="sticky bottom-6 pt-4">
            <Button type="submit" size="lg" className="w-full shadow-lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
