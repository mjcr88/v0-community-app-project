"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { updatePrivacySettings } from "./update-privacy-settings-action"

interface PrivacySettingsFormProps {
  privacySettings: any
  tenantSlug: string
}

export function PrivacySettingsForm({ privacySettings, tenantSlug }: PrivacySettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    showEmail: privacySettings?.show_email ?? true,
    showPhone: privacySettings?.show_phone ?? true,
    showBirthday: privacySettings?.show_birthday ?? true,
    showBirthCountry: privacySettings?.show_birth_country ?? true,
    showCurrentCountry: privacySettings?.show_current_country ?? true,
    showLanguages: privacySettings?.show_languages ?? true,
    showPreferredLanguage: privacySettings?.show_preferred_language ?? true,
    showJourneyStage: privacySettings?.show_journey_stage ?? true,
    showEstimatedMoveInDate: privacySettings?.show_estimated_move_in_date ?? true,
    showFamily: privacySettings?.show_family ?? true,
    showFamilyRelationships: privacySettings?.show_family_relationships ?? true,
    showInterests: privacySettings?.show_interests ?? true,
    showSkills: privacySettings?.show_skills ?? true,
    showOpenToRequests: privacySettings?.show_open_to_requests ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("[v0] Submitting privacy settings:", settings)
      const result = await updatePrivacySettings(tenantSlug, settings)
      console.log("[v0] Privacy settings update result:", result)

      if (result.success) {
        toast({
          title: "Privacy settings updated",
          description: "Your privacy preferences have been saved successfully.",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update privacy settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error updating privacy settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const privacyGroups = [
    {
      title: "Contact Information",
      description: "Control who can see your contact details",
      settings: [
        { key: "showEmail", label: "Email Address", value: settings.showEmail },
        { key: "showPhone", label: "Phone Number", value: settings.showPhone },
      ],
    },
    {
      title: "Personal Information",
      description: "Manage visibility of your personal details",
      settings: [
        { key: "showBirthday", label: "Birthday", value: settings.showBirthday },
        { key: "showBirthCountry", label: "Country of Birth", value: settings.showBirthCountry },
        { key: "showCurrentCountry", label: "Current Country", value: settings.showCurrentCountry },
        { key: "showLanguages", label: "Languages", value: settings.showLanguages },
        { key: "showPreferredLanguage", label: "Preferred Language", value: settings.showPreferredLanguage },
      ],
    },
    {
      title: "Journey Information",
      description: "Control visibility of your community journey",
      settings: [
        { key: "showJourneyStage", label: "Journey Stage", value: settings.showJourneyStage },
        { key: "showEstimatedMoveInDate", label: "Estimated Move-in Date", value: settings.showEstimatedMoveInDate },
      ],
    },
    {
      title: "Community Information",
      description: "Manage what community details are visible",
      settings: [
        { key: "showFamily", label: "Family Members", value: settings.showFamily },
        { key: "showFamilyRelationships", label: "Family Relationship Types", value: settings.showFamilyRelationships },
        { key: "showInterests", label: "Interests", value: settings.showInterests },
        { key: "showSkills", label: "Skills", value: settings.showSkills },
        { key: "showOpenToRequests", label: "Open to Help Requests", value: settings.showOpenToRequests },
      ],
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Your name, profile picture, lot assignment, and neighborhood are always visible to other residents. All other
          fields can be hidden below.
        </AlertDescription>
      </Alert>

      {privacyGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.settings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between">
                <Label htmlFor={setting.key} className="cursor-pointer">
                  {setting.label}
                </Label>
                <Switch
                  id={setting.key}
                  checked={setting.value}
                  onCheckedChange={(checked) => setSettings({ ...settings, [setting.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Privacy Settings
        </Button>
      </div>
    </form>
  )
}
