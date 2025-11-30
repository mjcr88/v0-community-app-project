import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, PawPrint } from "lucide-react"
import Link from "next/link"
import { filterPrivateData } from "@/lib/privacy-utils"
import { getFamilyById } from "@/lib/data/families"
import { getResidentById } from "@/lib/data/residents"
import { ProfileBanner } from "@/components/directory/ProfileBanner"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { FamilyMemberCard } from "@/components/directory/FamilyMemberCard"
import { PhotoGallerySection } from "@/components/directory/PhotoGallerySection"
import { AboutSection } from "@/components/directory/AboutSection"

export default async function FamilyProfilePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get current resident's tenant and family
  const currentResident = await getResidentById(user.id)

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  // Fetch family unit with all details
  const familyUnit = await getFamilyById(id, {
    enrichWithMembers: true,
    enrichWithPets: true,
  })

  if (!familyUnit || familyUnit.tenant_id !== currentResident.tenant_id) {
    notFound()
  }

  const isFamily = familyUnit.id === currentResident.family_unit_id

  // Get lot information from one of the family members
  const familyMembers = familyUnit.members || []
  let lotInfo = null

  if (familyMembers.length > 0) {
    // Fetch lot info directly instead of using getResidentById to avoid RLS issues
    const { data: firstMemberData } = await supabase
      .from("users")
      .select("lot_id, lots(id, lot_number, address, neighborhoods(id, name))")
      .eq("id", familyMembers[0].id)
      .single()

    if (firstMemberData?.lots) {
      // Handle case where lots might be returned as an array or single object depending on relation
      const lotData = Array.isArray(firstMemberData.lots) ? firstMemberData.lots[0] : firstMemberData.lots
      if (lotData) {
        lotInfo = lotData
      }
    }
  }

  // Get tenant and locations for map
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", currentResident.tenant_id).single()
  const { data: locations } = await supabase.from("locations").select("*").eq("tenant_id", currentResident.tenant_id)

  // Find the location for this resident's lot
  const lotLocation = locations?.find((loc) => loc.lot_id === lotInfo?.id && loc.type === "lot")

  const mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  const initials = familyUnit.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const familyPhotos = Array.isArray(familyUnit.photos)
    ? familyUnit.photos
      .filter((p: any) => (typeof p === "string" ? p : p?.url))
      .map((p: any) => (typeof p === "string" ? p : p?.url))
    : []

  // Enrich members with lot info for the cards
  const enrichedMembers = familyMembers.map((member: any) => {
    // If we have lot info for the family, assume it applies to all members for display purposes
    // unless they have a specific different lot (unlikely for family unit)
    return {
      ...member,
      lots: lotInfo
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/t/${slug}/dashboard/neighbours`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Family Profile</h1>
          <p className="text-muted-foreground text-sm">View family details and members</p>
        </div>
      </div>

      {/* Profile Banner */}
      <ProfileBanner
        bannerUrl={familyUnit.banner_image_url}
        profileUrl={familyUnit.profile_picture_url}
        name={familyUnit.name}
        neighborhood={Array.isArray((lotInfo as any)?.neighborhoods) ? (lotInfo as any).neighborhoods[0]?.name : (lotInfo as any)?.neighborhoods?.name}
        lotNumber={lotInfo?.lot_number}
        initials={initials}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* About Section */}
          {familyUnit.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Family</CardTitle>
              </CardHeader>
              <CardContent>
                <AboutSection content={familyUnit.description} />
              </CardContent>
            </Card>
          )}

          {/* Family Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Family Members ({familyMembers.length})
              </CardTitle>
              <CardDescription>Click on a member to view their profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {enrichedMembers.map((member: any) => {
                  const privacySettings = Array.isArray(member.user_privacy_settings)
                    ? member.user_privacy_settings[0]
                    : member.user_privacy_settings

                  const filteredMember = filterPrivateData(member, privacySettings, isFamily)

                  return (
                    <FamilyMemberCard
                      key={member.id}
                      member={filteredMember}
                      currentUserFamilyId={currentResident.family_unit_id || ""}
                      tenantSlug={slug}
                      currentUserId={user.id}
                      isPrimaryContact={member.id === familyUnit.primary_contact_id}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pets */}
          {familyUnit.pets && familyUnit.pets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PawPrint className="h-5 w-5" />
                  Family Pets ({familyUnit.pets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {familyUnit.pets.map((pet: any) => (
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Location Map */}
          {lotLocation && locations && (
            <MapPreviewWidget
              tenantSlug={slug}
              tenantId={currentResident.tenant_id}
              locations={locations}
              mapCenter={mapCenter}
              highlightLocationId={lotLocation.id}
            />
          )}

          {/* Photo Gallery */}
          <PhotoGallerySection photos={familyPhotos} residentName={familyUnit.name} />
        </div>
      </div>
    </div>
  )
}
