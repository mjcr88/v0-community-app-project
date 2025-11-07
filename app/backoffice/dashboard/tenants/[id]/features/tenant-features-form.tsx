"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

type Tenant = {
  id: string
  name: string
  resident_visibility_scope?: "neighborhood" | "tenant"
  features?: {
    neighborhoods?: boolean
    interests?: boolean
    skills?: boolean
    pets?: boolean
    families?: boolean
    lots?: boolean
    journey_stages?: boolean
    onboarding?: boolean
    map?: boolean
    location_types?: {
      facility?: boolean
      lot?: boolean
      walking_path?: boolean
      neighborhood?: boolean
      boundary?: boolean
      protection_zone?: boolean
      easement?: boolean
      playground?: boolean
      public_street?: boolean
      green_area?: boolean
      recreational_zone?: boolean
    }
  }
}

const FEATURES = [
  {
    key: "neighborhoods",
    label: "Neighborhoods",
    description: "Enable multi-neighborhood support for this community",
    table: "neighborhoods",
  },
  {
    key: "lots",
    label: "Lots",
    description: "Enable property lot management (disable for apartments/condos)",
    table: "lots",
  },
  {
    key: "families",
    label: "Family Units",
    description: "Allow grouping residents into family units",
    table: "family_units",
  },
  {
    key: "pets",
    label: "Pets",
    description: "Enable pet registration and tracking",
    table: "pets",
  },
  {
    key: "interests",
    label: "Interests",
    description: "Allow residents to select and share community interests",
    table: "interests",
  },
  {
    key: "skills",
    label: "Skills",
    description: "Enable skills marketplace where residents can offer help",
    table: "skills",
  },
  {
    key: "journey_stages",
    label: "Journey Stages",
    description: "Track resident move-in journey stages (planning, building, arriving, integrating)",
    checkField: "journey_stage",
  },
  {
    key: "onboarding",
    label: "Onboarding Flow",
    description: "Enable guided onboarding for new residents (disable to use simple profile editing)",
    checkField: null,
  },
  {
    key: "map",
    label: "Community Map",
    description: "Enable interactive community map with locations and boundaries",
    table: "locations",
  },
] as const

const LOCATION_TYPE_OPTIONS = [
  { key: "facility", label: "Facilities", description: "Community amenities like pools, clubs, offices" },
  { key: "lot", label: "Lots", description: "Property boundaries and lot markers" },
  { key: "walking_path", label: "Walking Paths", description: "Trails and pathways" },
  { key: "neighborhood", label: "Neighborhoods", description: "Neighborhood boundaries" },
  { key: "boundary", label: "Community Boundary", description: "Overall community boundary" },
  { key: "protection_zone", label: "Protection Zones", description: "Protected areas" },
  { key: "easement", label: "Easements", description: "Utility and access easements" },
  { key: "playground", label: "Playgrounds", description: "Play areas" },
  { key: "public_street", label: "Public Streets", description: "Roads and streets" },
  { key: "green_area", label: "Green Areas", description: "Parks and green spaces" },
  { key: "recreational_zone", label: "Recreational Zones", description: "Sports and recreation areas" },
] as const

