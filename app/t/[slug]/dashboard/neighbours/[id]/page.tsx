import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  Languages,
  Lightbulb,
  Wrench,
  Users,
  ArrowLeft,
  CheckCircle2,
  Star,
} from "lucide-react"
import Link from "next/link"
import { filterPrivateData } from "@/lib/privacy-utils"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get current resident's tenant and family
  const { data: currentResident } = await supabase
    .from("users")
    .select("id, tenant_id, family_unit_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  console.log("[v0] Viewing profile - Current resident:", {
    id: currentResident.id,
    family_unit_id: currentResident.family_unit_id,
  })

  const { data: resident } = await supabase
    .from("users")
    .select(
      `
      *,
      lots (
        lot_number,
        neighborhoods (
          name
        )
      ),
      family_units (
        name
      ),
      user_interests (
        interests (
          id,
          name
        )
      ),
      user_skills (
        skills (
          id,
          name
        ),
        open_to_requests
      ),
      user_privacy_settings (
        show_email,
        show_profile_picture,
        show_phone,
        show_birthday,
        show_birth_country,
        show_current_country,
        show_languages,
        show_preferred_language,
        show_journey_stage,
        show_estimated_move_in_date,
        show_neighborhood,
        show_family,
        show_family_relationships,
        show_interests,
        show_skills,
        show_open_to_requests
      ),
      photos,
      hero_photo
    `,
    )
    .eq("id", id)
    .eq("tenant_id", currentResident.tenant_id)
    .eq("role", "resident")
    .single()

  if (!resident) {
    notFound()
  }

  console.log("[v0] Profile being viewed:", {
    id: resident.id,
    name: `${resident.first_name} ${resident.last_name}`,
    family_unit_id: resident.family_unit_id,
    email: resident.email,
    phone: resident.phone,
  })

  const privacySettingsData = Array.isArray(resident.user_privacy_settings)
    ? resident.user_privacy_settings[0]
    : resident.user_privacy_settings

  console.log("[v0] Raw privacy settings from query:", resident.user_privacy_settings)
  console.log(
    "[v0] Privacy settings type:",
    Array.isArray(resident.user_privacy_settings) ? "array" : typeof resident.user_privacy_settings,
  )
  console.log("[v0] Extracted privacy settings:", privacySettingsData)

  const isFamily = resident.family_unit_id === currentResident.family_unit_id
  const privacySettings = privacySettingsData || {}

  console.log("[v0] Privacy check:", {
    isFamily,
    privacySettings,
    hasPrivacySettings: !!privacySettingsData,
  })

  const filteredResident = filterPrivateData(resident, privacySettings, isFamily)

  console.log("[v0] Filtered resident:", {
    email: filteredResident.email,
    phone: filteredResident.phone,
    show_email: filteredResident.show_email,
    show_phone: filteredResident.show_phone,
  })

  const { data: pets } = await supabase.from("pets").select("*").eq("family_unit_id", resident.family_unit_id)

  const initials = [filteredResident.first_name, filteredResident.last_name]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase()
  const displayName = `${filteredResident.first_name || ""} ${filteredResident.last_name || ""}`.trim()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", currentResident.tenant_id).single()

  const { data: locations } = await supabase.from("locations").select("*").eq("tenant_id", currentResident.tenant_id)

  // Find the location for this resident's lot
  const lotLocation = locations?.find((loc) => loc.lot_id === resident.lot_id && loc.type === "lot")

  const mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  const residentPhotos = Array.isArray(resident.photos) ? resident.photos : []
  const heroPhoto =
    resident.hero_photo || resident.profile_picture_url || (residentPhotos.length > 0 ? residentPhotos[0] : null)
  const otherPhotos = heroPhoto ? residentPhotos.filter((p) => p !== heroPhoto) : residentPhotos

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/t/${slug}/dashboard/neighbours`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{displayName}</h2>
          <p className="text-muted-foreground">Resident Profile</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={heroPhoto || undefined} alt={displayName} />
                <AvatarFallback className="text-3xl">{initials || "?"}</AvatarFallback>
              </Avatar>

              <div className="space-y-1 w-full">
                <h3 className="text-2xl font-bold">{displayName}</h3>

                {filteredResident.show_neighborhood && resident.lots?.neighborhoods?.name && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {resident.lots.neighborhoods.name} - Lot #{resident.lots.lot_number}
                    </span>
                  </div>
                )}

                {filteredResident.show_journey_stage && filteredResident.journey_stage && (
                  <Badge variant="secondary" className="capitalize mt-2">
                    {filteredResident.journey_stage}
                  </Badge>
                )}
              </div>

              {filteredResident.show_estimated_move_in_date && filteredResident.estimated_move_in_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Moving {new Date(filteredResident.estimated_move_in_date).toLocaleDateString()}</span>
                </div>
              )}

              {filteredResident.show_neighborhood && lotLocation && locations && (
                <div className="w-full space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                  <MapPreviewWidget
                    tenantSlug={slug}
                    locations={locations}
                    mapCenter={mapCenter}
                    highlightLocationId={lotLocation.id}
                  />
                  <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                    <Link href={`/t/${slug}/dashboard/map?highlightLot=${resident.lot_id}`}>View on Full Map</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {((filteredResident.show_email && filteredResident.email) ||
            (filteredResident.show_phone && filteredResident.phone)) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredResident.show_email && filteredResident.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${filteredResident.email}`} className="text-sm hover:underline">
                      {filteredResident.email}
                    </a>
                  </div>
                )}
                {filteredResident.show_phone && filteredResident.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${filteredResident.phone}`} className="text-sm hover:underline">
                      {filteredResident.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {((filteredResident.show_birth_country && filteredResident.birth_country) ||
            (filteredResident.show_current_country && filteredResident.current_country) ||
            (filteredResident.show_birthday && filteredResident.birthday)) && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredResident.show_birthday && filteredResident.birthday && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Birthday: {new Date(filteredResident.birthday).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {filteredResident.show_birth_country && filteredResident.birth_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">From: {filteredResident.birth_country}</span>
                  </div>
                )}
                {filteredResident.show_current_country && filteredResident.current_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Currently in: {filteredResident.current_country}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {filteredResident.show_languages && filteredResident.languages && filteredResident.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
                {filteredResident.show_preferred_language && filteredResident.preferred_language && (
                  <CardDescription>Preferred: {filteredResident.preferred_language}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {filteredResident.languages.map((language: string) => (
                    <Badge key={language} variant="secondary">
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredResident.show_family && resident.family_units && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{resident.family_units.name}</p>
              </CardContent>
            </Card>
          )}

          {filteredResident.show_interests &&
            filteredResident.user_interests &&
            filteredResident.user_interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {filteredResident.user_interests.map((ui: any) => (
                      <Badge key={ui.interests.id} variant="outline">
                        {ui.interests.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {filteredResident.show_skills && filteredResident.user_skills && filteredResident.user_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Skills
                </CardTitle>
                <CardDescription>
                  {filteredResident.user_skills.some((s: any) => s.open_to_requests)
                    ? "Open to help requests for some skills"
                    : "Not currently accepting help requests"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredResident.user_skills.map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.skills.name}</span>
                      {skill.open_to_requests && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Available to help
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pets && pets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Family Pets</CardTitle>
                <CardDescription>
                  {pets.length} pet{pets.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {pets.map((pet) => {
                    const petInitials = pet.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()

                    return (
                      <div key={pet.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={pet.profile_picture_url || undefined} alt={pet.name} />
                          <AvatarFallback>{petInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{pet.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {pet.breed ? `${pet.species} • ${pet.breed}` : pet.species}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Gallery */}
          {residentPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>
                  {residentPhotos.length} photo{residentPhotos.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heroPhoto && (
                  <div className="space-y-3 mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Featured Photo
                    </Badge>
                    <div className="rounded-lg overflow-hidden aspect-video">
                      <img
                        src={heroPhoto || "/placeholder.svg"}
                        alt="Featured"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {otherPhotos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">More Photos</p>
                    <div className="grid grid-cols-2 gap-3">
                      {otherPhotos.map((photo, index) => (
                        <div key={index} className="rounded-lg overflow-hidden aspect-square">
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
