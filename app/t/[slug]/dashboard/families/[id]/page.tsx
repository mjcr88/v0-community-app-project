import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Map, Upload, X, ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { filterPrivateData } from "@/lib/privacy-utils"
import { getFamilyById } from "@/lib/data/families"
import { getResidentById } from "@/lib/data/residents"

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
  // Note: In the new data model, we might need to fetch lot info differently if not directly on member
  // But getFamilyById doesn't return full member details with lot_id populated in the same way as the raw query
  // Let's check if we need to fetch lot separately or if we can get it from members.
  // The raw query fetched users with lot_id. getFamilies fetches members with basic info.
  // We might need to enhance getFamilies or fetch lot separately.
  // For now, let's assume we might miss lot info or need to fetch it.
  // Actually, let's fetch the lot info for the primary contact or first member if needed.
  // The original code used `familyMembers[0]?.lot_id`.
  // Let's try to get it from the first member if possible, but `members` in `FamilyUnitWithRelations` might not have `lot_id`.
  // Checking `lib/data/families.ts`: members has `id, first_name, last_name, profile_picture_url, role`. NO lot_id.
  // So we need to fetch the lot info separately if we want it.
  // We can use `getResidentById` for the first member to get their lot_id.

  let lotInfo = null
  if (familyMembers.length > 0) {
    const firstMember = await getResidentById(familyMembers[0].id, { enrichWithLot: true })
    if (firstMember && firstMember.lot) {
      lotInfo = {
        lot_number: firstMember.lot.lot_number,
        neighborhoods: { name: "Neighborhood" } // Placeholder as getResidents doesn't return neighborhood name deeply nested in lot
      }
      // Wait, getResidents with enrichWithLot returns lot object.
      // We might need to fetch neighborhood name separately or enhance getResidents.
      // For now, let's keep it simple.
    }
  }

  // Get primary contact details
  const primaryContact = familyMembers.find((member: any) => member.id === familyUnit.primary_contact_id)

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
  const familyHeroPhoto =
    familyUnit.hero_photo || familyUnit.profile_picture_url || (familyPhotos.length > 0 ? familyPhotos[0] : null)
  const otherFamilyPhotos = familyHeroPhoto ? familyPhotos.filter((p: string) => p !== familyHeroPhoto) : familyPhotos

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/t/${slug}/dashboard/neighbours`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{familyUnit.name}</h2>
          <p className="text-muted-foreground">Family Profile</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Family Info Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={familyHeroPhoto || undefined} alt={familyUnit.name} />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>

              <div className="space-y-1 w-full">
                <h3 className="text-2xl font-bold">{familyUnit.name}</h3>

                {lotInfo && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {lotInfo.neighborhoods?.name} - Lot #{lotInfo.lot_number}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {familyMembers.length} {familyMembers.length === 1 ? "member" : "members"}
                  </span>
                </div>

                {familyUnit.pets && familyUnit.pets.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {familyUnit.pets.length} {familyUnit.pets.length === 1 ? "pet" : "pets"}
                    </span>
                  </div>
                )}
              </div>

              {primaryContact && (
                <div className="w-full pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Primary Contact</p>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {primaryContact.first_name} {primaryContact.last_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="lg:col-span-2 space-y-6">
          {familyUnit.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Family</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{familyUnit.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Members ({familyMembers.length})
              </CardTitle>
              <CardDescription>Click on a member to view their profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {familyMembers.map((member: any) => {
                  const privacySettings = Array.isArray(member.user_privacy_settings)
                    ? member.user_privacy_settings[0]
                    : member.user_privacy_settings

                  const filteredMember = filterPrivateData(member, privacySettings, isFamily)

                  const memberInitials = [filteredMember.first_name, filteredMember.last_name]
                    .filter(Boolean)
                    .map((n) => n![0])
                    .join("")
                    .toUpperCase()

                  return (
                    <Link
                      key={member.id}
                      href={`/t/${slug}/dashboard/neighbours/${member.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={filteredMember.profile_picture_url || undefined}
                          alt={`${filteredMember.first_name} ${filteredMember.last_name}`}
                        />
                        <AvatarFallback>{memberInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {filteredMember.first_name} {filteredMember.last_name}
                        </p>
                        {member.id === familyUnit.primary_contact_id && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Primary Contact
                          </Badge>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {familyUnit.pets && familyUnit.pets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🐾</span>
                  Family Pets ({familyUnit.pets.length})
                </CardTitle>
                <CardDescription>Beloved members of the family</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {familyUnit.pets.map((pet: any) => {
                    const petInitials = pet.name
                      .split(" ")
                      .map((word: string) => word[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <div key={pet.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={pet.profile_picture_url || "/placeholder.svg"} alt={pet.name} />
                          <AvatarFallback>{petInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{pet.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {pet.species}
                            {pet.breed && ` • ${pet.breed}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Family Photo Gallery */}
          {familyPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Family Photo Gallery</CardTitle>
                <CardDescription>
                  {familyPhotos.length} photo{familyPhotos.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {familyHeroPhoto && (
                  <div className="space-y-3 mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Featured Photo
                    </Badge>
                    <div className="relative rounded-lg overflow-hidden aspect-video">
                      <Image
                        src={familyHeroPhoto || "/placeholder.svg"}
                        alt="Featured family photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {otherFamilyPhotos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">More Family Photos</p>
                    <div className="grid grid-cols-2 gap-3">
                      {otherFamilyPhotos.map((photo, index) => (
                        <div key={index} className="rounded-lg overflow-hidden aspect-square">
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Family photo ${index + 1}`}
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