export default function TenantFeaturesForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [features, setFeatures] = useState<{
    neighborhoods?: boolean
    interests?: boolean
    skills?: boolean
    pets?: boolean
    families?: boolean
    lots?: boolean
    journey_stages?: boolean
    onboarding?: boolean
    map?: boolean
    location_types?: {
      facility?: boolean
      lot?: boolean
      walking_path?: boolean
      neighborhood?: boolean
      boundary?: boolean
      protection_zone?: boolean
      easement?: boolean
      playground?: boolean
      public_street?: boolean
      green_area?: boolean
      recreational_zone?: boolean
    }
  }>(
    tenant.features || {
      neighborhoods: true,
      interests: true,
      skills: true,
      pets: true,
      families: true,
      lots: true,
      journey_stages: true,
      onboarding: true,
      map: true,
      location_types: {
        facility: true,
        lot: true,
        walking_path: true,
        neighborhood: true,
        boundary: true,
        protection_zone: true,
        easement: true,
        playground: true,
        public_street: true,
        green_area: true,
        recreational_zone: true,
      },
    },
  )
  const [visibilityScope, setVisibilityScope] = useState<"neighborhood" | "tenant">(
    tenant.resident_visibility_scope || "tenant",
  )

  const handleToggle = async (featureKey: string, enabled: boolean) => {
    if (featureKey === "map" && !enabled) {
      const feature = FEATURES.find((f) => f.key === featureKey)
      if (feature?.table) {
        const { count } = await supabase
          .from(feature.table)
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)

        if (count && count > 0) {
          alert(
            `Cannot disable ${feature.label} because there are ${count} existing records. Please delete all ${feature.label.toLowerCase()} first.`,
          )
          return
        }
      }

      setFeatures((prev) => ({
        ...prev,
        map: false,
        location_types: {
          facility: false,
          lot: false,
          walking_path: false,
          neighborhood: false,
          boundary: false,
          protection_zone: false,
          easement: false,
          playground: false,
          public_street: false,
          green_area: false,
          recreational_zone: false,
        },
      }))
      return
    }

    if (featureKey === "map" && enabled) {
      setFeatures((prev) => ({
        ...prev,
        map: true,
        location_types: {
          facility: true,
          lot: true,
          walking_path: true,
          neighborhood: true,
          boundary: true,
          protection_zone: true,
          easement: true,
          playground: true,
          public_street: true,
          green_area: true,
          recreational_zone: true,
        },
      }))
      return
    }

    if (!enabled) {
      const feature = FEATURES.find((f) => f.key === featureKey)
      if (feature) {
        if (feature.table) {
          const { count } = await supabase
            .from(feature.table)
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenant.id)

          if (count && count > 0) {
            alert(
              `Cannot disable ${feature.label} because there are ${count} existing records. Please delete all ${feature.label.toLowerCase()} first.`,
            )
            return
          }
        } else if (feature.checkField) {
          const { count } = await supabase
            .from("residents")
            .select("*", { count: "exact", head: true })
            .not(feature.checkField, "is", null)

          if (count && count > 0) {
            alert(
              `Cannot disable ${feature.label} because ${count} residents have this data set. Please clear the data first.`,
            )
            return
          }
        }
      }
    }

    setFeatures((prev) => ({ ...prev, [featureKey]: enabled }))
  }

  const handleLocationTypeToggle = (typeKey: string, enabled: boolean) => {
    setFeatures((prev) => ({
      ...prev,
      location_types: {
        ...prev.location_types,
        [typeKey]: enabled,
      },
    }))
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from("tenants")
        .update({ features, resident_visibility_scope: visibilityScope })
        .eq("id", tenant.id)

      if (error) {
        console.error("[v0] Error saving features:", error)
        alert("Failed to save features")
        return
      }

      router.refresh()
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Control which features are available for this tenant. Features cannot be disabled if data exists.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Community Structure</h3>
          {FEATURES.filter((f) => ["neighborhoods", "lots", "families"].includes(f.key)).map((feature) => (
            <div key={feature.key} className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.key}
                checked={features[feature.key as keyof typeof features] ?? true}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Community Features</h3>
          {FEATURES.filter((f) => ["pets", "interests", "skills"].includes(f.key)).map((feature) => (
            <div key={feature.key} className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.key}
                checked={features[feature.key as keyof typeof features] ?? true}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Resident Experience</h3>
          {FEATURES.filter((f) => ["journey_stages", "onboarding"].includes(f.key)).map((feature) => (
            <div key={feature.key} className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.key}
                checked={features[feature.key as keyof typeof features] ?? true}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Map & Locations</h3>
          {FEATURES.filter((f) => f.key === "map").map((feature) => (
            <div key={feature.key} className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.key}
                checked={features.map ?? true}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          ))}

          {features.map && (
            <div className="ml-6 space-y-3 pt-2">
              <Label className="text-sm font-medium">Active Location Types</Label>
              <p className="text-sm text-muted-foreground">Select which location types are available on the map</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LOCATION_TYPE_OPTIONS.map((locationType) => (
                  <div key={locationType.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={`location-type-${locationType.key}`}
                      checked={
                        features.location_types?.[locationType.key as keyof typeof features.location_types] ?? true
                      }
                      onCheckedChange={(checked) => handleLocationTypeToggle(locationType.key, checked as boolean)}
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={`location-type-${locationType.key}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {locationType.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{locationType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Privacy & Visibility</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">Resident Directory Scope</Label>
              <p className="text-sm text-muted-foreground">
                Control which residents can see each other in the community directory
              </p>
            </div>
            <RadioGroup
              value={visibilityScope}
              onValueChange={(value) => setVisibilityScope(value as "neighborhood" | "tenant")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant" id="tenant" />
                <Label htmlFor="tenant" className="font-normal cursor-pointer">
                  <span className="font-medium">Entire Community</span>
                  <span className="text-sm text-muted-foreground block">
                    Residents can see all other residents across all neighborhoods
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neighborhood" id="neighborhood" />
                <Label htmlFor="neighborhood" className="font-normal cursor-pointer">
                  <span className="font-medium">Neighborhood Only</span>
                  <span className="text-sm text-muted-foreground block">
                    Residents can only see other residents in their own neighborhood
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
