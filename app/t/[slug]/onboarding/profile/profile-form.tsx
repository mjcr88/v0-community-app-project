"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { COUNTRIES, LANGUAGES } from "@/lib/data/countries-languages"

interface ProfileFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  resident: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    phone: string | null
    birthday: string | null
    birth_country: string | null
    current_country: string | null
    languages: string[] | null
    preferred_language: string | null
    profile_picture_url: string | null
  }
  isSuperAdmin: boolean
}

export function ProfileForm({ tenant, resident, isSuperAdmin }: ProfileFormProps) {
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
  })
  const [languageSearch, setLanguageSearch] = useState("")

  const countryOptions = COUNTRIES.map((country) => ({
    value: country,
    label: country,
  }))

  const languageOptions = LANGUAGES.map((language) => ({
    value: language,
    label: language,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSuperAdmin) {
        console.log("[v0] Super admin test mode - skipping profile save")
        router.push(`/t/${tenant.slug}/onboarding/interests`)
        return
      }

      // TODO: Implement profile update with Vercel Blob for profile picture
      console.log("[v0] Profile data:", formData)
      router.push(`/t/${tenant.slug}/onboarding/interests`)
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push(`/t/${tenant.slug}/onboarding/interests`)
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

  const handlePhotoUpload = () => {
    // TODO: Implement Vercel Blob upload
    alert("Photo upload will be implemented with Vercel Blob storage")
  }

  const initials = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Help your neighbors get to know you better by sharing some basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.profilePicture || "/placeholder.svg"} alt={initials} />
              <AvatarFallback className="text-2xl">{initials || "?"}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" onClick={handlePhotoUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
            <p className="text-xs text-muted-foreground">Recommended: Square image, at least 400x400px</p>
          </div>

          {/* Name Fields */}
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

          {/* Phone and Birthday */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthCountry">Country of Origin</Label>
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
              <Label htmlFor="currentCountry">Current Country</Label>
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
            <Label>Languages You Speak</Label>
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
            <Label htmlFor="preferredLanguage">Preferred Language for Communication</Label>
            <Combobox
              options={languageOptions}
              value={formData.preferredLanguage}
              onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
              placeholder="Select preferred language"
              searchPlaceholder="Search languages..."
              emptyText="No language found."
            />
            <p className="text-xs text-muted-foreground">
              This helps neighbors communicate with you in your preferred language
            </p>
          </div>

          {/* Actions */}
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
