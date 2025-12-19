import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Phone, Mail, Globe, Languages, Lightbulb, Wrench, Users, ArrowLeft, CheckCircle2, Star, PawPrint, EyeOff } from 'lucide-react'
import Link from "next/link"
import { filterPrivateData } from "@/lib/privacy-utils"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { ResidentExchangeListings } from "@/components/profile/resident-exchange-listings"
import { getExchangeListingsByUser, getExchangeCategories } from "@/app/actions/exchange-listings"
import { getNeighborhoods } from "@/app/actions/neighborhoods"
import { getLocations } from "@/app/actions/locations"

import { ProfileBanner } from "@/components/directory/ProfileBanner"
import { AboutSection } from "@/components/directory/AboutSection"
import { SkillsList } from "@/components/directory/SkillsList"
import { FamilyMemberCard } from "@/components/directory/FamilyMemberCard"
import { ExchangeListingCard } from "@/components/directory/ExchangeListingCard"
import { PhotoGallerySection } from "@/components/directory/PhotoGallerySection"
import { CollapsibleSection } from "@/components/directory/CollapsibleSection"
import { TrackProfileView } from "@/components/analytics/track-views"

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

  // Fetch all family members (excluding current profile being viewed)
  // First get the basic user data
  const { data: familyMembers, error: familyError } = await supabase
    .from("users")
    .select(`
      id,
      first_name,
      last_name,
      profile_picture_url,
      family_unit_id,
      lot_id
    `)
    .eq("family_unit_id", resident.family_unit_id)
    .neq("id", resident.id)

  console.log('[DEBUG] Family members base query:', {
    residentId: resident.id,
    familyUnitId: resident.family_unit_id,
    count: familyMembers?.length || 0,
    error: familyError,
    members: familyMembers?.map(m => ({ id: m.id, name: `${m.first_name} ${m.last_name}` }))
  })

  // Enrich with privacy settings and lot info for each member
  const enrichedFamilyMembers = await Promise.all(
    (familyMembers || []).map(async (member) => {
      // Get privacy settings
      const { data: privacySettings } = await supabase
        .from("user_privacy_settings")
        .select("*")
        .eq("user_id", member.id)
        .single()

      // Get lot info if they have one
      let lotInfo = null
      if (member.lot_id) {
        const { data } = await supabase
          .from("lots")
          .select("lot_number, neighborhoods(name)")
          .eq("id", member.lot_id)
          .single()
        lotInfo = data
      }

      return {
        ...member,
        user_privacy_settings: privacySettings,
        lots: lotInfo
      }
    })
  )

  // Filter each family member by their own privacy settings
  const filteredFamilyMembers = enrichedFamilyMembers.map(member => {
    const memberIsFamily = member.family_unit_id === currentResident.family_unit_id
    const memberPrivacy = member.user_privacy_settings
    return filterPrivateData(member, memberPrivacy || {}, memberIsFamily)
  })

  console.log('[DEBUG] Filtered family members:', {
    count: filteredFamilyMembers.length,
    members: filteredFamilyMembers.map(m => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`,
      show_family: m.show_family
    }))
  })

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
  const otherPhotos = heroPhoto ? residentPhotos.filter((p: any) => p !== heroPhoto) : residentPhotos

  const exchangeEnabled = tenant?.exchange_enabled === true
  let residentListings: any[] = []
  let categories: any[] = []
  let neighborhoods: any[] = []
  let allLocations: any[] = []

  // Exchange data fetching
  if (exchangeEnabled) {
    residentListings = await getExchangeListingsByUser(resident.id, currentResident.tenant_id)

    const categoriesData = await getExchangeCategories()
    categories = categoriesData || []

    const neighborhoodsResult = await getNeighborhoods(currentResident.tenant_id)
    neighborhoods = neighborhoodsResult.success ? neighborhoodsResult.data : []

    allLocations = await getLocations(currentResident.tenant_id)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <TrackProfileView isOwnProfile={user.id === resident.id} />
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/t/${slug}/dashboard/neighbours`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resident Profile</h1>
          <p className="text-muted-foreground text-sm">View and connect with your neighbor</p>
        </div>
      </div>

      {/* Profile Banner */}
      <ProfileBanner
        bannerUrl={resident.banner_image_url}
        profileUrl={filteredResident.show_profile_picture ? (resident.profile_picture_url || undefined) : undefined}
        name={displayName}
        neighborhood={filteredResident.show_neighborhood ? resident.lots?.neighborhoods?.name : undefined}
        lotNumber={filteredResident.show_neighborhood ? resident.lots?.lot_number : undefined}
        journeyStage={filteredResident.show_journey_stage ? (filteredResident.journey_stage || undefined) : undefined}
        initials={initials}
      />

      {/* Two Column Grid */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* About Section - Moved to top of left column */}
          {(filteredResident.show_about && filteredResident.about) || !filteredResident.show_about ? (
            <CollapsibleSection title="About" iconName="Users" defaultOpen={true}>
              {filteredResident.show_about && filteredResident.about ? (
                <AboutSection content={filteredResident.about} />
              ) : (
                <p className="text-sm text-muted-foreground">About information is private</p>
              )}
            </CollapsibleSection>
          ) : null}

          {/* Languages */}
          {(filteredResident.show_languages && filteredResident.languages && filteredResident.languages.length > 0) || !filteredResident.show_languages ? (
            <CollapsibleSection
              title="Languages"
              iconName="Languages"
              description={filteredResident.show_preferred_language && filteredResident.preferred_language ? `Prefers: ${filteredResident.preferred_language}` : undefined}
              defaultOpen={true}
            >
              {filteredResident.show_languages && filteredResident.languages && filteredResident.languages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredResident.languages.map((lang: string) => (
                    <Badge key={lang} variant="outline">{lang}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Languages are private</p>
              )}
            </CollapsibleSection>
          ) : null}

          {/* Contact & Personal Details (Side by Side) */}
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
            {/* Contact Info */}
            <CollapsibleSection title="Contact" iconName="Mail" defaultOpen={true}>
              <div className="space-y-3">
                {filteredResident.show_email && filteredResident.email ? (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${filteredResident.email}`} className="text-sm hover:underline truncate">
                      {filteredResident.email}
                    </a>
                  </div>
                ) : !filteredResident.show_email ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <EyeOff className="h-4 w-4" />
                    <span className="text-sm">Email hidden</span>
                  </div>
                ) : null}

                {filteredResident.show_phone && filteredResident.phone ? (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${filteredResident.phone}`} className="text-sm hover:underline">
                      {filteredResident.phone}
                    </a>
                  </div>
                ) : !filteredResident.show_phone ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <EyeOff className="h-4 w-4" />
                    <span className="text-sm">Phone hidden</span>
                  </div>
                ) : null}
              </div>
            </CollapsibleSection>

            {/* Personal Details */}
            <CollapsibleSection title="Personal" iconName="IdCard">
              <div className="space-y-3">
                {filteredResident.show_birthday && filteredResident.birthday && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{new Date(filteredResident.birthday).toLocaleDateString()}</span>
                  </div>
                )}
                {filteredResident.show_birth_country && filteredResident.birth_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">From: {filteredResident.birth_country}</span>
                  </div>
                )}
                {filteredResident.show_current_country && filteredResident.current_country && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">Currently in: {filteredResident.current_country}</span>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* Interests */}
          {filteredResident.show_interests !== false && (
            <CollapsibleSection title="Interests" iconName="Heart">
              {!filteredResident.show_interests ? (
                <p className="text-sm text-muted-foreground">Interests are private</p>
              ) : filteredResident.user_interests?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredResident.user_interests.map((ui: any) => (
                    <Badge key={ui.interests.id} variant="secondary">
                      {ui.interests.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No interests added yet</p>
              )}
            </CollapsibleSection>
          )}

          {/* Skills */}
          {filteredResident.show_skills !== false && (
            <CollapsibleSection title="Skills" iconName="Lightbulb">
              {!filteredResident.show_skills ? (
                <p className="text-sm text-muted-foreground">Skills are private</p>
              ) : filteredResident.user_skills?.length > 0 ? (
                <SkillsList
                  skills={filteredResident.user_skills.map((us: any) => ({
                    name: us.skills.name,
                    open_to_requests: us.open_to_requests,
                  }))}
                  showOpenToRequests={filteredResident.show_open_to_requests !== false}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
            </CollapsibleSection>
          )}


          {/* Photo Gallery */}
          <CollapsibleSection title="Photos" iconName="Image">
            <PhotoGallerySection photos={residentPhotos} residentName={displayName} />
          </CollapsibleSection>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Family */}
          {filteredResident.show_family && resident.family_unit_id ? (
            <CollapsibleSection title="Family" iconName="Users" description={resident.family_units?.name}>
              <div className="space-y-4">
                {filteredFamilyMembers && filteredFamilyMembers.length > 0 ? (
                  <div className="grid gap-3">
                    {filteredFamilyMembers.map((member: any) => (
                      <FamilyMemberCard
                        key={member.id}
                        member={member}
                        currentUserFamilyId={currentResident.family_unit_id}
                        tenantSlug={slug}
                        compact={true}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No other family members to display
                  </p>
                )}

                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href={`/t/${slug}/dashboard/families/${resident.family_unit_id}`}>
                    View Family Profile
                  </Link>
                </Button>
              </div>
            </CollapsibleSection>
          ) : null}

          {/* Pets */}
          {filteredResident.show_family && pets && pets.length > 0 && (
            <CollapsibleSection title="Pets" iconName="PawPrint">
              <div className="grid gap-3 sm:grid-cols-2">
                {pets.map((pet: any) => (
                  <div key={pet.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={pet.profile_picture_url} alt={pet.name} />
                      <AvatarFallback>{pet.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pet.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {pet.breed || pet.species}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Location Map */}
          {filteredResident.show_neighborhood && lotLocation && locations && (
            <CollapsibleSection title="Community Map" iconName="MapPin">
              <div className="rounded-lg overflow-hidden -mx-6 -mb-6">
                <MapPreviewWidget
                  tenantSlug={slug}
                  tenantId={currentResident.tenant_id}
                  locations={locations}
                  mapCenter={mapCenter}
                  highlightLocationId={lotLocation.id}
                  hideSidebar={true}
                  disableAutoScroll={true}
                  hideHeader={true}
                />
              </div>
            </CollapsibleSection>
          )}

          {/* Exchange Listings */}
          {exchangeEnabled && residentListings.length > 0 && (
            <CollapsibleSection title="Exchange Listings" iconName="Package" description={`${residentListings.length} active listing${residentListings.length === 1 ? '' : 's'}`}>
              <div className="grid gap-4">
                {residentListings.map((listing: any) => (
                  <Link key={listing.id} href={`/t/${slug}/dashboard/exchange`}>
                    <ExchangeListingCard
                      listing={listing}
                      ownerName={displayName}
                      ownerAvatar={resident.profile_picture_url}
                    />
                  </Link>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  )
}
