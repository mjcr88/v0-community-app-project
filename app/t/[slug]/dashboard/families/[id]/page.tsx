import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, ArrowLeft, Briefcase } from "lucide-react"
import Link from "next/link"
import { filterPrivateData } from "@/lib/privacy-utils"

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
  const { data: currentResident } = await supabase
    .from("users")
    .select("id, tenant_id, family_unit_id")
    .eq("id", user.id)
    .eq("role", "resident")
    .single()

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  // Fetch family unit with all details
  const { data: familyUnit } = await supabase
    .from("family_units")
    .select(
      `
      *,
      users!users_family_unit_id_fkey (
        id,
        first_name,
        last_name,
        profile_picture_url,
        email,
        phone,
        lot_id,
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
        )
      ),
      pets (
        id,
        name,
        species,
        breed
      )
    `,
    )
    .eq("id", id)
    .eq("tenant_id", currentResident.tenant_id)
    .single()

  if (!familyUnit) {
    notFound()
  }

  const isFamily = familyUnit.id === currentResident.family_unit_id

  // Get lot information from one of the family members
  const familyMembers = familyUnit.users || []
  const lotId = familyMembers[0]?.lot_id

  let lotInfo = null
  if (lotId) {
    const { data: lot } = await supabase
      .from("lots")
      .select(
        `
        id,
        lot_number,
        neighborhoods (
          name
        )
      `,
      )
      .eq("id", lotId)
      .single()

    lotInfo = lot
  }

  // Get primary contact details
  const primaryContact = familyMembers.find((member: any) => member.id === familyUnit.primary_contact_id)

  const initials = familyUnit.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

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
                <AvatarImage src={familyUnit.profile_picture_url || undefined} alt={familyUnit.name} />
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
                <CardTitle>Pets ({familyUnit.pets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {familyUnit.pets.map((pet: any) => (
                    <div key={pet.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xl">
                        {pet.species === "dog" ? "🐕" : pet.species === "cat" ? "🐈" : "🐾"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pet.name}</p>
                        <p className="text-xs text-muted-foreground">{pet.breed || pet.species}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
