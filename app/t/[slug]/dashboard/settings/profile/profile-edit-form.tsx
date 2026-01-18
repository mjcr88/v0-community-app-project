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
import { Loader2, X, Plus, AlertCircle, Mail, Phone, Languages, Lightbulb, Wrench, MapPin, User, MessageSquare, Calendar, Camera, Map as MapIcon } from "lucide-react"
import { COUNTRIES, LANGUAGES } from "@/lib/data/countries-languages"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { EditableProfileBanner } from "@/components/profile/editable-profile-banner"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { PhotoManager } from "@/components/photo-manager"
import { MultiSelect } from "@/components/ui/multi-select"
import { CollapsibleCard } from "@/components/ui/collapsible-card"
import { ProfileAnalytics, ErrorAnalytics } from "@/lib/analytics"

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
  userEmail: string
}

export function ProfileEditForm({
  resident,
  tenant,
  availableInterests,
  availableSkills,
  tenantSlug,
  locations = [],
  userEmail,
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

      // Build update object with dirty checking
      const updates: any = {}

      if (formData.firstName !== resident.first_name) updates.first_name = formData.firstName
      if (formData.lastName !== resident.last_name) updates.last_name = formData.lastName
      if (formData.phone !== resident.phone) updates.phone = formData.phone
      if (formData.birthday !== resident.birthday) updates.birthday = formData.birthday || null
      if (formData.birthCountry !== resident.birth_country) updates.birth_country = formData.birthCountry || null
      if (formData.currentCountry !== resident.current_country) updates.current_country = formData.currentCountry || null
      // Array comparison for languages
      const languagesChanged = JSON.stringify([...formData.languages].sort()) !== JSON.stringify([...(resident.languages || [])].sort())
      if (languagesChanged) updates.languages = formData.languages

      if (formData.preferredLanguage !== resident.preferred_language) updates.preferred_language = formData.preferredLanguage || null
      if (formData.about !== resident.about) updates.about = formData.about || null
      if (formData.journeyStage !== resident.journey_stage) updates.journey_stage = formData.journeyStage || null
      if (formData.estimatedMoveInDate !== resident.estimated_move_in_date) updates.estimated_move_in_date = formData.estimatedMoveInDate || null
      if (formData.estimatedConstructionStartDate !== resident.estimated_construction_start_date) updates.estimated_construction_start_date = formData.estimatedConstructionStartDate || null
      if (formData.estimatedConstructionEndDate !== resident.estimated_construction_end_date) updates.estimated_construction_end_date = formData.estimatedConstructionEndDate || null

      // Photo arrays
      const photosChanged = JSON.stringify([...formData.photos].sort()) !== JSON.stringify([...(resident.photos || [])].sort())
      if (photosChanged) updates.photos = formData.photos

      if (formData.heroPhoto !== resident.hero_photo) {
        updates.hero_photo = formData.heroPhoto
        updates.profile_picture_url = formData.heroPhoto // Sync profile picture
      }
      if (formData.bannerImageUrl !== resident.banner_image_url) updates.banner_image_url = formData.bannerImageUrl

      if (Object.keys(updates).length > 0) {
        const { error: userError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", resident.id)

        if (userError) throw userError
      }

      if (formData.about !== resident.about) ProfileAnalytics.aboutUpdated('bio')
      if (formData.journeyStage !== resident.journey_stage) ProfileAnalytics.aboutUpdated('journey')

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
      ProfileAnalytics.updated(['profile'])
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      ErrorAnalytics.actionFailed('update_profile', error instanceof Error ? error.message : "Unknown error")
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
    // Defer DB update to handleSubmit for consistency
  }

  const handleProfilePhotoChange = async (url: string | null) => {
    setFormData(prev => ({ ...prev, heroPhoto: url }))
    // We defer the DB update to handleSubmit to avoid race conditions and double-writing.
    // The user sees the optimistic update via local state.
  }

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData({ ...formData, languages: [...formData.languages, language], languageSearch: "" })
      ProfileAnalytics.languageAdded(language)
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
        ProfileAnalytics.skillAdded(newSkillTrimmed, false)
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
    const skillName = formData.skills[index]?.skill_name
    if (skillName) {
      ProfileAnalytics.skillRemoved(skillName)
    }
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userEmail}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Contact your community administrator to change your email address</p>
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
          <CollapsibleCard title="About" description="Tell your neighbors a bit about yourself" icon={MessageSquare} defaultOpen={false}>
            <Textarea
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="I love gardening and community dinners..."
              rows={4}
            />
          </CollapsibleCard>

          {/* Personal Details */}
          <CollapsibleCard title="Personal Details" description="Your birthday and origin" icon={User}>
            <div className="space-y-4">
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
            </div>
          </CollapsibleCard>

          {/* Languages */}
          <CollapsibleCard title="Languages" description="Languages you speak" icon={Languages} defaultOpen={false}>
            <div className="space-y-4">
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
            </div>
          </CollapsibleCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Journey Section */}
          <CollapsibleCard title="My Journey" description="Track your progress in the community" icon={Calendar} defaultOpen={false}>
            <div className="space-y-4">
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
            </div>
          </CollapsibleCard>

          {/* Interests */}
          {tenant?.features?.interests && (
            <CollapsibleCard title="Interests" description="Things you're passionate about" icon={Lightbulb} defaultOpen={false}>
              <div className="space-y-2">
                <Label>Interests</Label>
                <MultiSelect
                  options={availableInterests.map(i => ({ value: i.id, label: i.name }))}
                  selected={formData.selectedInterests}
                  onChange={(selected) => {
                    // Track analytics
                    const added = selected.find(id => !formData.selectedInterests.includes(id))
                    if (added) {
                      const interest = availableInterests.find(i => i.id === added)
                      if (interest) ProfileAnalytics.interestAdded(interest.name)
                    }
                    const removed = formData.selectedInterests.find(id => !selected.includes(id))
                    if (removed) {
                      const interest = availableInterests.find(i => i.id === removed)
                      if (interest) ProfileAnalytics.interestRemoved(interest.name)
                    }
                    setFormData({ ...formData, selectedInterests: selected })
                  }}
                  placeholder="Select interests..."
                  searchPlaceholder="Search interests..."
                  emptyMessage="No interests found."
                />
              </div>
            </CollapsibleCard>
          )}

          {/* Skills */}
          <CollapsibleCard title="Skills" description="What you can help with" icon={Wrench} defaultOpen={false}>
            <div className="space-y-4">
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
            </div>
          </CollapsibleCard>

          {/* Photo Gallery */}
          <CollapsibleCard title="Photo Gallery" description="Share photos of yourself and your life" icon={Camera} defaultOpen={false}>
            <PhotoManager
              photos={formData.photos}
              heroPhoto={formData.heroPhoto}
              onPhotosChange={(photos) => setFormData({ ...formData, photos })}
              onHeroPhotoChange={(heroPhoto) => setFormData({ ...formData, heroPhoto })}
              entityType="user"
              maxPhotos={10}
            />
          </CollapsibleCard>

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
      </form >
    </div >
  )
}
